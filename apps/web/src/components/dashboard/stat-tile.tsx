import { cn } from '@/lib/cn';

interface StatTileProps {
  label: string;
  value: string;
  alerta?: boolean;
}

// Espelha o mockup do doc 07 (§5 Dashboard financeiro): valores neutros em preto,
// o item vencido/atrasado destacado em vermelho — é o único lugar onde a cor de
// alerta da marca aparece por padrão, mantendo o resto da tela sóbrio.
export function StatTile({ label, value, alerta = false }: StatTileProps) {
  return (
    <div
      className={cn(
        'rounded-lg border border-border bg-background p-4',
        alerta && 'border-secondary/30 bg-secondary/5',
      )}
    >
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={cn('mt-1 text-2xl font-semibold', alerta && 'text-secondary')}>{value}</p>
    </div>
  );
}
