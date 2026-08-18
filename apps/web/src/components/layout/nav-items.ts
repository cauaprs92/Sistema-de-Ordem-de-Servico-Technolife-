import {
  ClipboardList,
  FileText,
  LayoutDashboard,
  Package,
  Settings,
  Users,
  Wallet,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

// Ordem por frequência de uso no dia a dia da assistência técnica — OS é o documento
// central do sistema (doc 05), por isso vem logo após o Dashboard.
export const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Ordens de Serviço', href: '/ordens-servico', icon: ClipboardList },
  { label: 'Clientes', href: '/clientes', icon: Users },
  { label: 'Estoque', href: '/estoque', icon: Package },
  { label: 'Financeiro', href: '/financeiro', icon: Wallet },
  { label: 'Notas Fiscais', href: '/notas-fiscais', icon: FileText },
  { label: 'Configurações', href: '/configuracoes', icon: Settings },
];
