import { Link, useRouterState } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { Fragment } from "react";

const ROUTE_LABELS: Record<string, string> = {
  admin: "Dashboard",
  transactions: "Transactions",
  review: "Review",
  labeling: "Etiquetado",
  label: "Etiquetar",
  products: "Products",
  training: "Training",
  fridges: "Fridges",
  sim: "Simulador",
  settings: "Settings",
};

export function Breadcrumb() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (!pathname.startsWith("/admin")) return null;
  const parts = pathname.split("/").filter(Boolean);
  // Build cumulative crumbs
  let acc = "";
  const crumbs = parts.map((p, i) => {
    acc += "/" + p;
    let label = ROUTE_LABELS[p] || p;
    // dynamic ids
    const prev = parts[i - 1];
    if (prev === "transactions") label = `tx_${p.replace(/^tx_/, "").slice(0, 8)}…`;
    if (prev === "fridges") label = p;
    if (prev === "products") label = p;
    if (prev === "sim") label = p;
    if (prev === "label") label = `tx_${p.replace(/^tx_/, "").slice(0, 8)}…`;
    return { href: acc, label };
  });
  if (crumbs.length === 0) return null;
  return (
    <nav aria-label="Breadcrumb" className="hidden md:flex items-center text-sm">
      {crumbs.map((c, i) => {
        const last = i === crumbs.length - 1;
        return (
          <Fragment key={c.href}>
            {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground mx-1" />}
            {last ? (
              <span aria-current="page" className="font-semibold truncate max-w-[40vw]">{c.label}</span>
            ) : (
              <Link to={c.href as any} className="text-muted-foreground hover:text-foreground truncate max-w-[20vw]">{c.label}</Link>
            )}
          </Fragment>
        );
      })}
    </nav>
  );
}
