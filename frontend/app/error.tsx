"use client";

import { RecoveryScreen } from "@/components/ui/recovery-screen";

/**
 * Boundary d'erreur des segments (dashboard, auth…) : toute exception non
 * attrapée pendant le rendu affiche l'écran de récupération au lieu du
 * message générique « Application error: a client-side exception has occurred ».
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <RecoveryScreen error={error} reset={reset} />;
}
