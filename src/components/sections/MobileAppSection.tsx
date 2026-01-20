import React from 'react';
import { 
  Users, Calendar, DollarSign, MessageCircle, TrendingUp, BarChart3,
  Heart, Bell, Lock, Smartphone, Star, CheckCircle, Home, Search,
  Plus, User, LogOut, ShoppingBag, Apple
} from 'lucide-react';

const MobileAppSection: React.FC = () => {
  return (
    <section id="benefits" className="pt-24 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gradient-to-b dark:from-slate-950 dark:to-slate-900 relative overflow-hidden">
      {/* Decorative background blobs */}
      <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden">
        <div className="absolute w-[80vw] h-[80vw] -top-[40vw] -left-[20vw] bg-[#00f0ff] rounded-full blur-[180px] opacity-5 dark:opacity-10 animate-float"></div>
        <div className="absolute w-[80vw] h-[80vw] top-[20%] -right-[20vw] bg-[#ff00a0] rounded-full blur-[180px] opacity-5 dark:opacity-10 animate-float-alt"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center max-w-4xl mx-auto mb-16 relative z-20">
          <div className="inline-flex items-center gap-2 bg-cyan-50 dark:bg-[#00f0ff]/10 border border-cyan-200 dark:border-[#00f0ff]/30 px-4 py-1.5 rounded-full mb-8 backdrop-blur-sm">
            <Smartphone className="w-4 h-4 text-cyan-600 dark:text-[#00f0ff]" />
            <span className="text-sm font-semibold text-cyan-600 dark:text-[#00f0ff] uppercase tracking-wider">Mobile App</span>
          </div>
          <h2 className="text-4xl sm:text-5xl lg:text-5xl font-bold tracking-tight text-gray-900 dark:text-white mb-6 leading-[1.1]" style={{ fontFamily: "'Rethink Sans', sans-serif" }}>
            Stay Connected,<br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 via-gray-900 dark:via-white to-pink-600 dark:to-[#ff00a0] animate-pulse">Anytime, Anywhere</span>
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 dark:text-[#b0b0b0] leading-relaxed max-w-2xl mx-auto font-light">
            Give generously, discover what's happening, check in to worship, and stay connected with your faith community—all from your phone.
          </p>
        </div>

        {/* Phone Mockup with Floating Cards */}
        <div className="relative w-full h-auto flex flex-col items-center justify-center py-12">
          {/* Floating Cards Container */}
          <div className="absolute inset-0 w-full h-full pointer-events-none z-20">
            {/* Top-Left Card - Community */}
            <div className="absolute top-[12%] left-[5%] md:left-[2%] w-[280px] h-[320px] animate-float-delayed">
              <div className="relative h-full">
                <div className="absolute -inset-4 bg-gradient-to-r from-cyan-400/30 dark:from-[#00f0ff]/30 to-pink-400/20 dark:to-[#ff00a0]/20 blur-3xl rounded-[2rem]"></div>
                <div className="relative bg-white dark:bg-slate-800/90 rounded-[2rem] p-6 border border-gray-200 dark:border-slate-700/50 backdrop-blur-md h-full shadow-2xl overflow-hidden">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-lg font-bold text-cyan-600 dark:text-[#00f0ff]">Community</span>
                    <BarChart3 className="w-5 h-5 text-gray-400 dark:text-white/50" />
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/5 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
                      <div className="w-12 h-12 rounded-full bg-indigo-500 flex items-center justify-center text-sm font-bold text-white">JS</div>
                      <div className="flex-1">
                        <div className="font-bold text-sm text-gray-900 dark:text-white">John Smith</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Member since 2021</div>
                      </div>
                      <span className="text-green-700 dark:text-green-400 text-xs font-bold px-2 py-1 bg-green-50 dark:bg-green-400/10 rounded-full border border-green-200 dark:border-green-400/20">Active</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/5 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
                      <div className="w-12 h-12 rounded-full bg-pink-500 flex items-center justify-center text-sm font-bold text-white">ML</div>
                      <div className="flex-1">
                        <div className="font-bold text-sm text-gray-900 dark:text-white">Mary Lewis</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Choir Director</div>
                      </div>
                      <span className="text-blue-700 dark:text-blue-400 text-xs font-bold px-2 py-1 bg-blue-50 dark:bg-blue-400/10 rounded-full border border-blue-200 dark:border-blue-400/20">Staff</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Top-Right Card - Events */}
            <div className="absolute top-[12%] right-[1%] md:right-[5%] w-[300px] h-[340px] animate-float-alt">
              <div className="relative h-full">
                <div className="absolute -inset-4 bg-gradient-to-r from-pink-400/30 dark:from-[#ff00a0]/30 to-cyan-400/20 dark:to-[#00f0ff]/20 blur-3xl rounded-[2rem]"></div>
                <div className="relative bg-white dark:bg-slate-800/90 rounded-[2rem] p-6 border border-gray-200 dark:border-slate-700/50 backdrop-blur-md h-full shadow-2xl overflow-hidden">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-lg font-bold text-pink-600 dark:text-[#ff00a0]">October</span>
                    <Calendar className="w-5 h-5 text-gray-400 dark:text-white/50" />
                  </div>
                  <div className="grid grid-cols-7 gap-1 mb-4 text-center text-xs text-gray-500 dark:text-gray-500 font-medium">
                    <span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span>
                  </div>
                  <div className="grid grid-cols-7 gap-1 text-center text-sm mb-5 font-medium">
                    <span className="text-gray-400 dark:text-gray-600">29</span><span className="text-gray-400 dark:text-gray-600">30</span>
                    <span className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-white/10 cursor-pointer text-gray-900 dark:text-white">1</span>
                    <span className="w-8 h-8 flex items-center justify-center rounded-full bg-pink-600 dark:bg-[#ff00a0] text-white shadow-lg" style={{ boxShadow: 'rgba(255, 0, 160, 0.5) 0px 0px 20px' }}>2</span>
                    <span className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-white/10 cursor-pointer text-gray-900 dark:text-white">3</span>
                    <span className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-white/10 cursor-pointer text-gray-900 dark:text-white">4</span>
                    <span className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-white/10 cursor-pointer text-gray-900 dark:text-white">5</span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-pink-50 dark:bg-[#ff00a0]/10 border-l-4 border-pink-600 dark:border-[#ff00a0] rounded-r-xl">
                      <div className="text-center w-8">
                        <div className="text-[10px] text-pink-600 dark:text-[#ff00a0] font-bold">SUN</div>
                        <div className="text-lg font-bold leading-none text-gray-900 dark:text-white">02</div>
                      </div>
                      <div>
                        <div className="text-sm font-bold text-gray-900 dark:text-white">Youth Night</div>
                        <div className="text-[10px] text-gray-500 dark:text-gray-400">7:00 PM • Main Hall</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom-Left Card - Donations */}
            <div className="absolute bottom-[30%] left-[3%] md:left-[5%] w-[340px] h-[300px] animate-float">
              <div className="relative h-full">
                <div className="absolute -inset-4 bg-gradient-to-r from-cyan-400/30 dark:from-[#00f0ff]/30 to-pink-400/20 dark:to-[#ff00a0]/20 blur-3xl rounded-[2rem]"></div>
                <div className="relative bg-white dark:bg-slate-800/90 rounded-[2rem] p-6 border border-gray-200 dark:border-slate-700/50 backdrop-blur-md h-full shadow-2xl overflow-hidden">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider mb-1 font-bold">Total Giving</div>
                      <div className="text-4xl font-bold text-gray-900 dark:text-white tracking-tight">$42,593</div>
                      <div className="text-green-700 dark:text-green-400 text-xs flex items-center mt-2 font-medium bg-green-50 dark:bg-green-400/10 px-2 py-1 rounded-lg w-fit">
                        <TrendingUp className="w-4 h-4 mr-1" /> +12.5% vs last month
                      </div>
                    </div>
                    <div className="bg-gray-100 dark:bg-white/5 p-2.5 rounded-xl border border-gray-200 dark:border-white/10">
                      <BarChart3 className="w-5 h-5 text-amber-500" />
                    </div>
                  </div>
                  <div className="mt-4 flex gap-3 items-end h-28 pb-2 border-b border-gray-200 dark:border-white/10">
                    <div className="flex-1 bg-gray-100 dark:bg-white/5 rounded-t-lg h-[40%] hover:bg-cyan-400 dark:hover:bg-[#00f0ff] transition-colors relative group"></div>
                    <div className="flex-1 bg-gray-100 dark:bg-white/5 rounded-t-lg h-[60%] hover:bg-cyan-400 dark:hover:bg-[#00f0ff] transition-colors relative group"></div>
                    <div className="flex-1 bg-gray-100 dark:bg-white/5 rounded-t-lg h-[30%] hover:bg-cyan-400 dark:hover:bg-[#00f0ff] transition-colors relative group"></div>
                    <div className="flex-1 bg-cyan-500 dark:bg-[#00f0ff] rounded-t-lg h-[80%] shadow-[0_0_20px_rgba(0,240,255,0.4)] relative group"></div>
                    <div className="flex-1 bg-gray-100 dark:bg-white/5 rounded-t-lg h-[50%] hover:bg-cyan-400 dark:hover:bg-[#00f0ff] transition-colors relative group"></div>
                  </div>
                  <div className="flex justify-between text-[10px] text-gray-500 dark:text-gray-500 mt-2 font-medium uppercase tracking-wide">
                    <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom-Right Card - Quick Actions */}
            <div className="absolute bottom-[30%] right-[3%] md:right-[5%] w-[280px] h-[280px] animate-float-delayed">
              <div className="relative h-full">
                <div className="absolute -inset-4 bg-gradient-to-r from-pink-400/30 dark:from-[#ff00a0]/30 to-cyan-400/20 dark:to-[#00f0ff]/20 blur-3xl rounded-[2rem]"></div>
                <div className="relative bg-white dark:bg-slate-800/90 rounded-[2rem] p-6 border border-gray-200 dark:border-slate-700/50 backdrop-blur-md h-full shadow-2xl grid grid-cols-2 gap-4 place-content-center overflow-hidden">
                  <button className="flex flex-col items-center justify-center bg-gray-50 dark:bg-slate-700 p-4 rounded-2xl hover:bg-gray-100 dark:hover:bg-slate-600 transition-all border border-gray-200 dark:border-slate-600/50 group shadow-lg">
                    <Heart className="w-6 h-6 mb-2 text-gray-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-[#00f0ff] transition-colors" />
                    <span className="text-xs text-gray-700 dark:text-gray-300 font-medium">Donate</span>
                  </button>
                  <button className="flex flex-col items-center justify-center bg-gray-50 dark:bg-slate-700 p-4 rounded-2xl hover:bg-gray-100 dark:hover:bg-slate-600 transition-all border border-gray-200 dark:border-slate-600/50 group shadow-lg">
                    <Bell className="w-6 h-6 mb-2 text-gray-900 dark:text-white group-hover:text-pink-600 dark:group-hover:text-[#ff00a0] transition-colors" />
                    <span className="text-xs text-gray-700 dark:text-gray-300 font-medium">Announce</span>
                  </button>
                  <button className="flex flex-col items-center justify-center bg-gray-50 dark:bg-slate-700 p-4 rounded-2xl hover:bg-gray-100 dark:hover:bg-slate-600 transition-all border border-gray-200 dark:border-slate-600/50 group shadow-lg">
                    <CheckCircle className="w-6 h-6 mb-2 text-gray-900 dark:text-white group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors" />
                    <span className="text-xs text-gray-700 dark:text-gray-300 font-medium">Check-in</span>
                  </button>
                  <button className="flex flex-col items-center justify-center bg-gray-50 dark:bg-slate-700 p-4 rounded-2xl hover:bg-gray-100 dark:hover:bg-slate-600 transition-all border border-gray-200 dark:border-slate-600/50 group shadow-lg">
                    <Smartphone className="w-6 h-6 mb-2 text-gray-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-yellow-400 transition-colors" />
                    <span className="text-xs text-gray-700 dark:text-gray-300 font-medium">Scan</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Main Phone Frame */}
          <div className="relative w-full max-w-sm mb-12 z-40 perspective">
            {/* Phone outer glow */}
            <div className="absolute -inset-8 bg-gradient-to-b from-cyan-400/20 dark:from-[#00f0ff]/20 to-pink-400/20 dark:to-[#ff00a0]/20 blur-3xl -z-10 rounded-[4rem]"></div>

            {/* Phone mockup */}
            <div className="relative bg-black rounded-[3.5rem] border-8 border-gray-900 shadow-2xl overflow-hidden" style={{ boxShadow: '0 0 0 4px white, 0 0 80px -20px rgba(0,0,0,0.2)' }}>
              {/* Phone screen */}
              <div className="bg-white dark:bg-gradient-to-b dark:from-slate-800 dark:to-slate-900 overflow-hidden relative aspect-[9/19.5]">
                {/* Status bar */}
                <div className="h-8 w-full flex justify-between px-6 items-center text-[12px] text-gray-500 dark:text-white/50 pt-2 font-medium">
                  <span>9:41</span>
                  <div className="flex gap-1.5 text-xs">
                    <span>📶</span>
                    <span>📡</span>
                    <span>🔋</span>
                  </div>
                </div>

                {/* Screen content */}
                <div className="p-8 flex flex-col h-full">
                  {/* Greeting */}
                  <div className="flex justify-between items-center mb-8">
                    <div>
                      <h3 className="text-gray-900 dark:text-white text-2xl font-bold">Good Morning,</h3>
                      <p className="text-gray-500 dark:text-gray-400 text-base">Pastor David</p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 border-2 border-white/20 shadow-lg"></div>
                  </div>

                  {/* Service card */}
                  <div className="bg-gradient-to-r from-cyan-100 dark:from-[#00f0ff]/20 to-pink-100 dark:to-[#ff00a0]/20 p-6 rounded-3xl mb-8 border border-cyan-200 dark:border-white/10 backdrop-blur-md relative overflow-hidden group">
                    <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="text-xs text-cyan-700 dark:text-blue-300 font-bold uppercase mb-2 tracking-wide">Next Service</div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Sunday Worship</div>
                    <div className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <Calendar className="w-4 h-4" /> 10:00 AM • Main Sanctuary
                    </div>
                  </div>

                  {/* Feature grid */}
                  <div className="grid grid-cols-2 gap-4 mb-8">
                    {[
                      { icon: Users, label: 'Members', color: '#0891b2' },
                      { icon: Calendar, label: 'Events', color: '#be123c' },
                      { icon: DollarSign, label: 'Giving', color: '#b45309' },
                      { icon: MessageCircle, label: 'Chat', color: '#16a34a' },
                    ].map((item, i) => {
                      const IconComponent = item.icon;
                      return (
                        <div key={i} className="bg-gray-50 dark:bg-white/5 p-4 rounded-2xl border border-gray-200 dark:border-white/5 flex flex-col items-center justify-center aspect-square hover:bg-gray-100 dark:hover:bg-white/10 transition-colors group">
                          <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform" style={{ backgroundColor: `${item.color}20` }}>
                            <IconComponent className="w-6 h-6" style={{ color: item.color }} />
                          </div>
                          <span className="text-sm font-medium text-gray-900 dark:text-white text-center">{item.label}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Bottom nav */}
                  <div className="h-20 bg-white dark:bg-black/60 backdrop-blur-xl border-t border-gray-200 dark:border-white/5 flex justify-around items-center -mx-8 -mb-8 mt-auto px-4 pb-2">
                    <Home className="w-6 h-6 text-cyan-600 dark:text-[#00f0ff]" />
                    <Search className="w-6 h-6 text-gray-400 dark:text-gray-500" />
                    <div className="w-14 h-14 bg-gradient-to-tr from-cyan-500 dark:from-[#00f0ff] to-pink-600 dark:to-[#ff00a0] rounded-full flex items-center justify-center -mt-10 shadow-lg" style={{ boxShadow: 'rgba(139, 92, 246, 0.3) 0px 0px 40px -10px' }}>
                      <Plus className="w-6 h-6 text-white" />
                    </div>
                    <Bell className="w-6 h-6 text-gray-400 dark:text-gray-500" />
                    <User className="w-6 h-6 text-gray-400 dark:text-gray-500" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Download Buttons */}
          <div className="relative z-30 flex flex-col items-center gap-8 w-full max-w-lg mx-auto">
            <div className="flex flex-col sm:flex-row gap-6 justify-center w-full">
              <button className="flex items-center justify-center gap-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-8 py-4 rounded-2xl hover:shadow-lg hover:shadow-gray-400/30 dark:hover:shadow-white/30 transition-all font-bold text-base shadow-lg w-full sm:flex-1 group hover:-translate-y-1">
                <ShoppingBag className="w-8 h-8" />
                <div className="text-left">
                  <div className="text-xs leading-none opacity-70">Get it on</div>
                  <div className="text-lg font-bold leading-tight">Google Play</div>
                </div>
              </button>
              <button className="flex items-center justify-center gap-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-8 py-4 rounded-2xl hover:shadow-lg hover:shadow-gray-400/30 dark:hover:shadow-white/30 transition-all font-bold text-base shadow-lg w-full sm:flex-1 group hover:-translate-y-1">
                <Apple className="w-8 h-8" />
                <div className="text-left">
                  <div className="text-xs leading-none opacity-70">Download on</div>
                  <div className="text-lg font-bold leading-tight">App Store</div>
                </div>
              </button>
            </div>

            {/* Stats */}
            <div className="border-t border-gray-200 dark:border-white/20 pt-8 mt-4 w-full">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="flex flex-col items-center">
                  <Star className="w-8 h-8 mb-1 text-amber-500 fill-amber-500" />
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">4.8</div>
                  <div className="text-xs text-gray-500 dark:text-[#b0b0b0]">Rating</div>
                </div>
                <div className="flex flex-col items-center border-l border-gray-200 dark:border-white/20">
                  <Users className="w-8 h-8 mb-1 text-cyan-600 dark:text-[#00f0ff]" />
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">50K+</div>
                  <div className="text-xs text-gray-500 dark:text-[#b0b0b0]">Users</div>
                </div>
                <div className="flex flex-col items-center border-l border-gray-200 dark:border-white/20">
                  <CheckCircle className="w-8 h-8 mb-1 text-green-600 dark:text-green-400 fill-green-600 dark:fill-green-400" />
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">99.9%</div>
                  <div className="text-xs text-gray-500 dark:text-[#b0b0b0]">Uptime</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MobileAppSection;
