import React, { useState } from 'react';
import { Modal, Form, Input, message } from 'antd';
import api from '../api';
import { useAuthStore } from '../store/useAuthStore';

interface ChangePasswordModalProps {
    open: boolean;
    onClose: () => void;
    forced?: boolean;
}

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ open, onClose, forced }) => {
    const [loading, setLoading] = useState(false);
    const [form] = Form.useForm();
    const { updateMustChangePassword } = useAuthStore();

    const handleSubmit = async (values: any) => {
        if (values.newPassword !== values.confirmPassword) {
            message.error("Passwords do not match");
            return;
        }

        setLoading(true);
        try {
            await api.post('/auth/change-password', {
                oldPassword: values.oldPassword,
                newPassword: values.newPassword
            });
            message.success("Password changed successfully");
            updateMustChangePassword(false);
            form.resetFields();
            onClose();
        } catch (error) {
            message.error("Failed to change password. Old password might be incorrect.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            title={forced ? "Change Temporary Password" : "Change Password"}
            open={open}
            onCancel={forced ? undefined : onClose}
            onOk={() => form.submit()}
            confirmLoading={loading}
            closable={!forced}
            maskClosable={!forced}
            keyboard={!forced}
        >
            <Form form={form} layout="vertical" onFinish={handleSubmit}>
                <Form.Item 
                    name="oldPassword" 
                    label="Current Password" 
                    rules={[{ required: true, message: 'Please enter current password' }]}
                >
                    <Input.Password />
                </Form.Item>
                <Form.Item 
                    name="newPassword" 
                    label="New Password" 
                    rules={[
                        { required: true, message: 'Please enter new password' },
                        { min: 6, message: 'Password must be at least 6 characters' }
                    ]}
                >
                    <Input.Password />
                </Form.Item>
                <Form.Item 
                    name="confirmPassword" 
                    label="Confirm New Password" 
                    dependencies={['newPassword']}
                    rules={[
                        { required: true, message: 'Please confirm your password' },
                        ({ getFieldValue }) => ({
                            validator(_, value) {
                                if (!value || getFieldValue('newPassword') === value) {
                                    return Promise.resolve();
                                }
                                return Promise.reject(new Error('The two passwords that you entered do not match!'));
                            },
                        }),
                    ]}
                >
                    <Input.Password />
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default ChangePasswordModal;
