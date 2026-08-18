'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/cn';
import { Logo } from './logo';
import { navItems } from './nav-items';

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 border-r border-sidebar-border bg-sidebar md:flex md:flex-col">
      <div className="flex h-16 items-center border-b border-sidebar-border px-6">
        <Logo />
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {navItems.map((item) => {
          const ativo = pathname === item.href || pathname?.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                ativo
                  ? 'bg-sidebar-active text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              <Icon className="h-4 w-4" strokeWidth={ativo ? 2.5 : 2} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <div className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
          Sprint 0 — esqueleto do projeto
        </div>
      </div>
    </aside>
  );
}
