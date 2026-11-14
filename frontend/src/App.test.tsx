import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { seed, json, mockApi, ready } from "./test-utils";
async function send(msg: Response) {
  mockApi({ contact: () => msg }); await ready(); const u = userEvent.setup();
  await u.type(screen.getByPlaceholderText("Name"), "Test User"); await u.type(screen.getByPlaceholderText("Email"), "a@b.com");
  await u.type(screen.getByPlaceholderText("Subject"), "Hello there"); await u.type(screen.getByPlaceholderText("Message"), "A long enough message.");
  await u.click(screen.getByRole("button", { name: /send message/i }));
}
beforeEach(() => { document.documentElement.className = "dark"; });
describe("portfolio", () => {
  it("renders profile, city-only location and all projects", async () => {
    mockApi(); await ready(); expect(screen.getByText("Habra, West Bengal, India")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /view details/i })).toHaveLength(6); expect(screen.getAllByRole("img", { name: /thumbnail/i })).toHaveLength(6);
  });
  it("toggles theme", async () => { mockApi(); await ready(); await userEvent.click(screen.getByLabelText("Toggle theme")); expect(document.documentElement).not.toHaveClass("dark"); });
  it("opens the mobile menu", async () => {
    mockApi(); await ready(); const n = screen.getAllByRole("link", { name: /projects/i }).length;
    await userEvent.click(screen.getByLabelText("Menu")); expect(screen.getAllByRole("link", { name: /projects/i }).length).toBe(n + 1);
  });
  it("expands a project", async () => {
    mockApi(); await ready(); const b = screen.getAllByRole("button", { name: /view details/i })[0]; await userEvent.click(b);
    expect(b).toHaveAttribute("aria-expanded", "true"); expect(await screen.findByText(/Temporal Convolutional Graph Network/)).toBeInTheDocument();
  });
  it("handles a missing CV gracefully", async () => { mockApi({ cv: false }); await ready(); expect(await screen.findByText("CV coming soon")).toBeInTheDocument(); expect(screen.queryByText("Download CV")).toBeNull(); });
  it("shows a working CV link when the PDF exists", async () => { mockApi({ cv: true }); await ready(); expect(await screen.findByRole("link", { name: /download cv/i })).toHaveAttribute("href", "/Sandeepan_Podder_CV.pdf"); });
  it("social links match config and open safely", async () => {
    mockApi(); await ready();
    for (const l of seed.social_links) { const a = screen.getAllByRole("link", { name: l.name })[0]; expect(a).toHaveAttribute("href", l.url); if (l.url.startsWith("http")) expect(a).toHaveAttribute("rel", "noopener noreferrer"); }
  });
  it("contact: email delivered", async () => { await send(json({ success: true, data: { stored: true, email_sent: true, message: "Message sent — I'll reply by email." } })); expect(await screen.findByText(/Message sent/)).toBeInTheDocument(); });
  it("contact: stored but email failed is not reported as sent", async () => { await send(json({ success: true, data: { stored: true, email_sent: false, message: "Your message was saved, but the email notification could not be delivered." } })); expect(await screen.findByText(/could not be delivered/)).toBeInTheDocument(); expect(screen.queryByText(/Message sent/)).toBeNull(); });
  it("contact: server error", async () => { await send(json({ success: false, error: "Too many messages. Try again later." }, 429)); expect(await screen.findByRole("alert")).toHaveTextContent("Too many messages"); });
});
