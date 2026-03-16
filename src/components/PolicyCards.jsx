import React from 'react'

export function TermsCardContent({ onClose }) {
  return (
    <div className="space-y-8 rounded-[32px] border border-white/10 bg-[#090e23] p-10 shadow-[0_40px_120px_rgba(2,4,18,0.7)]">
      <div className="flex justify-end">
        {onClose ? (
          <button
            type="button"
            aria-label="Close terms"
            onClick={onClose}
            className="rounded-full border border-white/10 bg-white/5 p-2 text-white/70 transition hover:border-white/30 hover:text-white"
          >
            ×
          </button>
        ) : null}
      </div>
      <header className="space-y-3 text-center">
        <p className="text-sm uppercase tracking-[0.4em] text-indigo-300">InternConnect</p>
        <h1 className="text-4xl font-semibold">Terms of Service</h1>
        <p className="text-sm text-white/70">Last Updated: March 2026</p>
      </header>

      <section className="space-y-4 text-sm leading-relaxed text-white/80">
        <p>
          Welcome to InternConnect, an AI-powered internship recommendation platform that connects students with recruiters
          through verified skills and machine learning–based matching. By creating an account or using the platform, you agree to
          these Terms of Service.
        </p>
        <ol className="space-y-4 list-decimal pl-6">
          <li>
            <strong>User Accounts.</strong> Provide accurate information, keep credentials secure, and notify us about unauthorized
            access. We may suspend accounts that violate these terms.
          </li>
          <li>
            <strong>Acceptable Use.</strong> Do not impersonate others, distribute malware, access data without authorization, or
            manipulate assessments. Violations can lead to removal.
          </li>
          <li>
            <strong>Recruiter Responsibilities.</strong> Share accurate listings, communicate clearly, and use candidate data solely
            for recruitment while respecting privacy.
          </li>
          <li>
            <strong>Internship Listings Policy.</strong> Opportunities must be genuine, transparent, and compliant with laws. We may
            remove listings that break guidelines.
          </li>
          <li>
            <strong>Intellectual Property.</strong> Platform content—including algorithms, designs, and software—belongs to
            InternConnect. Do not reproduce or modify without permission.
          </li>
          <li>
            <strong>Account Termination.</strong> We may suspend accounts for violations or abuse. Users may request deletion by
            contacting support.
          </li>
          <li>
            <strong>Limitation of Liability.</strong> We facilitate connections but do not guarantee internship placements or the
            accuracy of third-party listings.
          </li>
          <li>
            <strong>Changes.</strong> Terms may change over time; continuing to use the platform signifies acceptance of updates.
          </li>
          <li>
            <strong>Contact.</strong> Reach us at <span className="text-indigo-300">support@internconnect.ai</span> with any
            questions.
          </li>
        </ol>
      </section>
    </div>
  )
}

export function PrivacyCardContent({ onClose }) {
  return (
    <div className="space-y-8 rounded-[32px] border border-white/10 bg-[#090e23] p-10 shadow-[0_40px_120px_rgba(2,4,18,0.7)]">
      <div className="flex justify-end">
        {onClose ? (
          <button
            type="button"
            aria-label="Close privacy policy"
            onClick={onClose}
            className="rounded-full border border-white/10 bg-white/5 p-2 text-white/70 transition hover:border-white/30 hover:text-white"
          >
            ×
          </button>
        ) : null}
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
