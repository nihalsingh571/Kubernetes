import React from 'react'

export default function AuthFooter() {
  return (
    <footer className="mt-12 flex w-full flex-col items-center gap-2 border-t border-white/5 pt-6 text-xs tracking-widest text-white/60 sm:flex-row sm:justify-between">
      <span className="uppercase">Privacy Architecture • Neural Policy • Help Terminal</span>
      <span className="font-semibold text-white/50">© {new Date().getFullYear()} InternConnect AI System</span>
    </footer>
  )
}
