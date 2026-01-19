import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Layout, Tree, Button, Modal, Form, Input, message, Typography, Select, Space, Segmented, Tabs } from 'antd';
import { 
  PlusOutlined, 
  FileTextOutlined, 
  SettingOutlined, 
  EyeOutlined, 
  CodeOutlined, 
  ImportOutlined,
  ExportOutlined,
  CopyOutlined,
  TagOutlined,
  FolderOutlined
} from '@ant-design/icons';
import { Resizable } from 're-resizable';
import { Dropdown, Switch } from 'antd';
import type { MenuProps } from 'antd';
import api from '../../api';
import ApiDebugger from './ApiDebugger';
import Documentation from './Documentation';
import EnvironmentManager from './EnvironmentManager';
import VersionHistory from './VersionHistory';
import RequestHistoryList from './RequestHistoryList';
import ImportConflictModal from './ImportConflictModal';
import { useSocket } from '../../store/useSocket';
import { useAuthStore } from '../../store/useAuthStore';
import { useEnvStore } from '../../store/useEnvStore';
import type { Environment } from '../../store/useEnvStore';
import { AppstoreOutlined, HistoryOutlined } from '@ant-design/icons';
import { parseCurl } from '../../utils/curlParser';
import { getRequiredVariablesForApi } from '../../utils/variableUtils';

const { Sider, Content, Header } = Layout;
const Text = Typography.Text;

interface ApiDef {
  id: number;
  title: string;
  content: string;
}

interface ApiTestCase {
    id: number;
    name: string;
    content: string;
}

const WorkspaceDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [apis, setApis] = useState<ApiDef[]>([]);
  const [testCases, setTestCases] = useState<Record<number, ApiTestCase[]>>({});
  
  // Tab State
  const [openTabs, setOpenTabs] = useState<{key: string, title: string, type: 'api'|'case', id: number, parentId?: number}[]>([]);
  const [activeTabKey, setActiveTabKey] = useState<string>('');

  const [selectedApiId, setSelectedApiId] = useState<number | null>(null);
  const [selectedCaseId, setSelectedCaseId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEnvModalOpen, setIsEnvModalOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'debug' | 'docs'>('debug');
  const [sidebarTab, setSidebarTab] = useState<'apis' | 'history'>('apis');
  const [viewByTag, setViewByTag] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(250);
  const [historyRefresh, setHistoryRefresh] = useState(0);
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [form] = Form.useForm();
  
  // Sync Tabs to Selection
  useEffect(() => {
      if (!activeTabKey) {
          // If no tab is active, we might want to clear selection or keep it? 
          // For now, clear it.
          setSelectedApiId(null);
          setSelectedCaseId(null);
          return;
      }
      
      const tab = openTabs.find(t => t.key === activeTabKey);
      if (tab) {
          if (tab.type === 'api') {
              setSelectedApiId(tab.id);
              setSelectedCaseId(null);
          } else if (tab.type === 'case') {
              setSelectedApiId(tab.parentId || null);
              setSelectedCaseId(tab.id);
          }
      }
  }, [activeTabKey]); // Intentionally not including openTabs to avoid loops if tab title changes

  // Conflict State
  const [isConflictModalOpen, setIsConflictModalOpen] = useState(false);
  const [missingVars, setMissingVars] = useState<string[]>([]);
  
  const { role } = useAuthStore();
  const isViewer = role === 'VIEWER';

  const { selectedEnvId, setSelectedEnvId } = useEnvStore();

  // Import State
  const [curlModalOpen, setCurlModalOpen] = useState(false);
  const [curlInput, setCurlInput] = useState('');
  
  // Copy API State
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
  const [targetWorkspaceId, setTargetWorkspaceId] = useState<number | null>(null);
  const [availableWorkspaces, setAvailableWorkspaces] = useState<{id: number, name: string}[]>([]);

  const fetchWorkspaces = async () => {
      try {
          const res = await api.get('/workspaces');
          // Filter out current workspace
          setAvailableWorkspaces(res.data.filter((w: any) => w.id !== Number(id)));
      } catch (e) {
          message.error('Failed to fetch workspaces');
      }
  };

  useEffect(() => {
      if (isCopyModalOpen) {
          fetchWorkspaces();
      }
  }, [isCopyModalOpen]);

  const handleCopyApis = async () => {
      if (!targetWorkspaceId) {
          message.error("Please select a target workspace");
          return;
      }
      
      const apiIdsToCopy = Array.from(new Set(checkedKeys
        .filter(k => k.toString().startsWith('api-'))
        .map(k => {
            const match = k.toString().match(/^api-(\d+)/);
            return match ? Number(match[1]) : 0;
        })
        .filter(id => id !== 0)));

      if (apiIdsToCopy.length === 0) {
          message.warning("No APIs selected to copy");
          return;
      }

      // 1. Scan for variables
      const requiredVars = new Set<string>();
      apiIdsToCopy.forEach(apiId => {
          const apiDef = apis.find(a => a.id === apiId);
          if (apiDef) {
              getRequiredVariablesForApi(apiDef.content).forEach(v => requiredVars.add(v));
          }
      });

      if (requiredVars.size > 0) {
          // 2. Fetch target workspace environments
          try {
              const targetEnvsRes = await api.get(`/environments/workspace/${targetWorkspaceId}`);
              const targetEnvs = targetEnvsRes.data;
              
              // 3. Find missing variables
              const availableInTarget = new Set<string>();
              targetEnvs.forEach((env: any) => {
                  try {
                      const vars = JSON.parse(env.variables || '[]');
                      vars.forEach((v: any) => availableInTarget.add(v.key));
                  } catch(e) {}
              });

              const missing = Array.from(requiredVars).filter(v => !availableInTarget.has(v));
              
              if (missing.length > 0) {
                  setMissingVars(missing);
                  setIsConflictModalOpen(true);
                  return; // Stop here, modal will handle next steps
              }
          } catch (e) {
              console.error("Failed to check target environments", e);
          }
      }

      // If no missing vars or check failed, proceed with copy
      executeCopy(apiIdsToCopy);
  };

  const executeCopy = async (apiIds?: number[]) => {
      const ids = apiIds || Array.from(new Set(checkedKeys
        .filter(k => k.toString().startsWith('api-'))
        .map(k => {
            const match = k.toString().match(/^api-(\d+)/);
            return match ? Number(match[1]) : 0;
        })
        .filter(id => id !== 0)));

      const hide = message.loading(`Copying ${ids.length} APIs...`, 0);
      let successCount = 0;

      for (const apiId of ids) {
          const apiDef = apis.find(a => a.id === apiId);
          if (apiDef) {
              try {
                  await api.post('/api-definitions', {
                      title: apiDef.title + ' (Copy)',
                      workspace: { id: targetWorkspaceId },
                      content: apiDef.content
                  });
                  successCount++;
              } catch (e) {
                  console.error(`Failed to copy API ${apiDef.title}`, e);
              }
          }
      }
      
      hide();
      message.success(`Successfully copied ${successCount} APIs`);
      setIsCopyModalOpen(false);
      setIsConflictModalOpen(false);
      setTargetWorkspaceId(null);
      setCheckedKeys([]);
  };
  
  // Export Selection State
  const [checkedKeys, setCheckedKeys] = useState<React.Key[]>([]);

  const onCheck = (checkedKeysValue: React.Key[] | { checked: React.Key[]; halfChecked: React.Key[] }) => {
    if (Array.isArray(checkedKeysValue)) {
        setCheckedKeys(checkedKeysValue);
    } else {
        setCheckedKeys(checkedKeysValue.checked);
    }
  };

  // Auto-switch to Docs for viewers
  useEffect(() => {
    if (isViewer) setViewMode('docs');
  }, [isViewer]);

  // Real-time sync with debounce
  const refreshTimerRef = useRef<any>(null);
  const debouncedFetchApis = useCallback(() => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    refreshTimerRef.current = setTimeout(() => {
      fetchApis();
    }, 500);
  }, [id]);

  useSocket('/topic/updates', (msg) => {
    if (msg.type === 'API_DEFINITION') {
      debouncedFetchApis();
    }
  });

  const fetchApis = async () => {
    try {
      const res = await api.get(`/api-definitions/workspace/${id}`);
      setApis(res.data);
      // No longer eager loading test cases for performance
    } catch (error) {
      message.error('Failed to fetch APIs');
    }
  };

  const fetchCases = async (apiId: number) => {
      try {
          const res = await api.get(`/api-test-cases/api-definition/${apiId}`);
          setTestCases(prev => ({ ...prev, [apiId]: res.data }));
      } catch (e) {}
  };

  const fetchEnvs = async () => {
    try {
      const res = await api.get(`/environments/workspace/${id}`);
      setEnvironments(res.data);
    } catch (e) {}
  };

  useEffect(() => {
    fetchApis();
    fetchEnvs();
  }, [id]);

  const handleCreateApi = async (values: any) => {
    try {
      const newApi = await api.post('/api-definitions', {
        ...values,
        workspace: { id: Number(id) },
        content: '{}'
      });
      message.success('API created');
      setIsModalOpen(false);
      form.resetFields();
      fetchApis();
      // Auto-open new tab
      const newKey = `api-${newApi.data.id}`;
      setOpenTabs(prev => [...prev, { key: newKey, title: newApi.data.title, type: 'api', id: newApi.data.id }]);
      setActiveTabKey(newKey);
      
      if (!isViewer) setViewMode('debug');
    } catch (error) {
      message.error('Failed to create API');
    }
  };

  const handleSaveApi = async (data: { title: string, content: any }) => {
      if (!selectedApiId) return;
      const apiDef = apis.find(a => a.id === selectedApiId);
      if (!apiDef) return;

      try {
          await api.put(`/api-definitions/${selectedApiId}`, {
              ...apiDef,
              title: data.title,
              content: JSON.stringify(data.content)
          });
          message.success('API saved');
          // Update local state immediately
          setApis(prev => prev.map(a => a.id === selectedApiId ? { 
              ...a, 
              title: data.title, 
              content: JSON.stringify(data.content)
          } : a));
      } catch (error) {
          message.error('Failed to save API');
      }
  };

  const handleUpdateCase = async (data: any) => {
      if (!selectedCaseId) return;
      try {
          const apiId = selectedApiId!;
          const tc = testCases[apiId]?.find(c => c.id === selectedCaseId);
          if (!tc) return;

          await api.put(`/api-test-cases/${selectedCaseId}`, {
              ...tc,
              content: JSON.stringify(data.content)
          });
          message.success('Case updated');
          fetchCases(apiId);
      } catch (e) {
          message.error('Failed to update case');
      }
  };

  const handleSaveCase = async (caseData: any) => {
      if (!selectedApiId) return;
      try {
          await api.post('/api-test-cases', {
              ...caseData,
              apiDefinition: { id: selectedApiId }
          });
          message.success('Case saved');
          fetchCases(selectedApiId);
      } catch (e) {
          message.error('Failed to save case');
      }
  };

  const handleDeleteApi = async () => {
      if (!selectedApiId) return;
      try {
          await api.delete(`/api-definitions/${selectedApiId}`);
          message.success('API deleted');
          setSelectedApiId(null);
          setSelectedCaseId(null);
          fetchApis();
      } catch (error) {
          message.error('Failed to delete API');
      }
  };

  const handleDeleteCase = async (caseId: number) => {
    try {
        await api.delete(`/api-test-cases/${caseId}`);
        message.success('Case deleted');
        setSelectedCaseId(null);
        fetchCases(selectedApiId!);
    } catch (e) {
        message.error('Failed to delete case');
    }
};

  const handleHistorySelect = (item: any) => {
      const content = {
          method: item.method,
          url: item.url,
          queryParams: JSON.parse(item.queryParams || '[]'),
          headers: JSON.parse(item.headers || '[]'),
          bodyType: item.bodyType,
          bodyContent: item.bodyContent
      };
      setHistorySelection(content);
      // Ensure we are in debug mode
      setViewMode('debug');
      // If no API is selected, we might need a dummy context or just use null ID
      if (!selectedApiId) {
          // If we select history for an API that is deleted or general history?
          // For now, history applies to current view.
          // Ideally, we select the API it belonged to?
          if (item.apiDefinition && item.apiDefinition.id) {
              setSelectedApiId(item.apiDefinition.id);
          }
      }
  };
  const [historySelection, setHistorySelection] = useState<any>(null);

  const getTreeData = () => {
    if (!viewByTag) {
        return apis.map(apiDef => ({
            title: apiDef.title,
            key: `api-${apiDef.id}`,
            icon: <FileTextOutlined />,
            apiId: apiDef.id,
            children: (testCases[apiDef.id] || []).map(tc => ({
                title: tc.name,
                key: `case-${apiDef.id}-${tc.id}`,
                isCase: true,
                apiId: apiDef.id,
                caseId: tc.id,
                icon: <EyeOutlined style={{ color: '#faad14' }} />,
            }))
        }));
    }

    const tagMap: Record<string, ApiDef[]> = {};
    const uncategorized: ApiDef[] = [];

    apis.forEach(apiDef => {
        let content: any = {};
        try { content = JSON.parse(apiDef.content); } catch (e) {}
        const tags = content.tags || [];
        
        if (!tags || tags.length === 0) {
            uncategorized.push(apiDef);
        } else {
            tags.forEach((tag: string) => {
                if (!tagMap[tag]) tagMap[tag] = [];
                tagMap[tag].push(apiDef);
            });
        }
    });

    const nodes = Object.entries(tagMap).sort((a, b) => a[0].localeCompare(b[0])).map(([tag, apiList]) => ({
        title: tag,
        key: `tag-${tag}`,
        selectable: false,
        icon: <TagOutlined />,
        children: apiList.map(apiDef => ({
            title: apiDef.title,
            key: `api-${apiDef.id}-${tag}`, // Unique key for duplicates
            icon: <FileTextOutlined />,
            apiId: apiDef.id,
            children: (testCases[apiDef.id] || []).map(tc => ({
                title: tc.name,
                key: `case-${apiDef.id}-${tc.id}-${tag}`,
                isCase: true,
                apiId: apiDef.id,
                caseId: tc.id,
                icon: <EyeOutlined style={{ color: '#faad14' }} />,
            }))
        }))
    }));

    if (uncategorized.length > 0) {
        nodes.push({
            title: 'Uncategorized',
            key: 'tag-uncategorized',
            selectable: false,
            icon: <FolderOutlined />,
            children: uncategorized.map(apiDef => ({
                title: apiDef.title,
                key: `api-${apiDef.id}-uncat`,
                icon: <FileTextOutlined />,
                apiId: apiDef.id,
                children: (testCases[apiDef.id] || []).map(tc => ({
                    title: tc.name,
                    key: `case-${apiDef.id}-${tc.id}-uncat`,
                    isCase: true,
                    apiId: apiDef.id,
                    caseId: tc.id,
                    icon: <EyeOutlined style={{ color: '#faad14' }} />,
                }))
            }))
        });
    }
    
    return nodes;
  };

  const onSelectNode = (keys: any[], info: any) => {
      if (keys.length === 0) return;
      const node = info.node;
      setHistorySelection(null);
      
      let key = '';
      let newTab = null;

      if (node.isCase) {
          key = `case-${node.caseId}`;
          newTab = { key, title: node.title, type: 'case', id: node.caseId, parentId: node.apiId };
      } else if (node.apiId) {
          key = `api-${node.apiId}`;
          newTab = { key, title: node.title, type: 'api', id: node.apiId };
      }

      if (newTab) {
          setOpenTabs(prev => {
              if (prev.find(t => t.key === key)) return prev;
              return [...prev, newTab as any];
          });
          setActiveTabKey(key);
      }
  };

  const handleImportPostman = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
        try {
            const json = JSON.parse(event.target?.result as string);
            console.log("DEBUG: Importing Postman Collection:", json.info?.name, json);
            const items = json.item || [];
            
            const extractRequests = (itemList: any[]): any[] => {
                let requests: any[] = [];
                itemList.forEach(item => {
                    if (item.request) {
                        requests.push(item);
                    } else if (item.item) {
                        requests = requests.concat(extractRequests(item.item));
                    }
                });
                return requests;
            };

            const allRequests = extractRequests(items);
            console.log(`DEBUG: Found ${allRequests.length} requests to import.`);
            
            if (allRequests.length === 0) {
                message.warning("No requests found in this collection.");
                return;
            }

            const hide = message.loading('Importing APIs...', 0);
            
            for (const req of allRequests) {
                const request = req.request;
                const reqObj = typeof request === 'string' ? { url: request, method: 'GET' } : request;
                console.log(`DEBUG: Processing Postman Request Object for "${req.name}":`, reqObj);
                
                let urlStr = '';
                let queryParams: any[] = [];

                if (typeof reqObj.url === 'string') {
                    urlStr = reqObj.url;
                } else if (reqObj.url) {
                    urlStr = reqObj.url.raw || '';
                    if (!urlStr && reqObj.url.path) {
                        const protocol = reqObj.url.protocol ? reqObj.url.protocol + '://' : '';
                        const host = Array.isArray(reqObj.url.host) ? reqObj.url.host.join('.') : (reqObj.url.host || '');
                        const path = Array.isArray(reqObj.url.path) ? reqObj.url.path.join('/') : (reqObj.url.path || '');
                        urlStr = `${protocol}${host}${reqObj.url.port ? ':' + reqObj.url.port : ''}${path.startsWith('/') ? '' : '/'}${path}`;
                    }
                    
                    if (reqObj.url.query && Array.isArray(reqObj.url.query)) {
                        queryParams = reqObj.url.query.map((q: any) => ({
                            id: Math.floor(Math.random() * 1000000000),
                            key: q.key || '',
                            value: q.value || '',
                            type: 'string',
                            description: q.description || '',
                            enabled: q.disabled === true ? false : true
                        }));
                    }
                }

                // If no query params found in object, try parsing from URL string
                if (queryParams.length === 0 && urlStr.includes('?')) {
                    try {
                        const urlObj = new URL(urlStr);
                        urlObj.searchParams.forEach((value, key) => {
                            queryParams.push({
                                id: Math.floor(Math.random() * 1000000000),
                                key: key,
                                value: value,
                                type: 'string',
                                description: '',
                                enabled: true
                            });
                        });
                    } catch (e) {
                        // Ignore URL parse errors
                    }
                }

                const headers = (reqObj.header || []).map((h: any) => ({
                    id: Math.floor(Math.random() * 1000000000),
                    key: h.key || '',
                    value: h.value || '',
                    type: 'string',
                    description: h.description || '',
                    enabled: h.disabled === true ? false : true
                }));

                let bodyType = 'none';
                let bodyContent = '';
                if (reqObj.body) {
                    if (reqObj.body.mode === 'raw') {
                        bodyType = 'json';
                        bodyContent = reqObj.body.raw || '';
                    } else if (reqObj.body.mode === 'formdata') {
                        bodyType = 'form-data';
                        bodyContent = JSON.stringify(reqObj.body.formdata || []);
                    }
                }

                const content = {
                    method: reqObj.method || 'GET',
                    url: urlStr,
                    headers: headers,
                    queryParams: queryParams,
                    bodyType: bodyType,
                    bodyContent: bodyContent
                };

                try {
                    await api.post('/api-definitions', {
                        title: req.name || 'Imported Request',
                        workspace: { id: Number(id) },
                        content: JSON.stringify(content)
                    });
                } catch (saveErr) {
                    console.error(`Failed to save imported request ${req.name}:`, saveErr);
                }
            }

            hide();
            message.success(`Successfully imported ${allRequests.length} requests`);
            fetchApis();
        } catch (err) {
            console.error("Postman Import Error:", err);
            message.error('Failed to parse Postman collection');
        }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleExportCollection = () => {
    // Filter APIs if selection exists
    let apisToExport = apis;
    if (checkedKeys.length > 0) {
        // Extract API IDs from checked keys (format: "api-{id}")
        const checkedApiIds = new Set(
            checkedKeys
                .filter(k => k.toString().startsWith('api-'))
                .map(k => {
                    const match = k.toString().match(/^api-(\d+)/);
                    return match ? Number(match[1]) : 0;
                })
                .filter(id => id !== 0)
        );
        
        // If specific APIs are selected, filter. 
        // Note: If only test cases are selected, the parent API might not be "fully" checked in UI depending on tree mode,
        // but typically we want to export the API definition. 
        // For simplicity, we strictly export fully checked APIs or fallback to all if none.
        if (checkedApiIds.size > 0) {
            apisToExport = apis.filter(a => checkedApiIds.has(a.id));
        }
    }

    const collection = {
        info: {
            name: `Workspace Export ${id}`,
            schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
        },
        item: apisToExport.map(apiDef => {
            let content: any = {};
            try {
                content = JSON.parse(apiDef.content || '{}');
            } catch (e) {}

            return {
                name: apiDef.title,
                request: {
                    method: content.method || 'GET',
                    header: (content.headers || []).filter((h: any) => h.key && h.enabled).map((h: any) => ({
                        key: h.key,
                        value: h.value,
                        type: "text"
                    })),
                    body: content.bodyType === 'json' ? {
                        mode: "raw",
                        raw: content.bodyContent,
                        options: { raw: { language: "json" } }
                    } : undefined,
                    url: {
                        raw: content.url || ''
                    }
                }
            };
        })
    };

    const blob = new Blob([JSON.stringify(collection, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `collection_workspace_${id}.json`;
    link.click();
  };

  const handleImportCurl = async () => {
    try {
        const parsed = parseCurl(curlInput);
        const content = {
            method: parsed.method,
            url: parsed.url,
            headers: Object.entries(parsed.headers).map(([k, v]) => ({
                id: Math.floor(Math.random() * 1000000000),
                key: k,
                value: v,
                type: 'string',
                description: '',
                enabled: true
            })),
            queryParams: [],
            bodyType: parsed.body ? 'json' : 'none',
            bodyContent: parsed.body || ''
        };

        const res = await api.post('/api-definitions', {
            title: `Imported cURL ${new Date().toLocaleTimeString()}`,
            workspace: { id: Number(id) },
            content: JSON.stringify(content)
        });

        message.success('cURL imported successfully');
        setCurlModalOpen(false);
        setCurlInput('');
        fetchApis();
        
        const newKey = `api-${res.data.id}`;
        setOpenTabs(prev => [...prev, { key: newKey, title: res.data.title, type: 'api', id: res.data.id }]);
        setActiveTabKey(newKey);
    } catch (e) {
        message.error('Failed to parse and import cURL command');
    }
  };

  const importMenuItems: MenuProps['items'] = [
    {
        key: 'curl',
        label: 'cURL Command',
        onClick: () => setCurlModalOpen(true)
    },
    {
        key: 'postman',
        label: 'Postman Collection (.json)',
        onClick: () => document.getElementById('postman-import')?.click()
    }
  ];

  const onEdit = (targetKey: any, action: 'add' | 'remove') => {
    if (action === 'remove') {
        const targetIndex = openTabs.findIndex((t) => t.key === targetKey);
        const newTabs = openTabs.filter((t) => t.key !== targetKey);
        
        if (newTabs.length && targetKey === activeTabKey) {
            const newActiveKey = newTabs[targetIndex === newTabs.length ? targetIndex - 1 : targetIndex].key;
            setActiveTabKey(newActiveKey);
        } else if (!newTabs.length) {
            setActiveTabKey('');
        }
        setOpenTabs(newTabs);
    }
  };

  return (
    <Layout style={{ height: '100%', background: '#fff' }}>
      <Header style={{ background: '#fff', borderBottom: '1px solid #f0f0f0', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 50 }}>
        <Space size="large">
            <Space>
                <Text strong>Environment:</Text>
                <Select 
                    style={{ width: 150 }} 
                    placeholder="No Environment" 
                    allowClear 
                    value={selectedEnvId}
                    onChange={(val) => setSelectedEnvId(val, environments)}
                    size="large"
                >
                    {environments.map(env => (
                        <Select.Option key={env.id} value={env.id}>{env.name}</Select.Option>
                    ))}
                </Select>
                {!isViewer && <Button size="large" icon={<SettingOutlined />} onClick={() => setIsEnvModalOpen(true)} />}
            </Space>

            <Segmented
                value={viewMode}
                onChange={(val) => setViewMode(val as any)}
                size="large"
                options={[
                    { label: 'Debug', value: 'debug', icon: <CodeOutlined /> },
                    { label: 'Docs', value: 'docs', icon: <EyeOutlined /> },
                ]}
            />
        </Space>
      </Header>
      <Layout>
        <Resizable
          size={{ width: sidebarWidth, height: '100%' }}
          onResizeStop={(_e, _direction, _ref, d) => {
            setSidebarWidth(sidebarWidth + d.width);
          }}
          minWidth={200}
          maxWidth={600}
          enable={{ right: true }}
        >
          <Sider width={sidebarWidth} theme="light" style={{ borderRight: '1px solid #f0f0f0', height: '100%' }}>
              <div style={{ padding: '8px' }}>
                  <Segmented 
                      block 
                      options={[
                          { label: 'APIs', value: 'apis', icon: <AppstoreOutlined /> },
                          { label: 'History', value: 'history', icon: <HistoryOutlined /> }
                      ]}
                      value={sidebarTab}
                      onChange={(v) => setSidebarTab(v as any)}
                  />
                  {sidebarTab === 'apis' && (
                      <div style={{ marginTop: 8, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                          <Space size="small">
                              <Text type="secondary" style={{ fontSize: 12 }}>Group by:</Text>
                              <Switch 
                                  checkedChildren="Tags" 
                                  unCheckedChildren="List" 
                                  checked={viewByTag} 
                                  onChange={setViewByTag} 
                                  size="small" 
                              />
                          </Space>
                      </div>
                  )}
              </div>
              
              {sidebarTab === 'apis' ? (
                  <>
                      <div style={{ padding: '8px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Text strong>Collections</Text>
                          {!isViewer && (
                              <Space>
                                <input 
                                    type="file" 
                                    id="postman-import" 
                                    style={{ display: 'none' }} 
                                    accept=".json"
                                    onChange={handleImportPostman}
                                />
                                <Dropdown menu={{ items: importMenuItems }} placement="bottomRight">
                                    <Button 
                                        type="text" 
                                        size="small"
                                        icon={<ImportOutlined />} 
                                        title="Import"
                                    />
                                </Dropdown>
                                <Button 
                                    type="text" 
                                    size="small"
                                    icon={<CopyOutlined />} 
                                    onClick={() => setIsCopyModalOpen(true)}
                                    title="Copy Selected APIs to Workspace"
                                    disabled={checkedKeys.length === 0}
                                />
                                <Button 
                                    type="text" 
                                    size="small"
                                    icon={<ExportOutlined />} 
                                    onClick={handleExportCollection} 
                                    title="Export Workspace as Postman Collection"
                                />
                                <Button type="text" size="small" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)} />
                              </Space>
                          )}
                      </div>
                      <Tree
                          showIcon
                          checkable
                          checkedKeys={checkedKeys}
                          onCheck={onCheck as any}
                          treeData={getTreeData() as any}
                          onSelect={onSelectNode}
                          style={{ padding: '8px' }}
                      />
                  </>
              ) : (
                  <RequestHistoryList 
                      workspaceId={Number(id)} 
                      onSelect={handleHistorySelect} 
                      refreshTrigger={historyRefresh}
                      sidebarWidth={sidebarWidth}
                  />
              )}
          </Sider>
        </Resizable>
        <Content style={{ padding: '0 0', overflow: 'auto' }}>
            {openTabs.length > 0 ? (
                <Tabs
                    type="editable-card"
                    activeKey={activeTabKey}
                    onChange={setActiveTabKey}
                    onEdit={onEdit}
                    hideAdd
                    style={{ height: '100%' }}
                    items={openTabs.map(tab => {
                        // Resolve Data
                        let data: any = null;
                        if (tab.type === 'api') {
                            data = apis.find(a => a.id === tab.id);
                        } else {
                            const parent = apis.find(a => a.id === tab.parentId);
                            const tc = testCases[tab.parentId!]?.find(c => c.id === tab.id);
                            if (parent && tc) data = { ...parent, content: tc.content, title: tc.name };
                        }
                        
                        // History Override (Only if this tab is active)
                        if (tab.key === activeTabKey && historySelection) {
                             data = { ...data, content: JSON.stringify(historySelection) };
                        }

                        return {
                            label: tab.title,
                            key: tab.key,
                            children: (
                                <div style={{ height: '100%', overflow: 'hidden' }}>
                                {viewMode === 'debug' ? (
                                    <ApiDebugger 
                                        apiData={data} 
                                        isCase={tab.type === 'case'}
                                        onSave={(d) => { 
                                            if (selectedCaseId) {
                                                handleUpdateCase(d);
                                            } else if (selectedApiId) {
                                                handleSaveApi(d); 
                                                setHistoryRefresh(n => n + 1); 
                                            } else {
                                                // Should not happen in tab mode usually as tabs are bound to IDs
                                            }
                                        }}
                                        onDelete={selectedApiId ? (selectedCaseId ? () => handleDeleteCase(selectedCaseId!) : handleDeleteApi) : undefined}
                                        onSaveCase={selectedApiId ? handleSaveCase : undefined}
                                        onHistory={() => setIsHistoryOpen(true)}
                                    /> 
                                ) : (
                                    <Documentation apiData={data} />
                                )}
                                </div>
                            )
                        };
                    })} 
                />
            ) : (
                <div style={{ padding: 40, textAlign: 'center', marginTop: 100 }}>
                    <Text type="secondary">Select an API from the sidebar to open a tab</Text>
                </div>
            )}
        </Content>
      </Layout>

      <Modal
        title="New API Interface"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={() => form.submit()}
      >
        <Form form={form} layout="vertical" onFinish={handleCreateApi}>
          <Form.Item name="title" label="API Name" rules={[{ required: true }]}>
            <Input placeholder="Get User Info" />
          </Form.Item>
        </Form>
      </Modal>

      <EnvironmentManager 
        workspaceId={Number(id)} 
        open={isEnvModalOpen} 
        onClose={() => setIsEnvModalOpen(false)} 
        onUpdate={fetchEnvs}
      />

      <VersionHistory 
        apiId={selectedApiId}
        open={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        onRestore={fetchApis}
      />

      <Modal
        title="Copy APIs to Workspace"
        open={isCopyModalOpen}
        onOk={handleCopyApis}
        onCancel={() => setIsCopyModalOpen(false)}
      >
          <div style={{ marginBottom: 16 }}>
              <Text>Select target workspace to copy {checkedKeys.filter(k => k.toString().startsWith('api-')).length} APIs to:</Text>
          </div>
          <Select
            style={{ width: '100%' }}
            placeholder="Select Workspace"
            value={targetWorkspaceId}
            onChange={setTargetWorkspaceId}
          >
              {availableWorkspaces.map(w => (
                  <Select.Option key={w.id} value={w.id}>{w.name}</Select.Option>
              ))}
          </Select>
      </Modal>

      <Modal
        title="Import from cURL"
        open={curlModalOpen}
        onOk={handleImportCurl}
        onCancel={() => setCurlModalOpen(false)}
        width={600}
      >
        <Input.TextArea 
            rows={10} 
            placeholder="Paste your cURL command here..." 
            value={curlInput}
            onChange={e => setCurlInput(e.target.value)}
            style={{ fontFamily: 'monospace' }}
        />
      </Modal>

      <ImportConflictModal
        open={isConflictModalOpen}
        onClose={() => setIsConflictModalOpen(false)}
        onConfirm={executeCopy}
        missingVariables={missingVars}
        sourceWorkspaceId={Number(id)}
        targetWorkspaceId={targetWorkspaceId || 0}
      />
    </Layout>
  );
};

export default WorkspaceDetail;
