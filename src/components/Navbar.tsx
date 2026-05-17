'use client';

import Link from 'next/link';
import { LayoutDashboard, UserPlus, Settings, Zap } from 'lucide-react';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';

const links = [
  { href: '/', label: 'Lead Form', icon: UserPlus },
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/update-lead', label: 'Update Lead', icon: Settings },
];

export default function Navbar() {
  const pathname = usePathname();
  return (
    <nav className="glass sticky top-0 z-50 border-b border-[var(--border)]" style={{ boxShadow: 'var(--shadow-sm)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-15" style={{ height: '3.75rem' }}>
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, var(--brand), var(--violet))',
              boxShadow: '0 2px 8px rgba(79,70,229,0.35)',
            }}
          >
            <Zap size={15} className="text-white" strokeWidth={2.5} />
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-bold text-base gradient-text tracking-tight">NexusCRM</span>
            <span className="text-[0.6rem] text-[var(--text-muted)] font-medium uppercase tracking-wider hidden sm:block">
              Lead Pipeline
            </span>
          </div>
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-1">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={clsx('nav-link', pathname === href && 'active')}
            >
              <Icon size={15} strokeWidth={2} />
              <span className="hidden sm:inline">{label}</span>
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
