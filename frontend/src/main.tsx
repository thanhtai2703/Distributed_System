import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/global.css';
import App from './App.tsx';
import { BrowserRouter, Route, Routes } from 'react-router';
import Layout from '@/components/Layout.tsx';
import TodoMain from '@/pages/todo-main.tsx';
import ComponentTest from '@/components/component-test.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<App />} />
          <Route path={'/todo'} element={<TodoMain />} />
          <Route path={'/test'} element={<ComponentTest />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
