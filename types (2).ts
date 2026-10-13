export type Role = "SUPER_ADMIN" | "ADMIN_INFRA" | "MEDECIN" | "PHARMACIEN" | "LABORANTIN" | "ASSURANCE" | "PATIENT";
export interface User { id: string; email: string; role: Role; firstName: string; lastName: string }
export interface SiteData {
  partners: Array<{ id: string; name: string; logoUrl: string | null; websiteUrl: string | null }>;
  faqs: Array<{ id: string; question: string; answer: string }>;
  socials: Array<{ id: string; platform: string; url: string }>;
  pages: Array<{ slug: string; title: string }>;
  media: Array<{ id: string; url: string; kind: string; alt: string | null }>;
}
export const EMPTY_SITE: SiteData = { partners: [], faqs: [], socials: [], pages: [], media: [] };
export const ROLE_LABEL: Record<Role, string> = {
  SUPER_ADMIN: "Administrateur de la plateforme", ADMIN_INFRA: "Administrateur de structure", MEDECIN: "Médecin",
  PHARMACIEN: "Pharmacien", LABORANTIN: "Laborantin", ASSURANCE: "Assurance santé", PATIENT: "Patient",
};
