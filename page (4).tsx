"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { refresh, signOut } from "@/lib/api";
import { ROLE_LABEL, type User } from "@/lib/types";

const SOON: Record<string, string[]> = {
  PATIENT: ["Mon dossier médical", "Mes rendez-vous", "Mes ordonnances", "Mes analyses", "Vaccination", "Urgence SOS"],
  MEDECIN: ["Mes patients", "Agenda et téléconsultations", "Ordonnances"],
  PHARMACIEN: ["Scanner une ordonnance", "Délivrances"],
  LABORANTIN: ["Résultats d'analyses"],
  ASSURANCE: ["Assurés et prises en charge"],
  ADMIN_INFRA: ["Utilisateurs de la structure", "Abonnement et factures", "Statistiques"],
};

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  useEffect(() => { void refresh().then((u) => (u ? setUser(u) : router.replace("/login"))); }, [router]);
  if (!user) return <div className="center">Chargement...</div>;
  return (
    <main className="wrap" style={{ padding: "40px 20px" }}>
      <div className="top">
        <div><h1 style={{ fontSize: 30, margin: 0 }}>Bonjour {user.firstName}</h1><div className="muted">{ROLE_LABEL[user.role]} · {user.email}</div></div>
        <div style={{ display: "flex", gap: 8 }}>
          {user.role === "SUPER_ADMIN" && <Link className="btn btn-n" href="/admin">Espace admin</Link>}
          <button className="btn btn-o" onClick={() => void signOut().then(() => router.replace("/login"))}>Déconnexion</button>
        </div>
      </div>
      <div className="ok">Votre connexion fonctionne. Les modules ci-dessous sont en cours de développement et ne sont pas encore disponibles.</div>
      <div className="grid">{(SOON[user.role] ?? []).map((m) => <div className="card" key={m}><h3 style={{ margin: 0 }}>{m}</h3><p className="muted" style={{ marginTop: 8 }}>Bientôt disponible</p></div>)}</div>
    </main>
  );
}
