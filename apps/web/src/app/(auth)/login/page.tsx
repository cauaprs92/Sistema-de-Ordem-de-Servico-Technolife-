import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

/**
 * Tela estática — Sprint 0 (item 0.7). A ligação com POST /auth/login
 * (doc 08) entra na Sprint 1, junto com o restante do fluxo de autenticação.
 */
export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted px-4">
      <div className="w-full max-w-sm rounded-lg border border-border bg-background p-8 shadow-sm">
        <div className="mb-6 text-center">
          <h1 className="text-xl font-semibold">Technoloife</h1>
          <p className="mt-1 text-sm text-muted-foreground">Entre com sua conta para continuar</p>
        </div>

        <form className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" name="email" type="email" placeholder="voce@technoloife.com.br" required />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="senha">Senha</Label>
            <Input id="senha" name="senha" type="password" placeholder="••••••••••" required />
          </div>

          <Button type="submit">Entrar</Button>
        </form>
      </div>
    </main>
  );
}
