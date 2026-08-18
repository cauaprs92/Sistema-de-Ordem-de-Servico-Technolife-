'use client';

import { usePathname } from 'next/navigation';
import { Bell } from 'lucide-react';
import { navItems } from './nav-items';

export function Topbar() {
  const pathname = usePathname();
  const paginaAtual = navItems.find(
    (item) => pathname === item.href || pathname?.startsWith(`${item.href}/`),
  );

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-background px-6">
      <h2 className="text-lg font-semibold">{paginaAtual?.label ?? 'Technoloife'}</h2>

      <div className="flex items-center gap-4">
        <button
          type="button"
          aria-label="Notificações"
          className="relative rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-secondary" />
        </button>

        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
            A
          </div>
          <span className="text-sm font-medium">Administrador</span>
        </div>
      </div>
    </header>
  );
}
