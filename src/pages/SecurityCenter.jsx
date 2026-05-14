import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { ShieldCheck, ShieldOff } from 'lucide-react'
import FeedbackToast from '../components/FeedbackToast'
import { useAuth } from '../context/AuthContext'

export default function SecurityCenter() {
  const { user, startTwoFactorSetup, confirmTwoFactorSetup, disableTwoFactor } = useAuth()
  const [feedback, setFeedback] = useState(null)
  const [setupPayload, setSetupPayload] = useState(null)
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)

  const handleGenerate = async () => {
    setLoading(true)
    const res = await startTwoFactorSetup()
    setLoading(false)
    if (res.success) {
      setSetupPayload(res.data)
      setFeedback({ type: 'success', message: 'Scan the QR code using your authenticator app.' })
    } else {
      setFeedback({ type: 'error', message: res.error })
    }
  }

  const handleVerify = async () => {
    if (!code.trim()) {
      setFeedback({ type: 'error', message: 'Enter the code displayed in your authenticator app.' })
      return
    }
    setLoading(true)
    const res = await confirmTwoFactorSetup(code.trim())
    setLoading(false)
    if (res.success) {
      setSetupPayload(null)
      setCode('')
      setFeedback({ type: 'success', message: 'Two-factor authentication enabled.' })
    } else {
      setFeedback({ type: 'error', message: res.error })
    }
  }

  const handleDisable = async () => {
    setLoading(true)
    const res = await disableTwoFactor()
    setLoading(false)
    if (res.success) {
      setSetupPayload(null)
      setCode('')
      setFeedback({ type: 'success', message: 'Two-factor authentication disabled.' })
    } else {
      setFeedback({ type: 'error', message: res.error })
    }
  }

  const isEnabled = Boolean(user?.two_factor_enabled)

  return (
    <div className="min-h-screen bg-[#030513] px-4 py-10 text-white">
      <FeedbackToast feedback={feedback} onClose={() => setFeedback(null)} />
      <div className="mx-auto max-w-3xl space-y-8 rounded-[32px] border border-white/10 bg-gradient-to-b from-[#0b1024] to-[#050713] p-10 shadow-[0_45px_120px_rgba(2,4,18,0.8)]">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <p className="text-sm uppercase tracking-[0.4em] text-indigo-300">Security Center</p>
          <h1 className="text-4xl font-semibold">Two-Factor Authentication</h1>
          <p className="text-white/70">
            Protect your InternConnect account with a one-time password (OTP) from an authenticator app such as Google Authenticator,
            Microsoft Authenticator, or 1Password.
          </p>
        </motion.div>

        <div className="rounded-[28px] border border-white/10 bg-white/5 p-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-white/50">Status</p>
              <p className="mt-1 flex items-center gap-2 text-2xl font-semibold">
                {isEnabled ? (
                  <>
                    <ShieldCheck className="text-emerald-300" size={24} />
                    2FA Enabled
                  </>
                ) : (
                  <>
                    <ShieldOff className="text-rose-300" size={24} />
                    2FA Disabled
                  </>
                )}
              </p>
            </div>

            {isEnabled ? (
              <button
                type="button"
                disabled={loading}
                onClick={handleDisable}
                className="rounded-2xl border border-white/10 px-4 py-2 text-sm font-semibold text-white/80 transition hover:border-white/40 disabled:opacity-60"
              >
                Turn Off 2FA
              </button>
            ) : (
              <button
                type="button"
                disabled={loading}
                onClick={handleGenerate}
                className="rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-fuchsia-500 px-6 py-3 text-sm font-semibold text-white shadow-[0_25px_60px_rgba(99,102,241,0.45)] transition hover:brightness-110 disabled:opacity-60"
              >
                {loading ? 'Preparing...' : 'Generate Setup QR'}
              </button>
            )}
          </div>

          {!isEnabled && setupPayload && (
            <div className="mt-8 grid gap-6 md:grid-cols-2">
              <div className="rounded-3xl border border-white/10 bg-[#0f152f] p-6 text-center">
                <p className="text-sm text-white/70">Scan this QR with your authenticator app</p>
                <img src={setupPayload.qr_code} alt="Authenticator QR" className="mx-auto mt-4 h-48 w-48 rounded-2xl bg-white p-3" />
                <p className="mt-4 text-xs text-white/50 break-words">{setupPayload.otpauth_url}</p>
              </div>
              <div className="flex flex-col justify-center space-y-4 rounded-3xl border border-white/10 bg-[#0f152f] p-6">
                <label className="text-xs uppercase tracking-[0.3em] text-white/60">Enter 6-digit code</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ''))}
                  className="rounded-2xl border border-white/10 bg-[#141b3c] px-4 py-3 text-center text-2xl tracking-[0.4em] text-white focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                  placeholder="••••••"
                />
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleVerify}
                  className="rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-3 text-sm font-semibold text-white shadow-[0_20px_50px_rgba(16,185,129,0.35)] transition hover:brightness-110 disabled:opacity-60"
                >
                  Confirm Setup
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 text-sm text-white/70">
          <p className="font-semibold text-white">How it works</p>
          <ol className="mt-3 list-decimal space-y-2 pl-6">
            <li>Click &ldquo;Generate Setup QR&rdquo; to receive a secure secret for your account.</li>
            <li>Scan the QR code with an authenticator app (Google Authenticator, Authy, 1Password, etc.).</li>
            <li>Enter the 6-digit code from the app and click &ldquo;Confirm Setup&rdquo;.</li>
            <li>During future logins we will ask for the OTP after your password.</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
