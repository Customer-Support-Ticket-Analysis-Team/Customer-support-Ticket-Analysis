import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, Mail, Monitor, AlertTriangle, HelpCircle } from 'lucide-react';
import Layout from '../components/layout/Layout';
import Loading from '../components/common/Loading';
import { ticketService } from '../services/ticketService';
import { useToast } from '../hooks/useToast';

const ISSUE_TYPES = [
  'Machine Failure',
  'Sensor Alert',
  'Connectivity',
  'Maintenance',
  'Other',
];

const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];

const AddTicket = () => {
  const navigate = useNavigate();
  const { show } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    reported_by: '',
    machine_id: '',
    issue_type: 'Machine Failure',
    priority: 'Medium',
    description: '',
    downtime_minutes: '',
  });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    if (!formData.reported_by.trim()) newErrors.reported_by = 'Reported by name is required';
    if (!formData.machine_id.trim()) newErrors.machine_id = 'Machine ID is required';
    if (!formData.description.trim()) newErrors.description = 'Please describe the issue';
    if (!formData.downtime_minutes) newErrors.downtime_minutes = 'Downtime minutes is required';
    else if (isNaN(parseInt(formData.downtime_minutes, 10))) newErrors.downtime_minutes = 'Please enter a valid number';
    else if (parseInt(formData.downtime_minutes, 10) < 0) newErrors.downtime_minutes = 'Downtime cannot be negative';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      await ticketService.createTicket({
        reported_by: formData.reported_by.trim(),
        machine_id: formData.machine_id.trim().toUpperCase(),
        issue_type: formData.issue_type,
        priority: formData.priority,
        description: formData.description.trim(),
        downtime_minutes: parseInt(formData.downtime_minutes, 10),
      });
      show({
        title: 'Ticket Created Successfully',
        description: 'Your support ticket has been submitted and is now being tracked.',
        type: 'success',
      });
      setTimeout(() => navigate('/tickets'), 1500);
    } catch (err) {
      show({ title: 'Failed to Create Ticket', description: err.message, type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const fieldIcon = (name) => {
    const icons = {
      reported_by: <Mail className="w-5 h-5 text-slate-400" />,
      machine_id: <Monitor className="w-5 h-5 text-slate-400" />,
      description: <AlertTriangle className="w-5 h-5 text-slate-400" />,
    };
    return icons[name];
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Page header */}
          <div className="bg-industrial-light px-8 py-8 border-b border-gray-100">
            <div className="flex items-center space-x-4">
              <div className="bg-white p-2.5 rounded-xl text-industrial-blue shadow-sm">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 tracking-tight">Report New Issue</h2>
                <p className="text-slate-500 text-sm mt-1">Create a support ticket for industrial equipment</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-8">
          {/* Personal & Machine Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="flex items-center space-x-4 text-sm font-semibold text-gray-700">
                {fieldIcon('reported_by')}
                Reported By
              </label>
              <input
                type="text"
                name="reported_by"
                className={`w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                  errors.reported_by ? 'border-red-500 bg-red-50' : 'border-gray-200'
                }`}
                value={formData.reported_by}
                onChange={handleChange}
                placeholder="e.g. Rahul Sharma"
              />
              {errors.reported_by && (
                <p className="text-xs text-red-600 flex items-center space-x-1 mt-1">
                  <AlertTriangle className="w-3 h-3" /> {errors.reported_by}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="flex items-center space-x-4 text-sm font-semibold text-gray-700">
                {fieldIcon('machine_id')}
                Machine ID
              </label>
              <input
                type="text"
                name="machine_id"
                className={`w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all uppercase ${
                  errors.machine_id ? 'border-red-500 bg-red-50' : 'border-gray-200'
                }`}
                value={formData.machine_id}
                onChange={handleChange}
                placeholder="e.g. M-101"
              />
              {errors.machine_id && (
                <p className="text-xs text-red-600 flex items-center space-x-1 mt-1">
                  <AlertTriangle className="w-3 h-3" /> {errors.machine_id}
                </p>
              )}
            </div>
          </div>

          {/* Issue Type & Priority */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Issue Type</label>
              <select
                name="issue_type"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white cursor-pointer transition-all"
                value={formData.issue_type}
                onChange={handleChange}
              >
                {ISSUE_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Priority</label>
              <select
                name="priority"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white cursor-pointer transition-all"
                value={formData.priority}
                onChange={handleChange}
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="flex items-center space-x-4 text-sm font-semibold text-gray-700">
              {fieldIcon('description')}
              Description
            </label>
            <textarea
              name="description"
              rows="5"
              className={`w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                errors.description ? 'border-red-500 bg-red-50' : 'border-gray-200'
              }`}
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe the problem in detail, including any error messages or unusual behavior..."
            />
            {errors.description && (
              <p className="text-xs text-red-600 flex items-center space-x-1 mt-1">
                <AlertTriangle className="w-3 h-3" /> {errors.description}
              </p>
            )}
          </div>

          {/* Downtime Minutes */}
          <div className="space-y-2">
            <div className="flex items-center space-x-4 text-sm font-semibold text-gray-700">
              <HelpCircle className="w-5 h-5 text-slate-400" />
              Downtime Minutes
            </div>
            <input
              type="number"
              name="downtime_minutes"
              className={`w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                errors.downtime_minutes ? 'border-red-500 bg-red-50' : 'border-gray-200'
              }`}
              value={formData.downtime_minutes}
              onChange={handleChange}
              placeholder="e.g. 120"
            />
            {errors.downtime_minutes && (
              <p className="text-xs text-red-600 flex items-center space-x-1 mt-1">
                <AlertTriangle className="w-3 h-3" /> {errors.downtime_minutes}
              </p>
            )}
            <p className="text-xs text-slate-500 mt-1">Estimated time the machine was non-operational</p>
          </div>

          {/* Form actions */}
          <div className="flex items-center justify-between space-x-4 pt-6 border-t border-gray-100">
            <button
              type="button"
              onClick={() => navigate('/tickets')}
              className="px-6 py-3 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-gray-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary"
            >
              {submitting ? (
                <>
                  <Loading message="" className="w-4 h-4" />
                  <span className="ml-2">Submitting...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span className="ml-2">Create Ticket</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
    </Layout>
  );
};

export default AddTicket;
