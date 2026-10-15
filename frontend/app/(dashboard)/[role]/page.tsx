"use client";

import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Users, Calendar, FileText, Activity, AlertTriangle, Shield, Clock } from "lucide-react";
import { DashboardSkeleton } from "@/components/ui/skeleton";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthStore } from "@/lib/store";
import api from "@/lib/api";

const roleTitles: Record<string, string> = {
  super_admin: "Super Admin",
  admin_infra: "Administrateur Infrastructure",
  medecin: "Médecin",
  pharmacien: "Pharmacien",
  laborantin: "Laborantin",
  assurance: "Assurance",
  patient: "Patient",
};

const roleColors: Record<string, string> = {
  super_admin: "from-purple-500 to-indigo-500",
  admin_infra: "from-primary to-accent",
  medecin: "from-emerald-500 to-teal-500",
  pharmacien: "from-orange-500 to-amber-500",
  laborantin: "from-blue-500 to-cyan-500",
  assurance: "from-pink-500 to-rose-500",
  patient: "from-primary to-accent",
};

export default function DashboardPage({ params }: { params: Promise<{ role: string }> }) {
  const { role } = use(params);
  const user = useAuthStore((s) => s.user);
  const roleName = roleTitles[role] ?? "Utilisateur";
  const gradient = roleColors[role] ?? "from-primary to-accent";

  const { data: stats, isLoading } = useQuery({
    queryKey: ["dashboard", "stats"],
    queryFn: async () => {
      const { data } = await api.get("/dashboard/stats");
      return data;
    },
  });

  if (isLoading) return <DashboardSkeleton />;

  const s = stats?.stats ?? {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className={`rounded-2xl bg-gradient-to-r ${gradient} p-8 text-white`}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="mb-2 text-3xl font-bold">
            Bonjour, {user?.firstName} 👋
          </h1>
          <p className="opacity-90">{roleName} — Voici l'activité de votre établissement</p>
        </motion.div>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Users className="h-5 w-5" />}
          label="Patients total"
          value={s.totalPatients ?? 0}
          color="bg-primary/10 text-primary"
          delay={0}
        />
        <StatCard
          icon={<Calendar className="h-5 w-5" />}
          label="RDV aujourd'hui"
          value={s.appointmentsToday ?? 0}
          color="bg-emerald-500/10 text-emerald-500"
          delay={0.1}
        />
        <StatCard
          icon={<FileText className="h-5 w-5" />}
          label="Ordonnances actives"
          value={s.pendingPrescriptions ?? 0}
          color="bg-amber-500/10 text-amber-500"
          delay={0.2}
        />
        <StatCard
          icon={<Activity className="h-5 w-5" />}
          label="Urgences actives"
          value={s.activeEmergencies ?? 0}
          color="bg-red-500/10 text-red-500"
          delay={0.3}
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Patients aujourd'hui</CardTitle>
          </CardHeader>
          <CardContent>
            <AnimatedCounter value={s.patientsToday ?? 0} className="text-3xl font-bold" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Patients cette semaine</CardTitle>
          </CardHeader>
          <CardContent>
            <AnimatedCounter value={s.patientsThisWeek ?? 0} className="text-3xl font-bold" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Revenus du mois</CardTitle>
          </CardHeader>
          <CardContent>
            <AnimatedCounter
              value={s.revenueThisMonth ?? 0}
              suffix=" FCFA"
              className="text-3xl font-bold text-emerald-500"
            />
          </CardContent>
        </Card>
      </div>

      {/* Infra info */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Abonnement
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Plan</span>
              <span className="font-semibold">{stats?.infra?.plan ?? "STARTER"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Statut</span>
              <span className={`font-semibold ${
                stats?.infra?.status === "ACTIVE" ? "text-emerald-500" :
                stats?.infra?.status === "SUSPENDED" ? "text-red-500" : "text-amber-500"
              }`}>
                {stats?.infra?.status ?? "TRIALING"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Utilisateurs</span>
              <span className="font-semibold">{s.totalUsers ?? 0} / {stats?.infra?.maxUsers ?? 5}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Patients</span>
              <span className="font-semibold">{s.totalPatients ?? 0} / {stats?.infra?.maxPatients ?? 500}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Alertes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {s.activeEmergencies > 0 && (
              <div className="flex items-center gap-3 rounded-lg bg-red-500/10 p-3">
                <Activity className="h-5 w-5 text-red-500" />
                <div>
                  <p className="font-medium text-red-500">{s.activeEmergencies} urgence(s) active(s)</p>
                  <p className="text-xs text-muted-foreground">Vérifiez la carte SOS</p>
                </div>
              </div>
            )}
            {s.pendingPrescriptions > 0 && (
              <div className="flex items-center gap-3 rounded-lg bg-amber-500/10 p-3">
                <FileText className="h-5 w-5 text-amber-500" />
                <div>
                  <p className="font-medium text-amber-500">{s.pendingPrescriptions} ordonnance(s) en attente</p>
                  <p className="text-xs text-muted-foreground">À valider ou dispenser</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3 rounded-lg bg-primary/10 p-3">
              <Clock className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium text-primary">{s.appointmentsToday ?? 0} rendez-vous aujourd'hui</p>
                <p className="text-xs text-muted-foreground">Prochain créneau disponible</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
  delay,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -4, boxShadow: "0 20px 40px rgba(14,165,233,0.1)" }}
    >
      <Card>
        <CardContent className="flex items-center gap-4 p-6">
          <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${color}`}>
            {icon}
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <AnimatedCounter value={value} className="text-2xl font-bold" />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
