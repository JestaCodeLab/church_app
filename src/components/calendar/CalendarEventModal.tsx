import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Bell } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { showToast } from '../../utils/toasts';
import { calendarAPI } from '../../services/api';

const PRESET_COLORS = [
  '#4F46E5', // indigo
  '#0EA5E9', // sky
  '#10B981', // emerald
  '#F59E0B', // amber
  '#EF4444', // red
  '#8B5CF6', // violet
];

interface Reminder {
  _id?: string;
  timeValue: number;
  timeUnit: 'minutes' | 'hours' | 'days';
  email: string;
  sent?: boolean;
  sentAt?: string;
}

interface CalendarEventData {
  _id?: string;
  title: string;
  description: string;
  location: string;
  startDate: string;
  endDate: string;
  allDay: boolean;
  color: string;
  reminders: Reminder[];
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  initialData?: Partial<CalendarEventData> | null;
  mode: 'create' | 'edit';
}

function toDatetimeLocal(date: Date | string | undefined): string {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  // Format as YYYY-MM-DDTHH:mm
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const CalendarEventModal: React.FC<Props> = ({ isOpen, onClose, onSaved, initialData, mode }) => {
  const { user } = useAuth();
  const userEmail = (user as any)?.email || '';

  const emptyForm: CalendarEventData = {
    title: '',
    description: '',
    location: '',
    startDate: '',
    endDate: '',
    allDay: false,
    color: '#4F46E5',
    reminders: []
  };

  const [form, setForm] = useState<CalendarEventData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setForm({
          ...emptyForm,
          ...initialData,
          startDate: toDatetimeLocal(initialData.startDate as any),
          endDate: toDatetimeLocal(initialData.endDate as any),
          reminders: initialData.reminders || []
        });
      } else {
        setForm(emptyForm);
      }
    }
  }, [isOpen, initialData]);

  const handleChange = (field: keyof CalendarEventData, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const addReminder = () => {
    setForm(prev => ({
      ...prev,
      reminders: [
        ...prev.reminders,
        { timeValue: 30, timeUnit: 'minutes', email: userEmail }
      ]
    }));
  };

  const updateReminder = (index: number, field: keyof Reminder, value: any) => {
    setForm(prev => {
      const updated = [...prev.reminders];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, reminders: updated };
    });
  };

  const removeReminder = (index: number) => {
    setForm(prev => ({
      ...prev,
      reminders: prev.reminders.filter((_, i) => i !== index)
    }));
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      showToast.error('Title is required');
      return;
    }
    if (!form.startDate) {
      showToast.error('Start date is required');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        startDate: new Date(form.startDate).toISOString(),
        endDate: form.endDate ? new Date(form.endDate).toISOString() : undefined
      };

      if (mode === 'edit' && initialData?._id) {
        await calendarAPI.updateEvent(initialData._id, payload);
        showToast.success('Event updated');
      } else {
        await calendarAPI.createEvent(payload);
        showToast.success('Event created');
      }
      onSaved();
      onClose();
    } catch (err: any) {
      showToast.error(err?.response?.data?.message || 'Failed to save event');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!initialData?._id) return;
    setDeleting(true);
    try {
      await calendarAPI.deleteEvent(initialData._id);
      showToast.success('Event deleted');
      onSaved();
      onClose();
    } catch (err: any) {
      showToast.error(err?.response?.data?.message || 'Failed to delete event');
    } finally {
      setDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {mode === 'edit' ? 'Edit Event' : 'New Event'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={e => handleChange('title', e.target.value)}
              placeholder="Event title"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* All Day toggle */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="allDay"
              checked={form.allDay}
              onChange={e => handleChange('allDay', e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-primary-600"
            />
            <label htmlFor="allDay" className="text-sm text-gray-700 dark:text-gray-300">All day</label>
          </div>

          {/* Start / End dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Start <span className="text-red-500">*</span>
              </label>
              <input
                type={form.allDay ? 'date' : 'datetime-local'}
                value={form.allDay ? form.startDate?.slice(0, 10) : form.startDate}
                onChange={e => handleChange('startDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End</label>
              <input
                type={form.allDay ? 'date' : 'datetime-local'}
                value={form.allDay ? form.endDate?.slice(0, 10) : form.endDate}
                onChange={e => handleChange('endDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Location</label>
            <input
              type="text"
              value={form.location}
              onChange={e => handleChange('location', e.target.value)}
              placeholder="Optional location"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={e => handleChange('description', e.target.value)}
              placeholder="Optional notes"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            />
          </div>

          {/* Color */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Color</label>
            <div className="flex items-center space-x-2">
              {PRESET_COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => handleChange('color', c)}
                  className="w-7 h-7 rounded-full border-2 transition-transform hover:scale-110"
                  style={{
                    backgroundColor: c,
                    borderColor: form.color === c ? '#111827' : 'transparent'
                  }}
                />
              ))}
            </div>
          </div>

          {/* Reminders */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                <Bell className="w-4 h-4 mr-1" /> Email Reminders
              </label>
              <button
                type="button"
                onClick={addReminder}
                className="flex items-center text-xs text-primary-600 hover:text-primary-700 font-medium"
              >
                <Plus className="w-3.5 h-3.5 mr-0.5" /> Add Reminder
              </button>
            </div>
            {form.reminders.length === 0 && (
              <p className="text-xs text-gray-400 dark:text-gray-500">No reminders set.</p>
            )}
            <div className="space-y-2">
              {form.reminders.map((reminder, i) => (
                <div key={i} className="flex items-center space-x-2 p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <input
                    type="number"
                    min={1}
                    value={reminder.timeValue}
                    onChange={e => updateReminder(i, 'timeValue', Number(e.target.value))}
                    className="w-16 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                  <select
                    value={reminder.timeUnit}
                    onChange={e => updateReminder(i, 'timeUnit', e.target.value)}
                    className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  >
                    <option value="minutes">minutes</option>
                    <option value="hours">hours</option>
                    <option value="days">days</option>
                  </select>
                  <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">before →</span>
                  <input
                    type="email"
                    value={reminder.email}
                    onChange={e => updateReminder(i, 'email', e.target.value)}
                    placeholder="email@example.com"
                    className="flex-1 min-w-0 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                  <button
                    type="button"
                    onClick={() => removeReminder(i)}
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <div>
            {mode === 'edit' && (
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
              >
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving…' : mode === 'edit' ? 'Save changes' : 'Create event'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarEventModal;
