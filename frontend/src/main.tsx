import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/global.css';
import { BrowserRouter, Route, Routes, Navigate } from 'react-router';
import Layout from '@/components/Layout.tsx';
import TodoMain from '@/pages/todo-main.tsx';
import UserManagement from '@/pages/user-management.tsx';
import StatsDashboard from '@/pages/stats-dashboard.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/todo" replace />} />
          <Route path="/todo" element={<TodoMain />} />
          <Route path="/users" element={<UserManagement />} />
          <Route path="/stats" element={<StatsDashboard />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
