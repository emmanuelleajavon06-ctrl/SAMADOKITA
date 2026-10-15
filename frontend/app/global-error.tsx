"use client";

import { RecoveryScreen } from "@/components/ui/recovery-screen";

/**
 * Boundary d'erreur racine : remplace le layout racine si celui-ci (ou un
 * composant hors segment) plante côté client. Doit rendre <html>/<body>.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="fr">
      <body>
        <RecoveryScreen error={error} reset={reset} />
      </body>
    </html>
  );
}
