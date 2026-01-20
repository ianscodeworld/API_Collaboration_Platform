import React, { useEffect, useState } from 'react';
import { Layout, Menu, Button, Dropdown } from 'antd';
import { Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { LogoutOutlined, AppstoreOutlined, UserOutlined, TeamOutlined, HomeOutlined, SettingOutlined } from '@ant-design/icons';
import api from '../api';
import ChangePasswordModal from '../components/ChangePasswordModal';
import CommandPalette from '../components/CommandPalette';
import type { MenuProps } from 'antd';

const { Header, Content, Sider } = Layout;

const MainLayout: React.FC = () => {
  const { logout, username, role, mustChangePassword } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [personalWsId, setPersonalWsId] = useState<number | null>(null);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            setIsPaletteOpen(true);
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    api.get('/workspaces/personal')
      .then(res => setPersonalWsId(res.data.id))
      .catch(() => {});
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userSettingsItems: MenuProps['items'] = [
    {
      key: 'change-password',
      label: 'Change Password',
      onClick: () => setIsPasswordModalOpen(true)
    }
  ];

  const menuItems = [
    {
      key: 'my-workspace',
      icon: <HomeOutlined />,
      label: personalWsId ? <Link to={`/workspace/${personalWsId}`}>My Workspace</Link> : 'My Workspace',
      disabled: !personalWsId
    },
    {
      key: 'shared-workspaces',
      icon: <AppstoreOutlined />,
      label: <Link to="/">Shared Workspaces</Link>,
    },
    ...(role === 'ADMIN'
      ? [
          {
            key: 'admin',
            icon: <UserOutlined />,
            label: 'Management',
            children: [
              {
                key: 'admin-users',
                icon: <TeamOutlined />,
                label: <Link to="/admin/users">Users</Link>,
              },
              {
                key: 'admin-workspaces',
                icon: <AppstoreOutlined />,
                label: <Link to="/admin/workspaces">All Workspaces</Link>,
              },
            ],
          },
        ]
      : []),
  ];

  const getSelectedKey = () => {
      if (location.pathname === '/') return 'shared-workspaces';
      if (personalWsId && location.pathname.startsWith(`/workspace/${personalWsId}`)) return 'my-workspace';
      if (location.pathname.startsWith('/admin/users')) return 'admin-users';
      if (location.pathname.startsWith('/admin/workspaces')) return 'admin-workspaces';
      return '';
  };

  const isWorkspaceRoute = location.pathname.startsWith('/workspace/');

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible>
        <div style={{ height: 32, margin: 16, background: 'rgba(255, 255, 255, 0.2)', color: 'white', textAlign: 'center', lineHeight: '32px' }}>
          API COLLAB
        </div>
        <Menu theme="dark" selectedKeys={[getSelectedKey()]} mode="inline" items={menuItems} />
      </Sider>
      <Layout>
        <Header style={{ background: '#fff', padding: '0 16px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
          <span style={{ marginRight: 16 }}>Welcome, {username}</span>
          <Dropdown menu={{ items: userSettingsItems }} placement="bottomRight">
             <Button icon={<SettingOutlined />} style={{ marginRight: 16 }}>Settings</Button>
          </Dropdown>
          <Button icon={<LogoutOutlined />} onClick={handleLogout}>Logout</Button>
        </Header>
        <Content style={{ margin: isWorkspaceRoute ? 0 : '16px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ 
            padding: isWorkspaceRoute ? 0 : 24, 
            background: '#fff', 
            minHeight: 360,
            flex: 1,
            display: 'flex',
            flexDirection: 'column'
          }}>
            <Outlet />
          </div>
        </Content>
      </Layout>
      <ChangePasswordModal 
         open={isPasswordModalOpen || mustChangePassword} 
         onClose={() => setIsPasswordModalOpen(false)} 
         forced={mustChangePassword}
      />
      <CommandPalette 
         open={isPaletteOpen} 
         onClose={() => setIsPaletteOpen(false)} 
      />
    </Layout>
  );
};

export default MainLayout;
