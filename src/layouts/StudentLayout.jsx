import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, Command, LogOut, Sparkles, UserCircle2, Check, X, ArrowUpRight } from 'lucide-react'
import API from '../services/api'

const navLinks = [
  { name: 'Dashboard', href: '/student/dashboard' },
  { name: 'Skills', href: '/student/skills' },
  { name: 'Discovery', href: '/student/internships' },
  { name: 'Applications', href: '/student/applications' },
  { name: 'Invitations', href: '/student/invitations' },
  { name: 'Interviews', href: '/student/interviews' },
  { name: 'Messages', href: '/student/messages' },
  { name: 'Profile', href: '/student/profile' },
]

export default function StudentLayout() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  
  const [notifications, setNotifications] = useState([])
  const [showNotifications, setShowNotifications] = useState(false)

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 10000)
    return () => clearInterval(interval)
  }, [])

  const fetchNotifications = async () => {
    try {
      const res = await API.get('/api/notifications/')
      setNotifications(res.data || [])
    } catch (err) {
      console.error('Failed to fetch notifications', err)
    }
  }

  const handleInviteResponse = async (id, action) => {
    try {
      await API.patch(`/api/invitations/${id}/${action}/`)
      fetchNotifications()
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

  const isActive = (path) => location.pathname === path

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-[#030616] to-[#090f2a] text-white">
      <aside className="hidden min-h-screen w-[260px] flex-col border-r border-white/5 bg-[#050b1f]/95 px-6 py-8 md:flex">
        <div>
          <p className="text-sm uppercase tracking-[0.35em] text-indigo-200">CareerLite</p>
          <h1 className="mt-2 text-2xl font-semibold">Student Hub</h1>
        </div>
        <nav className="mt-10 space-y-1 text-sm font-medium">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.href}
              className={`flex items-center justify-between rounded-xl px-4 py-3 transition ${
                isActive(link.href)
                  ? 'bg-gradient-to-r from-indigo-500/40 to-fuchsia-500/30 text-white shadow-[0_15px_45px_rgba(99,102,241,0.25)]'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <span>{link.name}</span>
              {isActive(link.href) ? <span className="text-xs text-white/80">●</span> : null}
            </Link>
          ))}
        </nav>
        <div className="mt-auto rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">Signed in</p>
          <p className="mt-1 text-base font-semibold text-white">{user?.first_name || 'Student'}</p>
          <p className="text-xs text-white/60">{user?.email}</p>
          <button
            onClick={logout}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex flex-col gap-4 border-b border-white/5 bg-[#040818] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-white/40">Student Hub</p>
            <h2 className="mt-2 text-lg font-semibold text-white">Control Center</h2>
          </div>
          <div className="flex flex-1 items-center justify-end gap-3">
            <button className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/80 transition hover:bg-white/10 md:flex">
              <Command size={16} />
              Quick Actions
            </button>
            <span className="hidden items-center gap-2 rounded-full border border-indigo-400/40 bg-indigo-500/15 px-3 py-1 text-xs font-semibold text-indigo-100 sm:inline-flex">
              <Sparkles size={14} />
              Premium
            </span>
            <div className="relative">
              <button 
                onClick={() => {
                  setShowNotifications(!showNotifications)
                  if (!showNotifications) markNotificationsRead()
                }}
                className="relative rounded-full border border-white/10 bg-white/5 p-2.5 text-white/80 transition hover:text-white" aria-label="Notifications"
              >
                <Bell size={18} />
                {(notifications || []).some(n => !n.is_read) && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-80"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-pink-500 shadow-[0_0_8px_rgba(236,72,153,0.8)]"></span>
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
                        {(notifications || []).length}
                      </span>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {(notifications || []).length === 0 ? (
                        <p className="p-8 text-xs text-white/40 text-center italic">No new notifications</p>
                      ) : (
                        (notifications || []).map(notif => {
                          const invite = notif.related_invitation_details
                          const isPendingInvite = invite && invite.status === 'pending'
                          const isInvitationNotif = notif.type === 'invitation' || notif.title.toLowerCase().includes('invitation')

                          return (
                            <div key={notif.id} className={`p-4 border-b border-white/5 text-sm transition-colors hover:bg-white/5 ${notif.is_read ? 'opacity-60' : 'bg-indigo-500/5'}`}>
                              <div className="flex items-start gap-3">
                                <div className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${notif.is_read ? 'bg-white/20' : 'bg-fuchsia-500 shadow-[0_0_8px_rgba(217,70,239,0.8)]'}`} />
                                <div className="flex-1">
                                  <p className="font-semibold text-white/90 text-xs">{notif.title}</p>
                                  <p className="text-white/60 text-xs mt-1 leading-relaxed">{notif.message}</p>
                                  <p className="text-[10px] text-white/30 mt-2 mb-2">{new Date(notif.created_at).toLocaleDateString()}</p>
                                  
                                  {/* If we have a pending invite with proper relations */}
                                  {isPendingInvite ? (
                                    <div className="mt-3 flex flex-wrap gap-2">
                                      <button
                                        onClick={() => handleInviteResponse(invite.id, 'accept')}
                                        className="flex-1 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-md py-1.5 px-2 text-[10px] font-bold shadow-[0_0_10px_rgba(99,102,241,0.3)] hover:scale-[1.02] transition-all flex items-center justify-center gap-1"
                                      >
                                        <Check size={12} /> Accept
                                      </button>
                                      <button
                                        onClick={() => handleInviteResponse(invite.id, 'reject')}
                                        className="flex-1 bg-[#0b1129] text-white/70 border border-white/10 rounded-md py-1.5 px-2 text-[10px] font-bold hover:bg-rose-500/10 hover:text-rose-400 hover:border-rose-500/30 transition-all flex items-center justify-center gap-1"
                                      >
                                        <X size={12} /> Decline
                                      </button>
                                      <button
                                        onClick={() => {
                                            setShowNotifications(false);
                                            navigate('/student/internships', { state: { searchRole: invite.internship_title, searchCompany: invite.company_name } });
                                        }}
                                        className="flex-1 bg-white/5 text-white/70 border border-white/10 rounded-md py-1.5 px-2 text-[10px] font-bold hover:bg-white/10 hover:text-white transition-all flex items-center justify-center gap-1"
                                      >
                                        <ArrowUpRight size={12} /> Details
                                      </button>
                                    </div>
                                  ) : isInvitationNotif && !invite ? (
                                    /* Fallback for OLD invitations that don't have the relation established in DB */
                                    <div className="mt-3 flex flex-wrap gap-2">
                                      <button
                                        onClick={() => {
                                            setShowNotifications(false);
                                            navigate('/student/invitations');
                                        }}
                                        className="w-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-md py-1.5 px-2 text-[10px] font-bold hover:bg-indigo-500/30 transition-all flex items-center justify-center gap-1"
                                      >
                                        <ArrowUpRight size={12} /> View Invitations
                                      </button>
                                    </div>
                                  ) : null}

                                  {invite && invite.status !== 'pending' && (
                                      <span className={`inline-block mt-2 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded border ${
                                          invite.status === 'accepted' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                      }`}>
                                          {invite.status}
                                      </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          )
                        })
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70">
              <div className="text-right text-xs leading-tight">
                <p className="font-semibold text-white">
                  {user?.first_name || 'Student'} {user?.last_name || ''}
                </p>
                <p className="text-white/60">Premium Plan</p>
              </div>
              <span className="rounded-full border border-white/20 bg-white/10 p-2">
                <UserCircle2 className="h-6 w-6 text-white" />
              </span>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto px-4 py-8 sm:px-8">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  )
}
