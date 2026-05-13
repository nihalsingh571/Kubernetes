import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Video, Building, Check, X, CheckCircle, Monitor } from 'lucide-react';
import API from '../services/api';

export default function StudentInterviews() {
    const [interviews, setInterviews] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchInterviews = async () => {
        try {
            const res = await API.get('/api/interviews/');
            setInterviews(res.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInterviews();
    }, []);

    const respondToInterview = async (id, action) => {
        try {
            await API.patch(`/api/interviews/${id}/respond/`, { action });
            fetchInterviews();
        } catch (err) {
            console.error(err);
        }
    };

    if (loading) return <div className="text-white/50 p-8 text-center">Loading interviews...</div>;

    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-2xl font-bold text-white mb-2">My Interviews</h1>
                <p className="text-white/60 text-sm">Manage your upcoming technical rounds and HR discussions.</p>
            </header>

            {interviews.length === 0 ? (
                <div className="rounded-3xl border border-white/10 bg-[#080d1f] p-10 text-center text-sm text-white/50">
                    No scheduled interviews yet. Keep applying!
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {interviews.map(interview => (
                        <div key={interview.id} className="rounded-3xl border border-white/10 bg-white/5 p-6 hover:bg-white/10 transition-colors flex flex-col">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-[9px] font-bold uppercase tracking-[0.2em] mb-3 ${
                                        interview.status === 'scheduled' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                        interview.status === 'accepted' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                        'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                    }`}>
                                        {interview.status}
                                    </span>
                                    <h3 className="font-bold text-white text-lg">{interview.interview_type}</h3>
                                    <p className="text-sm text-emerald-400">{interview.internship_title}</p>
                                </div>
                                <div className="w-12 h-12 rounded-2xl bg-[#0b1129] border border-white/5 flex items-center justify-center font-bold text-white/50">
                                    <Building size={20} className="text-indigo-400" />
                                </div>
                            </div>

                            <div className="space-y-3 mb-6 flex-1">
                                <div className="flex items-center gap-2 text-sm text-white/70">
                                    <Calendar size={14} className="text-white/40" /> {new Date(interview.interview_date).toLocaleDateString()}
                                </div>
                                <div className="flex items-center gap-2 text-sm text-white/70">
                                    <Clock size={14} className="text-white/40" /> {interview.interview_time}
                                </div>
                                <div className="flex items-center gap-2 text-sm text-white/70">
                                    <Monitor size={14} className="text-white/40" /> {interview.interview_mode}
                                </div>
                                {interview.meeting_link && (
                                    <div className="flex items-center gap-2 text-sm text-white/70 truncate">
                                        <Video size={14} className="text-white/40" /> 
                                        <a href={interview.meeting_link} target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline">Meeting Link</a>
                                    </div>
                                )}
                            </div>

                            {interview.status === 'scheduled' && (
                                <div className="flex gap-2 mt-auto">
                                    <button 
                                        onClick={() => respondToInterview(interview.id, 'accepted')}
                                        className="flex-1 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors py-2.5 rounded-full text-xs font-bold flex items-center justify-center gap-1"
                                    >
                                        <Check size={14} /> Accept
                                    </button>
                                    <button 
                                        onClick={() => respondToInterview(interview.id, 'rejected')}
                                        className="flex-1 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors py-2.5 rounded-full text-xs font-bold flex items-center justify-center gap-1"
                                    >
                                        <X size={14} /> Reject
                                    </button>
                                </div>
                            )}
                            
                            {interview.status === 'accepted' && (
                                <div className="mt-auto">
                                    <button className="w-full bg-white/5 text-white hover:bg-white/10 transition-colors py-2.5 rounded-full text-xs font-bold flex items-center justify-center gap-2">
                                        <Calendar size={14} /> Add to Calendar
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
