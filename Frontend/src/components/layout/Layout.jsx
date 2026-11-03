import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import ToastContainer from '../common/Toast';
import { useToast } from '../../hooks/useToast';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { toasts, show, dismiss } = useToast();

  return (
    <div className={`flex min-h-screen bg-industrial-light transition-all duration-300`}>
      <Sidebar isCollapsed={!sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      <div
        className={`flex-1 flex flex-col relative transition-all duration-300 ${
          sidebarOpen ? 'pl-0 md:pl-64' : 'pl-0'
        }`}
      >
        <Navbar onMenuToggle={() => setSidebarOpen(!sidebarOpen)} sidebarOpen={sidebarOpen} />
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
      <ToastContainer toasts={toasts} dismiss={dismiss} />
    </div>
  );
};

export default Layout;
