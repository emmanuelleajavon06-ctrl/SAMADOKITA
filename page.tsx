import Landing from "@/components/Landing";
import { apiBase } from "@/lib/server";
import { EMPTY_SITE, type SiteData } from "@/lib/types";

export const dynamic = "force-dynamic";

async function load(): Promise<SiteData> {
  try {
    const r = await fetch(`${apiBase()}/public/site`, { cache: "no-store" });
    return r.ok ? ((await r.json()) as SiteData) : EMPTY_SITE;
  } catch {
    return EMPTY_SITE; // l'accueil reste affiché même si l'API est indisponible
  }
}

export default async function Page() {
  return <Landing data={await load()} />;
}
