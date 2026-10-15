"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { AlertTriangle, Home, Loader2, RefreshCw } from "lucide-react";

/**
 * Détecte les erreurs de chargement de chunks (« ChunkLoadError »…) : elles
 * surviennent quand un redéploiement remplace les fichiers JS pendant que
 * l'utilisateur navigue. La page se recharge alors une seule fois toute seule.
 */
const CHUNK_PATTERN =
  /ChunkLoadError|Loading chunk|Loading CSS chunk|dynamically imported module|Importing a module script failed|Failed to fetch dynamically imported module/i;

/**
 * Écran d'erreur convivial (remplace le message brut
 * « Application error: a client-side exception has occurred »).
 */
export function RecoveryScreen({
  error,
  reset,
}: {
  error: (Error & { digest?: string }) | undefined;
  reset: () => void;
}) {
  const isChunk = CHUNK_PATTERN.test(error?.message ?? "");
  const started = useRef(false);

  useEffect(() => {
    if (!isChunk || started.current) return;
    started.current = true;
    if (sessionStorage.getItem("samadokita-chunk-reload") === "1") {
      // Déjà rechargé une fois : on laisse l'écran (bouton « Réessayer »).
      return;
    }
    sessionStorage.setItem("samadokita-chunk-reload", "1");
    window.location.reload();
  }, [isChunk]);

  const retry = () => {
    sessionStorage.removeItem("samadokita-chunk-reload");
    if (isChunk) window.location.reload();
    else reset();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-xl">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10">
          <AlertTriangle className="h-7 w-7 text-amber-500" />
        </div>
        <h1 className="mb-2 text-xl font-bold text-foreground">
          {isChunk ? "Mise à jour en cours…" : "Oups, une erreur est survenue"}
        </h1>
        <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
          {isChunk
            ? "L'application vient d'être redéployée et vos fichiers ont été actualisés. Rechargement automatique…"
            : "Une erreur inattendue s'est produite. Cela arrive pendant un redéploiement ou une coupure réseau : vos données restent sauvegardées."}
        </p>
        {isChunk ? (
          <p className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Veuillez patienter…
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            <button
              onClick={retry}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Réessayer
            </button>
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              <Home className="h-4 w-4" />
              Retour à l'accueil
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
