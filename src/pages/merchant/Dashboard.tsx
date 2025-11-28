import React from 'react';
import { Users, Calendar, DollarSign, TrendingUp, ArrowUpRight } from 'lucide-react';

const Dashboard = () => {
  const stats = [
    {
      name: 'Total Members',
      value: '248',
      change: '+12%',
      changeType: 'increase',
      icon: Users,
      color: 'blue',
    },
    {
      name: 'Upcoming Events',
      value: '12',
      change: '+3',
      changeType: 'increase',
      icon: Calendar,
      color: 'green',
    },
    {
      name: 'Monthly Giving',
      value: 'GHS 45,231',
      change: '+23%',
      changeType: 'increase',
      icon: DollarSign,
      color: 'purple',
    },
    {
      name: 'Attendance Rate',
      value: '87%',
      change: '+5%',
      changeType: 'increase',
      icon: TrendingUp,
      color: 'orange',
    },
  ];

  const recentMembers = [
    { name: 'John Doe', email: 'john@example.com', joined: '2024-01-15', avatar: 'JD' },
    { name: 'Jane Smith', email: 'jane@example.com', joined: '2024-01-14', avatar: 'JS' },
    { name: 'Michael Brown', email: 'michael@example.com', joined: '2024-01-13', avatar: 'MB' },
  ];

  const colorClasses = {
    blue: 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    green: 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400',
    purple: 'bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
    orange: 'bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400',
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Welcome back! Here's what's happening with your church today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.name}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-200 border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {stat.name}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-2">
                    {stat.value}
                  </p>
                  <div className="flex items-center mt-2">
                    <ArrowUpRight className="w-4 h-4 text-green-500 mr-1" />
                    <span className="text-sm font-medium text-green-600 dark:text-green-400">
                      {stat.change}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                      vs last month
                    </span>
                  </div>
                </div>
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorClasses[stat.color]}`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Members Card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Recently Added Members
          </h2>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {recentMembers.map((member) => (
              <div
                key={member.email}
                className="flex items-center justify-between p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center text-white font-semibold">
                    {member.avatar}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {member.name}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {member.email}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Joined
                  </p>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {member.joined}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
