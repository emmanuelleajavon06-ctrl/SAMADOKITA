/**
 * Registre des modules métier du tableau de bord.
 * Chaque module pointe vers une VRAIE route du backend NestJS (RBAC inclus) et
 * décrit les colonnes réellement retournées par l'API (modèles Prisma).
 */

export type ColumnFormat =
  | "date"
  | "datetime"
  | "fcfa"
  | "percent"
  | "status"
  | "boolean"
  | "medications";

export interface ModuleColumn {
  /** Chemin pointé dans l'objet (ex. "patient.firstName") ou liste à concaténer (noms composés). */
  path: string | string[];
  label: string;
  format?: ColumnFormat;
}

export interface ModuleDef {
  /** Clé d'URL (= segment après le rôle). */
  key: string;
  title: string;
  /** Route backend (base = NEXT_PUBLIC_API_URL). */
  endpoint: string;
  /** true : réponse { items, nextCursor } (pagination curseur) ; false : tableau simple. */
  paginated: boolean;
  /** true : le backend accepte le paramètre de recherche ?q=. */
  searchable: boolean;
  columns: ModuleColumn[];
}

export const MODULES: Record<string, ModuleDef> = {
  patients: {
    key: "patients",
    title: "Patients",
    endpoint: "/patients",
    paginated: true,
    searchable: true,
    columns: [
      { path: ["firstName", "lastName"], label: "Patient" },
      { path: "phone", label: "Téléphone" },
      { path: "gender", label: "Sexe", format: "status" },
      { path: "bloodGroup", label: "Groupe sanguin" },
      { path: "address", label: "Adresse" },
      { path: "createdAt", label: "Créé le", format: "date" },
    ],
  },
  appointments: {
    key: "appointments",
    title: "Rendez-vous",
    endpoint: "/appointments",
    paginated: true,
    searchable: false,
    columns: [
      { path: ["patient.firstName", "patient.lastName"], label: "Patient" },
      { path: ["doctor.user.firstName", "doctor.user.lastName"], label: "Médecin" },
      { path: "scheduledAt", label: "Date", format: "datetime" },
      { path: "status", label: "Statut", format: "status" },
      { path: "isTeleconsultation", label: "Téléconsultation", format: "boolean" },
      { path: "reason", label: "Motif" },
    ],
  },
  prescriptions: {
    key: "prescriptions",
    title: "Ordonnances",
    endpoint: "/prescriptions",
    paginated: true,
    searchable: false,
    columns: [
      { path: ["patient.firstName", "patient.lastName"], label: "Patient" },
      { path: ["doctor.user.firstName", "doctor.user.lastName"], label: "Médecin" },
      { path: "medications", label: "Médicaments", format: "medications" },
      { path: "status", label: "Statut", format: "status" },
      { path: "issuedAt", label: "Émise le", format: "date" },
      { path: "expiresAt", label: "Expire le", format: "date" },
    ],
  },
  emergency: {
    key: "emergency",
    title: "Urgences",
    endpoint: "/emergency",
    paginated: false,
    searchable: false,
    columns: [
      { path: ["patient.firstName", "patient.lastName"], label: "Patient" },
      { path: "type", label: "Type" },
      { path: "description", label: "Description" },
      { path: "status", label: "Statut", format: "status" },
      { path: "radiusKm", label: "Rayon (km)" },
      { path: "createdAt", label: "Déclenchée le", format: "datetime" },
    ],
  },
  notifications: {
    key: "notifications",
    title: "Notifications",
    endpoint: "/notifications",
    paginated: true,
    searchable: false,
    columns: [
      { path: "title", label: "Titre" },
      { path: "message", label: "Message" },
      { path: "type", label: "Type", format: "status" },
      { path: "read", label: "Lue", format: "boolean" },
      { path: "createdAt", label: "Reçue le", format: "datetime" },
    ],
  },
  results: {
    key: "results",
    title: "Résultats d'analyses",
    endpoint: "/laboratories",
    paginated: true,
    searchable: false,
    columns: [
      { path: ["patient.firstName", "patient.lastName"], label: "Patient" },
      { path: "type", label: "Analyse" },
      { path: "result", label: "Résultat" },
      { path: "status", label: "Statut", format: "status" },
      { path: "resultDate", label: "Date du résultat", format: "date" },
      { path: "notes", label: "Notes" },
    ],
  },
  policies: {
    key: "policies",
    title: "Polices d'assurance",
    endpoint: "/insurance/policies",
    paginated: false,
    searchable: false,
    columns: [
      { path: ["patient.firstName", "patient.lastName"], label: "Patient" },
      { path: "insurance.name", label: "Assureur" },
      { path: "policyNumber", label: "N° de police" },
      { path: "coverageRate", label: "Couverture", format: "percent" },
      { path: "startDate", label: "Début", format: "date" },
      { path: "endDate", label: "Fin", format: "date" },
    ],
  },
  billing: {
    key: "billing",
    title: "Historique de facturation",
    endpoint: "/billing/history",
    paginated: false,
    searchable: false,
    columns: [
      { path: "plan", label: "Plan", format: "status" },
      { path: "amount", label: "Montant", format: "fcfa" },
      { path: "provider", label: "Paiement", format: "status" },
      { path: "status", label: "Statut", format: "status" },
      { path: "transactionId", label: "Transaction" },
      { path: "createdAt", label: "Créée le", format: "datetime" },
    ],
  },
};

/** Modules accessibles par rôle — aligné sur la navigation du layout. */
export const MODULES_BY_ROLE: Record<string, string[]> = {
  super_admin: ["billing"],
  admin_infra: ["patients", "appointments", "prescriptions", "emergency", "notifications"],
  medecin: ["appointments", "patients", "prescriptions"],
  patient: ["appointments", "prescriptions"],
  pharmacien: ["scan", "prescriptions"],
  laborantin: ["results"],
  assurance: ["policies"],
};

/** Couleurs des libellés d'état (enums Prisma). */
const STATUS_COLORS: Record<string, string> = {
  // Rendez-vous
  PENDING: "bg-amber-500/10 text-amber-600",
  CONFIRMED: "bg-emerald-500/10 text-emerald-600",
  CANCELLED: "bg-rose-500/10 text-rose-600",
  COMPLETED: "bg-sky-500/10 text-sky-600",
  // Ordonnances
  DRAFT: "bg-zinc-500/10 text-zinc-600",
  VALIDATED: "bg-emerald-500/10 text-emerald-600",
  DISPENSED: "bg-teal-500/10 text-teal-600",
  EXPIRED: "bg-rose-500/10 text-rose-600",
  // Urgences / abonnements
  ACTIVE: "bg-red-500/10 text-red-600",
  RESOLVED: "bg-emerald-500/10 text-emerald-600",
  TRIALING: "bg-amber-500/10 text-amber-600",
  SUSPENDED: "bg-rose-500/10 text-rose-600",
  // Paiements
  PAID: "bg-emerald-500/10 text-emerald-600",
  FAILED: "bg-rose-500/10 text-rose-600",
  REFUNDED: "bg-zinc-500/10 text-zinc-600",
  // Notifications / analyses
  APPOINTMENT: "bg-sky-500/10 text-sky-600",
  PRESCRIPTION: "bg-teal-500/10 text-teal-600",
  LAB_RESULT: "bg-violet-500/10 text-violet-600",
  EMERGENCY: "bg-red-500/10 text-red-600",
  BILLING: "bg-amber-500/10 text-amber-600",
  SYSTEM: "bg-zinc-500/10 text-zinc-600",
  // Plans & providers
  STARTER: "bg-sky-500/10 text-sky-600",
  PROFESSIONAL: "bg-violet-500/10 text-violet-600",
  ENTERPRISE: "bg-purple-500/10 text-purple-600",
  WAVE: "bg-sky-500/10 text-sky-600",
  ORANGE_MONEY: "bg-orange-500/10 text-orange-600",
  FREE_MONEY: "bg-emerald-500/10 text-emerald-600",
  CARD: "bg-zinc-500/10 text-zinc-600",
  // Sexe
  MALE: "bg-sky-500/10 text-sky-600",
  FEMALE: "bg-pink-500/10 text-pink-600",
};

export function statusColor(value: string): string {
  return STATUS_COLORS[value] ?? "bg-zinc-500/10 text-zinc-600";
}

/** Lecture sûre d'un chemin pointé dans une réponse API (aucun `any`). */
export function readPath(item: Record<string, unknown>, path: string): unknown {
  let cur: unknown = item;
  for (const seg of path.split(".")) {
    if (cur === null || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[seg];
  }
  return cur;
}

/** Concatène les segments d'un nom composé ("Prénom Nom") en ignorant les vides. */
export function readJoined(item: Record<string, unknown>, paths: string[]): string {
  const parts = paths
    .map((p) => readPath(item, p))
    .filter((v): v is string | number => typeof v === "string" ? v.length > 0 : typeof v === "number");
  return parts.length > 0 ? parts.map(String).join(" ") : "—";
}

/** Formate une valeur selon le format de la colonne (libellé + classes Tailwind). */
export function formatCell(
  item: Record<string, unknown>,
  column: ModuleColumn
): { text: string; className?: string } {
  const raw = Array.isArray(column.path)
    ? readJoined(item, column.path)
    : readPath(item, column.path);

  switch (column.format) {
    case "date":
    case "datetime": {
      if (typeof raw !== "string" || raw.length === 0) return { text: "—" };
      const d = new Date(raw);
      if (Number.isNaN(d.getTime())) return { text: "—" };
      return {
        text: d.toLocaleDateString("fr-FR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          ...(column.format === "datetime" ? { hour: "2-digit", minute: "2-digit" } : {}),
        }),
      };
    }
    case "fcfa": {
      const n = typeof raw === "number" ? raw : Number(raw);
      if (!Number.isFinite(n)) return { text: "—" };
      return { text: `${n.toLocaleString("fr-FR")} FCFA` };
    }
    case "percent": {
      const n = typeof raw === "number" ? raw : Number(raw);
      if (!Number.isFinite(n)) return { text: "—" };
      return { text: `${n.toLocaleString("fr-FR")} %` };
    }
    case "status": {
      if (typeof raw !== "string" || raw.length === 0) return { text: "—" };
      const labels: Record<string, string> = {
        PENDING: "En attente",
        CONFIRMED: "Confirmé",
        CANCELLED: "Annulé",
        COMPLETED: "Terminé",
        DRAFT: "Brouillon",
        VALIDATED: "Validée",
        DISPENSED: "Délivrée",
        EXPIRED: "Expirée",
        ACTIVE: "Active",
        RESOLVED: "Résolue",
        TRIALING: "Essai",
        SUSPENDED: "Suspendu",
        PAID: "Payé",
        FAILED: "Échec",
        REFUNDED: "Remboursé",
        APPOINTMENT: "Rendez-vous",
        PRESCRIPTION: "Ordonnance",
        LAB_RESULT: "Analyse",
        EMERGENCY: "Urgence",
        BILLING: "Facturation",
        SYSTEM: "Système",
        STARTER: "STARTER",
        PROFESSIONAL: "PROFESSIONAL",
        ENTERPRISE: "ENTERPRISE",
        WAVE: "Wave",
        ORANGE_MONEY: "Orange Money",
        FREE_MONEY: "Free Money",
        CARD: "Carte",
        MALE: "Homme",
        FEMALE: "Femme",
      };
      return { text: labels[raw] ?? raw, className: statusColor(raw) };
    }
    case "boolean": {
      const b = raw === true;
      return b
        ? { text: "Oui", className: "bg-emerald-500/10 text-emerald-600" }
        : { text: "Non", className: "bg-zinc-500/10 text-zinc-500" };
    }
    case "medications": {
      if (!Array.isArray(raw) || raw.length === 0) return { text: "—" };
      const names = raw
        .map((m) =>
          m && typeof m === "object" && typeof (m as Record<string, unknown>).name === "string"
            ? ((m as Record<string, unknown>).name as string)
            : null
        )
        .filter((n): n is string => n !== null);
      const label = `${raw.length} médicament${raw.length > 1 ? "s" : ""}`;
      return { text: names.length > 0 ? `${label} : ${names.join(", ")}` : label };
    }
    default: {
      if (raw === null || raw === undefined) return { text: "—" };
      if (typeof raw === "object") return { text: "—" };
      return { text: String(raw) };
    }
  }
}
