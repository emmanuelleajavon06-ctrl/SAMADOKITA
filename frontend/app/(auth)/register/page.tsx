"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Heart, Loader2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageTransition } from "@/components/ui/page-transition";
import { useAuthStore } from "@/lib/store";
import api from "@/lib/api";

const registerSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(8, "8 caractères minimum"),
  confirmPassword: z.string(),
  firstName: z.string().min(2, "Prénom requis"),
  lastName: z.string().min(2, "Nom requis"),
  phone: z.string().optional(),
  infraName: z.string().min(3, "Nom de l'établissement requis"),
  address: z.string().optional(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const { setTokens, setUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterForm) => {
    setLoading(true);
    try {
      const { data: res } = await api.post("/auth/register", {
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        infraName: data.infraName,
        address: data.address,
      });
      setTokens(res.accessToken, res.refreshToken);
      const { data: me } = await api.get("/auth/me");
      setUser(me);
      toast.success("Compte créé ! Essai gratuit de 30 jours activé.");
      router.push(`/dashboard/${me.role.toLowerCase()}`);
    } catch (error: unknown) {
      const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Erreur lors de l'inscription";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTransition>
      <main className="flex min-h-screen items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-lg"
        >
          <Link href="/" className="mb-8 flex items-center justify-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent">
              <Heart className="h-5 w-5 text-white" />
            </div>
            <span className="text-2xl font-bold">SamaDokita</span>
          </Link>

          <div className="rounded-2xl border border-border bg-background p-8 shadow-xl">
            <h1 className="mb-2 text-2xl font-bold">Créer votre compte</h1>
            <p className="mb-6 text-sm text-muted-foreground">
              30 jours d'essai gratuit — Sans carte bancaire
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Input {...register("firstName")} placeholder="Prénom" label="Prénom" />
                  {errors.firstName && <p className="mt-1 text-xs text-red-500">{errors.firstName.message}</p>}
                </div>
                <div>
                  <Input {...register("lastName")} placeholder="Nom" label="Nom" />
                  {errors.lastName && <p className="mt-1 text-xs text-red-500">{errors.lastName.message}</p>}
                </div>
              </div>

              <div>
                <Input {...register("email")} type="email" placeholder="votre@email.com" label="Email" />
                {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
              </div>

              <div>
                <div className="relative">
                  <Input
                    {...register("password")}
                    type={showPassword ? "text" : "password"}
                    placeholder="8 caractères minimum"
                    label="Mot de passe"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-9 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
              </div>

              <div>
                <Input
                  {...register("confirmPassword")}
                  type="password"
                  placeholder="Confirmez le mot de passe"
                  label="Confirmation"
                />
                {errors.confirmPassword && <p className="mt-1 text-xs text-red-500">{errors.confirmPassword.message}</p>}
              </div>

              <div>
                <Input {...register("phone")} placeholder="+221 7X XXX XX XX" label="Téléphone (optionnel)" />
              </div>

              <div className="rounded-xl border border-border bg-muted/50 p-4">
                <p className="mb-3 text-sm font-semibold">Votre établissement</p>
                <div className="space-y-3">
                  <div>
                    <Input {...register("infraName")} placeholder="Nom de l'école / clinique" label="Établissement" />
                    {errors.infraName && <p className="mt-1 text-xs text-red-500">{errors.infraName.message}</p>}
                  </div>
                  <Input {...register("address")} placeholder="Adresse" label="Adresse (optionnel)" />
                </div>
              </div>

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Créer mon compte"}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              Déjà un compte ?{" "}
              <Link href="/login" className="text-primary hover:underline">
                Se connecter
              </Link>
            </p>
          </div>
        </motion.div>
      </main>
    </PageTransition>
  );
}
