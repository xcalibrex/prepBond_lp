import React, { useState } from 'react';
import { createPortal } from 'react-dom';

const TUTORS = [
    {
        id: 1,
        name: "Dr. Sarah Chen",
        role: "Perception Specialist",
        specialty: "Micro-expressions & Face Reading",
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah&backgroundColor=b6e3f4",
        status: "Available",
        bio: "Dr. Chen has over 15 years of experience in clinical psychology, focusing on non-verbal communication. She helps students decode subtle facial cues that often go unnoticed.",
        availability: ["Mon 10:00 AM", "Mon 2:00 PM", "Tue 11:00 AM", "Wed 3:30 PM"]
    },
    {
        id: 2,
        name: "Prof. Marcus Thorne",
        role: "Behavioral Analyst",
        specialty: "Conflict Resolution & Management",
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus&backgroundColor=c0aede",
        status: "In Session",
        bio: "Formerly a hostage negotiator, Professor Thorne applies high-stakes emotional management techniques to everyday leadership and personal conflict scenarios.",
        availability: ["Tue 9:00 AM", "Thu 1:00 PM", "Fri 10:00 AM"]
    },
    {
        id: 3,
        name: "Elena Rodriguez",
        role: "Clinical Psychologist",
        specialty: "Emotional Blending Theory",
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Elena&backgroundColor=ffdfbf",
        status: "Available",
        bio: "Elena specializes in the 'Understanding Emotions' branch, helping students map the complex transitions between emotional states.",
        availability: ["Mon 4:00 PM", "Wed 9:00 AM", "Fri 2:00 PM"]
    },
    {
        id: 4,
        name: "Dr. James Wilson",
        role: "EI Researcher",
        specialty: "Strategic Emotional Utilization",
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=James&backgroundColor=d1d4f9",
        status: "Available",
        bio: "Dr. Wilson researches how specific moods influence cognitive performance. He teaches techniques to harness emotions for creative and analytical tasks.",
        availability: ["Tue 3:00 PM", "Thu 11:00 AM", "Fri 4:00 PM"]
    }
];

export const Tutors: React.FC = () => {
    const [selectedTutor, setSelectedTutor] = useState<typeof TUTORS[0] | null>(null);
    const [activeTab, setActiveTab] = useState<'my-tutor' | 'find-tutor'>('my-tutor');
    const [myTutorSubTab, setMyTutorSubTab] = useState<'details' | 'availability'>('details');

    const myTutor = TUTORS[0]; // Assuming Dr. Sarah Chen is the assigned tutor

    return (
        <div className="space-y-8 animate-fade-in-up relative">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-gray-100 dark:border-gray-800 pb-0">
                <div className="pb-6 hidden md:block">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Mentorship</h1>
                    <p className="text-gray-500 dark:text-gray-400 text-base mt-1">
                        Connect with industry experts to refine your skills.
                    </p>
                </div>
                
                {/* Main Tabs */}
                <div className="flex gap-8 w-full md:w-auto overflow-x-auto">
                     <button 
                        onClick={() => setActiveTab('my-tutor')}
                        className={`pb-4 px-2 text-sm font-bold transition-all relative min-w-max ${activeTab === 'my-tutor' ? 'text-black dark:text-white' : 'text-gray-400 hover:text-gray-600 dark:text-gray-500'}`}
                     >
                        My Tutor
                        {activeTab === 'my-tutor' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-black dark:bg-white rounded-t-full"></div>}
                     </button>
                     <button 
                        onClick={() => setActiveTab('find-tutor')}
                        className={`pb-4 px-2 text-sm font-bold transition-all relative min-w-max ${activeTab === 'find-tutor' ? 'text-black dark:text-white' : 'text-gray-400 hover:text-gray-600 dark:text-gray-500'}`}
                     >
                        Find a Tutor
                        {activeTab === 'find-tutor' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-black dark:bg-white rounded-t-full"></div>}
                     </button>
                </div>
            </header>

            {activeTab === 'my-tutor' ? (
                 <div className="bg-white dark:bg-[#0A0A0A] border border-gray-100 dark:border-white/5 rounded-2xl p-8 shadow-sm flex flex-col md:flex-row gap-10 items-start animate-fade-in">
                     {/* Profile Column */}
                     <div className="flex flex-col items-center text-center w-full md:w-1/3 border-b md:border-b-0 md:border-r border-gray-100 dark:border-white/5 pb-8 md:pb-0 md:pr-8">
                          {/* Image */}
                          <div className="relative mb-6">
                            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-gray-50 dark:border-gray-800 shadow-lg">
                                <img src={myTutor.image} alt={myTutor.name} className="w-full h-full object-cover" />
                            </div>
                            <div className={`absolute bottom-2 right-2 w-5 h-5 rounded-full border-4 border-white dark:border-[#0A0A0A] ${myTutor.status === 'Available' ? 'bg-green-500' : 'bg-amber-500'}`}></div>
                          </div>
                          
                          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{myTutor.name}</h2>
                          <p className="text-sm font-bold text-secondary uppercase tracking-wider mb-6">{myTutor.role}</p>
                          
                          <div className="w-full space-y-3">
                              <button className="w-full py-3 rounded-xl bg-black dark:bg-white text-white dark:text-black font-bold text-sm hover:scale-[1.02] active:scale-[0.98] transition-all shadow-md">
                                  Message
                              </button>
                              <button className="w-full py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white font-bold text-sm hover:bg-gray-50 dark:hover:bg-white/5 transition-all">
                                  Book Session
                              </button>
                          </div>
                     </div>

                     {/* Details Column */}
                     <div className="w-full md:w-2/3">
                          {/* Sub Tabs */}
                          <div className="flex gap-2 p-1 bg-gray-100 dark:bg-white/5 rounded-xl mb-8 w-fit">
                              <button
                                onClick={() => setMyTutorSubTab('details')}
                                className={`px-6 py-2 rounded-lg text-xs font-bold transition-all ${myTutorSubTab === 'details' ? 'bg-white dark:bg-white/10 text-black dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}
                              >
                                  Details
                              </button>
                              <button
                                onClick={() => setMyTutorSubTab('availability')}
                                className={`px-6 py-2 rounded-lg text-xs font-bold transition-all ${myTutorSubTab === 'availability' ? 'bg-white dark:bg-white/10 text-black dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}
                              >
                                  Availability
                              </button>
                          </div>

                          <div className="animate-fade-in">
                               {myTutorSubTab === 'details' ? (
                                   <div className="space-y-6">
                                       <div>
                                           <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">About</h3>
                                           <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm">
                                               {myTutor.bio}
                                           </p>
                                       </div>
                                       <div>
                                           <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">Specialty</h3>
                                           <div className="flex flex-wrap gap-2">
                                                <span className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg text-xs font-bold border border-blue-100 dark:border-blue-900/30">
                                                    {myTutor.specialty}
                                                </span>
                                                <span className="px-3 py-1.5 bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-gray-400 rounded-lg text-xs font-bold border border-gray-100 dark:border-white/5">
                                                    MSCEIT Expert
                                                </span>
                                           </div>
                                       </div>
                                       <div className="pt-6 border-t border-gray-50 dark:border-white/5">
                                           <div className="flex items-center gap-4">
                                               <div>
                                                   <p className="text-2xl font-bold text-gray-900 dark:text-white">4.9</p>
                                                   <p className="text-xs text-gray-500">Rating</p>
                                               </div>
                                               <div className="w-px h-8 bg-gray-200 dark:bg-white/10"></div>
                                               <div>
                                                   <p className="text-2xl font-bold text-gray-900 dark:text-white">120+</p>
                                                   <p className="text-xs text-gray-500">Sessions</p>
                                               </div>
                                               <div className="w-px h-8 bg-gray-200 dark:bg-white/10"></div>
                                               <div>
                                                   <p className="text-2xl font-bold text-gray-900 dark:text-white">15yrs</p>
                                                   <p className="text-xs text-gray-500">Experience</p>
                                               </div>
                                           </div>
                                       </div>
                                   </div>
                               ) : (
                                   <div className="space-y-6 animate-fade-in">
                                       <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">Next 7 Days</h3>
                                       <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                            {myTutor.availability.map((time, idx) => (
                                                <button key={idx} className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-black dark:hover:border-white hover:bg-gray-50 dark:hover:bg-white/5 transition-all group text-left">
                                                    <span className="block text-xs text-gray-500 mb-1">{time.split(' ')[0]}</span>
                                                    <span className="block text-sm font-bold text-gray-900 dark:text-white group-hover:scale-105 transition-transform">{time.split(' ').slice(1).join(' ')}</span>
                                                </button>
                                            ))}
                                            <button className="p-4 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 text-gray-400 hover:text-black dark:hover:text-white hover:border-black dark:hover:border-white transition-all flex items-center justify-center">
                                                <span className="text-xs font-bold">Request Time</span>
                                            </button>
                                       </div>
                                   </div>
                               )}
                          </div>
                     </div>
                 </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
                    {TUTORS.map((tutor, i) => (
                        <div 
                            key={tutor.id} 
                            style={{ animationDelay: `${i * 100}ms` }}
                            onClick={() => setSelectedTutor(tutor)}
                            className="bg-[#F8F9FD] dark:bg-[#0A0A0A] border border-transparent dark:border-white/5 rounded-2xl p-6 flex flex-col items-center text-center transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group cursor-pointer animate-fade-in-up"
                        >
                            <div className="relative mb-4">
                                <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-white dark:border-gray-800 shadow-sm transition-transform duration-300 group-hover:scale-110">
                                    <img src={tutor.image} alt={tutor.name} className="w-full h-full object-cover" />
                                </div>
                                <div className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white dark:border-[#0A0A0A] ${tutor.status === 'Available' ? 'bg-green-500' : 'bg-amber-500'}`}></div>
                            </div>

                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{tutor.name}</h3>
                            <p className="text-xs font-bold text-secondary uppercase tracking-wider mb-2">{tutor.role}</p>
                            
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 line-clamp-2 h-10">
                                {tutor.specialty}
                            </p>

                            <button className="w-full py-3 rounded-xl bg-black dark:bg-white text-white dark:text-black font-bold text-sm hover:opacity-90 transition-all shadow-sm group-hover:shadow-md">
                                View Profile
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Side View Drawer - Portaled to Body */}
            {selectedTutor && createPortal(
                <div className="fixed inset-0 z-[100] flex justify-end">
                    <div 
                        className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity"
                        onClick={() => setSelectedTutor(null)}
                    ></div>
                    
                    <div className="relative w-full max-w-md bg-white dark:bg-[#0A0A0A] h-full shadow-2xl p-8 overflow-y-auto animate-slide-in-right border-l border-gray-100 dark:border-gray-800 flex flex-col">
                         <button 
                            onClick={() => setSelectedTutor(null)}
                            className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 transition-colors"
                         >
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                         </button>

                         <div className="flex flex-col items-center text-center mt-8 mb-8">
                             <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white dark:border-gray-800 shadow-lg mb-4">
                                <img src={selectedTutor.image} alt={selectedTutor.name} className="w-full h-full object-cover" />
                             </div>
                             <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{selectedTutor.name}</h2>
                             <span className="text-sm font-bold text-secondary uppercase tracking-wider">{selectedTutor.role}</span>
                         </div>

                         <div className="space-y-8 flex-1">
                             <div>
                                 <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">About</h3>
                                 <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm">
                                     {selectedTutor.bio}
                                 </p>
                             </div>

                             <div>
                                 <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-4">Availability</h3>
                                 <div className="grid grid-cols-2 gap-3">
                                     {selectedTutor.availability.map((time) => (
                                         <button key={time} className="py-3 px-4 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:border-black dark:hover:border-white hover:bg-gray-50 dark:hover:bg-white/5 transition-all text-center">
                                             {time}
                                         </button>
                                     ))}
                                 </div>
                             </div>
                         </div>

                         <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800">
                             <div className="flex justify-between items-center mb-4">
                                 <span className="text-sm text-gray-500">Session Price</span>
                                 <span className="text-xl font-bold text-gray-900 dark:text-white">$120<span className="text-sm font-normal text-gray-500">/hr</span></span>
                             </div>
                             <button className="w-full py-4 rounded-xl bg-black dark:bg-white text-white dark:text-black font-bold text-sm hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg">
                                 Confirm Booking
                             </button>
                         </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};