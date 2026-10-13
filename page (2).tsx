import Link from "next/link";
import { notFound } from "next/navigation";
import { apiBase } from "@/lib/server";

export const dynamic = "force-dynamic";

export default async function ContentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const r = await fetch(`${apiBase()}/public/pages/${encodeURIComponent(slug)}`, { cache: "no-store" }).catch(() => null);
  if (!r || !r.ok) notFound();
  const page = (await r.json()) as { title: string; content: string };
  return (
    <main className="doc">
      <Link href="/" className="muted">← Accueil</Link>
      <h1>{page.title}</h1>
      <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.7 }}>{page.content}</div>
    </main>
  );
}
