// Ícone provisório (anel + ondas de sinal), aproximando a logo real da fachada.
// Troca pelo SVG/PNG oficial em /public assim que o arquivo original for adicionado.
export function LogoIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" fill="none" className={className} aria-hidden="true">
      <path
        d="M25.7 31.2 A12 12 0 1 1 24 11.6"
        stroke="currentColor"
        strokeWidth="7"
        strokeLinecap="round"
        className="text-primary"
      />
      <path
        d="M22.5 9.2 A19 19 0 0 1 35.5 21.5"
        stroke="currentColor"
        strokeWidth="4.5"
        strokeLinecap="round"
        className="text-secondary"
      />
      <path
        d="M22.8 16 A11.5 11.5 0 0 1 29.8 22.3"
        stroke="currentColor"
        strokeWidth="4.5"
        strokeLinecap="round"
        className="text-secondary"
      />
    </svg>
  );
}
