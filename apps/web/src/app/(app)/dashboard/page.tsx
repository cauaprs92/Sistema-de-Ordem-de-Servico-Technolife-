import { StatTile } from '@/components/dashboard/stat-tile';

// Dados fixos por enquanto — vira consulta real em /dashboard (doc 08) na Sprint 7.
export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Visão geral</h1>
        <p className="mt-1 text-muted-foreground">Indicadores do dia, por papel (doc 00).</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Saldo em caixa" value="R$ 0,00" />
        <StatTile label="A receber hoje" value="R$ 0,00" />
        <StatTile label="A pagar hoje" value="R$ 0,00" />
        <StatTile label="Vencido" value="R$ 0,00" alerta />
      </div>

      <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        Fluxo de caixa projetado, produtividade por técnico e demais gráficos entram na
        Sprint 7 — este é só o esqueleto visual.
      </div>
    </div>
  );
}
