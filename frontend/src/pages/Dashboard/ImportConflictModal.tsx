import React, { useEffect, useState } from 'react';
import { Modal, Button, Space, Typography, Tag, Select, message, Alert } from 'antd';
import api from '../../api';
import type { Environment } from '../../store/useEnvStore';

const { Text } = Typography;

interface Props {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    missingVariables: string[];
    sourceWorkspaceId: number;
    targetWorkspaceId: number;
}

const ImportConflictModal: React.FC<Props> = ({ open, onClose, onConfirm, missingVariables, sourceWorkspaceId, targetWorkspaceId }) => {
    const [sourceEnvs, setSourceEnvs] = useState<Environment[]>([]);
    const [selectedEnvId, setSelectedEnvId] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open) {
            fetchSourceEnvs();
        }
    }, [open]);

    const fetchSourceEnvs = async () => {
        try {
            const res = await api.get(`/environments/workspace/${sourceWorkspaceId}`);
            setSourceEnvs(res.data);
        } catch (e) {
            message.error("Failed to fetch source environments");
        }
    };

    const handleCloneEnv = async () => {
        if (!selectedEnvId) return;
        setLoading(true);
        try {
            const envToClone = sourceEnvs.find(e => e.id === selectedEnvId);
            if (!envToClone) return;

            await api.post('/environments', {
                name: envToClone.name + " (Imported)",
                description: `Imported from workspace ${sourceWorkspaceId}`,
                variables: envToClone.variables,
                authConfigs: envToClone.authConfigs,
                workspace: { id: targetWorkspaceId }
            });

            message.success(`Environment '${envToClone.name}' cloned successfully`);
            onConfirm(); // Proceed with API copy
        } catch (e) {
            message.error("Failed to clone environment");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            title="Missing Environment Variables"
            open={open}
            onCancel={onClose}
            footer={[
                <Button key="cancel" onClick={onClose}>Cancel</Button>,
                <Button key="ignore" type="dashed" onClick={onConfirm}>Copy APIs Anyway</Button>,
                <Button key="clone" type="primary" loading={loading} disabled={!selectedEnvId} onClick={handleCloneEnv}>
                    Clone Environment & Copy APIs
                </Button>
            ]}
            width={600}
        >
            <Space direction="vertical" style={{ width: '100%' }} size="large">
                <Alert
                    message="The following variables are used in the selected APIs but were not found in the target workspace:"
                    type="warning"
                    showIcon
                />
                
                <div>
                    {missingVariables.map(v => <Tag key={v} color="volcano" style={{ marginBottom: 8 }}>{v}</Tag>)}
                </div>

                <div style={{ background: '#fafafa', padding: 16, borderRadius: 8 }}>
                    <Text strong>Recommendation:</Text>
                    <p>Select an environment from the current workspace to clone into the target workspace. This will ensure your APIs work immediately.</p>
                    
                    <Select
                        style={{ width: '100%' }}
                        placeholder="Select source environment to clone"
                        value={selectedEnvId}
                        onChange={setSelectedEnvId}
                    >
                        {sourceEnvs.map(env => (
                            <Select.Option key={env.id} value={env.id}>{env.name}</Select.Option>
                        ))}
                    </Select>
                </div>
            </Space>
        </Modal>
    );
};

export default ImportConflictModal;
