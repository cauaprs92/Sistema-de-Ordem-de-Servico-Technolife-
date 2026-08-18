import { cn } from '@/lib/cn';
import { LogoIcon } from './logo-icon';

// Wordmark provisório, no padrão da logo real da Technolife: ícone (anel +
// ondas de sinal) + nome em azul-marinho + descritor em vermelho abaixo.
// Troca pelo arquivo oficial (apps/web/public/logo.svg) quando ele for adicionado.
export function Logo({
  className,
  size = 'sm',
}: {
  className?: string;
  size?: 'sm' | 'lg';
}) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <LogoIcon className={size === 'lg' ? 'h-9 w-9' : 'h-7 w-7'} />
      <div>
        <div
          className={cn(
            'font-bold leading-tight tracking-tight text-primary',
            size === 'lg' ? 'text-3xl' : 'text-lg',
          )}
        >
          Technolife
        </div>
        <div
          className={cn(
            'font-semibold uppercase leading-tight tracking-widest text-secondary',
            size === 'lg' ? 'text-xs' : 'text-[10px]',
          )}
        >
          Gestão de OS
        </div>
      </div>
    </div>
  );
}
