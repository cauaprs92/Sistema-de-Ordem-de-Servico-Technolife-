import {
  ClipboardList,
  FileText,
  History,
  LayoutDashboard,
  Package,
  UserCog,
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
// central do sistema (doc 05), por isso vem logo após o Dashboard. Clientes vem em
// seguida porque toda OS, NF e título aponta para um cliente (doc 03).
export const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Ordem de Serviço', href: '/ordens-servico', icon: ClipboardList },
  { label: 'Clientes', href: '/clientes', icon: Users },
  { label: 'Estoque', href: '/estoque', icon: Package },
  { label: 'Nota Fiscal', href: '/notas-fiscais', icon: FileText },
  { label: 'Financeiro', href: '/financeiro', icon: Wallet },
  { label: 'Funcionários', href: '/funcionarios', icon: UserCog },
  { label: 'Histórico', href: '/historico', icon: History },
];
