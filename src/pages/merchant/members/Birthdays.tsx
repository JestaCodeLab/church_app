import React, { useState, useEffect } from 'react';
import {  
  Calendar, 
  Send, 
  Settings, 
  Users,
  TrendingUp,
  Clock,
  Gift,
  Bell,
  CheckCircle,
  XCircle,
  Loader,
  Search,
  Download,
  Zap,
  Cake,
  MessageSquare
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../../services/api';
import { showToast } from '../../../utils/toasts';
import { checkFeatureAccess } from '../../../utils/featureAccess';
import PermissionGuard from '../../../components/guards/PermissionGuard';

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
  branch?: {
    _id: string;
    name: string;
  };
  smsSent?: boolean;
  smsStatus?: 'sent' | 'pending' | 'failed';
}

interface BirthdayStats {
  today: number;
  thisWeek: number;
  thisMonth: number;
  upcoming: number;
  totalMembers: number;
  automationEnabled: boolean;
}

interface AutomationSettings {
  enabled: boolean;
  sendDaysBefore: number;
  customMessage?: string;
  sendTime: string;
  automationStatus?: {
    hasRunToday: boolean;
    lastRun?: string;
    nextScheduledRun?: string;
  };
}

const Birthdays: React.FC = () => {
  const navigate = useNavigate();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [birthdays, setBirthdays] = useState<Birthday[]>([]);
  const [todaysBirthdays, setTodaysBirthdays] = useState<Birthday[]>([]);
  const [upcomingBirthdays, setUpcomingBirthdays] = useState<Birthday[]>([]);
  const [stats, setStats] = useState<BirthdayStats | null>(null);
  const [automationSettings, setAutomationSettings] = useState<AutomationSettings | null>(null);
  const [smsCredits, setSmsCredits] = useState<number>(0);
  const [hasSmsAutomationAccess, setHasSmsAutomationAccess] = useState<boolean>(false);
  
  const [loading, setLoading] = useState(true);
  const [sendingTo, setSendingTo] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBranch, setFilterBranch] = useState('');

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  useEffect(() => {
    fetchData();
    checkSmsAutomationAccess();
  }, [selectedMonth]);

  const checkSmsAutomationAccess = async () => {
    const hasAccess = await checkFeatureAccess('smsAutomation', {showErrorToast: false});
    setHasSmsAutomationAccess(hasAccess);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const [birthdaysRes, todayRes, upcomingRes, statsRes, settingsRes, creditsRes] = await Promise.all([
        api.get(`/birthdays/month/${selectedMonth}`),
        api.get('/birthdays/today'),
        api.get('/birthdays/upcoming'),
        api.get('/birthdays/stats'),
        api.get('/birthdays/automation/settings'),
        api.get('/sms/credits')
      ]);

      setBirthdays(birthdaysRes.data.data.birthdays || []);
      setTodaysBirthdays(todayRes.data.data.birthdays || []);
      setUpcomingBirthdays(upcomingRes.data.data.birthdays || []);
      setStats(statsRes.data.data || null);
      setAutomationSettings(settingsRes.data.data || null);
      setSmsCredits(creditsRes.data.data.credits.balance || 0);

    } catch (error: any) {
      showToast.error('Failed to load birthdays');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendBirthdaySMS = async (memberId: string) => {
    try {
      setSendingTo(memberId);
      await api.post(`/birthdays/send-sms/${memberId}`);
      showToast.success('Birthday SMS sent successfully!');
      
      // Update birthday status
      setBirthdays(prev => prev.map(b => 
        b._id === memberId ? { ...b, smsSent: true, smsStatus: 'sent' as const } : b
      ));
      setTodaysBirthdays(prev => prev.map(b => 
        b._id === memberId ? { ...b, smsSent: true, smsStatus: 'sent' as const } : b
      ));
      
    } catch (error: any) {
      showToast.error(error.response?.data?.message || 'Failed to send SMS');
    } finally {
      setSendingTo(null);
    }
  };

  const handleSendBulkSMS = async (memberIds: string[]) => {
    try {
      setLoading(true);
      await api.post('/birthdays/send-bulk-sms', { memberIds });
      showToast.success(`Birthday SMS sent to ${memberIds.length} member(s)!`);
      fetchData(); // Refresh data
    } catch (error: any) {
      showToast.error(error.response?.data?.message || 'Failed to send bulk SMS');
    } finally {
      setLoading(false);
    }
  };

  const exportBirthdays = () => {
    const csv = [
      ['Name', 'Date of Birth', 'Age', 'Phone', 'Email', 'Branch'].join(','),
      ...birthdays.map(b => [
        b.fullName,
        b.dateOfBirth,
        b.age,
        b.phone,
        b.email || '',
        b.branch?.name || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `birthdays-${months[selectedMonth - 1]}.csv`;
    a.click();
  };

  const filteredBirthdays = birthdays.filter(b => {
    const matchesSearch = b.fullName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBranch = !filterBranch || b.branch?._id === filterBranch;
    return matchesSearch && matchesBranch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

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
        <div className="flex items-center space-x-3">
          <PermissionGuard permission="members.exportBirthdays">
          <button
            onClick={exportBirthdays}
            className="flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </button>
          </PermissionGuard>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-primary-100 text-sm font-medium">This Week</p>
              <p className="text-3xl font-bold mt-1">{stats?.thisWeek || 0}</p>
            </div>
            <Calendar className="w-12 h-12 text-primary-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-primary-100 text-sm font-medium">This Month</p>
              <p className="text-3xl font-bold mt-1">{stats?.thisMonth || 0}</p>
            </div>
            <TrendingUp className="w-12 h-12 text-purple-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-teal-100 text-sm font-medium">SMS Credits</p>
              <p className="text-3xl font-bold mt-1">{smsCredits}</p>
            </div>
            <MessageSquare className="w-12 h-12 text-teal-200" />
          </div>
        </div>

        {hasSmsAutomationAccess ? (
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Automation</p>
                <p className="text-lg font-semibold mt-1">
                  {automationSettings?.enabled ? 'Enabled' : 'Disabled'}
                </p>
              </div>
              <Bell className={`w-12 h-12 ${automationSettings?.enabled ? 'text-green-200' : 'text-green-300/50'}`} />
            </div>
            <button
              onClick={() => navigate('/members/birthdays/settings')}
              className="mt-3 w-full py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors"
            >
              {automationSettings?.enabled ? 'Disable' : 'Enable'} Automation
            </button>
          </div>
        ) : (
          <div className="bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 rounded-xl p-6 text-white relative overflow-hidden group">
            {/* Background shimmer effect */}
            <div className="inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            <div className="flex flex-row items-start justify-between py-0">
              <div className='text-left'>
                <p className="text-lg font-bold text-white">Premium Feature</p>
                <p className="text-sm text-white/90 mb-2">
                  Birthday Automation & Settings
                </p>
                  <div onClick={() => navigate('/settings?tab=billing')} className="cursor-pointer bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2 text-sm w-fit hover:bg-white/30 transition">
                    <p className="font-semibold">Unlock Feature</p>
                  </div>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-full p-3 group-hover:scale-110 transition-transform">
                <Zap className="w-8 h-8 text-yellow-300" />
              </div>
              
            </div>
          </div>
        )}
      </div>

      {/* Automation Status Banner */}
      {automationSettings?.enabled && (
        <div className={`rounded-xl p-4 border ${
          automationSettings.automationStatus?.hasRunToday
            ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800'
            : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
        }`}>
          <div className="flex items-start space-x-3">
            {automationSettings.automationStatus?.hasRunToday ? (
              <CheckCircle className="w-5 h-5 text-primary-600 dark:text-primary-400 mt-0.5" />
            ) : (
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
            )}
            <div className="flex-1">
              <p className={`text-sm font-bold ${
                automationSettings.automationStatus?.hasRunToday
                  ? 'text-primary-900 dark:text-primary-100'
                  : 'text-green-900 dark:text-green-100'
              }`}>
                {automationSettings.automationStatus?.hasRunToday
                  ? 'Automation Already Ran Today'
                  : 'Birthday Automation Active'}
              </p>
              <p className={`text-sm mt-1 ${
                automationSettings.automationStatus?.hasRunToday
                  ? 'text-primary-700 dark:text-blue-300'
                  : 'text-green-700 dark:text-green-300'
              }`}>
                {automationSettings.automationStatus?.hasRunToday ? (
                  <>
                    Messages were sent at{' '}
                    <span className="font-semibold uppercase">
                      {automationSettings.automationStatus.lastRun 
                        ? new Date(automationSettings.automationStatus.lastRun).toLocaleString([], { 
                            hour: '2-digit', 
                            minute: '2-digit',
                            hour12: true
                          }) 
                        : 'today'}
                    </span>
                    . 
                    {' '}
                    <span className="font-medium">
                      If you've added new birthday automations, you'll need to manually trigger them.
                    </span>
                  </>
                ) : (
                  <>
                    Birthday messages will be sent automatically {automationSettings.sendDaysBefore} day(s) before 
                    at <span className="font-semibold">{automationSettings.sendTime}</span>. {' '}
                    <Link to="/members/birthdays/settings" className="underline font-medium">
                      Configure settings
                    </Link>
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Today's Birthdays */}
      {todaysBirthdays.length > 0 && (
        <div className="bg-gradient-to-r from-pink-500 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center">
              <Cake className="w-6 h-6 mr-2" />
              Today's Birthdays ({todaysBirthdays.length})
            </h2>
            {todaysBirthdays.some(b => !b.smsSent) && (
              <button
                onClick={() => handleSendBulkSMS(
                  todaysBirthdays.filter(b => !b.smsSent).map(b => b._id)
                )}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors flex items-center"
              >
                <Send className="w-4 h-4 mr-2" />
                Send All
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {todaysBirthdays.map((member) => (
              <div key={member._id} className="bg-white/10 backdrop-blur rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3 flex-1">
                    {member.photo ? (
                      <img
                        src={member.photo}
                        alt={member.fullName}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-2xl">
                        🎂
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{member.fullName}</p>
                      <p className="text-sm opacity-90">Turning {member.age} today!</p>
                      {member.branch && (
                        <p className="text-xs opacity-75 mt-1">{member.branch.name}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end space-y-2">
                    {member.smsSent ? (
                      <div className="flex items-center space-x-1 text-xs bg-white/20 px-2 py-1 rounded">
                        <CheckCircle className="w-3 h-3" />
                        <span>Sent</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleSendBirthdaySMS(member._id)}
                        disabled={sendingTo === member._id}
                        className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors disabled:opacity-50"
                        title="Send birthday SMS"
                      >
                        {sendingTo === member._id ? (
                          <Loader className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Birthdays (Next 7 Days) */}
      {upcomingBirthdays.length > 0 && (
        <div className="bg-primary-50 dark:bg-primary-900/20 rounded-xl p-6 border-[1px] border-primary-200 dark:border-primary-800">
          <h2 className="text-lg font-bold text-primary-900 dark:text-primary-100 mb-4 flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            Upcoming Birthdays (Next 7 Days)
          </h2>
          <div className="space-y-2">
            {upcomingBirthdays.slice(0, 5).map((member) => (
              <div key={member._id} className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center space-x-3">
                  {member.photo ? (
                    <img
                      src={member.photo}
                      alt={member.fullName}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-xl">
                      🎂
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{member.fullName}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      In {member.daysUntil} day{member.daysUntil !== 1 ? 's' : ''} • Turning {member.age + 1}
                    </p>
                    {member.branch && (
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{member.branch.name}</p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {months[member.birthMonth - 1]} {member.birthDay}
                  </span>
                </div>
              </div>
            ))}
            
            {upcomingBirthdays.length > 5 && (
              <button
                onClick={() => setSelectedMonth(new Date().getMonth() + 1)}
                className="w-full py-2 text-sm text-primary-600 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
              >
                View all {upcomingBirthdays.length} upcoming birthdays
              </button>
            )}
          </div>
        </div>
      )}

      {/* Month Selector */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 p-3 bg-white dark:bg-gray-800 rounded-xl">
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

      {/* Search and Filters */}
      <div className="flex items-center space-x-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search members..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      {/* Birthday List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {months[selectedMonth - 1]} Birthdays ({filteredBirthdays.length})
          </h2>
          
          {filteredBirthdays.some(b => !b.smsSent) && (
            <button
              onClick={() => handleSendBulkSMS(
                filteredBirthdays.filter(b => !b.smsSent).map(b => b._id)
              )}
              className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              <Send className="w-4 h-4 mr-2" />
              Send to All ({filteredBirthdays.filter(b => !b.smsSent).length})
            </button>
          )}
        </div>
        
        {filteredBirthdays.length === 0 ? (
          <div className="p-12 text-center">
            <Cake className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              {searchTerm 
                ? 'No birthdays found matching your search' 
                : `No birthdays in ${months[selectedMonth - 1]}`
              }
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredBirthdays.map((member) => (
              <div key={member._id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <div className="flex items-center space-x-4">
                  {member.photo ? (
                    <img
                      src={member.photo}
                      alt={member.fullName}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-xl">
                      🎂
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{member.fullName}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {months[selectedMonth - 1]} {member.birthDay} • Turning {member.age + 1}
                    </p>
                    {member.branch && (
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{member.branch.name}</p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  {member.smsSent && (
                    <div className="flex items-center space-x-2 text-green-600 dark:text-green-400">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-sm">Sent</span>
                    </div>
                  )}
                  
                  <button
                    onClick={() => handleSendBirthdaySMS(member._id)}
                    disabled={sendingTo === member._id || member.smsSent}
                    className={`flex items-center px-4 py-2 text-sm rounded-lg transition-colors ${
                      member.smsSent
                        ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                        : 'bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50'
                    }`}
                  >
                    {sendingTo === member._id ? (
                      <>
                        <Loader className="w-4 h-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        {member.smsSent ? 'Sent' : 'Send SMS'}
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Birthdays;