interface PlaceholderPageProps {
  titulo: string;
  descricao: string;
}

export function PlaceholderPage({ titulo, descricao }: PlaceholderPageProps) {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">{titulo}</h1>
      <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        {descricao}
      </div>
    </div>
  );
}
