import { Sparkles } from 'lucide-react';
import React, { useState } from 'react'
import { useTheme } from '../../context/ThemeContext';

// Feature Showcase Component
const FeatureShowcase: React.FC<{ activeFeature: number }> = ({ activeFeature }) => {
  const { theme } = useTheme();
  const [imageLoaded, setImageLoaded] = useState<{ [key: number]: boolean }>({});
  const features = [
    {
      title: 'Automations',
      highlights: ['Birthdays SMS', 'Scheduled Events', 'SMS Reminders'],
      color: 'from-purple-500 to-pink-500',
      imageLight: '/images/automation-light.png',
      imageDark: '/images/automation-dark.png',
    },
    {
      title: 'Attendance Tracking',
      highlights: ['Real-time Tracking', 'Automatic Notifications', 'Analytics Dashboard'],
      color: 'from-blue-500 to-cyan-500',
      imageLight: '/images/attendance-light.png',
      imageDark: '/images/attendance-dark.png',
    },
    {
      title: 'Givings & Donations',
      highlights: ['Tithe, Offerings & Payments', 'Giving History', 'Payment Receipts'],
      color: 'from-orange-500 to-red-500',
      imageLight: '/images/giving-light.png',
      imageDark: '/images/giving-dark.png',
    },
    {
      title: 'Member App',
      highlights: ['Daily Devotions', 'Bible Reading', 'Event Registration & Check-in'],
      color: 'from-green-500 to-emerald-500',
      imageLight: '/images/member-app-light.png',
      imageDark: '/images/member-app-dark.png',
    },
  ];

  const current = features[activeFeature];

  return (
    <div className="relative animate-in fade-in slide-in-from-right-8 duration-1000 delay-300" key={activeFeature}>
      <div className="relative">
        {/* Gradient background blobs */}
        <div className={`absolute top-0 right-0 w-72 h-72 bg-gradient-to-br ${current.color} rounded-full blur-3xl opacity-20 transition-all duration-500`}></div>
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-gradient-to-tr from-purple-400 to-pink-400 rounded-full blur-3xl opacity-20 transition-all duration-500"></div>

        {/* Feature showcase card */}
        <div className="relative bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 dark:from-blue-800 dark:via-purple-800 dark:to-pink-700 rounded-3xl p-8 shadow-2xl transition-all duration-500">
          <div className="space-y-6">
            <div className={`h-[350px] border-2 border-white/30 bg-gradient-to-br ${current.color} rounded-2xl flex items-center justify-center overflow-hidden relative transition-all duration-500 backdrop-blur-sm`}>
              {/* Image with fallback */}
              {current.imageLight && current.imageDark ? (
                <>
                  <img
                    key={`${activeFeature}-${theme}`}
                    src={theme === 'dark' ? current.imageDark : current.imageLight}
                    alt={current.title}
                    className={`w-full h-full object-fit transition-all duration-300 ${imageLoaded[activeFeature] ? 'opacity-100' : 'opacity-0'}`}
                    onLoad={() => setImageLoaded(prev => ({ ...prev, [activeFeature]: true }))}
                    onError={() => setImageLoaded(prev => ({ ...prev, [activeFeature]: false }))}
                  />
                  {!imageLoaded[activeFeature] && (
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 flex items-center justify-center">
                      <div className="text-center">
                        <Sparkles className="w-16 h-16 text-primary-600 dark:text-primary-400 mx-auto mb-4" />
                        <p className="text-gray-700 dark:text-gray-300 font-bold text-lg">{current.title}</p>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center">
                  <Sparkles className="w-16 h-16 text-white mx-auto mb-4" />
                  <p className="text-white font-bold text-lg">{current.title}</p>
                </div>
              )}
            </div>

            <div className="space-y-4">
              {current.highlights.map((highlight, i) => (
                <div key={i} className="flex items-center space-x-3 p-3 bg-white/95 dark:bg-gray-900/95 rounded-lg border border-white/30 dark:border-gray-700/30 animate-in fade-in slide-in-from-left-4" style={{ animationDelay: `${i * 100}ms` }}>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">{highlight}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeatureShowcase