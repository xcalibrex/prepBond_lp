import React, { useState } from 'react';

export const Profile: React.FC = () => {
  const [tab, setTab] = useState<'profile'|'billing'>('profile');

  return (
    <div className="max-w-4xl mx-auto animate-fade-in-up">
       <div className="hidden md:flex items-center justify-between mb-8">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Settings</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your account and subscription.</p>
            </div>
       </div>

       <div className="flex gap-8 mb-8 border-b border-gray-100 dark:border-gray-800">
          <button 
            onClick={() => setTab('profile')} 
            className={`pb-3 px-1 text-sm font-medium transition-all relative ${
                tab === 'profile' 
                ? 'text-black dark:text-white' 
                : 'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300'
            }`}
          >
            My Profile
            {tab === 'profile' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-black dark:bg-white rounded-t-full"></div>}
          </button>
          <button 
            onClick={() => setTab('billing')} 
            className={`pb-3 px-1 text-sm font-medium transition-all relative ${
                tab === 'billing' 
                ? 'text-black dark:text-white' 
                : 'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300'
            }`}
          >
            Billing
            {tab === 'billing' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-black dark:bg-white rounded-t-full"></div>}
          </button>
       </div>

       {tab === 'profile' ? (
         <div className="bg-white dark:bg-gray-900 rounded-xl p-8 shadow-sm space-y-8">
            {/* Avatar Section */}
            <div className="flex items-center gap-6">
                <div className="w-20 h-20 rounded-full bg-gray-50 dark:bg-gray-800 border-2 border-white dark:border-gray-700 flex items-center justify-center text-xl font-bold text-gray-400 dark:text-gray-500 shadow-sm">JD</div>
                <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Johnny Doe</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Level 5 Scholar</p>
                    <button className="text-xs font-bold text-black dark:text-white hover:underline">Change Avatar</button>
                </div>
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Full Name</label>
                    <input type="text" defaultValue="Johnny Doe" className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-lg px-4 py-3 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-black dark:focus:ring-white transition-all outline-none" />
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Email Address</label>
                    <input type="email" defaultValue="johnny.doe@example.com" className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-lg px-4 py-3 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-black dark:focus:ring-white transition-all outline-none" />
                </div>
            </div>

            <div className="pt-6 border-t border-gray-50 dark:border-gray-800">
                <h3 className="text-base font-bold text-gray-900 dark:text-white mb-6">Password & Security</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">New Password</label>
                        <input type="password" placeholder="••••••••" className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-lg px-4 py-3 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-black dark:focus:ring-white transition-all outline-none" />
                    </div>
                    <div className="space-y-2">
                         <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Confirm Password</label>
                        <input type="password" placeholder="••••••••" className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-lg px-4 py-3 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-black dark:focus:ring-white transition-all outline-none" />
                    </div>
                </div>
            </div>

            <div className="flex justify-end pt-2">
                <button className="bg-black dark:bg-white text-white dark:text-black px-8 py-3 rounded-lg font-bold text-sm hover:opacity-90 transition-all shadow-md hover:scale-105 active:scale-95">Save Changes</button>
            </div>
         </div>
       ) : (
          <div className="space-y-6">
              {/* Plan Card */}
              <div className="bg-black dark:bg-white text-white dark:text-black rounded-xl p-8 shadow-lg relative overflow-hidden group">
                  <div className="relative z-10 flex justify-between items-start">
                      <div>
                          <p className="text-sm text-gray-400 dark:text-gray-600 mb-2 font-medium">Current Plan</p>
                          <h3 className="text-3xl font-bold mb-1">Pro Scholar</h3>
                          <p className="text-xs text-gray-500">$29.00 / month</p>
                      </div>
                      <span className="px-3 py-1 bg-white/20 dark:bg-black/10 text-white dark:text-black text-[10px] font-bold uppercase tracking-wider rounded-full backdrop-blur-sm">Active</span>
                  </div>
                  <div className="mt-8 flex gap-3">
                      <button className="px-4 py-2 bg-white dark:bg-black text-black dark:text-white rounded-lg text-xs font-bold hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors">Manage Subscription</button>
                      <button className="px-4 py-2 text-white dark:text-black border border-white/30 dark:border-black/20 rounded-lg text-xs font-bold hover:bg-white/10 dark:hover:bg-black/5 transition-colors">Cancel Plan</button>
                  </div>
                  
                  {/* Decorative bg shapes */}
                  <div className="absolute -right-6 -bottom-10 w-40 h-40 bg-white/10 dark:bg-black/5 rounded-full blur-2xl"></div>
              </div>
              
              <div className="bg-white dark:bg-gray-900 rounded-xl p-8 shadow-sm">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-6 uppercase tracking-wider">Payment Method</h3>
                   <div className="flex items-center gap-4 p-4 border border-gray-100 dark:border-gray-800 rounded-xl bg-gray-50/50 dark:bg-black/20">
                       <div className="w-12 h-8 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center text-[10px] font-bold text-gray-500">VISA</div>
                       <div className="flex-1">
                            <p className="font-mono text-sm text-gray-900 dark:text-white font-medium">•••• •••• •••• 4242</p>
                            <p className="text-xs text-gray-500">Expires 12/25</p>
                       </div>
                       <button className="px-3 py-1.5 text-xs font-bold text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 shadow-sm transition-all">Edit</button>
                   </div>
              </div>

               <div className="bg-white dark:bg-gray-900 rounded-xl p-8 shadow-sm">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-6 uppercase tracking-wider">Invoice History</h3>
                   <div className="space-y-1">
                       {[1,2,3].map(i => (
                           <div key={i} className="flex justify-between items-center py-4 border-b border-gray-50 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 px-2 -mx-2 rounded-lg transition-colors cursor-pointer group">
                               <div className="flex items-center gap-4">
                                   <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 group-hover:text-black dark:group-hover:text-white transition-colors">
                                       <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                                   </div>
                                   <div>
                                       <p className="text-sm font-semibold text-gray-900 dark:text-white">Invoice #00{1023+i}</p>
                                       <p className="text-xs text-gray-500">Oct 12, 2023</p>
                                   </div>
                               </div>
                               <div className="flex items-center gap-4">
                                   <span className="text-sm font-bold text-gray-900 dark:text-white">$29.00</span>
                                   <button className="text-gray-400 hover:text-black dark:hover:text-white transition-colors">
                                       <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                   </button>
                               </div>
                           </div>
                       ))}
                   </div>
              </div>
          </div>
       )}
    </div>
  )
}