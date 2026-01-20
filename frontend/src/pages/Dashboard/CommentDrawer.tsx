import React, { useState, useEffect } from 'react';
import { Drawer, List, Avatar, Input, Button, message, Typography, Space, Tag, Empty } from 'antd';
import { UserOutlined, SendOutlined, CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import api from '../../api';

const { Text } = Typography;

interface Comment {
    id: number;
    content: string;
    fieldPath: string;
    resolved: boolean;
    createdAt: string;
    user: {
        username: string;
    };
}

interface CommentDrawerProps {
    apiId: number;
    open: boolean;
    onClose: () => void;
}

const CommentDrawer: React.FC<CommentDrawerProps> = ({ apiId, open, onClose }) => {
    const [comments, setComments] = useState<Comment[]>([]);
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(false);

    const fetchComments = async () => {
        try {
            const res = await api.get(`/comments/api/${apiId}`);
            setComments(res.data);
        } catch (e) {
            message.error('Failed to fetch comments');
        }
    };

    useEffect(() => {
        if (open && apiId) {
            fetchComments();
        }
    }, [open, apiId]);

    const handleAddComment = async () => {
        if (!content.trim()) return;
        setLoading(true);
        try {
            await api.post(`/comments/api/${apiId}`, { content });
            setContent('');
            fetchComments();
            message.success('Comment added');
        } catch (e) {
            message.error('Failed to add comment');
        } finally {
            setLoading(false);
        }
    };

    const handleResolve = async (commentId: number) => {
        try {
            await api.put(`/comments/${commentId}/resolve`);
            fetchComments();
            message.success('Comment resolved');
        } catch (e) {
            message.error('Failed to resolve comment');
        }
    };

    return (
        <Drawer
            title={`Comments (${comments.length})`}
            placement="right"
            onClose={onClose}
            open={open}
            width={400}
        >
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <div style={{ flex: 1, overflow: 'auto', marginBottom: 16 }}>
                    {comments.length === 0 ? (
                        <Empty description="No comments yet" style={{ marginTop: 100 }} />
                    ) : (
                        <List
                            itemLayout="horizontal"
                            dataSource={comments}
                            renderItem={(item) => (
                                <List.Item
                                    actions={[
                                        !item.resolved && (
                                            <Button 
                                                type="link" 
                                                size="small" 
                                                icon={<CheckCircleOutlined />} 
                                                onClick={() => handleResolve(item.id)}
                                            >
                                                Resolve
                                            </Button>
                                        )
                                    ].filter(Boolean) as any}
                                >
                                    <List.Item.Meta
                                        avatar={<Avatar icon={<UserOutlined />} />}
                                        title={
                                            <Space>
                                                <Text strong>{item.user.username}</Text>
                                                {item.resolved ? (
                                                    <Tag color="success" icon={<CheckCircleOutlined />}>Resolved</Tag>
                                                ) : (
                                                    <Tag color="warning" icon={<ClockCircleOutlined />}>Open</Tag>
                                                )}
                                            </Space>
                                        }
                                        description={
                                            <div style={{ marginTop: 4 }}>
                                                <Text style={{ whiteSpace: 'pre-wrap' }}>{item.content}</Text>
                                                <div style={{ marginTop: 8 }}>
                                                    <Text type="secondary" style={{ fontSize: 11 }}>
                                                        {new Date(item.createdAt).toLocaleString()}
                                                    </Text>
                                                </div>
                                            </div>
                                        }
                                    />
                                </List.Item>
                            )}
                        />
                    )}
                </div>

                <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 16 }}>
                    <Input.TextArea
                        rows={3}
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Add a comment..."
                        style={{ marginBottom: 8 }}
                    />
                    <Button
                        type="primary"
                        icon={<SendOutlined />}
                        onClick={handleAddComment}
                        loading={loading}
                        block
                    >
                        Send Comment
                    </Button>
                </div>
            </div>
        </Drawer>
    );
};

export default CommentDrawer;
