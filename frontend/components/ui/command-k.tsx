"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Command } from "cmdk";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

interface SearchResult {
  id: string;
  label: string;
  type: string;
}

export function CommandK() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", down);
    return () => window.removeEventListener("keydown", down);
  }, []);

  const { data } = useQuery({
    queryFn: async () => {
      if (query.length < 2) return [] as SearchResult[];
      const { data } = await api.get(`/search?q=${encodeURIComponent(query)}`);
      const results: SearchResult[] = [];
      if (data.patients) results.push(...data.patients.map((p: { id: string; firstName: string; lastName: string }) => ({ id: p.id, label: `${p.firstName} ${p.lastName}`, type: "Patient" })));
      if (data.doctors) results.push(...data.doctors.map((d: { id: string; specialty: string; user: { firstName: string; lastName: string } }) => ({ id: d.id, label: `${d.user.firstName} ${d.user.lastName} (${d.specialty})`, type: "Médecin" })));
      return results;
    },
    queryKey: ["search", query],
    enabled: open && query.length >= 2,
  });

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          />
          <motion.div
            className="fixed left-1/2 top-20 z-50 w-full max-w-lg -translate-x-1/2"
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            <Command className="rounded-xl border border-border bg-background shadow-2xl">
              <Command.Input
                value={query}
                onValueChange={setQuery}
                placeholder="Rechercher un patient, médecin..."
                className="w-full rounded-t-xl border-none bg-transparent px-4 py-3 text-sm outline-none"
              />
              <Command.List className="max-h-64 overflow-y-auto p-2">
                {data?.map((item) => (
                  <Command.Item
                    key={item.id}
                    value={item.id}
                    className="flex items-center justify-between rounded-lg px-3 py-2 text-sm cursor-pointer data-[selected=true]:bg-primary data-[selected=true]:text-primary-foreground"
                  >
                    <span>{item.label}</span>
                    <span className="text-xs opacity-60">{item.type}</span>
                  </Command.Item>
                ))}
                {query.length >= 2 && data?.length === 0 && (
                  <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                    Aucun résultat
                  </div>
                )}
              </Command.List>
            </Command>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
