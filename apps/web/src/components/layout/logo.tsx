// Wordmark provisório — troca pelo logo real quando as artes da empresa chegarem.
export function Logo({ className }: { className?: string }) {
  return (
    <div className={className}>
      <span className="text-lg font-bold tracking-tight text-primary">Techno</span>
      <span className="text-lg font-bold tracking-tight text-secondary">loife</span>
    </div>
  );
}
