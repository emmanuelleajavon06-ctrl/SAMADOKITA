"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Heart, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageTransition } from "@/components/ui/page-transition";
import { useAuthStore } from "@/lib/store";
import api from "@/lib/api";

const loginSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(8, "8 caractères minimum"),
  totpCode: z.string().optional(),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { setTokens, setUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [requires2FA, setRequires2FA] = useState(false);
  const [tempToken, setTempToken] = useState("");

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", totpCode: "" },
  });

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    try {
      const { data: res } = await api.post("/auth/login", {
        email: data.email,
        password: data.password,
        totpCode: data.totpCode,
      });

      if (res.requires2FA) {
        setRequires2FA(true);
        setTempToken(res.tempToken);
        setLoading(false);
        return;
      }

      setTokens(res.accessToken, res.refreshToken);
      const { data: me } = await api.get("/auth/me");
      setUser(me);
      toast.success(`Bienvenue, ${me.firstName} !`);
      router.push(`/dashboard/${me.role.toLowerCase()}`);
    } catch (error: unknown) {
      const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Erreur de connexion";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const submit2FA = async (data: LoginForm) => {
    setLoading(true);
    try {
      const { data: res } = await api.post("/auth/verify-2fa", {
        code: data.totpCode,
        tempToken,
      });
      setTokens(res.accessToken, res.refreshToken);
      const { data: me } = await api.get("/auth/me");
      setUser(me);
      toast.success(`Bienvenue, ${me.firstName} !`);
      router.push(`/dashboard/${me.role.toLowerCase()}`);
    } catch (error: unknown) {
      const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Erreur";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTransition>
      <main className="flex min-h-screen">
        {/* Left: form */}
        <div className="flex w-full flex-col justify-center px-6 md:w-1/2 lg:px-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mx-auto w-full max-w-md"
          >
            <Link href="/" className="mb-8 flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent">
                <Heart className="h-5 w-5 text-white" />
              </div>
              <span className="text-2xl font-bold">SamaDokita</span>
            </Link>

            <h1 className="mb-2 text-3xl font-bold">
              {requires2FA ? "Vérification 2FA" : "Bon retour"}
            </h1>
            <p className="mb-8 text-muted-foreground">
              {requires2FA
                ? "Entrez le code de votre application d'authentification"
                : "Connectez-vous pour accéder à votre tableau de bord"}
            </p>

            <form onSubmit={handleSubmit(requires2FA ? submit2FA : onSubmit)} className="space-y-4">
              {!requires2FA && (
                <>
                  <div>
                    <Input
                      {...register("email")}
                      type="email"
                      placeholder="votre@email.com"
                      label="Email"
                    />
                    {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>}
                  </div>
                  <div>
                    <Input
                      {...register("password")}
                      type="password"
                      placeholder="Votre mot de passe"
                      label="Mot de passe"
                    />
                    {errors.password && <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>}
                  </div>
                </>
              )}

              {requires2FA && (
                <div>
                  <Input
                    {...register("totpCode")}
                    placeholder="123456"
                    label="Code 2FA"
                  />
                  {errors.totpCode && <p className="mt-1 text-sm text-red-500">{errors.totpCode.message}</p>}
                </div>
              )}

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : requires2FA ? "Vérifier" : "Se connecter"}
              </Button>
            </form>

            {!requires2FA && (
              <p className="mt-6 text-center text-sm text-muted-foreground">
                Pas encore de compte ?{" "}
                <Link href="/register" className="text-primary hover:underline">
                  Créer un compte
                </Link>
              </p>
            )}
          </motion.div>
        </div>

        {/* Right: visual */}
        <div className="relative hidden w-1/2 overflow-hidden bg-gradient-to-br from-primary to-accent md:flex items-center justify-center">
          <div className="relative z-10 max-w-md text-center text-white">
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="mb-8"
            >
              <Heart className="mx-auto h-24 w-24 opacity-80" />
            </motion.div>
            <h2 className="mb-4 text-4xl font-bold">Votre santé, partout avec vous</h2>
            <p className="text-lg opacity-90">
              La plateforme qui connecte tout l'écosystème santé du Sénégal.
            </p>
          </div>
          <div className="pointer-events-none absolute inset-0">
            <div className="animate-blob absolute -left-20 -top-20 h-72 w-72 bg-white/10 blur-3xl" />
            <div className="animate-blob absolute -bottom-20 -right-20 h-72 w-72 bg-white/10 blur-3xl" style={{ animationDelay: "-4s" }} />
          </div>
        </div>
      </main>
    </PageTransition>
  );
}
