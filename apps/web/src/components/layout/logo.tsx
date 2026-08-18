import { cn } from '@/lib/cn';

// Wordmark provisório, no padrão do site institucional (technolife.net.br):
// nome em azul-marinho + descritor em vermelho. Troca pelo logo real (SVG)
// quando as artes da empresa chegarem.
export function Logo({
  className,
  size = 'sm',
}: {
  className?: string;
  size?: 'sm' | 'lg';
}) {
  return (
    <div className={className}>
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
  );
}
