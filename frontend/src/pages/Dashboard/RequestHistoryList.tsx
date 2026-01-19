import React, { useEffect, useState } from 'react';
import { Typography, Tag, Empty, Flex, Divider } from 'antd';
import { RightOutlined } from '@ant-design/icons';
import api from '../../api';

interface RequestHistory {
  id: number;
  method: string;
  url: string;
  executedAt: string;
  // ... other fields if needed for display
  content?: any; // To load back
}

interface GroupedHistory {
    date: string;
    items: RequestHistory[];
}

interface Props {
  workspaceId: number;
  onSelect: (historyItem: any) => void;
  refreshTrigger: number;
  sidebarWidth: number;
}

const RequestHistoryList: React.FC<Props> = ({ workspaceId, onSelect, refreshTrigger, sidebarWidth }) => {
  const [groupedHistory, setGroupedHistory] = useState<GroupedHistory[]>([]);

  const groupHistoryByDate = (history: RequestHistory[]) => {
    const groups = history.reduce((acc, item) => {
        const date = new Date(item.executedAt).toLocaleDateString([], {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        if (!acc[date]) {
            acc[date] = [];
        }
        acc[date].push(item);
        return acc;
    }, {} as Record<string, RequestHistory[]>);

    return Object.entries(groups)
        .map(([date, items]) => ({ date, items: items.sort((a, b) => new Date(b.executedAt).getTime() - new Date(a.executedAt).getTime()) }))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const fetchHistory = async () => {
    try {
      const res = await api.get(`/history/workspace/${workspaceId}`);
      setGroupedHistory(groupHistoryByDate(res.data));
    } catch (e) {}
  };

  useEffect(() => {
    fetchHistory();
  }, [workspaceId, refreshTrigger]);

  if (groupedHistory.length === 0) {
      return <Flex vertical align="center" justify="center" style={{ height: '100%' }}><Empty description="No history yet" image={Empty.PRESENTED_IMAGE_SIMPLE} /></Flex>;
  }

  return (
    <div style={{ height: '100%', overflow: 'auto' }}>
        {groupedHistory.map(group => (
            <div key={group.date}>
                <Typography.Text strong style={{ display: 'block', padding: '16px 16px 8px', color: '#888' }}>
                    {group.date}
                </Typography.Text>
                <Flex vertical gap={0}>
                    {group.items.map((item, idx) => (
                        <React.Fragment key={item.id}>
                            <Flex 
                                style={{ padding: '8px 16px', cursor: 'pointer' }}
                                onClick={() => onSelect(item)}
                                align="center"
                                justify="space-between"
                                className="history-item-hover"
                            >
                                <div style={{ width: '100%' }}>
                                    <Flex justify="space-between" align="center" style={{ marginBottom: 4 }}>
                                        <Tag color={item.method === 'GET' ? 'green' : 'orange'}>{item.method}</Tag>
                                        <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                                            {new Date(item.executedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </Typography.Text>
                                    </Flex>
                                    <Typography.Text ellipsis style={{ display: 'block', width: sidebarWidth - 50, fontSize: 12 }}>
                                        {item.url}
                                    </Typography.Text>
                                </div>
                                <RightOutlined style={{ fontSize: 10, color: '#ccc', marginLeft: 8 }} />
                            </Flex>
                            {idx < group.items.length - 1 && <Divider style={{ margin: 0 }} />}
                        </React.Fragment>
                    ))}
                </Flex>
            </div>
        ))}
    </div>
  );
};

export default RequestHistoryList;
