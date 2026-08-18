import { Logo } from '@/components/layout/logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

/**
 * Tela estática — Sprint 0 (item 0.7). A ligação com POST /auth/login
 * (doc 08) entra na Sprint 1, junto com o restante do fluxo de autenticação.
 */
export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm overflow-hidden rounded-lg border border-border shadow-sm">
        <div className="h-1.5 w-full bg-gradient-to-r from-primary to-secondary" />

        <div className="p-8">
          <div className="mb-6 text-center">
            <Logo className="flex flex-col items-center" size="lg" />
            <p className="mt-2 text-sm text-muted-foreground">Entre com sua conta para continuar</p>
          </div>

          <form className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="voce@technolife.com.br"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="senha">Senha</Label>
              <Input id="senha" name="senha" type="password" placeholder="••••••••••" required />
            </div>

            <Button type="submit">Entrar</Button>
          </form>
        </div>
      </div>
    </main>
  );
}
