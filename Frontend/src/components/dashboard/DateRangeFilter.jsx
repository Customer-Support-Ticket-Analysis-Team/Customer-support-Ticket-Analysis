import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, Clock } from 'lucide-react';

const DATE_OPTIONS = [
  { value: 'all', label: 'All Time' },
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'last7', label: 'Last 7 Days' },
  { value: 'last30', label: 'Last 30 Days' },
  { value: 'last90', label: 'Last 90 Days' },
  { value: 'thisMonth', label: 'This Month' },
  { value: 'lastMonth', label: 'Last Month' },
  { value: 'thisYear', label: 'This Year' },
  { value: 'custom', label: 'Custom Range' },
];

const startOfDay = (d) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};
const addDays = (d, n) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};
const addMonths = (d, n) => {
  const x = new Date(d);
  x.setMonth(x.getMonth() + n);
  return x;
};
const fmt = (d) => d.toISOString().slice(0, 10);
const firstDayOfMonth = (d) => new Date(d.getFullYear(), d.getMonth(), 1);
const lastDayOfMonth = (d) => new Date(d.getFullYear(), d.getMonth() + 1, 0);
const firstDayOfYear = (d) => new Date(d.getFullYear(), 0, 1);

const computePreset = (value) => {
  const now = startOfDay(new Date());
  switch (value) {
    case 'today':
      return { from: fmt(now), to: fmt(now), label: 'Today' };
    case 'yesterday': {
      const d = addDays(now, -1);
      return { from: fmt(d), to: fmt(d), label: 'Yesterday' };
    }
    case 'last7': {
      const d = addDays(now, -6);
      return { from: fmt(d), to: fmt(now), label: 'Last 7 Days' };
    }
    case 'last30': {
      const d = addDays(now, -29);
      return { from: fmt(d), to: fmt(now), label: 'Last 30 Days' };
    }
    case 'last90': {
      const d = addDays(now, -89);
      return { from: fmt(d), to: fmt(now), label: 'Last 90 Days' };
    }
    case 'thisMonth':
      return { from: fmt(firstDayOfMonth(now)), to: fmt(now), label: 'This Month' };
    case 'lastMonth': {
      const prev = addMonths(now, -1);
      return {
        from: fmt(firstDayOfMonth(prev)),
        to: fmt(lastDayOfMonth(prev)),
        label: 'Last Month',
      };
    }
    case 'thisYear':
      return { from: fmt(firstDayOfYear(now)), to: fmt(now), label: 'This Year' };
    default:
      return null;
  }
};

const DateRangeFilter = ({ value, onChange }) => {
  const [customFrom, setCustomFrom] = useState(value.from || '');
  const [customTo, setCustomTo] = useState(value.to || '');
  const [presetValue, setPresetValue] = useState(value.type);

  // Sync custom inputs when the controlled value changes (e.g. preset selected).
  useEffect(() => {
    setCustomFrom(value.from || '');
    setCustomTo(value.to || '');
    setPresetValue(value.type);
  }, [value.type, value.from, value.to]);

  const handlePresetSelect = useCallback(
    (selectedValue) => {
      if (selectedValue === 'custom') {
        setPresetValue('custom');
        return;
      }
      const preset = computePreset(selectedValue);
      if (!preset) {
        setCustomFrom('');
        setCustomTo('');
        setPresetValue('all');
        onChange({ type: 'all', from: '', to: '', label: 'All Time' });
      } else {
        setCustomFrom(preset.from);
        setCustomTo(preset.to);
        setPresetValue(selectedValue);
        onChange({ ...preset, type: selectedValue });
      }
    },
    [onChange]
  );

  const handleDateChange = useCallback(() => {
    if (!customFrom || !customTo) {
      setPresetValue('all');
      onChange({ type: 'all', from: '', to: '', label: 'All Time' });
      return;
    }
    setPresetValue('custom');
    onChange({
      type: 'custom',
      from: customFrom,
      to: customTo,
      label: `Custom: ${customFrom} to ${customTo}`,
    });
  }, [customFrom, customTo, onChange]);

  const handleReset = useCallback(() => {
    setCustomFrom('');
    setCustomTo('');
    setPresetValue('all');
    onChange({ type: 'all', from: '', to: '', label: 'All Time' });
  }, [onChange]);

  const current = DATE_OPTIONS.find((o) => o.value === value.type) || DATE_OPTIONS[0];

  return (
    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
      {/* Quick-select presets */}
      <div className="flex items-center gap-2">
        <Calendar className="w-4 h-4 text-slate-400" />
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Quick Range
        </label>
      </div>
      <select
        value={presetValue}
        onChange={(e) => handlePresetSelect(e.target.value)}
        className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
      >
        {DATE_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {/* Calendar date inputs — always visible so any date (e.g. 2023) can be picked */}
      <div className="flex items-center gap-2">
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mr-1">
          From
        </label>
        <input
          type="date"
          value={customFrom}
          onChange={(e) => setCustomFrom(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <span className="text-xs text-slate-400 mx-1">to</span>
        <input
          type="date"
          value={customTo}
          onChange={(e) => setCustomTo(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleDateChange}
          className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-xl transition-colors"
        >
          Apply
        </button>
        <button
          onClick={handleReset}
          className="px-3 py-2 text-slate-600 hover:text-slate-900 text-xs font-medium hover:bg-gray-100 rounded-xl transition-colors"
        >
          Reset
        </button>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <Clock className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-sm font-medium text-slate-700">{current.label}</span>
      </div>
    </div>
  );
};

export default DateRangeFilter;
