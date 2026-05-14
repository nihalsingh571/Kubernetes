import React from 'react'
import { useNavigate } from 'react-router-dom'

export function PrivacyCard({ onClose }) {
  return (
    <div className="space-y-8 rounded-[32px] border border-white/10 bg-[#090e23] p-10 shadow-[0_40px_120px_rgba(2,4,18,0.7)]">
      <div className="flex justify-end">
        <button
          type="button"
          aria-label="Close privacy policy"
          onClick={onClose}
          className="rounded-full border border-white/10 bg-white/5 p-2 text-white/70 transition hover:border-white/30 hover:text-white"
        >
          ×
        </button>
      </div>
      <header className="space-y-3 text-center">
          <p className="text-sm uppercase tracking-[0.4em] text-indigo-300">InternConnect</p>
          <h1 className="text-4xl font-semibold">Privacy Policy</h1>
          <p className="text-sm text-white/70">Last Updated: March 2026</p>
        </header>

        <section className="space-y-4 text-sm leading-relaxed text-white/80">
          <p>
            InternConnect values your privacy and explains here how we collect, use, and protect your personal information while you
            use our AI-powered internship platform.
          </p>
          <ol className="space-y-4 list-decimal pl-6">
            <li>
              <strong>Information We Collect.</strong> We gather account details (name, email, username), profile data (skills,
              education, links, resumes), and usage analytics to deliver recommendations.
            </li>
            <li>
              <strong>How We Use Data.</strong> Information powers account management, skill matching, recruiter discovery, platform
              improvements, notifications, and security monitoring.
            </li>
            <li>
              <strong>Cookies & Analytics.</strong> We use cookies and analytics tools to personalize experiences and analyze
              performance. You can manage cookies through browser settings.
            </li>
            <li>
              <strong>Data Protection.</strong> We apply encryption, secure storage, and access controls to keep your data safe.
            </li>
            <li>
              <strong>Third-Party Integrations.</strong> Services such as authentication, analytics, or hosting may process data under
              their own policies.
            </li>
            <li>
              <strong>User Rights.</strong> You may access, update, or delete profile information and request account removal by
              contacting support.
            </li>
            <li>
              <strong>Policy Updates.</strong> We may update this policy and will notify you of significant changes. Continued use
              indicates acceptance.
            </li>
            <li>
              <strong>Contact.</strong> Email <span className="text-indigo-300">support@internconnect.ai</span> for privacy questions.
            </li>
          </ol>
        </section>
    </div>
  )
}

export default function Privacy() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-[#050713] px-6 py-12 text-white">
      <div className="mx-auto max-w-4xl">
        <PrivacyCard onClose={() => navigate(-1)} />
      </div>
    </div>
  )
}
