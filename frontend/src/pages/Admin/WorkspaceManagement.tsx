import React, { useEffect, useState } from 'react';
import { Table, message, Typography, Tag, Button, Modal, Input } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import api from '../../api';

const { Title } = Typography;

interface Workspace {
  id: number;
  name: string;
  description: string;
  owner: { username: string };
  sharedUsers: { username: string }[];
}

const WorkspaceManagement: React.FC = () => {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Sharing state
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<number | null>(null);
  const [shareUsername, setShareUsername] = useState('');

  const fetchWorkspaces = async () => {
    setLoading(true);
    try {
      const res = await api.get('/workspaces/all');
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

  const handleUnshare = async (workspaceId: number, username: string) => {
      try {
          await api.delete(`/workspaces/${workspaceId}/share?username=${username}`);
          message.success(`Removed ${username}`);
          fetchWorkspaces();
      } catch (error) {
          message.error('Failed to remove user');
      }
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 50 },
    { title: 'Name', dataIndex: 'name' },
    { 
        title: 'Owner', 
        dataIndex: ['owner', 'username'],
        render: (text: string) => <Tag color="gold">{text}</Tag>
    },
    {
        title: 'Shared With',
        dataIndex: 'sharedUsers',
        render: (users: any[], record: Workspace) => (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center' }}>
                {users && users.map(u => (
                    <Tag 
                        key={u.username} 
                        closable 
                        onClose={(e) => { e.preventDefault(); handleUnshare(record.id, u.username); }}
                    >
                        {u.username}
                    </Tag>
                ))}
                <Button 
                    type="dashed" 
                    size="small" 
                    icon={<PlusOutlined />} 
                    onClick={() => { setSelectedWorkspaceId(record.id); setShareModalOpen(true); }}
                />
            </div>
        )
    }
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={3}>Workspace Management (All)</Title>
      </div>
      <Table 
        dataSource={workspaces} 
        columns={columns} 
        rowKey="id" 
        loading={loading}
      />

      <Modal
        title="Add User to Workspace"
        open={shareModalOpen}
        onCancel={() => setShareModalOpen(false)}
        onOk={handleShare}
      >
        <div>
            <Typography.Text>Enter username to add:</Typography.Text>
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

export default WorkspaceManagement;
