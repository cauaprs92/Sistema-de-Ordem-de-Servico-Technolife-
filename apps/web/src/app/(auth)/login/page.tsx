import { ShieldCheck } from 'lucide-react';
import { Logo } from '@/components/layout/logo';
import { LoginForm } from './login-form';

/**
 * Sprint 0: layout final da tela, mas ainda sem POST /auth/login real (doc 08)
 * — isso entra na Sprint 1. O envio do formulário está em ./login-form.tsx.
 */
export default function LoginPage() {
  return (
    <main className="flex min-h-screen">
      {/* Painel de marca — some em telas pequenas, o login sozinho já funciona */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-br from-primary via-primary to-secondary p-10 lg:flex">
        <div className="inline-flex w-fit rounded-lg bg-white/95 px-4 py-3 shadow-sm">
          <Logo />
        </div>

        <div className="max-w-md">
          <h1 className="text-4xl font-bold text-white">Bem-vindo</h1>
          <p className="mt-3 text-white/80">
            Gestão completa de ordens de serviço, estoque e financeiro em um só lugar.
          </p>

          <div className="mt-8 flex items-center gap-3 rounded-lg bg-white/10 p-3 text-sm text-white/90">
            <ShieldCheck className="h-5 w-5 shrink-0" />
            Acesso controlado por papel, com trilha de auditoria em cada ação.
          </div>
        </div>

        <div />
      </div>

      {/* Formulário */}
      <div className="flex w-full items-center justify-center bg-background px-4 lg:w-1/2">
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center lg:hidden">
            <Logo className="justify-center" size="lg" />
          </div>

          <h2 className="text-xl font-semibold">Entrar</h2>
          <p className="mt-1 text-sm text-muted-foreground">Entre com sua conta para continuar</p>

          <LoginForm />
        </div>
      </div>
    </main>
  );
}
