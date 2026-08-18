'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { cn } from '@/lib/cn';
import { apiFetch } from '@/lib/api-client';
import { limparSessao, obterRefreshToken, obterUsuarioSessao } from '@/lib/auth';
import { Logo } from './logo';
import { navItems } from './nav-items';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const usuario = obterUsuarioSessao();

  async function handleLogout() {
    const refreshToken = obterRefreshToken();
    limparSessao();
    router.push('/login');

    // Revoga no servidor depois de já ter tirado o usuário da tela — não faz
    // sentido travar o logout esperando a rede.
    if (refreshToken) {
      await apiFetch('/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
        autenticado: false,
      }).catch(() => {});
    }
  }

  return (
    <>
      {/* Backdrop — só existe no mobile, fecha a sidebar ao clicar fora */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 shrink-0 flex-col transition-transform duration-200 md:static md:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-16 items-center border-b border-border bg-background px-6">
          <Logo />
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto bg-sidebar p-3">
          {navItems.map((item) => {
            const ativo = pathname === item.href || pathname?.startsWith(`${item.href}/`);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  ativo
                    ? 'bg-secondary text-secondary-foreground'
                    : 'text-sidebar-foreground hover:bg-sidebar-hover hover:text-white',
                )}
              >
                <Icon className="h-4 w-4 shrink-0" strokeWidth={ativo ? 2.5 : 2} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/10 bg-sidebar p-3">
          <div className="flex items-center gap-2 rounded-md px-2 py-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
              {(usuario?.nome ?? '?').charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">
                {usuario?.nome ?? 'Usuário'}
              </p>
              <p className="truncate text-xs text-sidebar-foreground">{usuario?.papel ?? '—'}</p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              aria-label="Sair"
              className="rounded-md p-1.5 text-sidebar-foreground hover:bg-sidebar-hover hover:text-white"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
