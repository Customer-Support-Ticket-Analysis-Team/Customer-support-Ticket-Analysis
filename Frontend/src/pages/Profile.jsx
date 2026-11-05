import React, { useState } from 'react';
import {
  User,
  Ticket,
  Clock,
  CheckCircle2,
  AlertCircle,
  Mail,
  Edit,
  Save,
  Upload,
  Bell,
  ChevronRight,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../hooks/useToast';

const Profile = () => {
  const { user, logout, updateUser, loading } = useAuth();
  const navigate = useNavigate();
  const { show } = useToast();
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    department: user?.department || '',
  });

  const handleSave = async (e) => {
    e.preventDefault();
    setEditing(false);
    try {
      const updated = { ...user, ...formData };
      updateUser(updated);
      show({
        title: 'Profile Updated',
        description: 'Your profile information has been saved successfully.',
        type: 'success',
      });
    } catch (err) {
      show({
        title: 'Update Failed',
        description: err.message,
        type: 'error',
      });
    }
  };

  const handleLogout = async (e) => {
    e.preventDefault();
    await logout();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-industrial-light border-4 border-industrial-blue/20 flex items-center justify-center">
            <User className="w-6 h-6 text-industrial-blue" />
          </div>
          <p className="text-slate-500 text-sm">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center text-center min-h-[60vh] space-y-6">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8 text-slate-400" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Please Sign In</h2>
        <p className="text-slate-500">You need to be signed in to view your profile.</p>
        <button
          onClick={() => navigate('/login')}
          className="px-6 py-3 bg-industrial-blue text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
        >
          Sign In
        </button>
      </div>
    );
  }

  const stats = [
    {
      label: 'Tickets Created',
      value: user.tickets_created || 12,
      icon: Ticket,
      color: 'bg-blue-500 text-blue-600',
    },
    {
      label: 'Resolved',
      value: user.tickets_resolved || 7,
      icon: CheckCircle2,
      color: 'bg-emerald-500 text-emerald-600',
    },
    {
      label: 'Open',
      value: user.tickets_open || 3,
      icon: AlertCircle,
      color: 'bg-amber-500 text-amber-600',
    },
    {
      label: 'Avg. Downtime',
      value: `${user.avg_downtime || 4.2} hrs`,
      icon: Clock,
      color: 'bg-indigo-500 text-indigo-600',
    },
  ];

  const recentActivity = [
    {
      title: 'Ticket created',
      description: 'Machine Failure - M-101',
      time: '2 hours ago',
      status: 'Open',
      statusColor: 'text-amber-600 bg-amber-50',
    },
    {
      title: 'Ticket updated',
      description: 'Connectivity Issue - M-205',
      time: '1 day ago',
      status: 'In Progress',
      statusColor: 'text-blue-600 bg-blue-50',
    },
    {
      title: 'Ticket resolved',
      description: 'Sensor Alert - M-110',
      time: '3 days ago',
      status: 'Resolved',
      statusColor: 'text-emerald-600 bg-emerald-50',
    },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="space-y-8">
          {/* Page Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">My Profile</h2>
              <p className="text-slate-500">Manage your account settings and personal information</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-5 py-2.5 bg-red-50 border border-red-100 rounded-xl text-sm font-medium text-red-700 hover:bg-red-100 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>

          {/* Profile Header Card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-8 py-8">
              <div className="flex flex-col md:flex-row md:items-center gap-8">
                <div className="flex-shrink-0">
                  <div
                    className={`w-24 h-24 rounded-2xl bg-industrial-light flex items-center justify-center text-industrial-blue shadow-sm border border-gray-100`}
                  >
                    {user?.avatar ? (
                      <img src={user.avatar} alt="Profile" className="w-24 h-24 rounded-2xl object-cover" />
                    ) : (
                      <User className="w-12 h-12" />
                    )}
                  </div>
                  {!editing && (
                    <button
                      onClick={() => setEditing(true)}
                      className="mt-3 flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-industrial-blue hover:bg-gray-50 transition-colors"
                    >
                      <Edit className="w-3 h-3" /> Edit Profile
                    </button>
                  )}
                  {editing && (
                    <div className="mt-3 flex items-center space-x-3">
                      <label className="block w-9 h-9 rounded-full bg-industrial-light flex items-center justify-center cursor-pointer">
                        <Upload className="w-4 h-4 text-industrial-blue" />
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files[0]) {
                              const url = URL.createObjectURL(e.target.files[0]);
                              setFormData((prev) => ({ ...prev, avatar: url }));
                            }
                          }}
                        />
                      </label>
                      <button
                        onClick={() => setEditing(false)}
                        className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <h1 className="text-2xl font-bold text-gray-900">{formData.name || 'User'}</h1>
                    <span className="px-2.5 py-0.5 rounded-full bg-industrial-blue/10 text-industrial-blue text-xs font-semibold">
                      {user?.role || 'User'}
                    </span>
                  </div>
                  <p className="mt-1 text-slate-500 text-sm flex items-center space-x-2">
                    <Mail className="w-3 h-3" /> {formData.email || 'not provided'}
                  </p>
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {stats.map((stat) => (
                      <div
                        key={stat.label}
                        className="p-3 rounded-xl border border-gray-100 bg-gray-50 flex items-center space-x-3"
                      >
                        <div className={`w-8 h-8 rounded-lg ${stat.color} flex items-center justify-center`}>
                          <stat.icon className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 font-medium">{stat.label}</p>
                          <p className="text-sm font-bold text-gray-900">{stat.value}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {editing ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-lg font-bold text-gray-900">Edit Profile Information</h3>
              </div>
              <div className="p-6">
                <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <label className="block text-sm font-medium text-gray-700">Full Name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div className="space-y-4">
                    <label className="block text-sm font-medium text-gray-700">Email Address</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                      placeholder="name@company.com"
                    />
                  </div>
                  <div className="space-y-4">
                    <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                      placeholder="+1 234 567 8900"
                    />
                  </div>
                  <div className="space-y-4">
                    <label className="block text-sm font-medium text-gray-700">Department</label>
                    <input
                      type="text"
                      name="department"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                      placeholder="Engineering"
                    />
                  </div>
                </form>
              </div>
              <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="px-6 py-3 rounded-xl font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 rounded-xl bg-industrial-blue text-white font-medium hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <Save className="w-4 h-4" /> Save Changes
                </button>
              </div>
            </div>
          ) : (
            <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex items-center space-x-3">
                  <User className="w-5 h-5 text-industrial-blue" />
                  <h3 className="text-lg font-bold text-gray-900">Personal Information</h3>
                </div>
                <div className="p-6 space-y-5">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Full Name</p>
                    <p className="text-gray-900">{formData.name || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Email</p>
                    <p className="text-gray-900">{formData.email || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Phone</p>
                    <p className="text-gray-900">{formData.phone || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Department</p>
                    <p className="text-gray-900">{formData.department || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Member Since</p>
                    <p className="text-gray-900">{user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Recent'}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex items-center space-x-3">
                  <Bell className="w-5 h-5 text-industrial-blue" />
                  <h3 className="text-lg font-bold text-gray-900">Notification Preferences</h3>
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Email Notifications</p>
                      <p className="text-xs text-slate-500">Receive ticket updates via email</p>
                    </div>
                    <div className="relative">
                      <input
                        type="checkbox"
                        className="peer sr-only"
                        defaultChecked
                      />
                      <div className="w-11 h-6 bg-gray-200 rounded-full peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Push Notifications</p>
                      <p className="text-xs text-slate-500">Get instant alerts on new tickets</p>
                    </div>
                    <div className="relative">
                      <input
                        type="checkbox"
                        className="peer sr-only"
                        defaultChecked
                      />
                      <div className="w-11 h-6 bg-gray-200 rounded-full peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">SMS Alerts</p>
                      <p className="text-xs text-slate-500">Critical machine alerts via SMS</p>
                    </div>
                    <div className="relative">
                      <input
                        type="checkbox"
                        className="peer sr-only"
                      />
                      <div className="w-11 h-6 bg-gray-200 rounded-full peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Clock className="w-5 h-5 text-industrial-blue" />
                  <h3 className="text-lg font-bold text-gray-900">Recent Activity</h3>
                </div>
                <button className="text-sm font-medium text-industrial-blue hover:text-industrial-blue/80 flex items-center space-x-1">
                  View All <ChevronRight className="w-3 h-3" />
                </button>
              </div>
              <div className="p-0 divide-y divide-gray-50/50">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start space-x-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${activity.statusColor} mt-0.5`}>
                        <Ticket className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                        <p className="text-sm text-slate-500">{activity.description}</p>
                        <p className="text-xs text-slate-400 mt-1">{activity.time}</p>
                      </div>
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${activity.statusColor}`}>
                        {activity.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>)}
        </div>
      </div>
  );
};

export default Profile;
