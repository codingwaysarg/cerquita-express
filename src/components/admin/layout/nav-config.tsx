import { LayoutDashboard, Receipt, ListChecks, Package, Tags, GraduationCap, Refrigerator, FlaskConical, Settings } from "lucide-react";

export type NavItem = { to: string; label: string; icon: typeof LayoutDashboard; exact?: boolean };
export type NavGroup = { label: string; items: NavItem[] };

export const NAV: NavGroup[] = [
  { label: "Overview", items: [
    { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
    { to: "/admin/transactions", label: "Transactions", icon: Receipt },
    { to: "/admin/review", label: "Review queue", icon: ListChecks, exact: true },
  ]},
  { label: "Catalog", items: [
    { to: "/admin/products", label: "Products", icon: Package },
    { to: "/admin/review/labeling", label: "Etiquetado", icon: Tags },
    { to: "/admin/training", label: "Training", icon: GraduationCap },
  ]},
  { label: "Fleet", items: [
    { to: "/admin/fridges", label: "Fridges", icon: Refrigerator },
  ]},
  { label: "Tools", items: [
    { to: "/admin/sim", label: "Simulador", icon: FlaskConical },
  ]},
];
export const SETTINGS_ITEM: NavItem = { to: "/admin/settings", label: "Settings", icon: Settings };
