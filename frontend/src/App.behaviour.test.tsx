import { describe, it, expect, beforeEach } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { seed, mockApi, ready } from "./test-utils";
const SECTIONS = ["about", "education", "projects", "experience", "skills", "interests", "contact"];
const posts = (f: ReturnType<typeof mockApi>) => f.mock.calls.filter(([, i]) => (i as RequestInit | undefined)?.method === "POST");
beforeEach(() => { document.documentElement.className = "dark"; });
describe("navigation", () => {
  it("links every section and every target exists", async () => {
    mockApi(); await ready(); const nav = within(screen.getByRole("navigation", { name: "Main" }));
    for (const id of SECTIONS) { expect(nav.getByRole("link", { name: new RegExp(`^${id}$`, "i") })).toHaveAttribute("href", `#${id}`); expect(document.getElementById(id)).not.toBeNull(); }
  });
  it("mobile menu opens and closes after choosing a link", async () => {
    mockApi(); await ready(); const u = userEvent.setup(); const count = () => screen.getAllByRole("link", { name: /^projects$/i }).length; const n = count();
    await u.click(screen.getByLabelText("Menu")); expect(count()).toBe(n + 1);
    await u.click(screen.getAllByRole("link", { name: /^projects$/i }).slice(-1)[0]); await waitFor(() => expect(count()).toBe(n));
  });
});
describe("theme", () => {
  it("toggles dark and light and back", async () => {
    mockApi(); await ready(); const u = userEvent.setup(); const b = screen.getByLabelText("Toggle theme");
    await u.click(b); expect(document.documentElement).not.toHaveClass("dark"); await u.click(b); expect(document.documentElement).toHaveClass("dark");
  });
});
describe("projects", () => {
  it("renders every project's title, period and technology tags from the API", async () => {
    mockApi(); await ready();
    for (const p of seed.projects) { expect(screen.getByRole("heading", { name: p.title })).toBeInTheDocument(); for (const t of p.tech) expect(screen.getAllByText(t).length).toBeGreaterThan(0); }
    expect(screen.getAllByRole("img", { name: /thumbnail/i })).toHaveLength(seed.projects.length);
  });
  it("shows GitHub/demo buttons only when configured", async () => {
    mockApi({ data: { projects: [{ ...seed.projects[0], github: "https://github.com/example/repo", demo: null }, seed.projects[1]] } }); await ready();
    expect(screen.getAllByRole("link", { name: "GitHub" }).some(a => a.getAttribute("href") === "https://github.com/example/repo")).toBe(true);
    expect(screen.queryByRole("link", { name: "Live demo" })).toBeNull();
  });
});
describe("contact form validation", () => {
  async function submit(values: Record<string, string>) {
    const f = mockApi(); await ready(); const u = userEvent.setup();
    for (const [ph, v] of Object.entries(values)) if (v) await u.type(screen.getByPlaceholderText(ph), v);
    await u.click(screen.getByRole("button", { name: /send message/i })); return f;
  }
  const ok = { Name: "Test User", Email: "a@b.com", Subject: "Hello there", Message: "A long enough message." };
  it("does not submit an empty form", async () => { expect(posts(await submit({}))).toHaveLength(0); });
  it("rejects an invalid email", async () => { expect(posts(await submit({ ...ok, Email: "not-an-email" }))).toHaveLength(0); });
  it("declares required fields and minimum lengths (browsers enforce these; jsdom does not for typed text)", async () => {
    mockApi(); await ready();
    for (const [ph, min] of [["Name", "2"], ["Subject", "3"], ["Message", "10"]] as const) { const el = screen.getByPlaceholderText(ph); expect(el).toBeRequired(); expect(el).toHaveAttribute("minlength", min); }
    expect(screen.getByPlaceholderText("Email")).toHaveAttribute("type", "email");
  });
  it("submits a valid form once, including the hidden honeypot field", async () => {
    const f = await submit(ok); await waitFor(() => expect(posts(f)).toHaveLength(1));
    expect(JSON.parse((posts(f)[0][1] as RequestInit).body as string)).toMatchObject({ name: "Test User", email: "a@b.com", website: "" });
  });
});
