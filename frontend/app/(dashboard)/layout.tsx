"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/lib/store";
import { CommandK } from "@/components/ui/command-k";
import { AiBubble } from "@/components/ui/ai-bubble";
import { PageTransition } from "@/components/ui/page-transition";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import {
  Home,
  Users,
  Calendar,
  FileText,
  Activity,
  Bell,
  Heart,
  User,
  Sun,
  Moon,
  LogOut,
} from "lucide-react";

const navByRole: Record<string, Array<{ href: string; label: string; icon: typeof Home }>> = {
  admin_infra: [
    { href: "/dashboard/admin_infra", label: "Tableau de bord", icon: Home },
    { href: "/dashboard/admin_infra/patients", label: "Patients", icon: Users },
    { href: "/dashboard/admin_infra/appointments", label: "Rendez-vous", icon: Calendar },
    { href: "/dashboard/admin_infra/prescriptions", label: "Ordonnances", icon: FileText },
    { href: "/dashboard/admin_infra/emergency", label: "Urgences", icon: Activity },
    { href: "/dashboard/admin_infra/notifications", label: "Notifications", icon: Bell },
  ],
  medecin: [
    { href: "/dashboard/medecin", label: "Tableau de bord", icon: Home },
    { href: "/dashboard/medecin/appointments", label: "Rendez-vous", icon: Calendar },
    { href: "/dashboard/medecin/patients", label: "Patients", icon: Users },
    { href: "/dashboard/medecin/prescriptions", label: "Ordonnances", icon: FileText },
  ],
  patient: [
    { href: "/dashboard/patient", label: "Mon dossier", icon: Home },
    { href: "/dashboard/patient/appointments", label: "Rendez-vous", icon: Calendar },
    { href: "/dashboard/patient/prescriptions", label: "Ordonnances", icon: FileText },
  ],
  pharmacien: [
    { href: "/dashboard/pharmacien", label: "Tableau de bord", icon: Home },
    { href: "/dashboard/pharmacien/scan", label: "Scanner QR", icon: FileText },
  ],
  laborantin: [
    { href: "/dashboard/laborantin", label: "Tableau de bord", icon: Home },
    { href: "/dashboard/laborantin/results", label: "Résultats", icon: FileText },
  ],
  assurance: [
    { href: "/dashboard/assurance", label: "Tableau de bord", icon: Home },
    { href: "/dashboard/assurance/policies", label: "Polices", icon: FileText },
  ],
  super_admin: [
    { href: "/dashboard/super_admin", label: "Tableau de bord", icon: Home },
    { href: "/dashboard/super_admin/billing", label: "Facturation", icon: FileText },
  ],
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    if (!user) {
      router.replace("/login");
      return;
    }
    if (!navByRole[user.role]) {
      router.replace("/login");
    }
  }, [user, router]);

  const handleLogout = () => {
    logout();
    toast.info("Déconnexion réussie");
    router.push("/login");
  };

  const role = user?.role ?? "";
  const nav = navByRole[role] ?? [];

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 z-40 flex h-full w-64 flex-col border-r border-border bg-background">
        <div className="flex h-16 items-center gap-2 border-b border-border px-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent">
            <Heart className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold">SamaDokita</span>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="border-t border-border p-4">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
              <User className="h-4 w-4" />
            </div>
            <div className="flex-1 truncate">
              <p className="truncate text-sm font-medium">{user?.firstName} {user?.lastName}</p>
              <p className="truncate text-xs text-muted-foreground">{user?.role}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="sm" className="flex-1" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Déconnexion
            </Button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="ml-64 flex-1">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/80 px-6 backdrop-blur-xl">
          <div className="text-sm text-muted-foreground">
            Connecté en tant que <span className="font-medium text-foreground">{user?.firstName} {user?.lastName}</span>
          </div>
          <CommandK />
        </header>
        <PageTransition>
          <motion.main
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="p-6"
          >
            {children}
          </motion.main>
        </PageTransition>
      </div>

      <AiBubble />
    </div>
  );
}
