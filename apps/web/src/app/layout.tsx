import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Technoloife',
  description: 'Sistema de gestão — Clientes, Estoque, OS, Notas Fiscais e Financeiro',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
