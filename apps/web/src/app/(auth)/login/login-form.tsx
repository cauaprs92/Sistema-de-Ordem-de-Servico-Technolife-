'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import type { LoginResposta } from '@technolife/contracts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/ui/password-input';
import { ApiError, apiFetch } from '@/lib/api-client';
import { salvarSessao } from '@/lib/auth';

export function LoginForm() {
  const router = useRouter();
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro(null);
    setCarregando(true);

    const dados = new FormData(event.currentTarget);
    const email = String(dados.get('email') ?? '');
    const senha = String(dados.get('senha') ?? '');

    try {
      const resultado = await apiFetch<LoginResposta>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, senha }),
        autenticado: false,
      });

      salvarSessao(resultado);
      router.push('/dashboard');
    } catch (error) {
      const mensagem =
        error instanceof ApiError ? error.message : 'Não foi possível entrar. Tente novamente.';
      setErro(mensagem);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
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
        <div className="flex items-center justify-between">
          <Label htmlFor="senha">Senha</Label>
          <a href="#" className="text-xs font-medium text-secondary hover:underline">
            Esqueceu a senha?
          </a>
        </div>
        <PasswordInput id="senha" name="senha" placeholder="••••••••••" required />
      </div>

      {erro && <p className="text-sm text-destructive">{erro}</p>}

      <Button type="submit" disabled={carregando}>
        {carregando ? 'Entrando…' : 'Entrar'}
      </Button>
    </form>
  );
}
