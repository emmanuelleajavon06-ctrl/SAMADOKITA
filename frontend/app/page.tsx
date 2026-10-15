"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { gsap } from "gsap";
import Lenis from "lenis";
import Link from "next/link";
import { Heart, Activity, Calendar, FileText, Pill, FlaskConical, Shield, Users, ArrowRight, Star } from "lucide-react";
import { Parallax } from "@/components/animations/parallax";
import { FadeIn } from "@/components/animations/fade-in";
import { SlideUp } from "@/components/animations/slide-up";

function useLenis() {
  useEffect(() => {
    const lenis = new Lenis({ duration: 1.2 });
    let raf: number;
    const loop = (time: number) => {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
    };
  }, []);
}

function LogoLoader() {
  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-background"
      exit={{ opacity: 0, scale: 1.1 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
    >
      <motion.div
        className="flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-primary to-accent"
        animate={{ scale: [1, 1.15, 1], rotate: [0, 5, -5, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        <Heart className="h-12 w-12 text-white" />
      </motion.div>
    </motion.div>
  );
}

function Typewriter({ text }: { text: string }) {
  const [displayed, setDisplayed] = useState("");
  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      if (i <= text.length) {
        setDisplayed(text.slice(0, i));
        i++;
      } else {
        clearInterval(interval);
      }
    }, 60);
    return () => clearInterval(interval);
  }, [text]);
  return (
    <span>
      {displayed}
      <span className="typewriter-caret" />
    </span>
  );
}

function Blob() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="animate-blob absolute -left-32 -top-32 h-96 w-96 bg-primary/30 blur-3xl" />
      <div className="animate-blob absolute -right-32 top-1/3 h-96 w-96 bg-accent/30 blur-3xl" style={{ animationDelay: "-4s" }} />
      <div className="animate-blob absolute -bottom-32 left-1/3 h-96 w-96 bg-emerald-500/20 blur-3xl" style={{ animationDelay: "-2s" }} />
    </div>
  );
}

function FeatureCard({ icon: Icon, title, desc, delay }: { icon: typeof Heart; title: string; desc: string; delay: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref as React.RefObject<Element>, { once: true, margin: "-80px" });

  return (
    <motion.div
      ref={ref}
      className="rounded-2xl border border-border bg-background/80 p-6 shadow-lg backdrop-blur-sm"
      initial={{ opacity: 0, y: 60 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -8, boxShadow: "0 25px 50px rgba(14,165,233,0.15)" }}
    >
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
        <Icon className="h-6 w-6 text-primary" />
      </div>
      <h3 className="mb-2 text-lg font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground">{desc}</p>
    </motion.div>
  );
}

function Timeline() {
  const steps = [
    { title: "Inscription", desc: "Créez votre compte en 2 minutes", icon: Users },
    { title: "Enregistrement", desc: "Ajoutez vos patients et médecins", icon: FileText },
    { title: "Consultation", desc: "RDV, téléconsultation, ordonnances", icon: Calendar },
    { title: "Suivi", desc: "Vaccination, grossesse, résultats labo", icon: Activity },
    { title: "Sécurisé", desc: "Données souveraines au Sénégal", icon: Shield },
  ];

  return (
    <div className="relative mx-auto max-w-2xl">
      <div className="absolute left-8 top-0 h-full w-0.5 bg-gradient-to-b from-primary via-accent to-emerald-500" />
      {steps.map((step, i) => (
        <TimelineItem key={i} step={step} index={i} />
      ))}
    </div>
  );
}

function TimelineItem({ step, index }: { step: { title: string; desc: string; icon: typeof Heart }; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref as React.RefObject<Element>, { once: true });

  return (
    <motion.div
      ref={ref}
      className="relative mb-12 pl-20"
      initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
      animate={inView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="absolute left-4 top-0 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white">
        <step.icon className="h-4 w-4" />
      </div>
      <div className="rounded-xl border border-border bg-background p-4 shadow-sm">
        <h4 className="font-semibold">{step.title}</h4>
        <p className="text-sm text-muted-foreground">{step.desc}</p>
      </div>
    </motion.div>
  );
}

const features = [
  { icon: Users, title: "Dossier Médical Patient", desc: "Allergies, groupe sanguin, maladies chroniques — tout l'historical de santé en un seul endroit sécurisé." },
  { icon: Calendar, title: "Rendez-vous & Téléconsultation", desc: "Prise de rendez-vous simplifiée avec visioconférence intégrée via Jitsi." },
  { icon: FileText, title: "Ordonnances numériques", desc: "Prescriptions avec QR code vérifiable et signature numérique du médecin." },
  { icon: Pill, title: "Pharmacies connectées", desc: "Scannez le QR code d'une ordonnance pour vérifier et délivrer les médicaments." },
  { icon: FlaskConical, title: "Laboratoires", desc: "Résultats d'analyses téléchargeables et partageables en toute sécurité." },
  { icon: Activity, title: "Urgences SOS", desc: "Géolocalisation des urgences avec notification des médecins dans un rayon de 5 km." },
  { icon: Shield, title: "Souveraineté des données", desc: "Hébergement local au Sénégal, chiffrement de bout en bout, conformité RGPD." },
  { icon: Star, title: "Assistant IA", desc: "Un assistant intelligent pour répondre aux questions de santé 24h/24." },
];

export default function LandingPage() {
  useLenis();
  const [loading, setLoading] = useState(true);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (loading || !heroRef.current) return;
    gsap.fromTo(
      heroRef.current.querySelectorAll(".hero-animate"),
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.8, stagger: 0.15, ease: "power3.out" }
    );
  }, [loading]);

  return (
    <main className="min-h-screen overflow-x-hidden">
      <AnimatePresence>{loading && <LogoLoader />}</AnimatePresence>

      {/* Nav */}
      <nav className="fixed top-0 z-40 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent">
              <Heart className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold">SamaDokita</span>
          </div>
          <div className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Fonctionnalités</a>
            <a href="#timeline" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Comment ça marche</a>
            <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground-transition-colors">Tarifs</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="rounded-lg px-4 py-2 text-sm font-medium hover:bg-muted transition-colors">
              Connexion
            </Link>
            <Link href="/register" className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
              Essai gratuit
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative flex min-h-screen items-center justify-center pt-16">
        <Blob />
        <Parallax speed={0.1}>
          <div ref={heroRef} className="relative z-10 mx-auto max-w-4xl px-6 text-center">
            <motion.div
              className="hero-animate mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm text-primary"
              initial={{ opacity: 0 }}
            >
              <Star className="h-4 w-4" />
              Dossier Médical National du Sénégal
            </motion.div>
            <h1 className="hero-animate mb-6 text-5xl font-extrabold leading-tight md:text-7xl">
              <Typewriter text="Votre santé, partout avec vous" />
            </h1>
            <p className="hero-animate mx-auto mb-10 max-w-2xl text-lg text-muted-foreground md:text-xl">
              La plateforme santé numérique souveraine qui connecte patients, médecins,
              pharmacies et laboratoires à travers tout le Sénégal.
            </p>
            <div className="hero-animate flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/register"
                className="group flex items-center gap-2 rounded-xl bg-primary px-8 py-4 text-lg font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:bg-primary/90 hover:shadow-xl"
              >
                Commencer gratuitement
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
              <a
                href="#features"
                className="rounded-xl border border-border px-8 py-4 text-lg font-semibold hover:bg-muted transition-colors"
              >
                Découvrir
              </a>
            </div>
            <div className="hero-animate mt-12 flex items-center justify-center gap-8 text-sm text-muted-foreground">
              <span className="flex items-center gap-2"><Shield className="h-4 w-4 text-emerald-500" /> Données souveraines</span>
              <span className="flex items-center gap-2"><Activity className="h-4 w-4 text-primary" /> 800K utilisateurs</span>
              <span className="flex items-center gap-2"><Star className="h-4 w-4 text-amber-500" /> 30 jours gratuits</span>
            </div>
          </div>
        </Parallax>
      </section>

      {/* Features */}
      <section id="features" className="relative py-24">
        <div className="mx-auto max-w-7xl px-6">
          <FadeIn className="mb-16 text-center">
            <h2 className="mb-4 text-4xl font-bold">Tout votre écosystème santé</h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              16 modules intégrés pour gérer l'ensemble du parcours de soins, de la prise de rendez-vous au suivi post-traitement.
            </p>
          </FadeIn>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {features.map((f, i) => (
              <FeatureCard key={i} icon={f.icon} title={f.title} desc={f.desc} delay={i * 0.1} />
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section id="timeline" className="py-24 bg-muted/30">
        <div className="mx-auto max-w-7xl px-6">
          <FadeIn className="mb-16 text-center">
            <h2 className="mb-4 text-4xl font-bold">Comment ça marche</h2>
            <p className="text-muted-foreground">Un parcours simple en 5 étapes</p>
          </FadeIn>
          <Timeline />
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24">
        <div className="mx-auto max-w-7xl px-6">
          <FadeIn className="mb-16 text-center">
            <h2 className="mb-4 text-4xl font-bold">Tarifs simples</h2>
            <p className="text-muted-foreground">30 jours d'essai gratuit sur tous les plans</p>
          </FadeIn>
          <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-3">
            <PricingCard
              name="STARTER"
              price="20 000"
              features={["5 utilisateurs", "500 patients", "Support email", "Modules essentiels"]}
            />
            <PricingCard
              name="PROFESSIONAL"
              price="35 000"
              features={["20 utilisateurs", "5 000 patients", "Support prioritaire", "Tous les modules", "Assistant IA"]}
              highlighted
            />
            <PricingCard
              name="ENTERPRISE"
              price="75 000"
              features={["Utilisateurs illimités", "Patients illimités", "Support dédié", "API & intégrations", "SLA 99,9%"]}
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <SlideUp>
            <h2 className="mb-6 text-4xl font-bold">Prêt à transformer la santé au Sénégal ?</h2>
            <p className="mb-10 text-lg text-muted-foreground">
              Rejoignez les établissements de santé qui font confiance à SamaDokita.
            </p>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-10 py-4 text-lg font-semibold text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90"
            >
              Créer mon compte <ArrowRight className="h-5 w-5" />
            </Link>
          </SlideUp>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12">
        <div className="mx-auto max-w-7xl px-6 text-center text-sm text-muted-foreground">
          <p className="mb-2">SamaDokita — Votre santé, partout avec vous</p>
          <p>Dossier Médical National du Sénégal — Ministère de la Santé</p>
        </div>
      </footer>
    </main>
  );
}

function PricingCard({ name, price, features, highlighted }: { name: string; price: string; features: string[]; highlighted?: boolean }) {
  return (
    <motion.div
      className={`relative rounded-2xl border p-8 ${highlighted ? "border-primary bg-primary/5 shadow-xl shadow-primary/10" : "border-border bg-background"}`}
      whileHover={{ y: -8 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      {highlighted && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-xs font-semibold text-primary-foreground">
          Populaire
        </div>
      )}
      <h3 className="mb-2 text-xl font-bold">{name}</h3>
      <div className="mb-6">
        <span className="text-4xl font-extrabold">{price}</span>
        <span className="text-muted-foreground"> FCFA/mois</span>
      </div>
      <ul className="mb-8 space-y-3">
        {features.map((f, i) => (
          <li key={i} className="flex items-center gap-2 text-sm">
            <div className="h-1.5 w-1.5 rounded-full bg-primary" />
            {f}
          </li>
        ))}
      </ul>
      <Link
        href="/register"
        className={`block rounded-lg py-3 text-center font-semibold transition-colors ${highlighted ? "bg-primary text-primary-foreground hover:bg-primary/90" : "border border-border hover:bg-muted"}`}
      >
        Choisir {name}
      </Link>
    </motion.div>
  );
}
