import React from 'react';
import {
  LayoutDashboard,
  Ticket,
  PlusCircle,
  BarChart3,
  Clock2,
  X,
} from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';

const Sidebar = ({ isCollapsed, onToggle }) => {
  const navigate = useNavigate();
  const menuItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/tickets', label: 'Manage Tickets', icon: Ticket },
    { path: '/tickets/new', label: 'Add New Ticket', icon: PlusCircle },
    { path: '/analytics', label: 'Analytics', icon: BarChart3 },
  ];

  const handleMenuClick = (path) => {
    navigate(path);
    onToggle(false);
  };

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 w-64 bg-industrial-navy text-white flex flex-col transition-all duration-300 ease-in-out shadow-xl border-r border-industrial-navy/50 ${isCollapsed ? '-translate-x-full' : 'translate-x-0'}`}
    >
      <div className="p-6 flex items-center justify-between space-x-3 mb-10 border-b border-white/5 pb-6">
        <div className="flex items-center space-x-3">
          <div className="bg-blue-600 p-2.5 rounded-lg shadow-lg shadow-blue-600/20">
            <Ticket className="w-6 h-6 text-white" />
          </div>
          <span className={`text-xl font-bold tracking-tight ${isCollapsed ? 'hidden' : 'block'}`}>
            IIoT Support
          </span>
        </div>
        <button
          onClick={() => onToggle(false)}
          className="p-2 text-white/60 hover:text-white rounded-lg transition-colors md:hidden"
          aria-label="Close menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end
            onClick={() => handleMenuClick(item.path)}
            className={({ isActive }) => `
              flex items-center space-x-3 px-4 py-3.5 rounded-xl transition-all duration-200 cursor-pointer
              ${isActive
                ? 'bg-blue-600/20 text-blue-100 border-r-2 border-blue-600 shadow-soft'
                : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'}
            `}
          >
            {({ isActive }) => (
              <>
                <item.icon className={`w-5 h-5 ${isActive ? 'text-blue-300' : 'text-slate-500'}`} />
                <span className={`font-medium ${isCollapsed ? 'hidden' : 'block'}`}>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 mt-auto border-t border-white/10">
        <div className="flex items-center space-x-3 px-4 py-3.5 rounded-xl text-slate-400 hover:bg-slate-800/50 hover:text-white transition-colors cursor-pointer">
          <Clock2 className="w-5 h-5" />
          <div>
            <p className={`text-xs font-medium ${isCollapsed ? 'hidden' : 'block'}`}>System Status</p>
            <p className={`text-[10px] text-slate-500 ${isCollapsed ? 'hidden' : 'block'}`}>All systems operational</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
