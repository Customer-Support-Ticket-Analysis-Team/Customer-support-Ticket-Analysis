import React, { useState, useEffect } from 'react';
import {
  Ticket,
  Bell,
  User,
  Menu,
  ChevronLeft,
  ChevronRight,
  Clock,
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { notificationService } from '../../services/notificationService';

const Navbar = ({ onMenuToggle, sidebarOpen }) => {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsLoading, setNotificationsLoading] = useState(false);

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

  const fetchNotifications = async () => {
    setNotificationsLoading(true);
    try {
      const data = await notificationService.getNotifications({ limit: 10 });
      const list = data.notifications ?? data ?? [];
      setNotifications(list);
      const unread = list.filter((n) => !n.read).length;
      setUnreadCount(unread);
    } catch (err) {
      if (!err.message?.includes('404')) {
        console.error('Failed to fetch notifications:', err);
      }
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setNotificationsLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count);
    } catch (err) {
      if (!err.message?.includes('404')) {
        console.error('Failed to fetch unread count:', err);
      }
      setUnreadCount(0);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(prev - 1, 0));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      fetchNotifications();
      fetchUnreadCount();
    }
  }, [isAuthenticated, authLoading]);

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onMenuToggle}
            className="p-2.5 text-slate-600 hover:text-industrial-blue hover:bg-gray-100 rounded-lg transition-colors md:hidden"
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

          {/* Notification Button with Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setNotificationsOpen(!notificationsOpen);
                setProfileOpen(false);
              }}
              className="relative p-2.5 text-slate-400 hover:text-slate-600 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Notifications"
              aria-expanded={notificationsOpen}
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span
                  className={`absolute top-1 right-1 ${
                    unreadCount > 9 ? 'w-5 h-5 text-[10px]' : 'w-2 h-2'
                  } bg-red-500 rounded-full border-2 border-white flex items-center justify-center ${
                    unreadCount > 9 ? 'text-white font-bold' : ''
                  }`}
                >
                  {unreadCount > 9 ? '9+' : ''}
                </span>
              )}
            </button>

            {notificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-xl shadow-gray-200/50 z-50">
                <div className="px-4 py-3 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
                    <button
                      onClick={handleMarkAllAsRead}
                      className="text-xs text-industrial-blue hover:text-industrial-blue/80 font-medium"
                      disabled={unreadCount === 0}
                    >
                      Mark all as read
                    </button>
                  </div>
                </div>

                {notificationsLoading ? (
                  <div className="p-4 text-center text-slate-500 text-sm">Loading...</div>
                ) : notifications.length === 0 ? (
                  <div className="p-4 text-center">
                    <p className="text-sm text-slate-500">No notifications</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {notifications.map((notification) => (
                      <button
                        key={notification.id}
                        onClick={() => {
                          handleMarkAsRead(notification.id);
                          setNotificationsOpen(false);
                        }}
                        className={`w-full px-4 py-3 flex items-center space-x-3 hover:bg-gray-50 transition-colors ${
                          !notification.read ? 'bg-blue-50' : ''
                        }`}
                      >
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                          <Clock className="w-4 h-4 text-slate-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {notification.title}
                          </p>
                          <p className="text-xs text-slate-500 truncate">
                            {notification.message}
                          </p>
                        </div>
                        {!notification.read && (
                          <span className="w-2 h-2 bg-blue-500 rounded-full" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Profile Button */}
          <div className="relative">
            <button
              onClick={() => {
                navigate('/profile');
              }}
              className="flex items-center space-x-2 p-1 text-slate-400 hover:text-slate-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              aria-label="User profile"
            >
              <div className="w-9 h-9 rounded-xl bg-industrial-light flex items-center justify-center text-industrial-blue font-semibold border border-gray-100 shadow-sm">
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt="Profile"
                    className="w-9 h-9 rounded-xl object-cover"
                  />
                ) : (
                  <User className="w-5 h-5" />
                )}
              </div>
              <span className={`text-sm font-medium ${isAuthenticated ? 'text-gray-900' : 'text-slate-400'}`}>
                {isAuthenticated && user?.name ? user.name : 'Profile'}
              </span>
              <ChevronRight className={`w-4 h-4 text-gray-400`} />
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
