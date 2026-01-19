import React, { useEffect, useState } from 'react';
import { Card, Button, Modal, Form, Input, message, Typography, Popconfirm, Flex, Spin } from 'antd';
import { PlusOutlined, EnterOutlined, DeleteOutlined } from '@ant-design/icons';
import api from '../../api';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';

const { Title, Paragraph } = Typography;

interface Workspace {
  id: number;
  name: string;
  description: string;
}

const Workspaces: React.FC = () => {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();
  const navigate = useNavigate();
  
  const { role } = useAuthStore();
  const isViewer = role === 'VIEWER';

  // Sharing state
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<number | null>(null);
  const [shareUsername, setShareUsername] = useState('');

  const fetchWorkspaces = async () => {
    setLoading(true);
    try {
      const res = await api.get('/workspaces');
      setWorkspaces(res.data);
    } catch (error) {
      message.error('Failed to fetch workspaces');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  const handleCreate = async (values: any) => {
    try {
      await api.post('/workspaces', values);
      message.success('Workspace created');
      setIsModalOpen(false);
      form.resetFields();
      fetchWorkspaces();
    } catch (error) {
      message.error('Failed to create workspace');
    }
  };

  const handleShare = async () => {
    if (!selectedWorkspaceId || !shareUsername) return;
    try {
        await api.post(`/workspaces/${selectedWorkspaceId}/share?username=${shareUsername}`);
        message.success(`Shared with ${shareUsername}`);
        setShareModalOpen(false);
        setShareUsername('');
        fetchWorkspaces();
    } catch (error) {
        message.error('Failed to share workspace');
    }
  };

  const handleDelete = async (id: number) => {
      try {
          await api.delete(`/workspaces/${id}`);
          message.success('Workspace deleted');
          fetchWorkspaces();
      } catch (error) {
          message.error('Failed to delete workspace');
      }
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={2}>My Workspaces</Title>
        {!isViewer && (
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>
            New Workspace
            </Button>
        )}
      </div>

      {loading ? (
          <div style={{ padding: '100px 0', textAlign: 'center' }}><Spin size="large" /></div>
      ) : (
          <Flex wrap="wrap" gap={16}>
            {workspaces.map((ws) => (
                <Card 
                    key={ws.id}
                    hoverable 
                    title={ws.name}
                    style={{ width: 300 }}
                    actions={[
                        <Button type="link" icon={<EnterOutlined />} onClick={() => navigate(`/workspace/${ws.id}`)}>Enter</Button>,
                        !isViewer && <Button type="text" onClick={() => { setSelectedWorkspaceId(ws.id); setShareModalOpen(true); }}>Share</Button>,
                        !isViewer && (
                            <Popconfirm title="Delete workspace?" onConfirm={() => handleDelete(ws.id)}>
                                <Button type="text" icon={<DeleteOutlined />} danger />
                            </Popconfirm>
                        )
                    ].filter(Boolean)}
                >
                    <Paragraph ellipsis={{ rows: 2 }}>{ws.description || 'No description'}</Paragraph>
                </Card>
            ))}
          </Flex>
      )}

      <Modal
        title="Create New Workspace"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={() => form.submit()}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item name="name" label="Name" rules={[{ required: true }]}>
            <Input placeholder="Team API project" />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea placeholder="Shared APIs for our team" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Share Workspace"
        open={shareModalOpen}
        onCancel={() => setShareModalOpen(false)}
        onOk={handleShare}
      >
        <div style={{ marginBottom: 16 }}>
            <Typography.Text>Enter username to share with:</Typography.Text>
            <Input 
                value={shareUsername} 
                onChange={e => setShareUsername(e.target.value)} 
                placeholder="Username" 
                style={{ marginTop: 8 }}
            />
        </div>
      </Modal>
    </div>
  );
};

export default Workspaces;
