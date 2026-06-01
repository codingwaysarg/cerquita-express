import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { CommandDialog, CommandInput, CommandList, CommandGroup, CommandItem, CommandEmpty, CommandSeparator } from "@/components/ui/command";
import { NAV, SETTINGS_ITEM } from "./nav-config";
import { ArrowLeft, Search, Receipt, ListChecks, Refrigerator } from "lucide-react";
import { getTransaction, getFridges } from "@/lib/admin/api/client";
import type { Fridge, Transaction } from "@/lib/admin/types";

type Mode = "default" | "search-tx" | "jump-to-fridge";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("default");
  const [q, setQ] = useState("");
  const [fridges, setFridges] = useState<Fridge[]>([]);
  const [searching, setSearching] = useState<"idle" | "searching" | "404" | "error">("idle");
  const [foundTx, setFoundTx] = useState<Transaction | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setOpen(o => !o); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open && mode === "jump-to-fridge" && fridges.length === 0) {
      getFridges().then(setFridges).catch(() => {});
    }
  }, [open, mode, fridges.length]);

  useEffect(() => { if (!open) { setMode("default"); setQ(""); setSearching("idle"); setFoundTx(null); } }, [open]);

  function go(to: string) { setOpen(false); navigate({ to: to as any }); }

  async function searchTx() {
    if (!q.trim()) return;
    setSearching("searching");
    try {
      const t = await getTransaction(q.trim());
      setFoundTx(t);
      setOpen(false);
      navigate({ to: "/admin/transactions/$id", params: { id: t.id } });
    } catch (e) {
      if (e instanceof Response && e.status === 404) setSearching("404");
      else setSearching("error");
    }
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      {mode === "default" && (
        <>
          <CommandInput placeholder="Buscá una acción o página…" value={q} onValueChange={setQ} />
          <CommandList>
            <CommandEmpty>Sin resultados</CommandEmpty>
            <CommandGroup heading="Navigate">
              {NAV.flatMap(g => g.items).concat(SETTINGS_ITEM as any).map(it => (
                <CommandItem key={it.to} onSelect={() => go(it.to)}><it.icon className="h-3.5 w-3.5 mr-2" />{it.label}</CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Quick actions">
              <CommandItem onSelect={() => go("/admin/review")}><ListChecks className="h-3.5 w-3.5 mr-2" />Open review queue</CommandItem>
              <CommandItem onSelect={() => { setMode("search-tx"); setQ(""); }}><Receipt className="h-3.5 w-3.5 mr-2" />Search transaction by id…</CommandItem>
              <CommandItem onSelect={() => { setMode("jump-to-fridge"); setQ(""); }}><Refrigerator className="h-3.5 w-3.5 mr-2" />Jump to fridge…</CommandItem>
            </CommandGroup>
          </CommandList>
        </>
      )}
      {mode === "search-tx" && (
        <>
          <div className="flex items-center gap-1 border-b px-2"><button onClick={() => setMode("default")} aria-label="Back" className="p-2"><ArrowLeft className="h-4 w-4" /></button><Search className="h-3.5 w-3.5 text-muted-foreground" /><input autoFocus className="flex-1 bg-transparent py-3 outline-none text-sm" placeholder="Search transactions by id…" value={q} onChange={e => { setQ(e.target.value); setSearching("idle"); }} onKeyDown={e => { if (e.key === "Enter") searchTx(); }} /></div>
          <div className="px-4 py-6 text-sm text-muted-foreground">
            {searching === "idle" && "Press Enter to search by id."}
            {searching === "searching" && "Searching…"}
            {searching === "404" && "No transaction matches that id"}
            {searching === "error" && "Couldn't search right now"}
            {foundTx && <div>Found {foundTx.id}</div>}
          </div>
        </>
      )}
      {mode === "jump-to-fridge" && (
        <>
          <div className="flex items-center gap-1 border-b px-2"><button onClick={() => setMode("default")} aria-label="Back" className="p-2"><ArrowLeft className="h-4 w-4" /></button><Search className="h-3.5 w-3.5 text-muted-foreground" /><input autoFocus className="flex-1 bg-transparent py-3 outline-none text-sm" placeholder="Filter by id or location…" value={q} onChange={e => setQ(e.target.value)} /></div>
          <CommandList>
            <CommandEmpty>Sin heladeras</CommandEmpty>
            <CommandGroup>
              {fridges.filter(f => !q || f.id.toLowerCase().includes(q.toLowerCase()) || f.location?.toLowerCase().includes(q.toLowerCase())).map(f => (
                <CommandItem key={f.id} onSelect={() => { setOpen(false); navigate({ to: "/admin/fridges/$id", params: { id: f.id } }); }}>
                  <Refrigerator className="h-3.5 w-3.5 mr-2" />{f.name} <span className="ml-2 text-xs text-muted-foreground">{f.location || f.id}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </>
      )}
    </CommandDialog>
  );
}
