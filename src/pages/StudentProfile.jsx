import { useEffect, useState } from 'react'
import API from '../services/api'
import { Upload } from 'lucide-react'
import ChangePasswordPanel from '../components/ChangePasswordPanel'
import FeedbackToast from '../components/FeedbackToast'

export default function StudentProfile() {
  const [profile, setProfile] = useState(null)
  const [feedback, setFeedback] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [otp, setOtp] = useState('')
  const [otpLoading, setOtpLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    university_email: '',
    mobile_number: '',
    github_link: '',
    linkedin_link: '',
    college: '',
    degree: '',
    major: '',
    graduation_year: '',
    interested_role: '',
    skills: '',
    resume: null,
  })

  const loadProfile = () => {
    API.get('/api/applicants/me/')
      .then((res) => {
        const data = res.data
        setProfile(data)
        setFormData({
          email: data.email || '',
          university_email: data.university_email || '',
          mobile_number: data.mobile_number || '',
          github_link: data.github_link || '',
          linkedin_link: data.linkedin_link || '',
          college: data.college || '',
          degree: data.degree || '',
          major: data.major || '',
          graduation_year: data.graduation_year || '',
          interested_role: data.interested_role || '',
          skills: Array.isArray(data.skills)
            ? data.skills.map((skill) => (typeof skill === 'string' ? skill : skill?.name)).filter(Boolean).join(', ')
            : '',
          resume: null,
        })
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadProfile()
  }, [])

  const handleChange = (e) => {
    const { name, files, value } = e.target
    if (name === 'resume') {
      setFormData((prev) => ({ ...prev, resume: files?.[0] || null }))
      return
    }
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const payload = new FormData()
      payload.append('email', formData.email)
      payload.append('university_email', formData.university_email)
      payload.append('college', formData.college)
      payload.append('degree', formData.degree)
      payload.append('major', formData.major)
      payload.append('graduation_year', formData.graduation_year)
      payload.append('interested_role', formData.interested_role)
      payload.append('mobile_number', formData.mobile_number)
      payload.append('github_link', formData.github_link)
      payload.append('linkedin_link', formData.linkedin_link)
      payload.append(
        'skills',
        JSON.stringify(
          formData.skills
            .split(',')
            .map((skill) => skill.trim())
            .filter(Boolean),
        ),
      )
      if (formData.resume) {
        payload.append('resume', formData.resume)
      }
      console.log('student profile formData', Object.fromEntries(payload.entries()))
      const res = await API.patch('/api/applicants/me/', payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setProfile(res.data)
      setIsEditing(false)
      alert('Profile updated successfully!')
    } catch (error) {
      console.error(error)
      alert('Failed to update profile.')
    }
  }

  const handleSendOtp = async () => {
    const collegeEmail = formData.university_email || profile?.university_email || ''
    if (!collegeEmail.trim()) {
      setFeedback({ type: 'error', message: 'Enter your college email before requesting OTP.' })
      return
    }
    try {
      setOtpLoading(true)
      const response = await API.post('/api/applicants/send-college-email-otp/', {
        collegeEmail,
      })
      setFeedback({ type: 'success', message: response.data?.message || 'Verification code sent.' })
      await loadProfile()
    } catch (error) {
      setFeedback({
        type: 'error',
        message: error.response?.data?.detail || 'Unable to send verification code.',
      })
    } finally {
      setOtpLoading(false)
    }
  }

  const handleVerifyOtp = async () => {
    if (!otp.trim()) {
      setFeedback({ type: 'error', message: 'Enter the verification code.' })
      return
    }
    try {
      setOtpLoading(true)
      const response = await API.post('/api/applicants/verify-college-email-otp/', { otp: otp.trim() })
      setOtp('')
      setProfile(response.data.profile)
      setFeedback({ type: 'success', message: response.data?.message || 'College email verified.' })
      await loadProfile()
    } catch (error) {
      setFeedback({
        type: 'error',
        message: error.response?.data?.detail || 'Unable to verify code.',
      })
    } finally {
      setOtpLoading(false)
    }
  }

  if (loading) return <div className="text-white">Loading...</div>

  const completion = profile?.profile_completion_status?.percentage ?? 0
  const missingFields = profile?.eligibility?.missing_fields || []
  const collegeEmailVerified = Boolean(profile?.collegeEmailVerified || profile?.university_email_verified)
  const isEligible = Boolean(profile?.eligibility?.is_eligible_for_assessments)

  return (
    <div className="space-y-6 text-white">
      <FeedbackToast feedback={feedback} onClose={() => setFeedback(null)} />
      <section className="rounded-3xl border border-white/10 bg-[#080d1f] p-8 shadow-[0_25px_80px_rgba(4,7,19,0.7)]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-white/40">Profile</p>
            <h1 className="mt-2 text-3xl font-semibold">Professional identity</h1>
            <p className="mt-2 text-sm text-white/60">
              Keep your academic and portfolio details up to date so recruiters get the most accurate view of your experience.
            </p>
          </div>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="rounded-full bg-gradient-to-r from-indigo-500 to-fuchsia-500 px-6 py-3 text-sm font-semibold text-white"
            >
              Edit profile
            </button>
          )}
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-white/40">Profile completion</p>
            <p className="mt-2 text-3xl font-semibold">{completion}%</p>
            <div className="mt-3 h-2 rounded-full bg-white/10">
              <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-indigo-400" style={{ width: `${completion}%` }} />
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-white/40">College email</p>
            <p className={`mt-2 text-lg font-semibold ${collegeEmailVerified ? 'text-emerald-200' : 'text-amber-200'}`}>
              {collegeEmailVerified ? 'Verified' : 'Not verified'}
            </p>
            <p className="mt-1 text-sm text-white/50">{profile?.university_email || 'Add your college email'}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-white/40">Eligibility</p>
            <p className={`mt-2 text-lg font-semibold ${isEligible ? 'text-emerald-200' : 'text-rose-200'}`}>
              {isEligible ? 'Unlocked' : 'Locked'}
            </p>
            <p className="mt-1 text-sm text-white/50">Assessments, applications, AI badges, and recruiter visibility</p>
          </div>
        </div>
        {!isEligible ? (
          <div className="mt-5 rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm text-amber-50">
            <p className="font-semibold">Complete verification to unlock InternConnect features.</p>
            {missingFields.length ? <p className="mt-2">Missing: {missingFields.join(', ')}</p> : null}
            {!collegeEmailVerified ? <p className="mt-1">College email verification is required.</p> : null}
          </div>
        ) : null}
      </section>

      <div className="rounded-3xl border border-white/10 bg-[#050916]/90 p-8 backdrop-blur">
        {isEditing ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              {[
                { label: 'Email address', name: 'email', type: 'email' },
                { label: 'University email', name: 'university_email', type: 'email' },
                { label: 'Mobile number', name: 'mobile_number', type: 'text' },
                { label: 'College / University', name: 'college', type: 'text' },
                { label: 'Degree', name: 'degree', type: 'text' },
                { label: 'Major / Branch', name: 'major', type: 'text' },
                { label: 'Graduation year', name: 'graduation_year', type: 'number' },
                { label: 'Interested role', name: 'interested_role', type: 'text' },
                { label: 'Skills', name: 'skills', type: 'text' },
                { label: 'GitHub profile', name: 'github_link', type: 'url' },
                { label: 'LinkedIn profile', name: 'linkedin_link', type: 'url' },
              ].map((field) => (
                <label key={field.name} className="text-xs uppercase tracking-[0.3em] text-white/40">
                  {field.label}
                  <input
                    type={field.type}
                    name={field.name}
                    value={formData[field.name]}
                    onChange={handleChange}
                    className="mt-2 w-full rounded-2xl border border-white/15 bg-[#070b1c] px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                  />
                </label>
              ))}
            </div>
            <label className="block text-xs uppercase tracking-[0.3em] text-white/40">
              Resume
              <input
                type="file"
                name="resume"
                accept=".pdf,.doc,.docx"
                onChange={handleChange}
                className="mt-2 w-full rounded-2xl border border-dashed border-white/15 bg-[#070b1c] px-4 py-3 text-sm text-white/70 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
              />
            </label>
            <div className="flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="rounded-full border border-white/20 px-6 py-2 text-sm font-semibold text-white/80"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-full bg-gradient-to-r from-indigo-500 to-fuchsia-500 px-6 py-2 text-sm font-semibold text-white shadow-[0_15px_45px_rgba(99,102,241,0.35)]"
              >
                Save changes
              </button>
            </div>
          </form>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            <ProfileCard title="Identity" data={[['Name', `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim()], ['Email', profile?.email], ['University Email', profile?.university_email], ['Phone', profile?.mobile_number]]} />
            <ProfileCard title="Education" data={[['University', profile?.college], ['Degree', profile?.degree], ['Major', profile?.major], ['Graduation Year', profile?.graduation_year], ['Interested Role', profile?.interested_role]]} />
            <ProfileCard title="Links" data={[['GitHub', profile?.github_link], ['LinkedIn', profile?.linkedin_link]]} linkLabels={['GitHub', 'LinkedIn']} />
            <ProfileCard title="Skills" data={[['Skills', Array.isArray(profile?.skills) ? profile.skills.map((skill) => (typeof skill === 'string' ? skill : skill?.name)).filter(Boolean).join(', ') : '']]} />
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-xs uppercase tracking-[0.3em] text-white/40">Resume upload</p>
              <div className="mt-3 flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/20 bg-[#080d1f] p-6 text-center text-sm text-white/60">
                <Upload className="mb-3 h-8 w-8 text-white/50" />
                {profile?.resume_url ? (
                  <a href={profile.resume_url} target="_blank" rel="noreferrer" className="text-indigo-200 underline">
                    View uploaded resume
                  </a>
                ) : (
                  <p>No resume uploaded</p>
                )}
                <button type="button" onClick={() => setIsEditing(true)} className="mt-4 rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-white">
                  Replace
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <p className="text-xs uppercase tracking-[0.35em] text-white/40">College Email Verification</p>
        <h2 className="mt-2 text-xl font-semibold">Verify your university email</h2>
        <p className="mt-2 text-sm text-white/60">
          Personal domains such as Gmail, Yahoo, Outlook, and iCloud are not accepted for college verification.
        </p>
        <div className="mt-5 grid gap-4 md:grid-cols-[1fr_auto]">
          <input
            type="email"
            value={formData.university_email}
            onChange={(event) => setFormData((prev) => ({ ...prev, university_email: event.target.value }))}
            className="rounded-2xl border border-white/15 bg-[#070b1c] px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
            placeholder="you@youruniversity.edu"
            disabled={collegeEmailVerified}
          />
          <button
            type="button"
            onClick={handleSendOtp}
            disabled={otpLoading || collegeEmailVerified}
            className="rounded-2xl border border-white/15 px-5 py-3 text-sm font-semibold text-white/80 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {collegeEmailVerified ? 'Verified' : otpLoading ? 'Sending...' : 'Send OTP'}
          </button>
        </div>
        {!collegeEmailVerified ? (
          <div className="mt-4 grid gap-4 md:grid-cols-[1fr_auto]">
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={otp}
              onChange={(event) => setOtp(event.target.value.replace(/[^0-9]/g, ''))}
              className="rounded-2xl border border-white/15 bg-[#070b1c] px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
              placeholder="Enter 6-digit OTP"
            />
            <button
              type="button"
              onClick={handleVerifyOtp}
              disabled={otpLoading}
              className="rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {otpLoading ? 'Verifying...' : 'Verify OTP'}
            </button>
          </div>
        ) : null}
      </section>
      <ChangePasswordPanel onFeedback={setFeedback} />
    </div>
  )
}

function ProfileCard({ title, data, linkLabels = [] }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-white/80">
      <p className="text-xs uppercase tracking-[0.3em] text-white/40">{title}</p>
      <div className="mt-3 space-y-2 text-sm">
        {data.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between gap-4 text-white">
            <span className="text-white/50">{label}</span>
            {linkLabels.includes(label) && value ? (
              <a href={value} target="_blank" rel="noreferrer" className="max-w-[65%] truncate text-right text-indigo-200 underline">
                {value}
              </a>
            ) : (
              <span className="text-right text-white">{value || '—'}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
