import React, { useEffect, useState } from 'react';
import { Modal, Table, Input, Button, message, Typography, Tabs } from 'antd';
import { DeleteOutlined, PlusOutlined, SaveOutlined } from '@ant-design/icons';
import api from '../../api';
import type { Environment, EnvVariable } from '../../store/useEnvStore';

interface Props {
  workspaceId: number;
  open: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

interface AuthConfig {
    key: string;
    tokenUrl: string;
    clientId: string;
    clientSecret: string;
    scope?: string;
}

const EnvironmentManager: React.FC<Props> = ({ workspaceId, open, onClose, onUpdate }) => {
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [editingEnv, setSelectedEnv] = useState<Environment | null>(null);
  const [localVars, setLocalVars] = useState<EnvVariable[]>([]);
  const [authConfigs, setAuthConfigs] = useState<AuthConfig[]>([]);

  const fetchEnvs = async () => {
    try {
      const res = await api.get(`/environments/workspace/${workspaceId}`);
      setEnvironments(res.data);
    } catch (e) {
      message.error('Failed to fetch environments');
    }
  };

  useEffect(() => {
    if (open) fetchEnvs();
  }, [open, workspaceId]);

  const handleEdit = (env: Environment) => {
    setSelectedEnv(env);
    try {
      setLocalVars(JSON.parse(env.variables) || [{ key: '', value: '' }]);
    } catch (e) {
      setLocalVars([{ key: '', value: '' }]);
    }
    
    // Parse Auth Configs
    if (env.authConfigs) {
        try {
            const parsed = JSON.parse(env.authConfigs);
            // Convert Map to Array
            const list = Object.entries(parsed).map(([key, val]: [string, any]) => ({
                key,
                ...val
            }));
            setAuthConfigs(list);
        } catch(e) {
            setAuthConfigs([]);
        }
    } else {
        setAuthConfigs([]);
    }
  };

  const handleAddRow = () => {
    setLocalVars([...localVars, { key: '', value: '' }]);
  };

  const handleRemoveRow = (index: number) => {
    setLocalVars(localVars.filter((_, i) => i !== index));
  };

  const handleVarChange = (index: number, field: 'key' | 'value', val: string) => {
    const next = [...localVars];
    next[index][field] = val;
    setLocalVars(next);
  };

  const handleSave = async () => {
    if (!editingEnv) return;
    
    // Convert Auth Array back to Map (Trim Keys)
    const authMap = authConfigs.reduce((acc, curr) => {
        if (curr.key) {
            acc[curr.key.trim()] = {
                tokenUrl: curr.tokenUrl.trim(),
                clientId: curr.clientId.trim(),
                clientSecret: curr.clientSecret.trim(),
                scope: curr.scope?.trim()
            };
        }
        return acc;
    }, {} as any);

    // Trim Variables
    const trimmedVars = localVars
        .filter(v => v.key)
        .map(v => ({ key: v.key.trim(), value: v.value.trim() }));

    try {
      await api.put(`/environments/${editingEnv.id}`, {
        ...editingEnv,
        variables: JSON.stringify(trimmedVars),
        authConfigs: JSON.stringify(authMap)
      });
      message.success('Environment saved');
      fetchEnvs();
      onUpdate();
    } catch (e) {
      message.error('Save failed');
    }
  };

  // Auth Handlers
  const handleAddAuth = () => setAuthConfigs([...authConfigs, { key: '', tokenUrl: '', clientId: '', clientSecret: '' }]);
  const handleRemoveAuth = (idx: number) => setAuthConfigs(authConfigs.filter((_, i) => i !== idx));
  const handleAuthChange = (idx: number, field: keyof AuthConfig, val: string) => {
      const next = [...authConfigs];
      next[idx][field] = val;
      setAuthConfigs(next);
  };

  const handleCreate = async () => {
    const name = prompt('Environment Name:');
    if (!name) return;
    try {
      await api.post('/environments', {
        name,
        workspace: { id: workspaceId },
        variables: '[]'
      });
      fetchEnvs();
      onUpdate();
    } catch (e) {
      message.error('Creation failed');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/environments/${id}`);
      fetchEnvs();
      if (editingEnv?.id === id) {
          setSelectedEnv(null);
          setLocalVars([]);
      }
      onUpdate();
    } catch (e) {
      message.error('Delete failed');
    }
  };

  return (
    <Modal title="Environment Management" open={open} onCancel={onClose} width={900} footer={null}>
      <div style={{ display: 'flex', gap: 20, minHeight: 400 }}>
        <div style={{ width: 200, borderRight: '1px solid #f0f0f0', paddingRight: 16 }}>
          <Button type="dashed" block icon={<PlusOutlined />} onClick={handleCreate} style={{ marginBottom: 16 }}>
            New Env
          </Button>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {environments.map((env) => (
              <div 
                key={env.id} 
                style={{ 
                    padding: '8px 12px', 
                    cursor: 'pointer', 
                    borderRadius: 4,
                    background: editingEnv?.id === env.id ? '#e6f7ff' : 'transparent',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}
                onClick={() => handleEdit(env)}
              >
                <Typography.Text ellipsis style={{ flex: 1 }}>{env.name}</Typography.Text>
                <DeleteOutlined onClick={(e) => { e.stopPropagation(); handleDelete(env.id); }} style={{ color: '#ff4d4f', marginLeft: 8 }} />
              </div>
            ))}
          </div>
        </div>
        <div style={{ flex: 1 }}>
          {editingEnv ? (
            <>
              <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
                <Typography.Title level={5}>{editingEnv.name}</Typography.Title>
                <Button type="primary" icon={<SaveOutlined />} onClick={handleSave}>Save All</Button>
              </div>
              
              <Tabs items={[
                  {
                      key: 'vars',
                      label: 'Variables',
                      children: (
                        <>
                            <Table
                                dataSource={localVars}
                                pagination={false}
                                size="small"
                                rowKey={(_, index) => index!}
                                columns={[
                                { title: 'Variable', render: (_, __, i) => <Input value={localVars[i].key} onChange={(e) => handleVarChange(i, 'key', e.target.value)} placeholder="e.g. baseUrl" /> },
                                { title: 'Value', render: (_, __, i) => <Input value={localVars[i].value} onChange={(e) => handleVarChange(i, 'value', e.target.value)} placeholder="Value" /> },
                                { title: '', width: 50, render: (_, __, i) => <Button type="text" danger icon={<DeleteOutlined />} onClick={() => handleRemoveRow(i)} /> }
                                ]}
                            />
                            <Button type="dashed" block onClick={handleAddRow} style={{ marginTop: 16 }} icon={<PlusOutlined />}>Add Variable</Button>
                        </>
                      )
                  },
                  {
                      key: 'auth',
                      label: 'OAuth2 Providers',
                      children: (
                          <>
                            {authConfigs.map((auth, idx) => (
                                <div key={idx} style={{ background: '#fafafa', padding: 12, borderRadius: 8, marginBottom: 12 }}>
                                    <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                                        <Input addonBefore="Ref Name" placeholder="e.g. wapi_token" value={auth.key} onChange={e => handleAuthChange(idx, 'key', e.target.value)} />
                                        <Button danger icon={<DeleteOutlined />} onClick={() => handleRemoveAuth(idx)} />
                                    </div>
                                    <Input addonBefore="Token URL" placeholder="https://..." value={auth.tokenUrl} onChange={e => handleAuthChange(idx, 'tokenUrl', e.target.value)} style={{ marginBottom: 8 }} />
                                    <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                                        <Input addonBefore="Client ID" value={auth.clientId} onChange={e => handleAuthChange(idx, 'clientId', e.target.value)} />
                                        <Input addonBefore="Secret" type="password" value={auth.clientSecret} onChange={e => handleAuthChange(idx, 'clientSecret', e.target.value)} />
                                    </div>
                                    <Input addonBefore="Scope" placeholder="Optional" value={auth.scope} onChange={e => handleAuthChange(idx, 'scope', e.target.value)} />
                                </div>
                            ))}
                            <Button type="dashed" block onClick={handleAddAuth} icon={<PlusOutlined />}>Add OAuth2 Provider</Button>
                          </>
                      )
                  }
              ]} />
            </>
          ) : (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography.Text type="secondary">Select an environment to manage</Typography.Text>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default EnvironmentManager;
