import React, { useState } from 'react';
import { X, Calendar, Clock, Video, FileText, User } from 'lucide-react';
import API from '../services/api';

export default function InterviewScheduleModal({ conversation, onClose, onScheduled }) {
    const [form, setForm] = useState({
        type: 'Technical Interview',
        mode: 'Online',
        date: '',
        time: '',
        link: '',
        interviewer: '',
        instructions: ''
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // 1. Create the interview schedule
            await API.post('/api/interviews/', {
                student: conversation.student,
                internship: conversation.internship,
                interview_type: form.type,
                interview_mode: form.mode,
                interview_date: form.date,
                interview_time: form.time,
                meeting_link: form.link,
                interviewer_name: form.interviewer,
                instructions: form.instructions
            });

            // 2. Send a system message in the chat
            const msgContent = `[Interview Scheduled]\nType: ${form.type}\nMode: ${form.mode}\nDate: ${form.date}\nTime: ${form.time}\nInterviewer: ${form.interviewer}\n${form.link ? `Link: ${form.link}\n` : ''}${form.instructions ? `\nInstructions: ${form.instructions}` : ''}`;
            
            const msgRes = await API.post('/api/messages/', {
                conversation: conversation.id,
                message: msgContent,
                type: 'interview'
            });

            onScheduled(msgRes.data);
        } catch (err) {
            console.error(err);
            alert("Failed to schedule interview.");
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#0b1129] border border-white/10 rounded-[32px] w-full max-w-xl overflow-hidden shadow-2xl">
                <div className="p-6 border-b border-white/10 flex justify-between items-center bg-[#070c1f]">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Calendar className="text-indigo-400" /> Schedule Interview
                    </h2>
                    <button onClick={onClose} className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs text-white/60 font-medium">Interview Type</label>
                            <select 
                                value={form.type} 
                                onChange={e => setForm({...form, type: e.target.value})}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                                required
                            >
                                <option value="HR Interview">HR Interview</option>
                                <option value="Technical Interview">Technical Interview</option>
                                <option value="Final Round">Final Round</option>
                                <option value="Assignment Discussion">Assignment Discussion</option>
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs text-white/60 font-medium">Mode</label>
                            <select 
                                value={form.mode} 
                                onChange={e => setForm({...form, mode: e.target.value})}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                                required
                            >
                                <option value="Online">Online</option>
                                <option value="Offline">Offline</option>
                                <option value="Hybrid">Hybrid</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs text-white/60 font-medium">Date</label>
                            <input 
                                type="date"
                                value={form.date}
                                onChange={e => setForm({...form, date: e.target.value})}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                                required
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs text-white/60 font-medium">Time</label>
                            <input 
                                type="time"
                                value={form.time}
                                onChange={e => setForm({...form, time: e.target.value})}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs text-white/60 font-medium">Interviewer Name</label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={16} />
                            <input 
                                type="text"
                                value={form.interviewer}
                                onChange={e => setForm({...form, interviewer: e.target.value})}
                                placeholder="e.g. John Doe, Senior Developer"
                                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs text-white/60 font-medium">Meeting Link / Location</label>
                        <div className="relative">
                            <Video className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={16} />
                            <input 
                                type="text"
                                value={form.link}
                                onChange={e => setForm({...form, link: e.target.value})}
                                placeholder="Google Meet, Zoom link, or office address"
                                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs text-white/60 font-medium">Instructions for Candidate</label>
                        <textarea 
                            value={form.instructions}
                            onChange={e => setForm({...form, instructions: e.target.value})}
                            placeholder="Any specific instructions, topics to prepare, or assignment links..."
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 h-24 resize-none"
                        />
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button 
                            type="button" 
                            onClick={onClose}
                            className="flex-1 py-3 px-4 bg-white/5 hover:bg-white/10 text-white rounded-xl font-semibold transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            disabled={loading}
                            className="flex-[2] py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl font-bold transition-colors flex justify-center items-center gap-2"
                        >
                            {loading ? 'Scheduling...' : 'Confirm Schedule'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
