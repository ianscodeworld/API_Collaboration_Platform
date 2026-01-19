import { Routes, Route, Navigate } from 'react-router-dom'
import MainLayout from './layout/MainLayout'
import Login from './pages/Login'
import ApiDebugger from './pages/Dashboard/ApiDebugger'
import Workspaces from './pages/Dashboard/Workspaces'
import WorkspaceDetail from './pages/Dashboard/WorkspaceDetail'
import UserManagement from './pages/Admin/UserManagement'
import WorkspaceManagement from './pages/Admin/WorkspaceManagement'
import { useAuthStore } from './store/useAuthStore'

function App() {
  const token = useAuthStore((state) => state.token)

  return (
    <Routes>
      <Route path="/login" element={!token ? <Login /> : <Navigate to="/" />} />
      <Route path="/" element={token ? <MainLayout /> : <Navigate to="/login" />}>
        <Route index element={<Workspaces />} />
        <Route path="workspace/:id" element={<WorkspaceDetail />} />
        <Route path="proxy" element={<ApiDebugger />} />
        
        {/* Admin Routes */}
        <Route path="admin/users" element={<UserManagement />} />
        <Route path="admin/workspaces" element={<WorkspaceManagement />} />
      </Route>
    </Routes>
  )
}

export default App