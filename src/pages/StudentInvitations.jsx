import { useEffect, useState } from 'react';
import { Bell, Building, Clock, Check, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';

export default function StudentInvitations() {
    const [invitations, setInvitations] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchInvitations = async () => {
            try {
                const res = await API.get('/api/invitations/');
                setInvitations(res.data || []);
            } catch (err) {
                console.error('Failed to fetch invitations', err);
            } finally {
                setLoading(false);
            }
        };

        fetchInvitations();
        const interval = setInterval(() => {
            API.get('/api/invitations/').then(res => setInvitations(res.data)).catch(() => {});
        }, 10000);
        return () => clearInterval(interval);
    }, []);

    const handleInviteResponse = async (id, action) => {
        try {
            await API.patch(`/api/invitations/${id}/${action}/`);
            const res = await API.get('/api/invitations/');
            setInvitations(res.data || []);
        } catch (err) {
            console.error('Failed to respond to invitation', err);
        }
    };

    if (loading) return <div className="text-center text-white p-8">Loading invitations...</div>;

    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-2xl font-bold text-white mb-2">Recruiter Invitations</h1>
                <p className="text-white/60 text-sm">Review and respond to exclusive opportunities sent directly by recruiters.</p>
            </header>

            {invitations.length === 0 ? (
                <div className="rounded-3xl border border-white/10 bg-[#080d1f] p-10 text-center text-sm text-white/50">
                    No active invitations. Build your skills and profile to get noticed!
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {invitations.map(invite => (
                        <motion.div
                            key={invite.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`rounded-3xl border p-6 relative overflow-hidden group transition-all duration-300 hover:shadow-2xl flex flex-col ${
                                invite.status === 'pending' 
                                    ? 'bg-[#0a0f25] border-indigo-500/30 hover:border-indigo-400/50 hover:shadow-[0_0_30px_rgba(99,102,241,0.15)]' 
                                    : 'bg-[#070c1f] border-white/5 opacity-80'
                            }`}
                        >
                            {invite.status === 'pending' && (
                                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-indigo-500 to-fuchsia-500 shadow-[0_0_15px_rgba(99,102,241,0.8)]"></div>
                            )}
                            <div className="flex justify-between items-start gap-4 mb-4">
                                <div className="flex gap-4">
                                    <div className="hidden sm:flex h-12 w-12 rounded-2xl bg-[#0b1129] border border-white/5 items-center justify-center font-bold text-white/50 group-hover:text-indigo-400 group-hover:border-indigo-500/30 transition-all">
                                        {invite.company_name?.[0] || 'C'}
                                    </div>
                                    <div>
                                        <span className={`inline-flex items-center rounded-full px-3 py-1 text-[9px] font-bold uppercase tracking-[0.2em] mb-2 border ${
                                            invite.status === 'pending' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                                            invite.status === 'accepted' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                                            'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                        }`}>
                                            {invite.status}
                                        </span>
                                        <h4 className="text-base font-bold text-white mb-1 group-hover:text-indigo-300 transition-colors">{invite.internship_title}</h4>
                                        <p className="text-xs text-white/60 font-medium flex items-center gap-1.5">
                                            <Building size={12} className="text-white/40" />
                                            {invite.company_name}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5 text-xs text-white/60 mb-4">
                                <span className="flex items-center gap-1"><Clock size={12}/> {invite.work_type}</span>
                                <span className="font-bold text-emerald-400">
                                    {invite.stipend ? `₹${invite.stipend}/mo` : 'Not disclosed'}
                                </span>
                            </div>

                            {invite.message && (
                                <div className="mb-4 bg-[#0b1129] p-4 rounded-2xl border border-white/5 text-xs text-white/70 italic relative">
                                    <div className="absolute top-0 left-4 -mt-2 w-4 h-4 bg-[#0b1129] border-t border-l border-white/5 rotate-45"></div>
                                    <span className="text-white/40 mr-1">"</span>
                                    {invite.message}
                                    <span className="text-white/40 ml-1">"</span>
                                </div>
                            )}

                            {invite.status === 'pending' && (
                                <div className="mt-2 flex flex-col gap-2">
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleInviteResponse(invite.id, 'accept')}
                                            className="flex-1 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-full py-2.5 text-xs font-bold shadow-[0_0_15px_rgba(99,102,241,0.3)] hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                                        >
                                            <Check size={14} /> Accept
                                        </button>
                                        <button
                                            onClick={() => handleInviteResponse(invite.id, 'reject')}
                                            className="flex-1 bg-[#0b1129] text-white/70 border border-white/10 rounded-full py-2.5 text-xs font-bold hover:bg-rose-500/10 hover:text-rose-400 hover:border-rose-500/30 transition-all flex items-center justify-center gap-2"
                                        >
                                            <X size={14} /> Decline
                                        </button>
                                    </div>
                                    <button
                                        onClick={() => navigate('/student/internships', { state: { searchRole: invite.internship_title, searchCompany: invite.company_name } })}
                                        className="w-full bg-white/5 text-white/80 border border-white/10 rounded-full py-2.5 text-xs font-bold hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                                    >
                                        View Full Details
                                    </button>
                                </div>
                            )}
                            
                            {invite.status !== 'pending' && (
                                <div className="mt-2">
                                    <button
                                        onClick={() => navigate('/student/internships', { state: { searchRole: invite.internship_title, searchCompany: invite.company_name } })}
                                        className="w-full bg-white/5 text-white/80 border border-white/10 rounded-full py-2.5 text-xs font-bold hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                                    >
                                        View Full Details
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
