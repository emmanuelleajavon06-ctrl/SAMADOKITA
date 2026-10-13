"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Suspense, useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { signIn } from "@/lib/api";
import { pageTransition } from "@/lib/motion";

function Form() {
  const router = useRouter();
  const [register, setRegister] = useState(typeof window !== "undefined" && new URLSearchParams(window.location.search).get("mode") === "register");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true); setErr("");
    const f = Object.fromEntries(new FormData(e.currentTarget).entries()) as Record<string, string>;
    try {
      const u = await signIn(register ? "register" : "login", f);
      router.push(u.role === "SUPER_ADMIN" ? "/admin" : "/dashboard");
    } catch (x) {
      setErr(x instanceof Error ? x.message : "Erreur");
      setBusy(false);
    }
  }

  return (
    <div className="center">
      <motion.div className="box" {...pageTransition}>
        <Link href="/"><img src="/logo.png" alt="SamaDokita" style={{ height: 64, margin: "0 auto 8px" }} /></Link>
        <h2 style={{ textAlign: "center", color: "var(--navy)", margin: "8px 0 0" }}>{register ? "Créer mon dossier patient" : "Connexion"}</h2>
        <form onSubmit={submit}>
          {register && (<>
            <label htmlFor="firstName">Prénom</label><input id="firstName" name="firstName" required maxLength={60} />
            <label htmlFor="lastName">Nom</label><input id="lastName" name="lastName" required maxLength={60} />
          </>)}
          <label htmlFor="email">Email</label><input id="email" name="email" type="email" required autoComplete="email" />
          <label htmlFor="password">Mot de passe{register ? " (10 caractères minimum)" : ""}</label>
          <input id="password" name="password" type="password" required minLength={register ? 10 : 1} maxLength={72} autoComplete={register ? "new-password" : "current-password"} />
          {err && <div className="err" role="alert">{err}</div>}
          <button className="btn btn-p" style={{ width: "100%", marginTop: 20 }} disabled={busy}>{busy ? "Patientez..." : register ? "Créer mon compte" : "Se connecter"}</button>
        </form>
        <button className="btn" style={{ width: "100%", marginTop: 8, background: "none", color: "var(--mut)" }} onClick={() => { setRegister(!register); setErr(""); }}>
          {register ? "J'ai déjà un compte" : "Pas encore de compte ? Créer mon dossier"}
        </button>
      </motion.div>
    </div>
  );
}

export default function LoginPage() { return <Suspense><Form /></Suspense>; }
