import { FormEvent, useMemo, useState } from 'react'
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  BadgeCheck,
  Bell,
  Briefcase,
  ChartBar,
  Compass,
  Globe,
  Layers,
  LineChart,
  LogOut,
  Mail,
  MessagesSquare,
  PieChart,
  Settings,
  Sparkles,
  UserCircle,
  Users,
} from 'lucide-react'

type InternshipForm = {
  title: string
  company: string
  location: string
  mode: string
  duration: string
  stipend: string
  description: string
  responsibilities: string
  requiredSkills: string
  preferredSkills: string
  startDate: string
  deadline: string
}

const navLinks = [
  'Dashboard',
  'Post Internship',
  'Manage Internships',
  'Applicants',
  'Candidate Discovery',
  'Messages',
  'Analytics',
  'Company Profile',
]

const overviewCards = [
  { title: 'Active Internships', value: '3', sub: 'Open listings' },
  { title: 'Total Applicants', value: '47', sub: 'Across roles' },
  { title: 'Shortlisted', value: '12', sub: 'Ready to interview' },
  { title: 'AI Recommended', value: '25', sub: 'Auto-matched' },
]

const aiMatches = [
  { name: 'Ananya Sharma', uni: 'LPU', match: 92, vsps: 78, skills: ['Python', 'Django', 'SQL'] },
  { name: 'Rohit Verma', uni: 'IIT Madras', match: 88, vsps: 82, skills: ['React', 'Node', 'PostgreSQL'] },
  { name: 'Meera Iyer', uni: 'BITS Pilani', match: 85, vsps: 80, skills: ['UI Design', 'Figma', 'Motion'] },
]

const internshipsTable = [
  { title: 'Backend Developer Intern', location: 'Remote', applicants: 18, posted: 'Mar 08, 2026', status: 'Open' },
  { title: 'Product Design Intern', location: 'Bangalore', applicants: 12, posted: 'Mar 04, 2026', status: 'Reviewing' },
  { title: 'Data Science Intern', location: 'Hybrid • Pune', applicants: 17, posted: 'Feb 25, 2026', status: 'Paused' },
]

const pipelineStages = [
  { label: 'Applied', count: 18 },
  { label: 'Under Review', count: 10 },
  { label: 'Shortlisted', count: 8 },
  { label: 'Interview', count: 5 },
  { label: 'Offer Sent', count: 2 },
  { label: 'Rejected', count: 6 },
]

const discoveryResults = [
  { name: 'Devika Rao', uni: 'NIT Trichy', vsps: 81, verification: 'Level 3', skills: ['Python', 'React', 'SQL'] },
  { name: 'Harsh Patel', uni: 'VIT', vsps: 76, verification: 'Level 2', skills: ['Node.js', 'MongoDB', 'AWS'] },
  { name: 'Riya Malhotra', uni: 'SRM', vsps: 84, verification: 'Level 3', skills: ['UI Design', 'Figma', 'Framer'] },
]

const analyticsTrends = [
  { title: 'Applications per internship', value: '+18% vs last month', icon: ChartBar },
  { title: 'Skill demand trend', value: 'Python +24%, React +18%', icon: LineChart },
  { title: 'University distribution', value: 'IIT • VIT • LPU • SRM', icon: PieChart },
]

const companyProfile = {
  name: 'NeuraStack Labs',
  description: 'NeuraStack builds AI-native developer tools, helping 40+ enterprise teams ship reliable ML products.',
  industry: 'AI Infrastructure',
  size: '120 - 200',
  website: 'neurastack.ai',
  hq: 'Bangalore, India',
}

const initialForm: InternshipForm = {
  title: '',
  company: 'NeuraStack Labs',
  location: '',
  mode: 'Remote',
  duration: '',
  stipend: '',
  description: '',
  responsibilities: '',
  requiredSkills: '',
  preferredSkills: '',
  startDate: '',
  deadline: '',
}

const sectionHeading = (title: string, subtitle?: string) => (
  <div>
    <p className="text-xs uppercase tracking-[0.35em] text-white/50">{title}</p>
    {subtitle && <p className="text-sm text-white/60">{subtitle}</p>}
  </div>
)

export default function RecruiterDashboard() {
  const [form, setForm] = useState(initialForm)
  const [filter, setFilter] = useState<'Active' | 'Starred'>('Active')

  const filteredMatches = useMemo(() => (filter === 'Active' ? aiMatches : aiMatches.slice(0, 1)), [filter])

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    alert('Internship posted! AI matching has been triggered.')
    setForm(initialForm)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#030616] via-[#050a1c] to-[#090f2a] text-white">
      <div className="flex min-h-screen">
        <aside className="hidden w-72 flex-shrink-0 flex-col border-r border-white/5 bg-[#050a1c]/80 px-6 py-8 backdrop-blur lg:flex">
          <div className="text-xl font-semibold tracking-wide">InternConnect</div>
          <nav className="mt-10 space-y-2 text-sm font-semibold">
            {navLinks.map((link) => (
              <button
                key={link}
                className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 ${
                  link === 'Dashboard'
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-[0_15px_45px_rgba(88,80,255,0.35)]'
                    : 'text-white/60 hover:bg-white/5'
                }`}
              >
                {link}
                {link === 'Dashboard' && <ArrowUpRight size={16} />}
              </button>
            ))}
          </nav>
          <div className="mt-auto flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70">
            <UserCircle size={28} />
            <div>
              <p className="font-semibold text-white">Rahul Mehta</p>
              <p className="text-xs text-white/50">Lead Recruiter</p>
            </div>
            <LogOut size={18} className="ml-auto text-white/60" />
          </div>
        </aside>

        <main className="flex-1 px-4 py-6 sm:px-8 lg:px-10">
          <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-white/50">Recruiter Command Center</p>
              <h1 className="text-3xl font-semibold">Welcome back, Rahul.</h1>
              <p className="mt-1 text-sm text-white/70">You have 3 active internship listings and 47 applications this week.</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button className="rounded-full border border-white/10 px-4 py-2 text-sm text-white/70 transition hover:bg-white/5">
                <Bell size={16} />
              </button>
              <button className="rounded-full border border-white/10 px-4 py-2 text-sm text-white/70 transition hover:bg-white/5">
                View Applicants
              </button>
              <button className="rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-fuchsia-500 px-4 py-2 text-sm font-semibold shadow-[0_20px_50px_rgba(99,102,241,0.45)]">
                Post New Internship
              </button>
            </div>
          </header>

          <section className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {overviewCards.map((card) => (
              <div key={card.title} className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-[0_15px_45px_rgba(5,7,19,0.65)]">
                <p className="text-xs uppercase tracking-[0.3em] text-white/50">{card.title}</p>
                <p className="mt-3 text-3xl font-semibold">{card.value}</p>
                <p className="text-sm text-white/60">{card.sub}</p>
              </div>
            ))}
          </section>

          <section className="mt-10 grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
            <form onSubmit={handleSubmit} className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-[0_35px_100px_rgba(5,7,19,0.55)]">
              {sectionHeading('Post internship', 'Launch a listing and trigger AI matching.')}
              <div className="mt-6 grid gap-4 text-sm text-white/80 md:grid-cols-2">
                <label className="space-y-1 md:col-span-2">
                  Internship Title
                  <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full rounded-2xl border border-white/15 bg-[#070c1f] px-4 py-3" />
                </label>
                <label className="space-y-1">
                  Company Name
                  <input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} className="w-full rounded-2xl border border-white/15 bg-[#070c1f] px-4 py-3" />
                </label>
                <label className="space-y-1">
                  Location
                  <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="w-full rounded-2xl border border-white/15 bg-[#070c1f] px-4 py-3" />
                </label>
                <label className="space-y-1">
                  Work Mode
                  <select value={form.mode} onChange={(e) => setForm({ ...form, mode: e.target.value })} className="w-full rounded-2xl border border-white/15 bg-[#070c1f] px-4 py-3">
                    <option>Remote</option>
                    <option>Hybrid</option>
                    <option>Onsite</option>
                  </select>
                </label>
                <label className="space-y-1">
                  Duration
                  <input value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} placeholder="e.g., 6 Months" className="w-full rounded-2xl border border-white/15 bg-[#070c1f] px-4 py-3" />
                </label>
                <label className="space-y-1">
                  Stipend
                  <input value={form.stipend} onChange={(e) => setForm({ ...form, stipend: e.target.value })} placeholder="₹40,000/month" className="w-full rounded-2xl border border-white/15 bg-[#070c1f] px-4 py-3" />
                </label>
                <label className="space-y-1 md:col-span-2">
                  Job Description
                  <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="w-full rounded-2xl border border-white/15 bg-[#070c1f] px-4 py-3" />
                </label>
                <label className="space-y-1 md:col-span-2">
                  Responsibilities
                  <textarea value={form.responsibilities} onChange={(e) => setForm({ ...form, responsibilities: e.target.value })} rows={2} className="w-full rounded-2xl border border-white/15 bg-[#070c1f] px-4 py-3" />
                </label>
                <label className="space-y-1">
                  Required Skills
                  <input value={form.requiredSkills} onChange={(e) => setForm({ ...form, requiredSkills: e.target.value })} placeholder="Python, Django, SQL" className="w-full rounded-2xl border border-white/15 bg-[#070c1f] px-4 py-3" />
                </label>
                <label className="space-y-1">
                  Preferred Skills
                  <input value={form.preferredSkills} onChange={(e) => setForm({ ...form, preferredSkills: e.target.value })} placeholder="Docker, Kubernetes" className="w-full rounded-2xl border border-white/15 bg-[#070c1f] px-4 py-3" />
                </label>
                <label className="space-y-1">
                  Start Date
                  <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="w-full rounded-2xl border border-white/15 bg-[#070c1f] px-4 py-3" />
                </label>
                <label className="space-y-1">
                  Application Deadline
                  <input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} className="w-full rounded-2xl border border-white/15 bg-[#070c1f] px-4 py-3" />
                </label>
              </div>
              <button type="submit" className="mt-6 w-full rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-fuchsia-500 px-4 py-3 text-sm font-semibold shadow-[0_20px_50px_rgba(99,102,241,0.45)]">
                Publish Internship & Run AI Matching
              </button>
            </form>

            <div className="space-y-6">
              <div className="rounded-[32px] border border-white/10 bg-white/5 p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  {sectionHeading('AI Suggested Candidates', 'Ranked by VSPS, skills, and cosine similarity.')}
                  <div className="flex gap-2 rounded-full bg-white/10 p-1 text-xs">
                    {['Active', 'Starred'].map((label) => (
                      <button key={label} onClick={() => setFilter(label as 'Active' | 'Starred')} className={`rounded-full px-4 py-1 ${filter === label ? 'bg-gradient-to-r from-indigo-500 to-purple-500' : 'text-white/60'}`}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="mt-6 space-y-4">
                  {filteredMatches.map((candidate) => (
                    <div key={candidate.name} className="rounded-2xl border border-white/10 bg-[#0b1129] p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold">{candidate.name}</p>
                          <p className="text-xs text-white/50">{candidate.uni}</p>
                        </div>
                        <span className="text-sm font-semibold text-indigo-200">{candidate.match}% match</span>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs text-white/70">
                        {candidate.skills.map((skill) => (
                          <span key={`${candidate.name}-${skill}`} className="rounded-full border border-white/10 px-3 py-1">
                            {skill}
                          </span>
                        ))}
                      </div>
                      <div className="mt-3 flex items-center justify-between text-xs">
                        <span className="text-white/50">
                          VSPS <span className="font-semibold text-white">{candidate.vsps}</span>
                        </span>
                        <span className="text-emerald-200">Verified: {candidate.skills.slice(0, 2).join(', ')}</span>
                      </div>
                      <div className="mt-3 flex gap-2 text-xs">
                        <button className="flex-1 rounded-full border border-white/10 px-3 py-2 text-white/70 hover:bg-white/5">View profile</button>
                        <button className="flex-1 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 px-3 py-2 text-white">Invite to apply</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[32px] border border-white/10 bg-white/5 p-6">
                {sectionHeading('Recruiter insight', 'AI alerts for your talent pool.')}
                <div className="mt-5 space-y-4 text-sm text-white/80">
                  <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4">
                    <p className="font-semibold text-amber-200">Skills shortage alert</p>
                    <p className="mt-2 text-amber-100/80">Python developers with data engineering verification are 3x harder to find than React in your region.</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-sm font-semibold">Auto-sourcing active</p>
                    <p className="mt-2 text-white/70">AI queued 12 new matches for “Senior UI Architect” overnight.</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-sm font-semibold">Assessment efficiency</p>
                    <p className="mt-2 text-white/70">85% of applicants completed assessments this week.</p>
                  </div>
                </div>
                <button className="mt-6 w-full rounded-full bg-[#fbbf24] px-5 py-3 text-sm font-semibold text-[#1f1300] shadow-[0_20px_60px_rgba(251,191,36,0.35)]">
                  Generate hiring report
                </button>
              </div>
            </div>
          </section>

          <section className="mt-10 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
            <div className="rounded-[32px] border border-white/10 bg-white/5 p-6">
              {sectionHeading('Manage internships', 'Track active roles and application volume.')}
              <div className="mt-6 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-xs uppercase tracking-[0.3em] text-white/40">
                    <tr>
                      <th className="pb-3">Internship Title</th>
                      <th className="pb-3">Location</th>
                      <th className="pb-3">Applicants</th>
                      <th className="pb-3">Posted</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {internshipsTable.map((row) => (
                      <tr key={row.title} className="border-t border-white/10">
                        <td className="py-4 font-semibold">{row.title}</td>
                        <td className="py-4 text-white/60">{row.location}</td>
                        <td className="py-4 text-white/60">{row.applicants}</td>
                        <td className="py-4 text-white/60">{row.posted}</td>
                        <td className="py-4">
                          <span className="rounded-full border border-white/15 px-3 py-1 text-xs text-white/70">{row.status}</span>
                        </td>
                        <td className="py-4 text-right text-xs text-indigo-200">
                          <button className="mr-3 hover:text-white">View</button>
                          <button className="hover:text-white">Edit</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-[32px] border border-white/10 bg-white/5 p-6">
              {sectionHeading('Applicants pipeline', 'Live view of candidate stages.')}
              <div className="mt-6 grid gap-4 text-sm">
                {pipelineStages.map((stage) => (
                  <div key={stage.label} className="rounded-2xl border border-white/10 bg-[#0b1129] p-4">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold">{stage.label}</p>
                      <span className="text-xl font-bold text-indigo-200">{stage.count}</span>
                    </div>
                    <div className="mt-3 h-2 rounded-full bg-white/10">
                      <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500" style={{ width: `${Math.min(stage.count * 8, 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="mt-10 grid gap-6 lg:grid-cols-2">
            <div className="rounded-[32px] border border-white/10 bg-white/5 p-6">
              {sectionHeading('Candidate discovery', 'Search verified students even before they apply.')}
              <div className="mt-6 flex flex-wrap gap-3 text-xs text-white/70">
                {['Skill: Python', 'VSPS ≥ 70', 'Verification Level 3'].map((chip) => (
                  <span key={chip} className="rounded-full border border-white/10 px-3 py-1">
                    {chip}
                  </span>
                ))}
              </div>
              <div className="mt-6 space-y-4">
                {discoveryResults.map((student) => (
                  <div key={student.name} className="rounded-2xl border border-white/10 bg-[#0b1129] p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold">{student.name}</p>
                        <p className="text-xs text-white/50">{student.uni}</p>
                      </div>
                      <span className="text-sm font-semibold text-indigo-200">VSPS {student.vsps}</span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-white/70">
                      {student.skills.map((skill) => (
                        <span key={`${student.name}-${skill}`} className="rounded-full border border-white/10 px-3 py-1">
                          {skill}
                        </span>
                      ))}
                    </div>
                    <p className="mt-2 text-xs text-emerald-200">Verification {student.verification}</p>
                    <div className="mt-3 flex gap-2 text-xs">
                      <button className="flex-1 rounded-full border border-white/10 px-3 py-2 text-white/70 hover:bg-white/5">View profile</button>
                      <button className="flex-1 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 px-3 py-2 text-white">Invite to apply</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[32px] border border-white/10 bg-white/5 p-6">
              {sectionHeading('Recruitment analytics', 'AI-powered visibility across performance.')}
              <div className="mt-5 space-y-4">
                {analyticsTrends.map((trend) => (
                  <div key={trend.title} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#0b1129] p-4 text-sm text-white/70">
                    <Sparkles size={18} className="text-indigo-300" />
                    <div>
                      <p className="text-sm font-semibold text-white">{trend.title}</p>
                      <p>{trend.value}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 rounded-2xl border border-white/10 bg-[#0c122c] p-4 text-xs text-white/60">
                <p className="font-semibold text-white">AI Candidate Ranking</p>
                <p className="mt-2">Candidates are ranked via TF-IDF vectors + cosine similarity across verified skills, VSPS, and assessment accuracy.</p>
              </div>
            </div>
          </section>

          <section className="mt-10 grid gap-6 lg:grid-cols-2">
            <div className="rounded-[32px] border border-white/10 bg-white/5 p-6">
              {sectionHeading('Messages', 'Communicate with candidates effortlessly.')}
              <div className="mt-5 space-y-4">
                {[
                  { sender: 'Neha • Backend Intern', preview: 'Your profile has been shortlisted for Backend Developer Intern.', time: '2m ago' },
                  { sender: 'Rohit • AI Research', preview: 'Can we schedule the next interview on Friday?', time: '1h ago' },
                ].map((message) => (
                  <div key={message.sender} className="rounded-2xl border border-white/10 bg-[#0b1129] p-4">
                    <div className="flex items-center justify-between text-sm text-white/60">
                      <p className="font-semibold text-white">{message.sender}</p>
                      <span>{message.time}</span>
                    </div>
                    <p className="mt-2 text-sm text-white/70">{message.preview}</p>
                    <div className="mt-3 flex gap-2 text-xs">
                      <button className="rounded-full border border-white/10 px-3 py-1 text-white/70 hover:bg-white/5">Reply</button>
                      <button className="rounded-full border border-white/10 px-3 py-1 text-white/70 hover:bg-white/5">Schedule interview</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[32px] border border-white/10 bg-white/5 p-6">
              {sectionHeading('Company profile', 'Keep your employer branding updated.')}
              <div className="mt-4 text-sm text-white/70">
                <p className="text-lg font-semibold text-white">{companyProfile.name}</p>
                <p className="mt-2">{companyProfile.description}</p>
                <dl className="mt-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <dt className="text-white/50">Industry</dt>
                    <dd className="font-semibold text-white">{companyProfile.industry}</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-white/50">Company size</dt>
                    <dd className="font-semibold text-white">{companyProfile.size}</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-white/50">Website</dt>
                    <dd className="font-semibold text-white">{companyProfile.website}</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-white/50">Headquarters</dt>
                    <dd className="font-semibold text-white">{companyProfile.hq}</dd>
                  </div>
                </dl>
                <button className="mt-4 rounded-full border border-white/10 px-4 py-2 text-xs text-white/70 hover:bg-white/5">Edit company info</button>
              </div>
            </div>
          </section>
        </main>
      </div>
      <footer className="border-t border-white/10 px-8 py-4 text-xs text-white/50">
        © {new Date().getFullYear()} InternConnect AI. All rights reserved.
      </footer>
    </div>
  )
}
