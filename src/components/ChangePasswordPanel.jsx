import { useState } from 'react'
import { Eye, EyeOff, ShieldCheck } from 'lucide-react'
import API from '../services/api'

const initialForm = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
}

export default function ChangePasswordPanel({ onFeedback }) {
  const [form, setForm] = useState(initialForm)
  const [show, setShow] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  })
  const [loading, setLoading] = useState(false)

  const updateField = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const validate = () => {
    if (!form.currentPassword || !form.newPassword || !form.confirmPassword) {
      return 'All password fields are required.'
    }
    if (form.newPassword.length < 8) {
      return 'New password must be at least 8 characters.'
    }
    if (form.newPassword !== form.confirmPassword) {
      return 'New password and confirmation do not match.'
    }
    if (form.currentPassword === form.newPassword) {
      return 'New password must be different from your current password.'
    }
    return null
  }

  const submit = async (event) => {
    event.preventDefault()
    const validationError = validate()
    if (validationError) {
      onFeedback?.({ type: 'error', message: validationError })
      return
    }

    try {
      setLoading(true)
      console.log('change password formData', {
        currentPassword: '***',
        newPassword: '***',
        confirmPassword: '***',
      })
      const response = await API.patch('/api/auth/change-password', form)
      setForm(initialForm)
      onFeedback?.({ type: 'success', message: response.data?.message || 'Password updated successfully' })
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.detail ||
        'Unable to update password. Please check your current password and try again.'
      onFeedback?.({ type: 'error', message })
    } finally {
      setLoading(false)
    }
  }

  const passwordFields = [
    { name: 'currentPassword', label: 'Current Password', autoComplete: 'current-password' },
    { name: 'newPassword', label: 'New Password', autoComplete: 'new-password' },
    { name: 'confirmPassword', label: 'Confirm New Password', autoComplete: 'new-password' },
  ]

  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-6 text-white shadow-[0_25px_70px_rgba(3,6,22,0.35)]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-white/40">Security</p>
          <h2 className="mt-2 flex items-center gap-2 text-xl font-semibold">
            <ShieldCheck className="h-5 w-5 text-emerald-300" />
            Change Password
          </h2>
          <p className="mt-2 text-sm text-white/60">Use at least 8 characters and avoid reusing your current password.</p>
        </div>
      </div>

      <form onSubmit={submit} className="mt-6 grid gap-4 md:grid-cols-3">
        {passwordFields.map((field) => {
          const isVisible = show[field.name]
          return (
            <label key={field.name} className="text-xs uppercase tracking-[0.25em] text-white/50">
              {field.label}
              <div className="relative mt-2">
                <input
                  type={isVisible ? 'text' : 'password'}
                  name={field.name}
                  autoComplete={field.autoComplete}
                  value={form[field.name]}
                  onChange={updateField}
                  className="w-full rounded-2xl border border-white/15 bg-[#070b1c] px-4 py-3 pr-12 text-sm text-white placeholder:text-white/30 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                  placeholder="Enter password"
                />
                <button
                  type="button"
                  onClick={() => setShow((prev) => ({ ...prev, [field.name]: !prev[field.name] }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-white/50 transition hover:text-white"
                  aria-label={isVisible ? `Hide ${field.label}` : `Show ${field.label}`}
                >
                  {isVisible ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>
          )
        })}

        <div className="flex flex-wrap items-center gap-3 md:col-span-3">
          <button
            type="submit"
            disabled={loading}
            className="rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-fuchsia-500 px-6 py-3 text-sm font-semibold text-white shadow-[0_15px_45px_rgba(99,102,241,0.35)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Updating...' : 'Update Password'}
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => setForm(initialForm)}
            className="rounded-2xl border border-white/15 px-6 py-3 text-sm font-semibold text-white/70 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Clear
          </button>
        </div>
      </form>
    </section>
  )
}
