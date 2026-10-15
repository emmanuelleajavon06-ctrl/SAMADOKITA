import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { LenisProvider, ReactQueryProvider } from "@/providers";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { MotionConfigProvider } from "@/components/ui/motion-config";
import { RegisterServiceWorker } from "./sw-register";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SamaDokita — Votre santé, partout avec vous",
  description: "Dossier Médical National du Sénégal — Plateforme Santé Numérique Souveraine",
  manifest: "/manifest.json",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light">
          <MotionConfigProvider>
            <ReactQueryProvider>
              <LenisProvider>
                {children}
                <Toaster />
                <RegisterServiceWorker />
              </LenisProvider>
            </ReactQueryProvider>
          </MotionConfigProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
