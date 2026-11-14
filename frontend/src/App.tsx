import { useEffect, useState, FormEvent, ReactNode } from "react";
import { motion, useScroll, useSpring, AnimatePresence } from "framer-motion";
import { Github, Linkedin, Instagram, Facebook, Mail, Phone, MapPin, Sun, Moon, ArrowUp, ChevronDown, Download, Loader2, CheckCircle2, AlertCircle, Menu, X } from "lucide-react";
import { get, sendContact } from "./api";
const ICONS: Record<string, any> = { GitHub: Github, LinkedIn: Linkedin, Instagram, Facebook, Email: Mail };
const NAV = ["about", "education", "projects", "experience", "skills", "interests", "contact"];
const Reveal = ({ children, i = 0 }: { children: ReactNode; i?: number }) => (
  <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-60px" }} transition={{ duration: .5, delay: i * .08 }}>{children}</motion.div>);
const H = ({ n, t }: { n: string; t: string }) => (<Reveal><p className="font-mono text-xs uppercase tracking-[.25em] text-a2 mb-3 flex items-center gap-3">{n}<span className="h-px w-10 bg-a2/50" /></p><h2 className="font-display text-3xl md:text-4xl tracking-tight mb-8 md:mb-10">{t}</h2></Reveal>);
const Sec = ({ id, children }: { id: string; children: ReactNode }) => (<section id={id} className="max-w-6xl mx-auto px-5 md:px-8 py-14 md:py-20 scroll-mt-12">{children}</section>);
function Contact() {
  const [s, setS] = useState<"idle" | "loading" | "ok" | "warn" | "err">("idle"); const [msg, setMsg] = useState("");
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); if (s === "loading") return;
    const form = e.currentTarget; const f = Object.fromEntries(new FormData(form)); setS("loading");
    try { const r = await sendContact(f); setMsg(r.data.message); setS(r.data.email_sent ? "ok" : "warn"); form.reset(); }
    catch (x: any) { setS("err"); setMsg(x.message || "Network error. Please try again."); }
  }
  const inp = "w-full bg-transparent border border-[var(--line)] rounded-lg px-4 py-3 outline-none focus:border-a1 transition-colors";
  const col = { ok: "text-a2", warn: "text-amber-500", err: "text-red-500" } as Record<string, string>;
  return (<form onSubmit={submit} className="neu rounded-2xl p-5 sm:p-6 space-y-4">
    <input name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
    <div className="grid sm:grid-cols-2 gap-4"><input required minLength={2} name="name" placeholder="Name" aria-label="Name" className={inp} /><input required type="email" name="email" placeholder="Email" aria-label="Email address" className={inp} /></div>
    <input required minLength={3} name="subject" placeholder="Subject" aria-label="Subject" className={inp} />
    <textarea required minLength={10} name="message" rows={5} placeholder="Message" aria-label="Message" className={inp} />
    <motion.button whileTap={{ scale: .97 }} whileHover={{ y: -2 }} disabled={s === "loading"} className="bg-a1 text-[var(--on)] font-medium rounded-lg px-6 py-3 flex items-center gap-2 disabled:opacity-60">
      {s === "loading" && <Loader2 className="animate-spin" size={18} />}{s === "loading" ? "Sending…" : "Send message"}</motion.button>
    <AnimatePresence>{s !== "idle" && s !== "loading" && <motion.p role={s === "err" ? "alert" : "status"} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className={`flex items-start gap-2 text-sm ${col[s]}`}>
      {s === "ok" ? <CheckCircle2 size={18} className="shrink-0" /> : <AlertCircle size={18} className="shrink-0" />}<span>{msg}</span></motion.p>}</AnimatePresence></form>);
}
function Bg() {
  const N = [[80,120],[190,60],[300,150],[230,260],[110,300],[360,300],[420,90]], E = [[0,1],[1,2],[2,3],[3,4],[0,4],[2,6],[3,5],[1,6]];
  return (<div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"><div className="absolute inset-0 bg-dots" />
    <svg className="absolute -top-10 -right-24 w-[34rem] max-w-none opacity-[.22]" viewBox="0 0 480 360" fill="none">{E.map(([a, b], i) => <line key={i} x1={N[a][0]} y1={N[a][1]} x2={N[b][0]} y2={N[b][1]} stroke="var(--a1)" />)}
      {N.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={i % 3 ? 4 : 7} fill={i % 3 ? "var(--a1)" : "var(--a2)"} className={i % 3 ? "" : "pulse"} />)}</svg>
    <svg className="absolute bottom-10 -left-10 w-80 opacity-[.12]" viewBox="0 0 240 160" fill="none" stroke="var(--a2)">{[0, 1, 2].map(i => <rect key={i} x={10 + i * 12} y={10 + i * 36} width={200 - i * 24} height="28" rx="4" />)}<path d="M110 40v8M110 76v8" /></svg></div>);
}
export default function App() {
  const [d, setD] = useState<any>(null); const [err, setErr] = useState(false); const [open, setOpen] = useState<number | null>(null);
  const [dark, setDark] = useState(true); const [menu, setMenu] = useState(false); const [top, setTop] = useState(false);
  const { scrollYProgress } = useScroll(); const bar = useSpring(scrollYProgress, { stiffness: 120, damping: 30 });
  useEffect(() => { Promise.all(["profile", "projects", "education", "experience", "skills", "social-links"].map(k => get(k)))
    .then(([profile, projects, education, experience, skills, links]) => setD({ profile, projects, education, experience, skills, links })).catch(() => setErr(true)); }, []);
  useEffect(() => { document.documentElement.classList.toggle("dark", dark); }, [dark]);
  useEffect(() => { const f = () => setTop(scrollY > 600); addEventListener("scroll", f); return () => removeEventListener("scroll", f); }, []);
  const [cvOk, setCvOk] = useState(false);
  useEffect(() => { if (!d) return; fetch(d.profile.cv_url, { method: "HEAD" }).then(r => setCvOk(r.ok && (r.headers.get("content-type") || "").includes("pdf"))).catch(() => setCvOk(false)); }, [d]);
  if (err) return <p className="p-10">Couldn't reach the API. Is the backend running on port 8000?</p>;
  if (!d) return <div className="min-h-screen grid place-items-center"><Loader2 className="animate-spin text-a1" /></div>;
  const p = d.profile; const [ha, hb] = p.headline.split(" Through ");
  return (<>
    <Bg /><motion.div style={{ scaleX: bar }} className="fixed top-0 left-0 right-0 h-0.5 bg-a1 origin-left z-50" />
    <header className="glass fixed top-0 w-full z-40"><nav className="max-w-6xl mx-auto px-5 md:px-8 h-14 flex items-center justify-between" aria-label="Main">
      <a href="#top" className="font-display text-lg">SP</a>
      <ul className="hidden md:flex gap-7 text-sm text-mute">{NAV.map(n => <li key={n}><a href={`#${n}`} className="relative capitalize hover:text-tx transition-colors group">{n}<span className="absolute -bottom-1 left-0 h-px w-0 bg-a1 group-hover:w-full transition-all duration-300" /></a></li>)}</ul>
      <div className="flex gap-2"><button aria-label="Toggle theme" onClick={() => setDark(!dark)} className="neu rounded-full p-2">{dark ? <Sun size={16} /> : <Moon size={16} />}</button>
        <button aria-label="Menu" className="md:hidden neu rounded-full p-2" onClick={() => setMenu(!menu)}>{menu ? <X size={16} /> : <Menu size={16} />}</button></div></nav>
      <AnimatePresence>{menu && <motion.ul initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="md:hidden overflow-hidden px-5 pb-3 space-y-3">{NAV.map(n => <li key={n}><a onClick={() => setMenu(false)} href={`#${n}`} className="capitalize block py-1">{n}</a></li>)}</motion.ul>}</AnimatePresence></header>
    <main id="top">
      <section className="relative max-w-6xl mx-auto px-5 md:px-8 pt-28 md:pt-36 pb-12 grid lg:grid-cols-[1.35fr_1fr] gap-12 items-center">
        <div className="min-w-0"><p className="inline-flex items-center gap-2 chip glass mb-6"><span className="w-2 h-2 rounded-full bg-a2 animate-pulse" />{p.status}</p>
          <p className="font-mono text-[11px] sm:text-xs uppercase tracking-[.22em] text-mute mb-4">{p.name} / {p.institute}</p>
          <h1 className="font-display text-[2.3rem] sm:text-5xl lg:text-[3.7rem] leading-[1.05] tracking-tight mb-6">{ha}{hb && <><br /><span className="italic text-a1">Through {hb}</span></>}</h1>
          <p className="text-mute max-w-xl mb-8 leading-relaxed">{p.tagline}</p>
          <div className="flex flex-wrap gap-3 mb-8">{[["View Projects", "#projects"], ["Contact Me", "#contact"]].map(([t, h], i) => <motion.a key={t} whileHover={{ y: -2 }} whileTap={{ scale: .97 }} href={h} className={i ? "neu rounded-lg px-5 py-3 text-sm" : "bg-a1 text-[var(--on)] rounded-lg px-5 py-3 text-sm font-medium"}>{t}</motion.a>)}
            {cvOk ? <motion.a whileHover={{ y: -2 }} whileTap={{ scale: .97 }} href={p.cv_url} download className="neu rounded-lg px-5 py-3 text-sm flex items-center gap-2"><Download size={16} />Download CV</motion.a>
              : <span role="note" title="Add your resume at frontend/public/Sandeepan_Podder_CV.pdf" className="neu rounded-lg px-5 py-3 text-sm flex items-center gap-2 opacity-60 cursor-not-allowed"><Download size={16} />CV coming soon</span>}</div>
          <div className="flex gap-3">{d.links.map((l: any) => { const I = ICONS[l.name] || Mail; return <motion.a key={l.name} whileHover={{ y: -3 }} href={l.url} aria-label={l.name} {...(l.url.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})} className="neu rounded-full p-3 hover:text-a1 transition-colors"><I size={18} /></motion.a>; })}</div></div>
        <motion.div initial={{ opacity: 0, scale: .96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: .7 }} className="relative p-4 max-w-[17rem] sm:max-w-xs lg:max-w-sm w-full mx-auto">
          {["top-0 left-0 border-t-2 border-l-2", "top-0 right-0 border-t-2 border-r-2", "bottom-0 left-0 border-b-2 border-l-2", "bottom-0 right-0 border-b-2 border-r-2"].map(c => <span key={c} className={`absolute w-7 h-7 border-a2 ${c}`} />)}
          <div className="relative overflow-hidden rounded-xl neu"><img src={p.image} alt="Placeholder portrait (replace with your photo)" className="w-full aspect-[5/6] object-cover" />
            <p className="absolute bottom-0 inset-x-0 px-3 py-2 font-mono text-[10px] text-white/80 bg-gradient-to-t from-black/70">placeholder · replace with your photo</p></div>
          {[[p.interests[0], "-left-3 sm:-left-8 top-14"], [p.interests[3], "-right-3 sm:-right-8 bottom-20"]].map(([t, c], i) => <motion.span key={t} animate={{ y: [0, -7, 0] }} transition={{ repeat: Infinity, duration: 5 + i, ease: "easeInOut" }} className={`absolute glass chip text-tx ${c}`}>{t}</motion.span>)}</motion.div></section>
      <Sec id="about"><H n="01" t="About" /><div className="grid md:grid-cols-[1fr_2fr] gap-8"><p className="font-display text-2xl text-a1">Research, engineering and experimentation.</p><div className="space-y-4 text-mute">{p.about.map((t: string, i: number) => <Reveal key={i} i={i}><p>{t}</p></Reveal>)}</div></div></Sec>
      <Sec id="education"><H n="02" t="Education" /><ol className="border-l border-[var(--line)] ml-2 space-y-8">{d.education.map((e: any, i: number) => <Reveal key={i} i={i}><li className="pl-6 relative"><span className="absolute -left-[5px] top-2 w-2.5 h-2.5 rounded-full bg-a2" /><p className="text-sm text-a2">{e.period}</p><h3 className="font-medium text-lg">{e.degree}</h3><p className="text-mute">{e.school} · {e.score}</p></li></Reveal>)}</ol></Sec>
      <Sec id="projects"><H n="03" t="Projects" /><div className="grid md:grid-cols-2 gap-6">{d.projects.map((x: any, i: number) => <Reveal key={i} i={i % 2}><article className="neu rounded-2xl overflow-hidden h-full group hover:-translate-y-1 transition-transform"><div className="aspect-video overflow-hidden border-b border-[var(--line)] bg-[#0F172A]"><img src={x.image} alt={`${x.title} thumbnail`} loading="lazy" onError={e => (e.currentTarget.style.visibility = "hidden")} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" /></div><div className="p-5 sm:p-6">
        <p className="text-sm text-a2 mb-1">{x.period}</p><h3 className="font-display text-xl mb-3">{x.title}</h3><div className="flex flex-wrap gap-2 mb-4">{x.tech.map((t: string) => <span key={t} className="chip">{t}</span>)}</div>
        <button aria-expanded={open === i} onClick={() => setOpen(open === i ? null : i)} className="flex items-center gap-1 text-sm text-a1">{open === i ? "Hide details" : "View details"}<ChevronDown size={16} className={`transition-transform ${open === i ? "rotate-180" : ""}`} /></button>
        <AnimatePresence>{open === i && <motion.ul initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden text-mute text-sm list-disc pl-5 mt-3 space-y-1">{x.points.map((t: string) => <li key={t}>{t}</li>)}</motion.ul>}</AnimatePresence>
        {(x.github || x.demo) && <div className="flex gap-3 mt-4 text-sm">{x.github && <a className="neu rounded-lg px-4 py-2 hover:text-a1 transition-colors" href={x.github} target="_blank" rel="noopener noreferrer">GitHub</a>}{x.demo && <a className="neu rounded-lg px-4 py-2 hover:text-a1 transition-colors" href={x.demo} target="_blank" rel="noopener noreferrer">Live demo</a>}</div>}</div></article></Reveal>)}</div></Sec>
      <Sec id="experience"><H n="04" t="Experience" /><div className="space-y-6">{d.experience.map((e: any, i: number) => <Reveal key={i}><div className="neu rounded-2xl p-5 sm:p-6 border-l-2 border-l-[var(--a2)]"><p className="text-sm text-a2">{e.period}</p><h3 className="font-medium text-lg">{e.role} — {e.org}</h3><ul className="list-disc pl-5 mt-3 text-mute space-y-1">{e.points.map((t: string) => <li key={t}>{t}</li>)}</ul></div></Reveal>)}</div></Sec>
      <Sec id="skills"><H n="05" t="Technical Skills" /><div className="grid sm:grid-cols-2 gap-6">{Object.entries(d.skills).map(([k, v]: any, i) => <Reveal key={k} i={i}><div className="neu rounded-2xl p-6"><h3 className="text-sm text-a2 mb-3">{k}</h3><div className="flex flex-wrap gap-2">{v.map((s: string) => <motion.span whileHover={{ y: -2 }} key={s} className="chip hover:text-tx hover:border-a1 transition-colors">{s}</motion.span>)}</div></div></Reveal>)}</div>
        <h3 className="font-display text-2xl mt-14 mb-4">Certifications</h3><ul className="space-y-2 text-mute">{p.certifications.map((c: any) => <li key={c.title}><b className="text-tx">{c.title}</b> — {c.issuer}{c.detail && `, ${c.detail}`}</li>)}</ul></Sec>
      <Sec id="interests"><H n="06" t="Research Interests" /><ul className="grid sm:grid-cols-2 gap-x-10">{p.interests.map((t: string, i: number) => <Reveal key={t} i={i}><li className="font-display text-2xl py-4 border-b border-[var(--line)] hover:text-a1 hover:pl-2 transition-all">{t}</li></Reveal>)}</ul></Sec>
      <Sec id="contact"><H n="07" t="Get in touch" /><div className="grid md:grid-cols-[1fr_1.3fr] gap-10"><ul className="space-y-4 text-mute">
        <li className="flex gap-3"><Mail size={18} /><a className="hover:text-a1" href={`mailto:${p.email}`}>{p.email}</a></li>{p.phone && <li className="flex gap-3"><Phone size={18} /><a className="hover:text-a1" href={`tel:+91${p.phone}`}>{p.phone}</a></li>}<li className="flex gap-3"><MapPin size={18} />{p.location}</li></ul><Contact /></div></Sec></main>
    <footer className="text-center text-sm text-mute py-10">© {new Date().getFullYear()} {p.name}</footer>
    <AnimatePresence>{top && <motion.button initial={{ opacity: 0, scale: .8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} aria-label="Back to top" onClick={() => scrollTo({ top: 0 })} className="fixed bottom-6 right-6 neu rounded-full p-3"><ArrowUp size={18} /></motion.button>}</AnimatePresence></>);
}
