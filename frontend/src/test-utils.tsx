import { vi } from "vitest";
import { render, screen } from "@testing-library/react";
import App from "./App";
import seed from "../../backend/app/seed.json";
export { seed };
const MAP: Record<string, string> = { profile: "profile", projects: "projects", education: "education", experience: "experience", skills: "skills", "social-links": "social_links" };
export const json = (b: object, status = 200) => new Response(JSON.stringify(b), { status });
export function mockApi(o: { cv?: boolean; contact?: () => Response; data?: Record<string, unknown> } = {}) {
  const f = vi.fn(async (url: string, init?: RequestInit) => {
    if (init?.method === "HEAD") return new Response(null, { headers: { "content-type": o.cv ? "application/pdf" : "text/html" } });
    if (init?.method === "POST") return o.contact ? o.contact() : json({ success: true, data: { stored: true, email_sent: true, message: "ok" } });
    const key = MAP[url.replace(/^.*\/api\//, "")];
    return json({ success: true, data: o.data && key in o.data ? o.data[key] : (seed as any)[key] });
  });
  vi.stubGlobal("fetch", f); return f;
}
export async function ready() { render(<App />); await screen.findByRole("heading", { level: 1 }); }
