"use client";

import { use, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Search, ChevronLeft, ScanLine, FileSearch, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import api from "@/lib/api";
import {
  MODULES,
  MODULES_BY_ROLE,
  formatCell,
  readJoined,
  type ModuleDef,
} from "@/lib/modules";

interface ListResponse {
  items: Record<string, unknown>[];
  nextCursor: string | null;
}

/** Les listes cursor renvoient { items, nextCursor } ; les listes simples renvoient un tableau. */
function normalize(data: unknown): ListResponse {
  if (Array.isArray(data)) {
    return { items: data as Record<string, unknown>[], nextCursor: null };
  }
  if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>;
    return {
      items: Array.isArray(obj.items) ? (obj.items as Record<string, unknown>[]) : [],
      nextCursor: typeof obj.nextCursor === "string" ? obj.nextCursor : null,
    };
  }
  return { items: [], nextCursor: null };
}

function axiosMessage(err: unknown): string {
  const e = err as { response?: { data?: { message?: string | string[] } } };
  const m = e?.response?.data?.message;
  if (Array.isArray(m)) return m.join(" · ");
  return m ?? "Impossible de charger les données. Vérifiez votre connexion.";
}

export default function ModulePage({ params }: { params: Promise<{ role: string; module: string }> }) {
  const { role, module: moduleKey } = use(params);
  const router = useRouter();
  const allowed = MODULES_BY_ROLE[role] ?? [];
  const allowedModule = allowed.includes(moduleKey);

  useEffect(() => {
    if (!allowedModule) router.replace(`/dashboard/${role}`);
  }, [allowedModule, role, router]);

  if (!allowedModule) return <Skeleton className="h-64 w-full rounded-2xl" />;
  if (moduleKey === "scan") return <ScanPage />;
  const def = MODULES[moduleKey];
  if (!def) return <Skeleton className="h-64 w-full rounded-2xl" />;
  return <ModuleList def={def} role={role} />;
}

/* ------------------------------------------------------------------ */
/* Liste (pagination curseur ou tableau simple)                        */
/* ------------------------------------------------------------------ */

function ModuleList({ def, role }: { def: ModuleDef; role: string }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  const queryFn = useMemo(() => {
    return async ({ pageParam }: { pageParam: string }): Promise<ListResponse> => {
      const cfg: { params: Record<string, string> } = { params: { take: "20" } };
      if (pageParam) cfg.params.cursor = pageParam;
      if (def.searchable && debounced) cfg.params.q = debounced;
      const { data } = await api.get<unknown>(def.endpoint, cfg);
      return normalize(data);
    };
  }, [def, debounced]);

  const infinite = useInfiniteQuery({
    queryKey: ["module", role, def.key, debounced],
    queryFn,
    initialPageParam: "",
    getNextPageParam: (last: ListResponse) => last.nextCursor ?? undefined,
    enabled: def.paginated,
  });

  const plain = useQuery({
    queryKey: ["module", role, def.key],
    queryFn: async () => {
      const { data } = await api.get<unknown>(def.endpoint);
      return normalize(data);
    },
    enabled: !def.paginated,
  });

  const isLoading = def.paginated ? infinite.isLoading : plain.isLoading;
  const isError = def.paginated ? infinite.isError : plain.isError;
  const error = def.paginated ? infinite.error : plain.error;

  const rows: Record<string, unknown>[] = def.paginated
    ? (infinite.data?.pages.flatMap((p) => p.items) ?? [])
    : (plain.data?.items ?? []);

  const hasNext = def.paginated && infinite.hasNextPage;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => router.push(`/dashboard/${role}`)} aria-label="Retour">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <CardTitle className="text-xl">{def.title}</CardTitle>
              {!isLoading && !isError && (
                <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                  {rows.length} élément{rows.length > 1 ? "s" : ""}
                </span>
              )}
            </div>
            {def.searchable && (
              <div className="relative w-full max-w-xs">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="Rechercher…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            )}
          </CardHeader>
          <CardContent>
            {isLoading && (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            )}

            {isError && (
              <div className="rounded-xl bg-rose-500/10 p-4 text-sm text-rose-600">{axiosMessage(error)}</div>
            )}

            {!isLoading && !isError && rows.length === 0 && (
              <div className="flex flex-col items-center gap-2 py-10 text-center text-muted-foreground">
                <FileSearch className="h-8 w-8" />
                <p className="font-medium">Aucun élément</p>
                <p className="text-sm">
                  {debounced ? "Aucun résultat pour cette recherche." : "Les données apparaîtront ici dès leur création."}
                </p>
              </div>
            )}

            {!isLoading && !isError && rows.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      {def.columns.map((c) => (
                        <th key={c.label} className="px-3 py-2 font-medium">
                          {c.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((item, idx) => (
                      <tr
                        key={typeof item.id === "string" ? item.id : String(idx)}
                        className="border-b last:border-0 hover:bg-muted/40"
                      >
                        {def.columns.map((c) => {
                          const cell = formatCell(item, c);
                          return (
                            <td key={c.label} className="px-3 py-2.5">
                              {cell.className ? (
                                <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${cell.className}`}>
                                  {cell.text}
                                </span>
                              ) : (
                                <span className="text-foreground/90">{cell.text}</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {hasNext && (
              <div className="mt-4 flex justify-center">
                <Button
                  variant="outline"
                  onClick={() => infinite.fetchNextPage()}
                  disabled={infinite.isFetchingNextPage}
                >
                  {infinite.isFetchingNextPage ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Charger plus
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Scan d'ordonnance (pharmacien) — GET /prescriptions/scan/:qrCode    */
/* ------------------------------------------------------------------ */

interface ScanResult {
  id: string;
  status: string;
  issuedAt: string;
  expiresAt: string | null;
  instructions: string | null;
  medications: unknown;
  patient: Record<string, unknown> | null;
  doctor: Record<string, unknown> | null;
}

function ScanPage() {
  const [code, setCode] = useState("");
  const [submitted, setSubmitted] = useState("");

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["prescription", "scan", submitted],
    queryFn: async () => {
      const { data } = await api.get<ScanResult>(
        `/prescriptions/scan/${encodeURIComponent(submitted)}`
      );
      return data;
    },
    enabled: submitted.length > 0,
    retry: false,
  });

  const meds = Array.isArray(data?.medications) ? (data?.medications as Record<string, unknown>[]) : [];

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <ScanLine className="h-5 w-5 text-primary" />
              Scanner une ordonnance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Saisissez le code QR (ou la référence) figurant sur l'ordonnance pour vérifier sa validité et ses
              médicaments.
            </p>
            <form
              className="flex gap-3"
              onSubmit={(e) => {
                e.preventDefault();
                setSubmitted(code.trim());
              }}
            >
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Code QR de l'ordonnance"
                required
              />
              <Button type="submit" disabled={isLoading || code.trim().length === 0}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ScanLine className="mr-2 h-4 w-4" />}
                Vérifier
              </Button>
            </form>

            {isError && (
              <div className="rounded-xl bg-rose-500/10 p-4 text-sm text-rose-600">
                Ordonnance introuvable ou accès refusé ({axiosMessage(error)}).
              </div>
            )}

            {data && (
              <div className="space-y-4 rounded-xl border p-5">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-semibold">
                    Patient : {readJoined(data.patient ?? {}, ["firstName", "lastName"])}
                  </span>
                  <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600">
                    {data.status}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Médecin : {readJoined(data.doctor?.["user"] as Record<string, unknown> ?? {}, ["firstName", "lastName"])}
                </p>
                <ul className="space-y-1 text-sm">
                  {meds.map((m, i) => (
                    <li key={i} className="rounded-lg bg-muted/50 px-3 py-2">
                      <span className="font-medium">{String(m.name ?? "—")}</span>
                      {typeof m.dosage === "string" && m.dosage.length > 0 ? ` — ${m.dosage}` : ""}
                      {typeof m.duration === "string" && m.duration.length > 0 ? ` — ${m.duration}` : ""}
                    </li>
                  ))}
                  {meds.length === 0 && <li className="text-muted-foreground">Aucun médicament renseigné.</li>}
                </ul>
                {typeof data.instructions === "string" && data.instructions.length > 0 && (
                  <p className="text-sm">
                    <span className="font-medium">Consignes : </span>
                    {data.instructions}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Émise le {new Date(data.issuedAt).toLocaleDateString("fr-FR")}
                  {data.expiresAt ? ` · Expire le ${new Date(data.expiresAt).toLocaleDateString("fr-FR")}` : ""}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
