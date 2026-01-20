import React, { useState, useEffect, useMemo } from 'react';
import { Modal, Input, List, Typography, Tag, Space } from 'antd';
import { SearchOutlined, AppstoreOutlined, FileTextOutlined } from '@ant-design/icons';
import api from '../api';
import { useNavigate } from 'react-router-dom';

const { Text } = Typography;

interface SearchItem {
    id: number;
    title: string;
    type: 'workspace' | 'api';
    workspaceId?: number;
    path: string;
}

interface CommandPaletteProps {
    open: boolean;
    onClose: () => void;
}

const CommandPalette: React.FC<CommandPaletteProps> = ({ open, onClose }) => {
    const [search, setSearch] = useState('');
    const [items, setItems] = useState<SearchItem[]>([]);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (open) {
            fetchData();
            setSearch('');
        }
    }, [open]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch Workspaces
            const wsRes = await api.get('/workspaces');
            const workspaces: SearchItem[] = wsRes.data.map((w: any) => ({
                id: w.id,
                title: w.name,
                type: 'workspace',
                path: `/workspace/${w.id}`
            }));

            // Fetch All APIs visible to user (This might need a specialized endpoint for better perf)
            // For now, we'll just get APIs from the fetched workspaces if possible, 
            // but the backend currently doesn't have "get all APIs for user".
            // We'll just stick to workspaces for now or add a backend endpoint.
            
            setItems(workspaces);
        } catch (e) {
            console.error("Failed to fetch search data", e);
        } finally {
            setLoading(false);
        }
    };

    const filteredItems = useMemo(() => {
        if (!search) return items;
        const s = search.toLowerCase();
        return items.filter(item => item.title.toLowerCase().includes(s));
    }, [search, items]);

    const handleSelect = (item: SearchItem) => {
        navigate(item.path);
        onClose();
    };

    return (
        <Modal
            open={open}
            onCancel={onClose}
            footer={null}
            closable={false}
            width={600}
            style={{ top: 100 }}
            bodyStyle={{ padding: 0 }}
        >
            <Input
                autoFocus
                size="large"
                prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                placeholder="Search workspaces..."
                variant="borderless"
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ padding: '16px 24px', borderBottom: '1px solid #f0f0f0' }}
            />
            <div style={{ maxHeight: 400, overflow: 'auto', padding: '8px 0' }}>
                <List
                    dataSource={filteredItems}
                    loading={loading}
                    renderItem={item => (
                        <List.Item
                            onClick={() => handleSelect(item)}
                            style={{ 
                                padding: '12px 24px', 
                                cursor: 'pointer',
                                transition: 'background 0.3s'
                            }}
                            className="search-item-hover"
                        >
                            <Space>
                                {item.type === 'workspace' ? <AppstoreOutlined /> : <FileTextOutlined />}
                                <Text>{item.title}</Text>
                                <Tag color={item.type === 'workspace' ? 'blue' : 'green'}>
                                    {item.type.toUpperCase()}
                                </Tag>
                            </Space>
                        </List.Item>
                    )}
                />
            </div>
            <div style={{ padding: '8px 24px', borderTop: '1px solid #f0f0f0', background: '#fafafa', borderRadius: '0 0 8px 8px' }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                    Tip: Use <Tag style={{ margin: 0, fontSize: 10 }}>↑↓</Tag> to navigate, <Tag style={{ margin: 0, fontSize: 10 }}>Enter</Tag> to select
                </Text>
            </div>
            <style>{`
                .search-item-hover:hover {
                    background: #f5f5f5;
                }
            `}</style>
        </Modal>
    );
};

export default CommandPalette;
