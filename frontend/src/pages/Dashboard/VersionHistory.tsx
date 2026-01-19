import React, { useEffect, useState } from 'react';
import { Drawer, Typography, Button, message, Tag, Tooltip, Flex, Divider, Spin } from 'antd';
import { HistoryOutlined, RollbackOutlined, ClockCircleOutlined, UserOutlined } from '@ant-design/icons';
import api from '../../api';

const { Text } = Typography;

interface ApiVersion {
  id: number;
  content: string;
  description: string;
  createdAt: string;
  createdBy: {
    id: number;
    username: string;
  } | null;
}

interface Props {
  apiId: number | null;
  open: boolean;
  onClose: () => void;
  onRestore: () => void;
}

const VersionHistory: React.FC<Props> = ({ apiId, open, onClose, onRestore }) => {
  const [history, setHistory] = useState<ApiVersion[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchHistory = async () => {
    if (!apiId) return;
    setLoading(true);
    try {
      const res = await api.get(`/api-versions/api/${apiId}`);
      setHistory(res.data);
    } catch (e) {
      message.error('Failed to fetch history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && apiId) {
      fetchHistory();
    }
  }, [open, apiId]);

  const handleCreateSnapshot = async () => {
    if (!apiId) return;
    const desc = prompt('Snapshot Description (Optional):');
    try {
      await api.post(`/api-versions/api/${apiId}`, { description: desc || 'Manual Snapshot' });
      message.success('Snapshot created');
      fetchHistory();
    } catch (e) {
      message.error('Failed to create snapshot');
    }
  };

  const handleRestore = async (versionId: number) => {
    try {
      await api.post(`/api-versions/${versionId}/restore`);
      message.success('Version restored');
      onRestore(); // Trigger refresh in parent
      onClose();
    } catch (e) {
      message.error('Failed to restore');
    }
  };

  return (
    <Drawer 
      title={
        <Flex justify="space-between" align="center">
            <span>Version History</span>
            <Button size="small" type="primary" onClick={handleCreateSnapshot}>Create Snapshot</Button>
        </Flex>
      } 
      placement="right" 
      onClose={onClose} 
      open={open}
      size="default"
    >
      {loading ? (
          <Flex justify="center" style={{ padding: 40 }}><Spin /></Flex>
      ) : (
          <Flex vertical gap={0}>
              {history.map((item, index) => (
                  <React.Fragment key={item.id}>
                      <Flex style={{ padding: '12px 0' }} align="flex-start" gap={12}>
                          <HistoryOutlined style={{ fontSize: 24, color: '#1890ff', marginTop: 4 }} />
                          <Flex vertical style={{ flex: 1 }} gap={4}>
                              <Text strong>{item.description}</Text>
                              <Flex gap={8} wrap="wrap">
                                  <Tag icon={<ClockCircleOutlined />} color="default">
                                      {new Date(item.createdAt).toLocaleString()}
                                  </Tag>
                                  {item.createdBy && (
                                      <Tag icon={<UserOutlined />} color="blue">
                                          {item.createdBy.username}
                                      </Tag>
                                  )}
                              </Flex>
                          </Flex>
                          <Tooltip title="Restore this version">
                              <Button 
                                  type="text" 
                                  icon={<RollbackOutlined />} 
                                  onClick={() => handleRestore(item.id)} 
                              />
                          </Tooltip>
                      </Flex>
                      {index < history.length - 1 && <Divider style={{ margin: 0 }} />}
                  </React.Fragment>
              ))}
          </Flex>
      )}
    </Drawer>
  );
};

export default VersionHistory;
