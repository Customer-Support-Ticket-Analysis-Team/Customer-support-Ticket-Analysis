import React from 'react';
import { Ticket, Bell, User, Menu, ChevronLeft, X } from 'lucide-react';
import { useLocation } from 'react-router-dom';

const Navbar = ({ onMenuToggle, sidebarOpen }) => {
  const location = useLocation();

  const getPageTitle = (path) => {
    switch (path) {
      case '/': return 'Dashboard Overview';
      case '/tickets': return 'Manage Tickets';
      case '/tickets/new': return 'Create New Ticket';
      case '/analytics': return 'Ticket Analytics';
      default: return 'IIoT Support System';
    }
  };

  const getPageSubtitle = (path) => {
    switch (path) {
      case '/': return 'Monitor ticket health and system performance';
      case '/tickets': return 'Track, filter, and update support tickets';
      case '/tickets/new': return 'Report a new industrial equipment issue';
      case '/analytics': return 'Analyze trends, priorities, and machine performance';
      default: return 'IIoT Customer Support Ticket Analytics';
    }
  };

  const now = new Date();
  const formattedDate = now.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onMenuToggle}
            className="p-2.5 text-slate-600 hover:text-industrial-blue hover:bg-gray-100 rounded-lg transition-colors"
            aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}
          >
            {sidebarOpen ? (
              <ChevronLeft className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
          <div className="flex items-center space-x-3">
            <div className="bg-industrial-blue p-2 rounded-lg shadow-lg shadow-industrial-blue/20">
              <Ticket className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-gray-900 tracking-tight uppercase">IIoT Support</h1>
              <p className="text-[11px] text-slate-500 font-medium">Customer Analytics</p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-5 hidden sm:flex">
          <div className="hidden md:flex flex-col items-end">
            <p className="text-sm font-medium text-gray-900">{formattedDate}</p>
            <p className="text-xs text-slate-500">System Online</p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-industrial-light flex items-center justify-center text-industrial-blue font-semibold border border-gray-100 shadow-sm">
              <User className="w-5 h-5" />
            </div>
            <button className="relative p-2.5 text-slate-400 hover:text-slate-600 hover:bg-gray-100 rounded-lg transition-colors" aria-label="Notifications">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-100 bg-gray-50 px-8">
        <div className="flex items-center space-x-4 py-2">
          <div className="w-1 h-5 bg-industrial-blue rounded-full"></div>
          <span className="text-xs font-medium text-gray-500">{getPageTitle(location.pathname)}</span>
          <span className="w-px h-2 bg-gray-200 mx-1"></span>
          <span className="text-xs text-gray-400">{getPageSubtitle(location.pathname)}</span>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
