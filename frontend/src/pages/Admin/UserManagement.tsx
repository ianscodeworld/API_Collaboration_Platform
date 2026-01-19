import React, { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, Select, message, Typography, Tag, Space, Popconfirm } from 'antd';
import { UserAddOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import api from '../../api';

const { Title } = Typography;
const { Option } = Select;

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/users');
      setUsers(res.data);
    } catch (error) {
      message.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (values: any) => {
    try {
      // Backend generates password, but DTO might still expect field, sending dummy
      const res = await api.post('/admin/users', { ...values, password: 'IGNORED' });
      message.success('User created');
      setIsModalOpen(false);
      form.resetFields();
      fetchUsers();

      const copyText = `--- Login Credentials ---
Username: ${res.data.user.username}
Temporary Password: ${res.data.rawPassword}

Note: This is a temporary password. You will be required to change it during your first login.`;

      Modal.success({
        title: 'User Created',
        content: (
          <div>
            <p>User <b>{res.data.user.username}</b> created successfully.</p>
            <p>
              Temporary Password:{' '}
              <Typography.Text 
                copyable={{ text: copyText, tooltips: ['Copy credentials', 'Copied!'] }} 
                code
              >
                {res.data.rawPassword}
              </Typography.Text>
            </p>
            <p>Please share this password with the user.</p>
          </div>
        )
      });
    } catch (error: any) {
      const errorMsg = error.response?.data || 'Failed to create user';
      message.error(errorMsg);
    }
  };

  const handleUpdateRole = async (values: any) => {
    if (!selectedUser) return;
    try {
      await api.put(`/admin/users/${selectedUser.id}/role`, values);
      message.success('Role updated');
      setIsEditModalOpen(false);
      fetchUsers();
    } catch (error) {
      message.error('Failed to update role');
    }
  };

  const handleDeleteUser = async (username: string) => {
    try {
      await api.delete(`/admin/users/${username}`);
      message.success('User deleted');
      fetchUsers();
    } catch (error) {
      message.error('Failed to delete user');
    }
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 50 },
    { title: 'Username', dataIndex: 'username' },
    { title: 'Email', dataIndex: 'email' },
    { 
      title: 'Role', 
      dataIndex: 'role',
      render: (role: string) => (
        <Tag color={role === 'ADMIN' ? 'red' : 'blue'}>{role}</Tag>
      )
    },
    {
      title: 'Actions',
      render: (_: any, record: User) => (
        <Space>
          <Button 
            icon={<EditOutlined />} 
            size="small"
            onClick={() => {
              setSelectedUser(record);
              editForm.setFieldsValue({ role: record.role });
              setIsEditModalOpen(true);
            }} 
          />
          <Popconfirm title="Delete user?" onConfirm={() => handleDeleteUser(record.username)}>
            <Button icon={<DeleteOutlined />} size="small" danger />
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={3}>User Management</Title>
        <Button type="primary" icon={<UserAddOutlined />} onClick={() => setIsModalOpen(true)}>
          Create User
        </Button>
      </div>

      <Table 
        dataSource={users} 
        columns={columns} 
        rowKey="id" 
        loading={loading}
      />

      {/* Create Modal */}
      <Modal
        title="Create New User"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={() => form.submit()}
      >
        <Form form={form} layout="vertical" onFinish={handleCreateUser} initialValues={{ role: 'EDITOR' }}>
          <Form.Item name="username" label="Username" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="role" label="Role">
            <Select>
              <Option value="ADMIN">ADMIN</Option>
              <Option value="EDITOR">EDITOR</Option>
              <Option value="VIEWER">VIEWER</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* Edit Role Modal */}
      <Modal
        title={`Edit Role: ${selectedUser?.username}`}
        open={isEditModalOpen}
        onCancel={() => setIsEditModalOpen(false)}
        onOk={() => editForm.submit()}
      >
        <Form form={editForm} layout="vertical" onFinish={handleUpdateRole}>
          <Form.Item name="role" label="Role">
            <Select>
              <Option value="ADMIN">ADMIN</Option>
              <Option value="EDITOR">EDITOR</Option>
              <Option value="VIEWER">VIEWER</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default UserManagement;
