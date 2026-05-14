import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, Search, LogOut, Check, X, MapPin, Briefcase, Clock, FileText, ChevronRight } from 'lucide-react'
import API from '../services/api'
import { useAuth } from '../context/AuthContext'

export default function StudentDashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [internships, setInternships] = useState([])
  const [invitations, setInvitations] = useState([])
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  const [newSkill, setNewSkill] = useState('')
  const [isAddingSkill, setIsAddingSkill] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 10000)
    return () => clearInterval(interval)
  }, [])

  const fetchData = async () => {
    try {
      const profileRes = await API.get('/api/applicants/me/')
      setProfile(profileRes.data)

      const internRes = await API.get('/api/internships/')
      setInternships(internRes.data)

      const inviteRes = await API.get('/api/invitations/')
      setInvitations(inviteRes.data)

      const notifRes = await API.get('/api/notifications/')
      setNotifications(notifRes.data)
    } catch (error) {
      console.error('Failed to fetch dashboard data', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInviteResponse = async (id, action) => {
    try {
      await API.patch(`/api/invitations/${id}/${action}/`)
      fetchData()
    } catch (err) {
      console.error('Failed to respond to invitation', err)
    }
  }

  const markNotificationsRead = async () => {
    try {
      await API.patch('/api/notifications/read_all/')
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    } catch (err) {
      console.error('Failed to mark notifications read', err)
    }
  }

  const addSkill = async () => {
    if (!newSkill) return
    try {
      const skillObj = { name: newSkill, status: 'pending' }
      const existing = Array.isArray(profile?.skills) ? profile.skills : []
      const updatedSkills = [...existing, skillObj]
      await API.patch('/api/applicants/me/', { skills: updatedSkills })
      setProfile({ ...profile, skills: updatedSkills })
      setNewSkill('')
      setIsAddingSkill(false)

      navigate('/assessment', { state: { skills: [newSkill] } })
    } catch (error) {
      alert('Failed to update skills')
    }
  }

  if (loading) return <div className="p-8 text-center">Loading...</div>

  const isVerified = profile?.vsps_score > 0.0
  const skills = Array.isArray(profile?.skills) ? profile.skills : []
  const featured = internships.slice(0, 3)

  return (
    <div className="min-h-screen bg-[#03040e] text-white flex font-sans">
      {/* Sidebar */}
      <aside className="hidden md:flex w-20 bg-[#070c1f] border-r border-white/5 flex-col items-center py-6 space-y-8">
        <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-fuchsia-500 shadow-[0_0_20px_rgba(99,102,241,0.4)]" />
        <nav className="flex-1 flex flex-col items-center gap-6 text-[11px] text-white/50">
          <div className="flex flex-col items-center gap-1 group cursor-pointer">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/5 text-white/70 group-hover:bg-indigo-500/20 group-hover:text-indigo-300 transition-all">
              <Briefcase size={18} />
            </span>
            <span className="group-hover:text-white transition-colors">Jobs</span>
          </div>
          <div className="flex flex-col items-center gap-1 group cursor-pointer">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/5 text-white/70 group-hover:bg-indigo-500/20 group-hover:text-indigo-300 transition-all">
              <FileText size={18} />
            </span>
            <span className="group-hover:text-white transition-colors">Apps</span>
          </div>
        </nav>
        <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center font-bold text-white shadow-inner">
          {user?.first_name?.[0] || 'S'}
        </div>
      </aside>

      {/* Main content column */}
      <div className="flex-1 flex flex-col h-screen overflow-y-auto">
        {/* Top bar with search and logout */}
        <header className="bg-[#050a1c] border-b border-white/5 sticky top-0 z-40 backdrop-blur-md bg-opacity-80">
          <div className="max-w-7xl mx-auto px-4 lg:px-8 py-5 flex items-center gap-6 justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-white/40 mb-1">
                Student Command Center
              </p>
              <h1 className="text-xl sm:text-2xl font-semibold text-white">
                CareerLite
              </h1>
            </div>
            <div className="hidden md:flex flex-1 max-w-lg">
              <div className="relative w-full">
                <span className="pointer-events-none absolute left-4 top-2.5 text-white/40">
                  <Search size={16} />
                </span>
                <input
                  type="text"
                  placeholder="Search internships or companies..."
                  className="w-full rounded-full border border-white/10 bg-white/5 pl-11 pr-4 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-indigo-500 focus:bg-[#0b1129] transition-all shadow-inner"
                />
              </div>
            </div>
            <div className="flex items-center gap-6 relative">
              <button 
                onClick={() => {
                  setShowNotifications(!showNotifications)
                  if (!showNotifications) markNotificationsRead()
                }} 
                className="relative text-white/60 hover:text-white transition-colors p-1"
              >
                <Bell size={22} />
                {notifications.some(n => !n.is_read) && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-fuchsia-400 opacity-80"></span>
                    <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-fuchsia-500 border-2 border-[#050a1c] shadow-[0_0_10px_rgba(217,70,239,0.8)]"></span>
                  </span>
                )}
              </button>
              
              <AnimatePresence>
                {showNotifications && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 top-12 mt-2 w-80 bg-[#0b1129] rounded-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10 z-50 overflow-hidden"
                  >
                    <div className="p-4 border-b border-white/5 bg-[#050a1c] flex justify-between items-center">
                      <h3 className="text-sm font-semibold text-white tracking-wide">Notifications</h3>
                      <span className="bg-indigo-500/20 text-indigo-300 text-[10px] px-2 py-0.5 rounded-full font-bold">
                        {notifications.length}
                      </span>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <p className="p-8 text-xs text-white/40 text-center italic">No new notifications</p>
                      ) : (
                        notifications.map(notif => (
                          <div key={notif.id} className={`p-4 border-b border-white/5 text-sm transition-colors hover:bg-white/5 ${notif.is_read ? 'opacity-60' : 'bg-indigo-500/5'}`}>
                            <div className="flex items-start gap-3">
                              <div className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${notif.is_read ? 'bg-white/20' : 'bg-fuchsia-500 shadow-[0_0_8px_rgba(217,70,239,0.8)]'}`} />
                              <div>
                                <p className="font-semibold text-white/90 text-xs">{notif.title}</p>
                                <p className="text-white/60 text-xs mt-1 leading-relaxed">{notif.message}</p>
                                <p className="text-[10px] text-white/30 mt-2">{new Date(notif.created_at).toLocaleDateString()}</p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                onClick={logout}
                className="flex items-center gap-2 text-xs font-semibold text-white/60 hover:text-white transition-colors"
              >
                <LogOut size={16} />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1">
          <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6 space-y-6">
            {/* Profile + skills card */}
            <section className="rounded-3xl border border-white/10 bg-[#070c1f] p-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[100px] pointer-events-none rounded-full" />
              <div className="relative flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-indigo-400 font-semibold">
                    Welcome back
                  </p>
                  <h2 className="mt-1 text-2xl font-bold text-white">
                    {user?.first_name || 'Student'}
                  </h2>
                  <p className="mt-2 text-sm text-white/60 max-w-md">
                    Your verified skills are used to rank internships in real
                    time using TF-IDF similarity, performance scores and trust
                    metrics.
                  </p>
                  <div className="mt-6 flex flex-wrap items-center gap-6 text-xs">
                    <div className="bg-[#0b1129] px-4 py-3 rounded-2xl border border-white/5">
                      <p className="text-white/40 uppercase tracking-widest text-[10px]">VSPS Score</p>
                      <p
                        className={`mt-1 text-xl font-bold ${
                          isVerified ? 'text-emerald-400' : 'text-white/50'
                        }`}
                      >
                        {profile?.vsps_score?.toFixed(2) ?? '0.00'}
                      </p>
                    </div>
                    <div className="bg-[#0b1129] px-4 py-3 rounded-2xl border border-white/5">
                      <p className="text-white/40 uppercase tracking-widest text-[10px]">Status</p>
                      <p className="mt-1 text-sm font-semibold text-white/90">
                        {isVerified ? 'Verified' : 'Unverified'}
                      </p>
                    </div>
                    <div className="bg-[#0b1129] px-4 py-3 rounded-2xl border border-white/5">
                      <p className="text-white/40 uppercase tracking-widest text-[10px]">Active applications</p>
                      <p className="mt-1 text-sm font-semibold text-white/90">
                        {profile?.applications?.length ?? 0}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-3 z-10">
                  {!isVerified ? (
                    <button
                      onClick={() => navigate('/assessment')}
                      className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-500 to-fuchsia-500 px-6 py-2.5 text-sm font-bold text-white shadow-[0_0_15px_rgba(99,102,241,0.5)] hover:scale-105 transition-transform"
                    >
                      Take Skill Assessment
                    </button>
                  ) : (
                    <button
                      onClick={() => navigate('/assessment')}
                      className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-6 py-2.5 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
                    >
                      Retake Assessment
                    </button>
                  )}
                  <p className="text-[11px] text-white/40 max-w-xs text-right leading-relaxed">
                    Assessments update your VSPS score, which directly impacts
                    how internships are ranked for you.
                  </p>
                </div>
              </div>

              {/* Skills chips */}
              <div className="mt-8 border-t border-white/10 pt-6">
                <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                  Your Verified Skills
                </h3>
                <div className="flex flex-wrap gap-3 items-center">
                  {skills.map((skill, idx) => {
                    const skillName =
                      typeof skill === 'string'
                        ? skill
                        : skill?.name || 'Skill'
                    const status =
                      typeof skill === 'string'
                        ? 'verified'
                        : skill?.status || 'pending'
                    const isPending = status !== 'verified'
                    return (
                      <span
                        key={`${skillName}-${idx}`}
                        className={`inline-flex items-center rounded-full px-4 py-1.5 text-xs font-semibold border transition-all ${
                          isPending
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.1)] hover:bg-emerald-500/20'
                        }`}
                      >
                        {skillName}
                        {isPending && (
                          <span className="ml-2 text-[9px] uppercase tracking-wider opacity-70">
                            Pending
                          </span>
                        )}
                      </span>
                    )
                  })}

                  {isAddingSkill ? (
                    <div className="flex gap-2 items-center bg-[#0b1129] p-1 rounded-full border border-white/20">
                      <input
                        type="text"
                        autoFocus
                        className="rounded-full bg-transparent px-3 py-1 text-xs text-white placeholder-white/30 focus:outline-none w-32"
                        placeholder="Java, SQL..."
                        value={newSkill}
                        onChange={(e) => setNewSkill(e.target.value)}
                      />
                      <button
                        onClick={addSkill}
                        className="text-xs font-bold text-indigo-400 hover:text-indigo-300 px-2"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setIsAddingSkill(false)}
                        className="text-xs font-bold text-white/40 hover:text-white/60 pr-3"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsAddingSkill(true)}
                      className="inline-flex items-center rounded-full border border-dashed border-white/20 px-4 py-1.5 text-xs font-semibold text-white/50 hover:border-indigo-500 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors"
                    >
                      + Add Skill
                    </button>
                  )}
                </div>
              </div>
            </section>

            {/* Categories row */}
            <section className="flex flex-wrap gap-4">
              {[
                'Developer',
                'Product',
                'Analytics',
                'Marketing',
                'Sales',
                'Ops',
                'Design',
              ].map((label) => (
                <button
                  key={label}
                  type="button"
                  className="group flex flex-col items-center justify-center rounded-[24px] bg-[#070c1f] border border-white/5 px-6 py-4 text-xs font-semibold text-white/60 shadow-lg hover:border-indigo-500/50 hover:bg-indigo-500/10 hover:text-indigo-300 transition-all"
                >
                  <span className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#0b1129] text-white/30 group-hover:text-indigo-400 group-hover:bg-indigo-500/20 transition-colors">
                    <Briefcase size={16} />
                  </span>
                  {label}
                </button>
              ))}
            </section>

            {/* Filter chips */}
            <section className="flex flex-wrap items-center gap-4 text-xs">
              <span className="font-semibold text-white/40 uppercase tracking-[0.2em]">
                Filters
              </span>
              {['Type', 'Location', 'Roles', 'Sort by'].map((label) => (
                <button
                  key={label}
                  type="button"
                  className="inline-flex items-center rounded-full border border-white/10 bg-[#070c1f] px-4 py-1.5 text-xs font-semibold text-white/70 hover:border-indigo-500 hover:bg-indigo-500/10 hover:text-indigo-300 transition-colors"
                >
                  {label}
                </button>
              ))}
              {!isVerified && (
                <span className="text-[11px] text-amber-400 ml-auto bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                  ⚠️ Complete an assessment to unlock personalised ranking.
                </span>
              )}
            </section>


            {/* Main grid: internships + sidebar */}
            <section className="grid gap-6 lg:grid-cols-[minmax(0,2.1fr)_minmax(0,1fr)]">
              <div className="space-y-6">
                {invitations.length > 0 && (
                  <div className="space-y-4 mb-8">
                    <h3 className="text-sm font-semibold text-white flex items-center gap-3">
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400">
                        <Bell size={12} />
                      </div>
                      <span>Recruiter Invitations</span>
                      <span className="bg-fuchsia-500/20 text-fuchsia-300 py-0.5 px-2.5 rounded-full text-[10px] font-bold border border-fuchsia-500/30">
                        {invitations.length} New
                      </span>
                    </h3>
                    <div className="grid gap-4">
                      {invitations.map(invite => (
                        <motion.div
                          key={invite.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`rounded-[24px] border p-6 relative overflow-hidden group transition-all duration-300 hover:shadow-2xl ${
                            invite.status === 'pending' 
                              ? 'bg-[#0a0f25] border-indigo-500/30 hover:border-indigo-400/50 hover:shadow-[0_0_30px_rgba(99,102,241,0.15)]' 
                              : 'bg-[#070c1f] border-white/5 opacity-80'
                          }`}
                        >
                          {invite.status === 'pending' && (
                            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-indigo-500 to-fuchsia-500 shadow-[0_0_15px_rgba(99,102,241,0.8)]"></div>
                          )}
                          <div className="flex justify-between items-start gap-4">
                            <div className="flex gap-4">
                              <div className="hidden sm:flex h-12 w-12 rounded-2xl bg-[#0b1129] border border-white/5 items-center justify-center font-bold text-white/50 group-hover:text-indigo-400 group-hover:border-indigo-500/30 transition-all">
                                {invite.company_name?.[0] || 'C'}
                              </div>
                              <div>
                                <span className={`inline-flex items-center rounded-full px-3 py-1 text-[9px] font-bold uppercase tracking-[0.2em] mb-3 border ${
                                  invite.status === 'pending' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                                  invite.status === 'accepted' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                                  'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                }`}>
                                  {invite.status}
                                </span>
                                <h4 className="text-lg font-bold text-white mb-1 group-hover:text-indigo-300 transition-colors">{invite.internship_title}</h4>
                                <p className="text-sm text-white/60 font-medium flex items-center gap-2">
                                  <Building size={14} className="text-white/40" />
                                  {invite.company_name} <span className="text-white/20">•</span> 
                                  <span className="text-white/40">Recruiter:</span> {invite.recruiter_name}
                                </p>
                              </div>
                            </div>
                            <div className="text-right flex flex-col items-end gap-2">
                              <span className="bg-[#0b1129] border border-white/5 px-3 py-1.5 rounded-full text-xs font-bold text-emerald-400">
                                ₹{invite.stipend}/mo
                              </span>
                              <span className="flex items-center gap-1 text-[11px] text-white/40 font-medium">
                                <Clock size={12} /> {invite.work_type}
                              </span>
                              {invite.location && (
                                <span className="flex items-center gap-1 text-[11px] text-white/40 font-medium">
                                  <MapPin size={12} /> {invite.location}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          {invite.message && (
                            <div className="mt-5 bg-[#0b1129] p-4 rounded-2xl border border-white/5 text-sm text-white/70 italic relative">
                              <div className="absolute top-0 left-4 -mt-2 w-4 h-4 bg-[#0b1129] border-t border-l border-white/5 rotate-45"></div>
                              <span className="text-white/40 mr-2">"</span>
                              {invite.message}
                              <span className="text-white/40 ml-2">"</span>
                            </div>
                          )}

                          {invite.required_skills && invite.required_skills.length > 0 && (
                            <div className="mt-4 flex flex-wrap gap-2">
                              {invite.required_skills.slice(0, 3).map((skill, idx) => (
                                <span key={idx} className="bg-white/5 border border-white/5 text-[10px] text-white/40 px-2 py-0.5 rounded-md">
                                  {skill}
                                </span>
                              ))}
                              {invite.required_skills.length > 3 && (
                                <span className="bg-white/5 border border-white/5 text-[10px] text-white/40 px-2 py-0.5 rounded-md">
                                  +{invite.required_skills.length - 3} more
                                </span>
                              )}
                            </div>
                          )}

                          {invite.status === 'pending' && (
                            <div className="mt-6 flex gap-4">
                              <button
                                onClick={() => handleInviteResponse(invite.id, 'accept')}
                                className="flex-1 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-full py-3 text-xs font-bold shadow-[0_0_15px_rgba(99,102,241,0.3)] hover:shadow-[0_0_20px_rgba(99,102,241,0.6)] hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                              >
                                <Check size={16} /> Accept & Apply
                              </button>
                              <button
                                onClick={() => handleInviteResponse(invite.id, 'reject')}
                                className="flex-1 bg-[#0b1129] text-white/70 border border-white/10 rounded-full py-3 text-xs font-bold hover:bg-rose-500/10 hover:text-rose-400 hover:border-rose-500/30 transition-all flex items-center justify-center gap-2"
                              >
                                <X size={16} /> Decline
                              </button>
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-white">
                    Recommended Internships
                  </h3>

                {!isVerified ? (
                  <div className="bg-[#0b1129] rounded-[24px] p-10 text-center border-2 border-dashed border-white/10 shadow-lg relative overflow-hidden">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-fuchsia-500/10 blur-[50px] rounded-full pointer-events-none" />
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/5 border border-white/10 text-white/50 shadow-inner">
                      🔒
                    </div>
                    <h4 className="text-lg font-bold text-white relative z-10">
                      Recommendations Locked
                    </h4>
                    <p className="mt-2 text-sm text-white/50 relative z-10">
                      Complete the skill assessment to see personalised
                      internship matches.
                    </p>
                    <button
                      type="button"
                      onClick={() => navigate('/assessment')}
                      className="mt-6 relative z-10 inline-flex items-center justify-center rounded-full bg-indigo-500 px-8 py-3 text-sm font-bold text-white shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:bg-indigo-400 hover:shadow-[0_0_25px_rgba(99,102,241,0.6)] transition-all"
                    >
                      Start Assessment
                    </button>
                  </div>
                ) : internships.length === 0 ? (
                  <p className="text-sm text-white/50">
                    No internships found yet. Check back later or update your
                    skills.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {internships.map((internship) => {
                      const skillsRow =
                        internship.required_skills ||
                        internship.skillsRequired ||
                        []
                      const matchPercent = (
                        (internship.recruiter_rating || profile?.vsps_score || 0) *
                        100
                      ).toFixed(0)

                      return (
                        <motion.div
                          key={internship.id}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="rounded-[24px] border border-white/5 bg-[#070c1f] shadow-lg hover:border-indigo-500/30 hover:shadow-[0_0_20px_rgba(99,102,241,0.1)] transition-all group"
                        >
                          <div className="p-6 space-y-4">
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <h4 className="text-base sm:text-lg font-bold text-white group-hover:text-indigo-300 transition-colors">
                                  {internship.title}
                                </h4>
                                <p className="text-xs text-white/50 font-medium">
                                  {internship.company_name ||
                                    internship.recruiter?.company_name ||
                                    'Company'}
                                </p>
                              </div>
                              <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0b1129] border border-white/5 text-xs font-bold text-white/40 shadow-inner group-hover:border-indigo-500/30 group-hover:text-indigo-400 transition-colors">
                                {internship.location
                                  ? internship.location.slice(0, 3).toUpperCase()
                                  : 'LOC'}
                              </span>
                            </div>

                            <p className="text-xs sm:text-sm text-white/60 line-clamp-3 leading-relaxed">
                              {internship.description}
                            </p>

                            <div className="flex flex-wrap gap-2 mt-3">
                              {skillsRow?.slice(0, 5).map((skill) => (
                                <span
                                  key={String(skill)}
                                  className="inline-flex items-center rounded-md bg-white/5 px-2.5 py-1 text-[10px] font-semibold text-white/50 border border-white/5"
                                >
                                  {String(skill)}
                                </span>
                              ))}
                            </div>

                            <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between text-[11px] text-white/40 font-semibold">
                              <span className="flex items-center gap-1.5"><Clock size={12} className="opacity-70" /> Posted recently</span>
                              <span className="text-emerald-400 font-bold bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                                {matchPercent}% match
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Sidebar: featured + explainer */}
              <aside className="space-y-6">
                <div className="rounded-[24px] border border-white/5 bg-[#070c1f] p-6 shadow-xl">
                  <h4 className="text-sm font-semibold text-white mb-4">
                    Featured Internships
                  </h4>
                  <div className="space-y-4 text-xs">
                    {featured.length === 0 ? (
                      <p className="text-white/40 italic">
                        Featured internships will appear here once available.
                      </p>
                    ) : (
                      featured.map((i) => (
                        <div
                          key={i.id}
                          className="flex items-start gap-3 border-b border-white/5 pb-4 last:border-0 last:pb-0"
                        >
                          <div className="h-10 w-10 rounded-xl bg-[#0b1129] border border-white/5 flex items-center justify-center text-[10px] font-bold text-white/40 shadow-inner">
                            {i.title.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <p className="font-bold text-white/90">
                              {i.title}
                            </p>
                            <p className="text-white/40 text-[10px] font-medium mt-0.5">
                              {i.company_name ||
                                i.recruiter?.company_name ||
                                'Company'}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="rounded-[24px] border border-indigo-500/20 bg-indigo-500/5 p-6 text-xs text-indigo-100/70 shadow-[0_0_30px_rgba(99,102,241,0.05)] relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-[40px] pointer-events-none rounded-full" />
                  <h4 className="text-sm font-bold text-indigo-300 mb-2">
                    How recommendations work
                  </h4>
                  <p className="leading-relaxed relative z-10">
                    We compute TF-IDF vectors for your skills and internship
                    descriptions, measure cosine similarity, and then weight
                    results using your VSPS and recruiter trust scores.
                  </p>
                </div>
              </aside>
            </section>
          </div>
        </main>
      </div>
    </div>
  )
}

