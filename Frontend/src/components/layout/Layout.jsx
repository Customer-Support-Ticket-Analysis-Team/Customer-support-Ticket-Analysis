import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import ToastContainer from '../common/Toast';
import { useToast } from '../../hooks/useToast';
import { AuthProvider } from '../../context/AuthContext';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { toasts, dismiss } = useToast();

  useEffect(() => {
    const checkScreen = () => {
      setSidebarOpen(window.innerWidth >= 768);
    };
    checkScreen();
    window.addEventListener('resize', checkScreen);
    return () => window.removeEventListener('resize', checkScreen);
  }, []);

  return (
    <AuthProvider>
      <div className={`flex min-h-screen bg-industrial-light transition-all duration-300`}>
        {/* Mobile backdrop overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        <Sidebar isCollapsed={!sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
        <div
          className={`flex-1 flex flex-col relative transition-all duration-300 ${
            sidebarOpen
              ? 'md:pl-64'
              : 'md:pl-0'
          }`}
        >
          <Navbar onMenuToggle={() => setSidebarOpen(!sidebarOpen)} sidebarOpen={sidebarOpen} />
          <main className="flex-1 p-4 md:p-6 overflow-y-auto">
            {children}
          </main>
        </div>
        <ToastContainer toasts={toasts} dismiss={dismiss} />
        </div>
    </AuthProvider>
  );
};

export default Layout;
