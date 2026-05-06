'use client';

import Link from 'next/link';
import { LayoutDashboard, UserPlus, Settings } from 'lucide-react';
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
    <nav className="glass sticky top-0 z-50 border-b border-[var(--border)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">C</span>
          </div>
          <span className="font-bold text-lg gradient-text">CRM Pro</span>
        </div>
        <div className="flex items-center gap-1">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={clsx('nav-link', pathname === href && 'active')}
            >
              <Icon size={16} />
              <span className="hidden sm:inline">{label}</span>
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
