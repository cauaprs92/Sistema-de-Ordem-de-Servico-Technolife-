'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { estaAutenticado } from '@/lib/auth';
import { Sidebar } from './sidebar';
import { Topbar } from './topbar';

// Dono único do estado "sidebar aberta no mobile" — Sidebar e Topbar são
// componentes simples que só recebem props, sem gerenciar esse estado sozinhos.
//
// Também é a guarda de rota do grupo (app): sem access token no localStorage,
// manda para /login. É uma checagem só de client (o token vive em localStorage,
// não em cookie — doc 09), então não substitui a autorização real da API.
export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [autenticado, setAutenticado] = useState(false);

  useEffect(() => {
    if (!estaAutenticado()) {
      router.replace('/login');
      return;
    }
    setAutenticado(true);
  }, [router]);

  if (!autenticado) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
