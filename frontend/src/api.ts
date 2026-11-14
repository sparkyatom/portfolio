const BASE = import.meta.env.VITE_API_URL ?? "";
export async function get<T = any>(p: string): Promise<T> { const r = await fetch(`${BASE}/api/${p}`); if (!r.ok) throw new Error(p); return (await r.json()).data; }
export async function sendContact(body: object) {
  const r = await fetch(`${BASE}/api/contact`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.success) throw new Error(j.error || "Could not send your message. Please try again or email me directly.");
  return j;
}
