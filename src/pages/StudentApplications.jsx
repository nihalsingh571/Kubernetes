import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import API from '../services/api'
import { Loader2 } from 'lucide-react'

const stages = [
  { id: 'PENDING', label: 'Applied', description: 'Awaiting recruiter review' },
  { id: 'REVIEWED', label: 'Under Review', description: 'Recruiter is evaluating' },
  { id: 'ACCEPTED', label: 'Accepted', description: 'Shortlisted / offer pipeline' },
  { id: 'REJECTED', label: 'Rejected', description: 'Closed applications' },
]

export default function StudentApplications() {
  const [applications, setApplications] = useState([])
  const [internshipMap, setInternshipMap] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchApplications()
  }, [])

  const fetchApplications = async () => {
    try {
      const [applicationsRes, internshipsRes] = await Promise.all([
        API.get('/api/applications/'),
        API.get('/api/internships/'),
      ])
      setApplications(applicationsRes.data || [])
      const map = {};
      (internshipsRes.data || []).forEach((internship) => {
        map[internship.id] = internship
      })
      setInternshipMap(map)
    } catch (err) {
      console.error('Failed to fetch applications', err)
    } finally {
      setLoading(false)
    }
  }

  const columnData = useMemo(
    () =>
      stages.map((stage) => ({
        ...stage,
        items: applications.filter((app) => app.status === stage.id),
      })),
    [applications],
  )

  return (
    <div className="space-y-6 text-white">
      <section className="rounded-3xl border border-white/10 bg-[#080d1d] p-6 shadow-[0_20px_70px_rgba(5,7,19,0.7)]">
        <p className="text-xs uppercase tracking-[0.35em] text-white/50">Applications</p>
        <h1 className="mt-2 text-3xl font-semibold">Track your pipeline</h1>
        <p className="mt-1 text-sm text-white/60">
          Every application is tied to AI-ranked internships. Recruiter updates reflect instantly, and notifications fire when
          statuses change.
        </p>
      </section>

      {loading ? (
        <div className="flex items-center justify-center rounded-3xl border border-white/10 bg-[#050914] p-20">
          <Loader2 className="h-8 w-8 animate-spin text-white/60" />
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-4">
          {columnData.map((column) => (
            <motion.div
              key={column.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex min-h-[320px] flex-col rounded-3xl border border-white/10 bg-[#060b19] p-4"
            >
              <div className="mb-4">
                <p className="text-xs uppercase tracking-[0.35em] text-white/40">{column.label}</p>
                <p className="text-[11px] text-white/50">{column.description}</p>
                <span className="mt-2 inline-flex items-center rounded-full bg-white/5 px-3 py-1 text-xs text-white/60">
                  {column.items.length} applications
                </span>
              </div>
              <div className="flex flex-1 flex-col gap-4">
                {column.items.length === 0 ? (
                  <p className="text-center text-xs text-white/30">No records</p>
                ) : (
                  column.items.map((application) => (
                    <div key={application.id} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/80">
                      <p className="text-xs uppercase tracking-[0.3em] text-white/40">
                        {internshipMap[application.internship]?.company_name || 'Recruiter'}
                      </p>
                      <h3 className="mt-1 text-base font-semibold">
                        {internshipMap[application.internship]?.title || 'Internship'}
                      </h3>
                      <p className="text-xs text-white/50">
                        Applied {application.applied_at ? new Date(application.applied_at).toLocaleDateString() : '—'}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-white/60">
                        <span className="rounded-full border border-white/10 px-3 py-1">
                          {internshipMap[application.internship]?.location || 'Remote'}
                        </span>
                        {internshipMap[application.internship]?.stipend ? (
                          <span className="rounded-full border border-white/10 px-3 py-1">
                            ₹{internshipMap[application.internship].stipend}/month
                          </span>
                        ) : null}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
