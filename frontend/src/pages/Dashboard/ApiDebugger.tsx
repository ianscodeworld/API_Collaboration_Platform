import React, { useState, useEffect } from 'react';
import { 
  Input, 
  Button, 
  Select, 
  Tabs, 
  Table, 
  Space, 
  Typography, 
  Tag, 
  Layout, 
  Empty,
  Popconfirm,
  message
} from 'antd';
import { 
  SendOutlined, 
  SaveOutlined,
  DeleteOutlined,
  RocketOutlined,
  PlusOutlined,
  HistoryOutlined,
  CopyOutlined
} from '@ant-design/icons';
import { Resizable } from 're-resizable';
import api from '../../api';
import { useAuthStore } from '../../store/useAuthStore';
import { useEnvStore } from '../../store/useEnvStore';

const { Option } = Select;
const { Text } = Typography;

// --- Helpers ---
const interpolate = (text: string, variables: Record<string, string>) => {
  if (!text) return text;
  return text.replace(/\{\{(.+?)\}\}/g, (match, key) => {
    return variables[key] !== undefined ? variables[key] : match;
  });
};

// --- Types ---
interface KeyValue {
  id: number;
  key: string;
  value: string;
  type?: string;
  description?: string;
  enabled: boolean;
}

interface ApiDebuggerProps {
  apiData?: any;
  isCase?: boolean;
  onSave?: (data: any) => void;
  onDelete?: () => void;
  onSaveCase?: (data: any) => void;
  onHistory?: () => void;
}

const ApiDebugger: React.FC<ApiDebuggerProps> = ({ apiData, isCase, onSave, onDelete, onSaveCase, onHistory }) => {

  const { role } = useAuthStore();

  const { activeVariables } = useEnvStore();

  const isViewer = role === 'VIEWER';

  const [requestHeight, setRequestHeight] = useState('50%');

  // --- State ---

  const [title, setTitle] = useState('');

    const [method, setMethod] = useState('GET');

    const [url, setUrl] = useState('');

    const [tags, setTags] = useState<string[]>([]);

    const [loading, setLoading] = useState(false);

  

    // Request Data

    const [queryParams, setQueryParams] = useState<KeyValue[]>([{ id: 0, key: '', value: '', type: 'string', description: '', enabled: true }]);

    const [headers, setHeaders] = useState<KeyValue[]>([{ id: 0, key: '', value: '', type: 'string', description: '', enabled: true }]);

    const [bodyType, setBodyType] = useState('json');

    const [bodyContent, setBodyContent] = useState(`{

  	

  }`);

  

    // Response Data

    const [response, setResponse] = useState<any>(null);

    const [responseMeta, setResponseMeta] = useState<{ status: number; time: number; size: string } | null>(null);

  

    // --- Effects ---

    useEffect(() => {

      if (apiData) {

        setTitle(apiData.title || 'Untitled API');

        if (apiData.content) {

          try {

            const content = JSON.parse(apiData.content);

            setMethod(content.method || 'GET');

            setUrl(content.url || '');

            setTags(content.tags || []);

            const qp = content.queryParams || [];

            setQueryParams(qp.length > 0 ? qp : [{ id: Math.floor(Math.random() * 1000000000), key: '', value: '', type: 'string', description: '', enabled: true }]);

            const hd = content.headers || [];

            setHeaders(hd.length > 0 ? hd : [{ id: Math.floor(Math.random() * 1000000000), key: '', value: '', type: 'string', description: '', enabled: true }]);

            setBodyType(content.bodyType || 'json');

            setBodyContent(content.bodyContent || '');

          } catch (e) {

            console.error("Failed to parse API content", e);

          }

        } else {

            // New/Empty content

            setMethod('GET');

            setUrl('');

            setTags([]);

        }

      } 

      // Clear response when switching APIs

      setResponse(null);

      setResponseMeta(null);

    }, [apiData]);

  

    // --- Handlers ---

    const handleSaveInternal = () => {
      const content = {
          method,
          url,
          tags,
          queryParams,
          headers,
          bodyType,
          bodyContent
      };

      if (onSave) {
          onSave({ title, content });
      }
  };

  const handleSaveAsCase = () => {
    const name = prompt('Case Name:');
    if (name && onSaveCase) {
        onSaveCase({
            name,
            content: JSON.stringify({
                method,
                url,
                tags,
                queryParams,
                headers,
                bodyType,
                bodyContent
            })
        });
    }
  };

  const generateCurl = () => {
    let curl = `curl --location --request ${method} '${url}'`;
    headers.forEach(h => {
        if (h.key && h.enabled) curl += ` \\\n--header '${h.key}: ${h.value}'`;
    });
    if (bodyType === 'json' && bodyContent) {
        const escapedBody = bodyContent.replace(/'/g, "'\\''");
        curl += ` \\\n--data-raw '${escapedBody}'`;
    }
    return curl;
  };

  const handleCopyCurl = () => {
    navigator.clipboard.writeText(generateCurl());
    message.success('cURL copied to clipboard');
  };



  const updateRow = (

    rows: KeyValue[], 

    setRows: React.Dispatch<React.SetStateAction<KeyValue[]>>,

    id: number,

    field: keyof KeyValue,

    newValue: any

  ) => {

    if (isViewer) return;

    const newRows = rows.map(row => {

      if (row.id === id) return { ...row, [field]: newValue };

      return row;

    });

    

    if (id === rows[rows.length - 1].id && (field === 'key' || field === 'value' || field === 'enabled') && newValue) {

        newRows.push({ id: Math.floor(Math.random() * 1000000000), key: '', value: '', type: 'string', description: '', enabled: true });

    }

    setRows(newRows);

  };



  const removeRow = (

    rows: KeyValue[], 

    setRows: React.Dispatch<React.SetStateAction<KeyValue[]>>,

    id: number

  ) => {

    if (isViewer) return;

    if (rows.length === 1) {

        setRows([{ id: Date.now(), key: '', value: '', type: 'string', description: '', enabled: true }]);

    } else {

        setRows(rows.filter(r => r.id !== id));

    }

  };



  const handleSend = async () => {

    setLoading(true);

    const startTime = Date.now();

    setResponse(null);

    setResponseMeta(null);



    // Prepare Query Params

    const activeParams = queryParams.filter(p => p.enabled && p.key);

    let finalUrl = interpolate(url, activeVariables);

    if (activeParams.length > 0) {

      const queryString = activeParams.map(p => `${p.key}=${interpolate(p.value, activeVariables)}`).join('&');

      finalUrl += (finalUrl.includes('?') ? '&' : '?') + queryString;

    }



    // Prepare Headers

    const activeHeaders = headers.reduce((acc, curr) => {

        if (curr.enabled && curr.key) acc[curr.key] = interpolate(curr.value, activeVariables);

        return acc;

    }, {} as Record<string, string>);



    // Auto-inject Content-Type for JSON body if not present

    if (bodyType === 'json' && !Object.keys(activeHeaders).some(k => k.toLowerCase() === 'content-type')) {

        activeHeaders['Content-Type'] = 'application/json';

    }



            try {



              const res = await api.post('/proxy/execute', {



                url: finalUrl,



                method,



                headers: activeHeaders,



                body: bodyType === 'json' ? interpolate(bodyContent, activeVariables) : undefined,



                environmentId: useEnvStore.getState().selectedEnvId



              });



        



              const endTime = Date.now();



              const sizeBytes = new TextEncoder().encode(JSON.stringify(res.data.body)).length;



              



              setResponse(res.data);



              setResponseMeta({



                status: res.data.status,



                time: endTime - startTime,



                size: sizeBytes > 1024 ? `${(sizeBytes / 1024).toFixed(2)} KB` : `${sizeBytes} B`



              });



        



                            // Log History (Fire and forget)



        



                            // Log if context exists OR if we are in a workspace context (which we should be via props)



        



                            const wsId = apiData?.workspace?.id || (window.location.pathname.match(/\/workspace\/(\d+)/)?.[1]);



        



                            const apiId = apiData?.id; // Can be undefined for scratchpad



        



              



        



                            if (wsId) { 



        



                                api.post('/history', {



        



                                    workspace: { id: Number(wsId) },



        



                                    apiDefinition: apiId ? { id: apiId } : null,



        



                                    method,



        



                                    url,



        



                                    headers: JSON.stringify(headers),



        



                                    queryParams: JSON.stringify(queryParams),



        



                                    bodyType,



        



                                    bodyContent



        



                                }).catch(e => console.error("Failed to log history", e));



        



                            }



        



            } catch (error: any) {
        setResponse({ body: "Error connecting to backend proxy" });
    } finally {
      setLoading(false);
    }
  };

  // --- Render Helpers ---
  const columns = (
    dataSource: KeyValue[], 
    setDataSource: React.Dispatch<React.SetStateAction<KeyValue[]>>
  ) => [
    {
      title: 'Param Name',
      dataIndex: 'key',
      width: '25%',
      render: (text: string, record: KeyValue) => (
        <Input 
            value={text} 
            placeholder="Key" 
            variant="borderless" 
            disabled={isViewer}
            onChange={e => updateRow(dataSource, setDataSource, record.id, 'key', e.target.value)}
        />
      )
    },
    {
      title: 'Value',
      dataIndex: 'value',
      width: '25%',
      render: (text: string, record: KeyValue) => (
        <Input 
            value={text} 
            placeholder="Value" 
            variant="borderless" 
            disabled={isViewer}
            onChange={e => updateRow(dataSource, setDataSource, record.id, 'value', e.target.value)}
        />
      )
    },
    {
        title: 'Status',
        dataIndex: 'enabled',
        width: '10%',
        render: (enabled: boolean, record: KeyValue) => (
          <div style={{ textAlign: 'center' }}>
              <input 
                  type="checkbox" 
                  checked={enabled} 
                  disabled={isViewer}
                  onChange={e => updateRow(dataSource, setDataSource, record.id, 'enabled', e.target.checked)}
              />
          </div>
        )
    },
    {
      title: 'Type',
      dataIndex: 'type',
      width: '15%',
      render: (text: string, record: KeyValue) => (
         <Select 
            value={text} 
            variant="borderless" 
            style={{ width: '100%' }}
            disabled={isViewer}
            onChange={val => updateRow(dataSource, setDataSource, record.id, 'type', val)}
         >
             <Option value="string">String</Option>
             <Option value="number">Number</Option>
             <Option value="boolean">Boolean</Option>
         </Select>
      )
    },
    {
        title: 'Description',
        dataIndex: 'description',
        width: '30%',
        render: (text: string, record: KeyValue) => (
          <Input 
              value={text} 
              placeholder="Description" 
              variant="borderless" 
              disabled={isViewer}
              onChange={e => updateRow(dataSource, setDataSource, record.id, 'description', e.target.value)}
          />
        )
      },
    {
      title: '',
      width: '5%',
      render: (_: any, record: KeyValue) => (
        <Button 
            type="text" 
            icon={<DeleteOutlined style={{ color: '#999' }} />} 
            onClick={() => removeRow(dataSource, setDataSource, record.id)}
            disabled={isViewer || (dataSource.length === 1 && !record.key)}
        />
      )
    }
  ];

  return (
    <Layout style={{ height: '100%', background: '#fff', display: 'flex', flexDirection: 'column' }}>
      
      {/* 1. Top Bar */}
      <div style={{ padding: '12px 24px', borderBottom: '1px solid #f0f0f0', display: 'flex', flexDirection: 'column', gap: 16 }}>
        
        {/* Title Input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Space.Compact style={{ width: '100%', maxWidth: 600 }}>
                <Button disabled size="large" style={{ cursor: 'default', background: '#fafafa', color: '#000000d9', borderColor: '#d9d9d9' }}>API Name</Button>
                <Input 
                    value={title} 
                    onChange={e => setTitle(e.target.value)} 
                    placeholder="Enter API Name" 
                    disabled={isViewer || isCase}
                    size="large"
                />
            </Space.Compact>
            {!isCase && (
                <Select
                    mode="tags"
                    style={{ flex: 1, maxWidth: 400 }}
                    placeholder="Tags (e.g. Auth, User)"
                    value={tags}
                    onChange={setTags}
                    disabled={isViewer}
                    size="large"
                    tokenSeparators={[',']}
                />
            )}
            {isCase && <Tag color="orange" style={{ fontSize: 14, padding: '4px 12px' }}>TEST CASE</Tag>}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ flex: 1, display: 'flex' }}>
            <Space.Compact style={{ width: '100%' }}>
                <Select 
                    value={method} 
                    onChange={setMethod} 
                    style={{ width: 100 }}
                    size="large"
                    variant="filled"
                    disabled={isViewer}
                >
                    <Option value="GET"><Text type="success">GET</Text></Option>
                    <Option value="POST"><Text type="warning">POST</Text></Option>
                    <Option value="PUT"><Text style={{ color: '#1890ff' }}>PUT</Text></Option>
                    <Option value="DELETE"><Text type="danger">DELETE</Text></Option>
                </Select>
                <Input 
                    placeholder="Enter request URL" 
                    value={url}
                    onChange={e => setUrl(e.target.value)}
                    size="large"
                    disabled={isViewer}
                />
            </Space.Compact>
        </div>
        <Space>
            <Button 
                type="primary" 
                icon={<SendOutlined />} 
                onClick={handleSend}
                loading={loading}
                size="large"
                style={{ background: '#722ed1', borderColor: '#722ed1', padding: '0 30px' }}
            >
                Send
            </Button>
            {!isViewer && (
                <>
                    <Button icon={<CopyOutlined />} size="large" onClick={handleCopyCurl}>Copy cURL</Button>
                    <Button icon={<SaveOutlined />} size="large" onClick={handleSaveInternal}>Save</Button>
                    <Button icon={<HistoryOutlined />} size="large" onClick={onHistory} />
                    <Button icon={<PlusOutlined />} size="large" onClick={handleSaveAsCase}>Save as Case</Button>
                    {apiData && onDelete && (
                        <Popconfirm title={isCase ? "Delete this Case?" : "Delete this API?"} onConfirm={onDelete}>
                            <Button icon={<DeleteOutlined />} size="large" danger />
                        </Popconfirm>
                    )}
                </>
            )}
        </Space>
        </div>
      </div>

      {/* 2. Main Content Split */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        {/* Request Section */}
        <Resizable
            size={{ width: '100%', height: requestHeight }}
            onResizeStop={(_e, _direction, ref, _d) => {
                setRequestHeight(ref.style.height);
            }}
            minHeight="20%"
            maxHeight="80%"
            enable={{ bottom: true }}
            handleStyles={{ bottom: { height: 6, bottom: -3, cursor: 'row-resize', zIndex: 10 } }}
            handleClasses={{ bottom: 'hover-resize-handle' }}
            style={{ borderBottom: '4px solid #f0f0f0' }}
        >
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
             <Tabs 
                defaultActiveKey="1" 
                tabBarStyle={{ padding: '0 24px', marginBottom: 0 }}
                style={{ height: '100%' }}
                // Make Tabs content fill height
                items={(function(items) {
                    return items?.map(item => ({
                        ...item,
                        children: <div style={{ height: 'calc(100% - 46px)', overflow: 'auto' }}>{item.children}</div>
                    }));
                })([
                    {
                        key: '1',
                        label: 'Params',
                        children: (
                            <div style={{ padding: '0 24px' }}>
                                <Text strong style={{ display: 'block', margin: '12px 0' }}>Query Params</Text>
                                <Table 
                                    dataSource={queryParams} 
                                    columns={columns(queryParams, setQueryParams)} 
                                    pagination={false} 
                                    size="small"
                                    rowKey="id"
                                    bordered={false}
                                />
                            </div>
                        )
                    },
                    {
                        key: '2',
                        label: 'Body',
                        children: (
                            <div style={{ padding: '16px 24px' }}>
                                <Space style={{ marginBottom: 16 }}>
                                    <Select value={bodyType} onChange={setBodyType} size="small" options={[ 
                                        { value: 'none', label: 'none' },
                                        { value: 'json', label: 'json' },
                                        { value: 'form-data', label: 'form-data' },
                                        { value: 'x-www-form-urlencoded', label: 'x-www-form-urlencoded' },
                                    ]} />
                                </Space>
                                {bodyType === 'json' && (
                                    <Input.TextArea 
                                        value={bodyContent}
                                        onChange={e => setBodyContent(e.target.value)}
                                        rows={10}
                                        style={{ fontFamily: 'monospace', fontSize: 13, backgroundColor: '#fafafa', borderColor: '#d9d9d9' }}
                                    />
                                )}
                                {bodyType === 'none' && <Empty description="No Body" image={Empty.PRESENTED_IMAGE_SIMPLE} />}
                            </div>
                        )
                    },
                    {
                        key: '3',
                        label: 'Headers',
                         children: (
                            <div style={{ padding: '0 24px' }}>
                                <Text strong style={{ display: 'block', margin: '12px 0' }}>Headers</Text>
                                <Table 
                                    dataSource={headers} 
                                    columns={columns(headers, setHeaders)} 
                                    pagination={false} 
                                    size="small"
                                    rowKey="id"
                                    bordered={false}
                                />
                            </div>
                        )
                    }
                ])}
             />
        </div>
        </Resizable>

        {/* Response Section */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, background: '#fff', overflow: 'hidden' }}>
             <div style={{ padding: '8px 24px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text strong>Response</Text>
                {responseMeta && (
                    <Space size="large">
                        <Tag color={responseMeta.status === 200 ? 'success' : 'error'}>
                            {responseMeta.status} {responseMeta.status === 200 ? 'OK' : 'Error'}
                        </Tag>
                        <Text type="secondary" style={{ fontSize: 12 }}>{responseMeta.time} ms</Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>{responseMeta.size}</Text>
                    </Space>
                )}
             </div>
             
             {response ? (
                 <div style={{ flex: 1, overflow: 'auto' }}>
                     <Tabs 
                        size="small"
                        tabBarStyle={{ padding: '0 24px', margin: 0 }}
                        items={[
                            {
                                key: 'body',
                                label: 'Body',
                                children: (
                                    <div style={{ padding: 0 }}>
                                        <Input.TextArea 
                                            readOnly 
                                            value={typeof response.body === 'object' ? JSON.stringify(response.body, null, 2) : response.body}
                                            style={{ 
                                                height: '100%',
                                                minHeight: '300px',
                                                fontFamily: 'monospace', 
                                                fontSize: 12, 
                                                border: 'none',
                                                resize: 'none',
                                                outline: 'none',
                                                padding: '16px 24px'
                                            }} 
                                        />
                                    </div>
                                )
                            },
                            {
                                key: 'headers',
                                label: 'Headers',
                                children: (
                                     <div style={{ padding: '16px 24px' }}>
                                        {Object.entries(response.headers || {}).map(([key, val]) => (
                                            <div key={key} style={{ display: 'flex', marginBottom: 8, borderBottom: '1px solid #f5f5f5', paddingBottom: 4 }}>
                                                <Text strong style={{ width: 200, color: '#666' }}>{key}</Text>
                                                <Text style={{ wordBreak: 'break-all', color: '#333' }}>{String(val)}</Text>
                                            </div>
                                        ))}
                                     </div>
                                )
                            }
                        ]}
                    />
                 </div>
             ) : (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: '#ccc' }}>
                    <RocketOutlined style={{ fontSize: 48, color: '#e0e0e0', marginBottom: 16 }} />
                    <Text type="secondary">Click "Send" to get a response</Text>
                </div>
             )}
        </div>

      </div>
    </Layout>
  );
};

export default ApiDebugger;
