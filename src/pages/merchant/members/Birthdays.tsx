import React, { useState, useEffect } from 'react';
import { Cake, Calendar, Send, Settings, Users } from 'lucide-react';
import api from '../../../services/api';
import toast from 'react-hot-toast';

interface Birthday {
  _id: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  dateOfBirth: string;
  phone: string;
  email?: string;
  photo?: string;
  birthDay: number;
  birthMonth: number;
  age: number;
  fullName: string;
  daysUntil?: number;
}

const Birthdays: React.FC = () => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [birthdays, setBirthdays] = useState<Birthday[]>([]);
  const [todaysBirthdays, setTodaysBirthdays] = useState<Birthday[]>([]);
  const [upcomingBirthdays, setUpcomingBirthdays] = useState<Birthday[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingTo, setSendingTo] = useState<string | null>(null);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  useEffect(() => {
    fetchBirthdays();
    fetchTodaysBirthdays();
    fetchUpcomingBirthdays();
  }, [selectedMonth]);

  const fetchBirthdays = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/birthdays/month/${selectedMonth}`);
      setBirthdays(response.data.data.birthdays);
    } catch (error) {
      toast.error('Failed to load birthdays');
    } finally {
      setLoading(false);
    }
  };

  const fetchTodaysBirthdays = async () => {
    try {
      const response = await api.get('/birthdays/today');
      setTodaysBirthdays(response.data.data.birthdays);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchUpcomingBirthdays = async () => {
    try {
      const response = await api.get('/birthdays/upcoming');
      setUpcomingBirthdays(response.data.data.birthdays);
    } catch (error) {
      console.error(error);
    }
  };

  const handleSendBirthdaySMS = async (memberId: string) => {
    try {
      setSendingTo(memberId);
      await api.post(`/birthdays/send-sms/${memberId}`, {});
      toast.success('Birthday SMS sent successfully!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to send SMS');
    } finally {
      setSendingTo(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            <Cake className="w-7 h-7 mr-3 text-pink-500" />
            Birthdays
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Celebrate with your members on their special day
          </p>
        </div>
        <button
          onClick={() => window.location.href = '/members/birthdays/settings'}
          className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          <Settings className="w-4 h-4 mr-2" />
          Configure Automation
        </button>
      </div>

      {/* Today's Birthdays */}
      {todaysBirthdays.length > 0 && (
        <div className="bg-gradient-to-r from-pink-500 to-purple-600 rounded-xl p-6 text-white">
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <Cake className="w-6 h-6 mr-2" />
            🎉 Today's Birthdays ({todaysBirthdays.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {todaysBirthdays.map((member) => (
              <div key={member._id} className="bg-white/10 backdrop-blur rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{member.fullName}</p>
                    <p className="text-sm opacity-90">Turning {member.age} today!</p>
                  </div>
                  <button
                    onClick={() => handleSendBirthdaySMS(member._id)}
                    disabled={sendingTo === member._id}
                    className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Birthdays */}
      {upcomingBirthdays.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6">
          <h2 className="text-lg font-bold text-blue-900 dark:text-blue-100 mb-4 flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            Upcoming Birthdays (Next 7 Days)
          </h2>
          <div className="space-y-2">
            {upcomingBirthdays.map((member) => (
              <div key={member._id} className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg p-3">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{member.fullName}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    In {member.daysUntil} day{member.daysUntil !== 1 ? 's' : ''} • Turning {member.age + 1}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Month Selector */}
      <div className="flex items-center space-x-4 overflow-x-auto pb-2">
        {months.map((month, index) => (
          <button
            key={index}
            onClick={() => setSelectedMonth(index + 1)}
            className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
              selectedMonth === index + 1
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {month}
          </button>
        ))}
      </div>

      {/* Birthday List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {months[selectedMonth - 1]} Birthdays ({birthdays.length})
          </h2>
        </div>
        
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : birthdays.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No birthdays in {months[selectedMonth - 1]}
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {birthdays.map((member) => (
              <div key={member._id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                    <span className="text-xl">🎂</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{member.fullName}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {months[selectedMonth - 1]} {member.birthDay} • Turning {member.age + 1}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleSendBirthdaySMS(member._id)}
                  disabled={sendingTo === member._id}
                  className="flex items-center px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {sendingTo === member._id ? 'Sending...' : 'Send SMS'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Birthdays;