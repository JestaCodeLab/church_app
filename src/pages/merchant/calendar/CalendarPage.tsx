import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, dateFnsLocalizer, SlotInfo, View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, startOfMonth, endOfMonth, addMonths, subMonths } from 'date-fns';
import { enUS } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { calendarAPI } from '../../../services/api';
import { showToast } from '../../../utils/toasts';
import CalendarEventModal from '../../../components/calendar/CalendarEventModal';

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 0 }),
  getDay,
  locales: { 'en-US': enUS }
});

interface CalendarEventRaw {
  _id: string;
  title: string;
  description?: string;
  location?: string;
  startDate: string;
  endDate?: string;
  allDay: boolean;
  color: string;
  reminders: any[];
}

interface BigCalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  resource: CalendarEventRaw;
}

function toCalendarEvent(raw: CalendarEventRaw): BigCalendarEvent {
  const start = new Date(raw.startDate);
  const end = raw.endDate ? new Date(raw.endDate) : new Date(start.getTime() + 60 * 60 * 1000);
  return { id: raw._id, title: raw.title, start, end, allDay: raw.allDay, resource: raw };
}

const CalendarPage: React.FC = () => {
  const [events, setEvents] = useState<BigCalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<View>('month');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedEvent, setSelectedEvent] = useState<Partial<CalendarEventRaw> | null>(null);

  const fetchEvents = useCallback(async (date: Date) => {
    try {
      setLoading(true);
      const start = startOfMonth(subMonths(date, 1));
      const end = endOfMonth(addMonths(date, 1));
      const res = await calendarAPI.getEvents({
        startDate: start.toISOString(),
        endDate: end.toISOString()
      });
      const rawEvents: CalendarEventRaw[] = res.data?.data || [];
      setEvents(rawEvents.map(toCalendarEvent));
    } catch (err) {
      showToast.error('Failed to load calendar events');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents(currentDate);
  }, [currentDate, fetchEvents]);

  const handleSelectSlot = (slotInfo: SlotInfo) => {
    const startStr = slotInfo.start instanceof Date
      ? format(slotInfo.start, "yyyy-MM-dd'T'HH:mm")
      : '';
    const endStr = slotInfo.end instanceof Date
      ? format(slotInfo.end, "yyyy-MM-dd'T'HH:mm")
      : '';
    setSelectedEvent({ startDate: startStr, endDate: endStr });
    setModalMode('create');
    setModalOpen(true);
  };

  const handleSelectEvent = (event: BigCalendarEvent) => {
    setSelectedEvent(event.resource);
    setModalMode('edit');
    setModalOpen(true);
  };

  const openCreateModal = () => {
    setSelectedEvent(null);
    setModalMode('create');
    setModalOpen(true);
  };

  const eventStyleGetter = (event: BigCalendarEvent) => ({
    style: {
      backgroundColor: event.resource.color || '#4F46E5',
      borderRadius: '4px',
      border: 'none',
      color: '#fff',
      fontSize: '12px',
      padding: '2px 6px'
    }
  });

  const navigate = (direction: 'prev' | 'next' | 'today') => {
    if (direction === 'today') {
      setCurrentDate(new Date());
    } else if (direction === 'prev') {
      setCurrentDate(prev => subMonths(prev, 1));
    } else {
      setCurrentDate(prev => addMonths(prev, 1));
    }
  };

  return (
    <div className="flex flex-col h-full min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Calendar</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Manage your schedule and set email reminders
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          New Event
        </button>
      </div>

      {/* Calendar toolbar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => navigate('prev')}
            className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigate('today')}
            className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors border border-gray-300 dark:border-gray-600"
          >
            Today
          </button>
          <button
            onClick={() => navigate('next')}
            className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 ml-2">
            {format(currentDate, 'MMMM yyyy')}
          </h2>
        </div>

        {/* View switcher */}
        <div className="flex rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden">
          {(['month', 'week', 'day', 'agenda'] as View[]).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1.5 text-sm font-medium capitalize transition-colors ${
                view === v
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Calendar container */}
      <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
          </div>
        ) : (
          <Calendar
            localizer={localizer}
            events={events}
            view={view}
            onView={setView}
            date={currentDate}
            onNavigate={setCurrentDate}
            selectable
            onSelectSlot={handleSelectSlot}
            onSelectEvent={handleSelectEvent}
            eventPropGetter={eventStyleGetter}
            style={{ height: 'calc(100vh - 280px)', minHeight: 500 }}
            toolbar={false}
          />
        )}
      </div>

      {/* Modal */}
      <CalendarEventModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={() => fetchEvents(currentDate)}
        initialData={selectedEvent}
        mode={modalMode}
      />
    </div>
  );
};

export default CalendarPage;
