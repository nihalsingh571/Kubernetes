import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import API from '../services/api'
import { Sparkles, ShieldCheck, Clock, Target, PlusCircle, AlertTriangle } from 'lucide-react'

const tabs = [
  { id: 'verified', label: 'Verified' },
  { id: 'pending', label: 'Pending' },
  { id: 'add', label: 'Add Skill' },
]

export default function StudentSkills() {
  const navigate = useNavigate()
  const [skills, setSkills] = useState([])
  const [newSkill, setNewSkill] = useState('')
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('verified')

  useEffect(() => {
    fetchSkills()
  }, [])

  const fetchSkills = async () => {
    try {
      const res = await API.get('/api/applicants/me/')
      const rawSkills = res.data.skills || []
      const normalized = rawSkills.map((skill) => {
        if (typeof skill === 'string') {
          return {
            name: skill,
            status: 'pending',
            updated_at: null,
            last_score: null,
            last_status: null,
          }
        }
        const normalizedStatus = (skill.status || 'pending').toLowerCase()
        const derivedScore =
          typeof skill.last_score === 'number'
            ? skill.last_score
            : typeof skill.last_accuracy === 'number'
              ? Math.round(skill.last_accuracy * 100)
              : null
        return {
          ...skill,
          name: skill.name || skill.label || skill.skill || 'Skill',
          status: normalizedStatus,
          updated_at: skill.updated_at || skill.last_assessed_at || null,
          last_score: derivedScore,
          last_status: skill.last_status || (normalizedStatus === 'verified' ? 'COMPLETED' : null),
        }
      })
      setSkills(normalized)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const verifiedSkills = useMemo(() => skills.filter((skill) => skill.status === 'verified'), [skills])
  const pendingSkills = useMemo(() => skills.filter((skill) => skill.status !== 'verified'), [skills])

  const handleVerifySkill = (skillName) => {
    navigate('/student/assessment', { state: { skills: [skillName] } })
  }

  const handleDeleteSkill = async (skillName) => {
    const updated = skills.filter((s) => !(s.status === 'pending' && s.name.toLowerCase() === skillName.toLowerCase()))
    try {
      await API.patch('/api/applicants/me/', { skills: updated })
      setSkills(updated)
    } catch (err) {
      console.error(err)
      alert('Failed to delete skill')
    }
  }

  const handleAddSkill = async (e) => {
    e.preventDefault()
    if (!newSkill.trim()) return
    const skillName = newSkill.trim()
    if (skills.some((s) => s.name.toLowerCase() === skillName.toLowerCase())) {
      alert('Skill already added')
      return
    }
    const newSkillsList = [...skills, { name: skillName, status: 'pending' }]
    try {
      await API.patch('/api/applicants/me/', { skills: newSkillsList })
      setSkills(newSkillsList)
      setNewSkill('')
      setActiveTab('pending')
      navigate('/student/assessment', { state: { skills: [skillName] } })
    } catch (err) {
      alert('Failed to save skill')
    }
  }

  const displayedSkills = activeTab === 'verified' ? verifiedSkills : pendingSkills

  if (loading) return <div className="text-center text-white">Loading...</div>

  return (
    <div className="space-y-8 text-white">
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl border border-white/10 bg-[#070b1c] p-8 shadow-[0_25px_90px_rgba(4,7,19,0.7)]"
      >
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1 text-xs uppercase tracking-[0.35em] text-white/70">
              <Sparkles size={14} />
              Skill Sync
            </div>
            <h1 className="mt-3 text-3xl font-semibold">Manage your verified skills</h1>
            <p className="mt-2 max-w-2xl text-sm text-white/70">
              Every skill runs through a 10-question Gemini-powered assessment. Verified skills feed directly into VSPS and your AI
              recommendations.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
            <p className="text-xs uppercase tracking-[0.35em] text-white/50">Assessment format</p>
            <ul className="mt-3 space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <Clock size={14} /> 60s timer per question
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck size={14} /> Violation tracking
              </li>
              <li className="flex items-center gap-2">
                <Target size={14} /> Gemini-generated MCQs
              </li>
            </ul>
          </div>
        </div>
      </motion.section>

      <div className="rounded-2xl border border-white/10 bg-[#050916]/80 p-4 backdrop-blur">
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-white shadow-[0_10px_30px_rgba(99,102,241,0.4)]'
                  : 'bg-white/5 text-white/60 hover:bg-white/10'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'add' ? (
          <form onSubmit={handleAddSkill} className="mt-6 space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6">
            <label className="text-xs uppercase tracking-[0.35em] text-white/50">Add a new skill</label>
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                type="text"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                placeholder="e.g. Python, React, Data Structures"
                className="flex-1 rounded-2xl border border-white/15 bg-[#070b1c] px-4 py-3 text-white placeholder:text-white/30 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
              />
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-fuchsia-500 px-6 py-3 text-sm font-semibold text-white shadow-[0_20px_60px_rgba(99,102,241,0.45)] hover:brightness-110"
              >
                <PlusCircle size={16} />
                Add & Verify
              </button>
            </div>
            <p className="text-xs text-white/50">Adding a skill immediately launches a 10-question verification test.</p>
          </form>
        ) : (
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {displayedSkills.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/20 bg-white/5 p-8 text-center text-sm text-white/50">
                No skills found in this state.
              </div>
            ) : (
              displayedSkills.map((skill) => (
                <motion.div
                  key={skill.name}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-[0_20px_50px_rgba(3,4,12,0.6)]"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm uppercase tracking-[0.35em] text-white/50">Skill</p>
                      <h3 className="text-xl font-semibold text-white">{skill.name}</h3>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        skill.status === 'verified' ? 'bg-emerald-500/20 text-emerald-200' : 'bg-amber-500/15 text-amber-200'
                      }`}
                    >
                      {skill.status === 'verified' ? 'Verified' : 'Pending'}
                    </span>
                  </div>
                  <div className="mt-4 flex flex-col gap-2 text-xs text-white/60">
                    <div>
                      <p>Last assessment: {skill.updated_at ? new Date(skill.updated_at).toLocaleDateString() : '—'}</p>
                      <p
                        className={`mt-1 text-sm font-semibold ${
                          skill.last_status === 'COMPLETED'
                            ? 'text-emerald-200'
                            : skill.last_status === 'FAILED'
                              ? 'text-rose-200'
                              : 'text-white'
                        }`}
                      >
                        {skill.last_score != null ? `Score: ${Number(skill.last_score).toFixed(1).replace(/\.0$/, '')}%` : 'Score: —'}
                        {skill.last_status && (
                          <span className="ml-2 rounded-full border border-white/10 px-2 py-0.5 text-[11px] uppercase tracking-[0.3em] text-white/60">
                            {skill.last_status === 'COMPLETED' ? 'Passed' : 'Failed'}
                          </span>
                        )}
                      </p>
                    </div>
                    {skill.status === 'pending' ? (
                      <div className="flex gap-3">
                        <button onClick={() => handleVerifySkill(skill.name)} className="text-indigo-200 hover:text-white">
                          Verify now
                        </button>
                        <button onClick={() => handleDeleteSkill(skill.name)} className="text-rose-200 hover:text-white">
                          Remove
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => handleVerifySkill(skill.name)} className="text-indigo-200 hover:text-white">
                        Retake assessment
                      </button>
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}
      </div>

      {pendingSkills.length > 0 && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6 text-amber-100">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-1 h-5 w-5" />
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.35em]">Pending verification</p>
              <p className="mt-2 text-sm">
                {pendingSkills.length} skills still require verification. Launch a combined assessment covering{' '}
                {pendingSkills.map((s) => s.name).join(', ')}.
              </p>
            </div>
            <button
              onClick={() =>
                navigate('/student/assessment', { state: { skills: pendingSkills.map((skill) => skill.name) } })
              }
              className="ml-auto rounded-full border border-white/30 px-4 py-2 text-xs font-semibold text-white"
            >
              Verify all
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
