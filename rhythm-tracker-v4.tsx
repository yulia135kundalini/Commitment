import React, { useState, useEffect, useMemo, useRef } from "react";

/* ─────────────────────────────────────────────────────────
   RHYTHM v3 — body · mind · soul
   Fulfilling your highest potential given by God.
   New: reminders, daily quotes, gratitude closure, vision-
   step field, weekly/monthly 3·3·3+debt priorities, rewards,
   12-goal monthly tracker with dashboard, Year Goals page,
   Life Vision page, export to document.
   ───────────────────────────────────────────────────────── */

const C = {
  night: "#1C1B2E", ivory: "#F7F3EA", paper: "#FFFDF7",
  brass: "#B98F4E", brassSoft: "#D9C29A",
  sage: "#7D8C7C", sageSoft: "#E4E9E2",
  rose: "#A8626A", roseSoft: "#F0E2E3",
  ink: "#2E2C3A", inkSoft: "#6E6B7E", line: "#E6DFD0",
};

const QUOTES = [
  ["The soul becomes dyed with the colour of its thoughts.", "Marcus Aurelius"],
  ["It is not that we have a short time to live, but that we waste much of it.", "Seneca"],
  ["Everyone thinks of changing the world, but no one thinks of changing himself.", "Leo Tolstoy"],
  ["Beauty will save the world.", "Fyodor Dostoevsky"],
  ["Whatever you can do, or dream you can, begin it. Boldness has genius, power and magic in it.", "Goethe"],
  ["Strive not to be a success, but rather to be of value.", "Albert Einstein"],
  ["The heart has its reasons which reason knows nothing of.", "Blaise Pascal"],
  ["Life can only be understood backwards; but it must be lived forwards.", "Søren Kierkegaard"],
  ["The only journey is the one within.", "Rainer Maria Rilke"],
  ["Nothing in life is to be feared, it is only to be understood.", "Marie Curie"],
  ["Time stays long enough for anyone who will use it.", "Leonardo da Vinci"],
  ["Our hearts are restless until they rest in Thee.", "St. Augustine"],
  ["What lies behind us and what lies before us are tiny matters compared to what lies within us.", "Ralph Waldo Emerson"],
  ["We are what we repeatedly do. Excellence, then, is not an act, but a habit.", "Aristotle (after Will Durant)"],
  ["He who has a why to live can bear almost any how.", "Friedrich Nietzsche"],
  ["Gratitude is not only the greatest of virtues, but the parent of all the others.", "Cicero"],
  ["The two most important days in your life are the day you are born and the day you find out why.", "attributed to Mark Twain"],
  ["Act as if what you do makes a difference. It does.", "William James"],
];

const NUTRITION = ["Vitamins", "No sugar", "No dairy", "No alcohol", "2L+ water", "No fast food", "No gluten", "Veg & fruit", "Protein"];
const SOUL = [
  { id: "meditation", label: "Meditation / yoga" },
  { id: "prayer", label: "Prayer / energy practice" },
  { id: "movement", label: "Movement / sport" },
  { id: "phonefree", label: "Phone-free first 20 min" },
  { id: "phonefree_eve", label: "Phone-free last 20 min" },
  { id: "reading", label: "Reading 20 min" },
];
const DOMAINS = [
  "Professional mastery", "Mind & learning", "Body", "Soul", "Relationships", "Joy & beauty", "Direction",
  "Culture", "Hobbies", "Manifestation (проявленность)", "Resourcefulness", "Serving my blooming",
  "Confidence & self-worth", "Transformation",
];
const WEIGHTS = { focus: 0.35, clarity: 0.25, energy: 0.25 };

/* ── dates ── */
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const todayKey = () => iso(new Date());
const weekKey = (d = new Date()) => {
  const t = new Date(d); t.setHours(0, 0, 0, 0);
  t.setDate(t.getDate() + 3 - ((t.getDay() + 6) % 7));
  const w1 = new Date(t.getFullYear(), 0, 4);
  const wk = 1 + Math.round(((t - w1) / 864e5 - 3 + ((w1.getDay() + 6) % 7)) / 7);
  return `${t.getFullYear()}-W${String(wk).padStart(2, "0")}`;
};
const monthKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
const lastNDays = (n) => { const o = []; for (let i = n - 1; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); o.push(iso(d)); } return o; };
const monthDayKeys = () => {
  const d = new Date(); const y = d.getFullYear(), m = d.getMonth();
  const days = new Date(y, m + 1, 0).getDate();
  return Array.from({ length: days }, (_, i) => iso(new Date(y, m, i + 1)));
};
const dayName = (k) => new Date(k + "T12:00:00").toLocaleDateString("en-US", { weekday: "short" });
const niceDate = (k) => new Date(k + "T12:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric" });

/* ── model ── */
const trip = () => [ptx(), ptx(), ptx()];
function ptx() { return { text: "", done: false }; }
const emptyDay = () => ({
  intention: "", compliment: "",
  priorities: { big: trip(), medium: trip(), quick: trip() },
  pulses: [], nutrition: {}, soul: {},
  sleepHours: 7, sleepQuality: 3, screenTime: "",
  joy: "", inspired: "", win: "", lesson: "", kindness: "",
  visionStep: "", tomorrow: "",
  thanksSelf: ["", "", ""], thanksOthers: ["", "", ""], proud: ["", "", ""],
});
const emptyPeriod = () => ({
  intention: "", experiment: "", differently: "", contemplations: "",
  priorities: { big: trip(), medium: trip(), quick: trip(), debt: trip() },
  reward: "", rewardThreshold: 70,
});

/* ── storage ── */
const mem = {};
async function sGet(k) { try { const r = await window.storage.get(k); return r ? JSON.parse(r.value) : mem[k] ?? null; } catch { return mem[k] ?? null; } }
async function sSet(k, v) { mem[k] = v; try { await window.storage.set(k, JSON.stringify(v)); } catch {} }

/* ── scoring ── */
const avg = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : null);
function dayScore(day) {
  const p = day?.pulses || [];
  if (!p.length) return null;
  const f = avg(p.map((x) => x.focus)), c = avg(p.map((x) => x.clarity)), e = avg(p.map((x) => x.energy));
  const ticks = p.reduce((s, x) => s + (x.ticks || 0), 0);
  const base = ((f * WEIGHTS.focus + c * WEIGHTS.clarity + e * WEIGHTS.energy) / 5) * 100;
  const penalty = Math.min(15, ticks * 1.5);
  return { score: Math.max(0, Math.round(base - penalty)), focus: f, clarity: c, energy: e, ticks, penalty: Math.round(penalty) };
}
function prioPct(pr) {
  const all = Object.values(pr || {}).flat().filter((t) => t.text.trim());
  if (!all.length) return null;
  return Math.round((all.filter((t) => t.done).length / all.length) * 100);
}
function dayPrioCounts(day) {
  const c = (a) => a.filter((t) => t.done && t.text.trim()).length;
  return { big: c(day.priorities.big), medium: c(day.priorities.medium), quick: c(day.priorities.quick) };
}

/* ── atoms ── */
function Label({ children, right }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline",
      fontFamily: "'Karla',sans-serif", fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase",
      color: C.inkSoft, marginBottom: 8 }}>
      <span>{children}</span>
      {right != null && <span style={{ color: C.brass, fontWeight: 700, fontSize: 13, textTransform: "none" }}>{right}</span>}
    </div>
  );
}
function Card({ children, style }) {
  return <div style={{ background: C.paper, border: `1px solid ${C.line}`, borderRadius: 14, padding: "20px 22px", ...style }}>{children}</div>;
}
function Dots({ value, onChange, color = C.brass, size = 18 }) {
  return (
    <div style={{ display: "flex", gap: 6 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} onClick={() => onChange(n)} aria-label={`level ${n}`}
          style={{ width: size, height: size, borderRadius: "50%", padding: 0, cursor: "pointer",
            border: `1.5px solid ${n <= value ? color : C.line}`, background: n <= value ? color : "transparent", transition: "all .12s" }} />
      ))}
    </div>
  );
}
function TickBtn({ on, label, onClick, onColor = C.sage, onBg = C.sageSoft }) {
  return (
    <button onClick={onClick} style={{ fontFamily: "'Karla',sans-serif", fontSize: 13, padding: "8px 14px", borderRadius: 999,
      border: `1px solid ${on ? onColor : C.line}`, background: on ? onBg : "transparent",
      color: on ? C.ink : C.inkSoft, fontWeight: on ? 700 : 400, cursor: "pointer", transition: "all .12s" }}>
      {on ? "✓ " : ""}{label}</button>
  );
}
const inputStyle = { fontFamily: "'Cormorant Garamond',serif", fontSize: 17, color: C.ink, width: "100%",
  background: "transparent", border: "none", borderBottom: `1px solid ${C.line}`, outline: "none", padding: "3px 0" };
const smallInput = { ...inputStyle, fontFamily: "'Karla',sans-serif", fontSize: 14 };
const taStyle = { ...inputStyle, minHeight: 56, resize: "vertical", lineHeight: 1.45, fontSize: 16.5 };
function download(filename, text) {
  const blob = new Blob([text], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
function compressImage(file, cb, max = 720) {
  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const cv = document.createElement("canvas");
      cv.width = Math.round(img.width * scale); cv.height = Math.round(img.height * scale);
      cv.getContext("2d").drawImage(img, 0, 0, cv.width, cv.height);
      cb(cv.toDataURL("image/jpeg", 0.78));
    };
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
}
const btn = (primary) => ({ fontFamily: "'Karla',sans-serif", fontWeight: 700, fontSize: 12.5,
  background: primary ? C.night : "transparent", color: primary ? C.ivory : C.ink,
  border: primary ? "none" : `1px solid ${C.line}`, borderRadius: 999, padding: "8px 18px", cursor: "pointer" });

/* ── generic 3·3·3 (+debt) priorities ── */
function PrioritySet({ value, onChange, withDebt, title }) {
  const groups = [
    { id: "big", name: "Big", note: "vision-moving", color: C.brass },
    { id: "medium", name: "Medium", note: "keeps things flowing", color: C.sage },
    { id: "quick", name: "Quick", note: "under 15 min", color: C.rose },
    ...(withDebt ? [{ id: "debt", name: "Debt", note: "long-postponed, 3 per week", color: C.ink }] : []),
  ];
  const setItem = (g, i, patch) =>
    onChange({ ...value, [g]: value[g].map((t, j) => (j === i ? { ...t, ...patch } : t)) });
  const done = Object.values(value).flat().filter((t) => t.done && t.text.trim()).length;
  const total = Object.values(value).flat().filter((t) => t.text.trim()).length;
  return (
    <Card>
      <Label right={`${done}/${total || "—"}`}>{title}</Label>
      <div className="rt-grid" style={{ display: "grid", gridTemplateColumns: withDebt ? "1fr 1fr" : "1fr 1fr 1fr", gap: 18 }}>
        {groups.map((g) => (
          <div key={g.id}>
            <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 18, color: g.color }}>
              {g.name} <span style={{ fontSize: 12.5, fontStyle: "italic", color: C.inkSoft }}>· {g.note}</span>
            </div>
            {(value[g.id] || []).map((t, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                <button onClick={() => setItem(g.id, i, { done: !t.done })} aria-label="done"
                  style={{ width: 18, height: 18, borderRadius: 5, flexShrink: 0, cursor: "pointer", padding: 0,
                    border: `1.5px solid ${t.done ? g.color : C.line}`, background: t.done ? g.color : "transparent",
                    color: C.paper, fontSize: 11, lineHeight: "15px" }}>{t.done ? "✓" : ""}</button>
                <input value={t.text} placeholder={`${g.name.toLowerCase()} ${i + 1}…`}
                  onChange={(e) => setItem(g.id, i, { text: e.target.value })}
                  style={{ ...smallInput, textDecoration: t.done ? "line-through" : "none", opacity: t.done ? 0.55 : 1 }} />
              </div>
            ))}
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ── reward card ── */
function Reward({ meta, setMeta, pct, periodName }) {
  const unlocked = pct != null && pct >= (meta.rewardThreshold ?? 70) && meta.reward?.trim();
  return (
    <Card style={{ background: unlocked ? C.sageSoft : "#FBF7EC", borderColor: unlocked ? C.sage : C.brassSoft }}>
      <Label right={pct != null ? `${pct}% fulfilled` : "—"}>Gratification — set the reward beforehand</Label>
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "flex-end" }}>
        <div style={{ flex: "1 1 240px" }}>
          <input value={meta.reward || ""} onChange={(e) => setMeta({ ...meta, reward: e.target.value })}
            placeholder={`my ${periodName} reward — jazz night, Le Labo, a museum morning…`} style={inputStyle} />
        </div>
        <div>
          <Label>Unlocks at</Label>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input type="number" min={10} max={100} step={5} value={meta.rewardThreshold ?? 70}
              onChange={(e) => setMeta({ ...meta, rewardThreshold: Number(e.target.value) })}
              style={{ ...smallInput, width: 64 }} />
            <span style={{ fontFamily: "'Karla',sans-serif", fontSize: 13, color: C.inkSoft }}>% of priorities</span>
          </div>
        </div>
      </div>
      <p style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic", fontSize: 15.5,
        color: unlocked ? C.sage : C.inkSoft, margin: "12px 0 0", fontWeight: unlocked ? 600 : 400 }}>
        {unlocked ? "✓ Earned. Enjoy it fully — celebration is part of the practice." :
          "Reward effort honestly given, not perfection."}
      </p>
    </Card>
  );
}

/* ── pulses ── */
function Pulses({ day, upd }) {
  const now = () => { const d = new Date(); return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`; };
  const [draft, setDraft] = useState({ time: now(), activity: "", focus: 3, clarity: 3, energy: 3, ticks: 0, effect: "neutral" });
  const add = () => {
    if (!draft.activity.trim()) return;
    upd({ pulses: [...day.pulses, draft] });
    setDraft({ time: now(), activity: "", focus: 3, clarity: 3, energy: 3, ticks: 0, effect: "neutral" });
  };
  const remove = (i) => upd({ pulses: day.pulses.filter((_, j) => j !== i) });
  const effBtn = (val, label, color, bg) => (
    <button onClick={() => setDraft({ ...draft, effect: val })} style={{ fontFamily: "'Karla',sans-serif", fontSize: 12,
      padding: "6px 12px", borderRadius: 999, cursor: "pointer",
      border: `1px solid ${draft.effect === val ? color : C.line}`, background: draft.effect === val ? bg : "transparent",
      color: draft.effect === val ? C.ink : C.inkSoft, fontWeight: draft.effect === val ? 700 : 400 }}>{label}</button>
  );
  return (
    <Card>
      <Label right={`${day.pulses.length} logged`}>Pulse — hourly, or per activity when they're short</Label>
      <div style={{ background: "#FBF7EC", border: `1px solid ${C.brassSoft}`, borderRadius: 12, padding: "14px 16px" }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div style={{ width: 82 }}><Label>Time</Label>
            <input type="time" value={draft.time} onChange={(e) => setDraft({ ...draft, time: e.target.value })} style={{ ...smallInput, fontSize: 13 }} /></div>
          <div style={{ flex: "1 1 160px" }}><Label>Activity</Label>
            <input value={draft.activity} placeholder="справка / MIC / reading…" onChange={(e) => setDraft({ ...draft, activity: e.target.value })}
              onKeyDown={(e) => e.key === "Enter" && add()} style={smallInput} /></div>
        </div>
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap", marginTop: 14 }}>
          {[["focus", "Focus", C.brass], ["clarity", "Clear mind", C.sage], ["energy", "Energy", C.rose]].map(([k, n, col]) => (
            <div key={k}><Label>{n}</Label><Dots value={draft[k]} onChange={(v) => setDraft({ ...draft, [k]: v })} color={col} /></div>
          ))}
          <div><Label>Distraction impulses</Label>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button onClick={() => setDraft({ ...draft, ticks: Math.max(0, draft.ticks - 1) })} style={pm}>−</button>
              <span style={{ fontFamily: "'Karla',sans-serif", fontWeight: 700, width: 20, textAlign: "center" }}>{draft.ticks}</span>
              <button onClick={() => setDraft({ ...draft, ticks: draft.ticks + 1 })} style={pm}>+</button>
            </div></div>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 14, alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ fontFamily: "'Karla',sans-serif", fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: C.inkSoft }}>This activity…</span>
          {effBtn("gives", "gives energy ↑", C.sage, C.sageSoft)}
          {effBtn("neutral", "neutral →", C.brass, "#F3EDDE")}
          {effBtn("drains", "drains ↓", C.rose, C.roseSoft)}
          <button onClick={add} style={{ ...btn(true), marginLeft: "auto" }}>Log pulse</button>
        </div>
      </div>
      {day.pulses.length > 0 && (
        <div style={{ marginTop: 14, display: "grid", gap: 6 }}>
          {day.pulses.map((p, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, fontFamily: "'Karla',sans-serif", fontSize: 13,
              color: C.ink, padding: "7px 10px", borderRadius: 8,
              background: p.effect === "gives" ? C.sageSoft : p.effect === "drains" ? C.roseSoft : "#F6F2E7" }}>
              <span style={{ color: C.inkSoft, width: 44 }}>{p.time}</span>
              <span style={{ flex: 1, fontWeight: 600 }}>{p.activity}</span>
              <span>F{p.focus}</span><span>C{p.clarity}</span><span>E{p.energy}</span>
              <span style={{ color: C.inkSoft }}>{p.ticks > 0 ? "|".repeat(Math.min(p.ticks, 8)) + (p.ticks > 8 ? "+" : "") : "·"}</span>
              <span>{p.effect === "gives" ? "↑" : p.effect === "drains" ? "↓" : "→"}</span>
              <button onClick={() => remove(i)} aria-label="remove" style={{ border: "none", background: "transparent", color: C.inkSoft, cursor: "pointer", fontSize: 15 }}>×</button>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
const pm = { width: 26, height: 26, borderRadius: "50%", border: `1px solid ${C.line}`, background: C.paper, cursor: "pointer", fontSize: 15, lineHeight: 1, color: C.ink };

/* ── resonance ── */
function Resonance({ day }) {
  const s = dayScore(day);
  const bar = (name, val, w, col) => (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "'Karla',sans-serif", fontSize: 12, color: "#B7B2C7" }}>
        <span>{name} · weight {Math.round(w * 100)}%</span>
        <span style={{ fontWeight: 700, color: C.ivory }}>{val ? val.toFixed(1) : "—"}/5</span>
      </div>
      <div style={{ height: 5, background: "#3A3852", borderRadius: 3, marginTop: 3 }}>
        <div style={{ height: 5, width: `${val ? (val / 5) * 100 : 0}%`, background: col, borderRadius: 3, transition: "width .3s" }} />
      </div>
    </div>
  );
  return (
    <Card style={{ background: C.night, border: "none" }}>
      <Label><span style={{ color: C.brassSoft }}>Day resonance — weighted from your pulses</span></Label>
      <div style={{ display: "flex", gap: 26, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 60, color: C.ivory, lineHeight: 1 }}>{s ? s.score : "—"}</div>
        <div style={{ flex: "1 1 240px" }}>
          {bar("Focus", s?.focus, WEIGHTS.focus, C.brass)}
          {bar("Clear mind", s?.clarity, WEIGHTS.clarity, C.sage)}
          {bar("Energy", s?.energy, WEIGHTS.energy, C.rose)}
          <div style={{ fontFamily: "'Karla',sans-serif", fontSize: 12, color: "#9A94B0", marginTop: 8 }}>
            {s ? `Distraction impulses: ${s.ticks} → −${s.penalty} pts (max −15)` : "Log pulses and the score takes shape."}
          </div>
        </div>
      </div>
      <p style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic", fontSize: 15, color: "#B7B2C7", margin: "12px 0 0" }}>
        A number to notice, not to obey. 60 on a heavy day can outshine 85 on an easy one.
      </p>
    </Card>
  );
}

/* ── triple gratitude ── */
function Gratitude({ day, upd }) {
  const block = (key, title, color) => (
    <div>
      <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 18, color, marginBottom: 4 }}>{title}</div>
      {day[key].map((v, i) => (
        <input key={i} value={v} placeholder={`${i + 1}…`}
          onChange={(e) => upd({ [key]: day[key].map((x, j) => (j === i ? e.target.value : x)) })}
          style={{ ...smallInput, marginTop: 6, fontFamily: "'Cormorant Garamond',serif", fontSize: 15.5 }} />
      ))}
    </div>
  );
  return (
    <Card>
      <Label>Thankfulness — 3 · 3 · 3</Label>
      <div className="rt-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 18 }}>
        {block("thanksSelf", "Thankful to myself for…", C.brass)}
        {block("thanksOthers", "Thankful to others for…", C.sage)}
        {block("proud", "Proud of myself for…", C.rose)}
      </div>
    </Card>
  );
}

/* ── exports ── */
function dayToMd(key, d) {
  if (!d) return `## ${key}\n_no entry_\n`;
  const s = dayScore(d);
  const pr = (g) => d.priorities[g].filter((t) => t.text.trim()).map((t) => `  - [${t.done ? "x" : " "}] ${t.text}`).join("\n");
  const list = (a) => a.filter(Boolean).map((x) => `  - ${x}`).join("\n");
  return [
    `## ${key} (${dayName(key)})`,
    d.intention && `**Intention:** ${d.intention}`,
    d.compliment && `**Morning compliment:** ${d.compliment}`,
    s && `**Resonance:** ${s.score} · focus ${s.focus.toFixed(1)} · clear mind ${s.clarity.toFixed(1)} · energy ${s.energy.toFixed(1)} · impulses ${s.ticks}`,
    `**Priorities**\n- Big:\n${pr("big")}\n- Medium:\n${pr("medium")}\n- Quick:\n${pr("quick")}`,
    d.pulses.length && `**Pulses**\n${d.pulses.map((p) => `  - ${p.time} ${p.activity} · F${p.focus} C${p.clarity} E${p.energy} · ${p.ticks} impulses · ${p.effect}`).join("\n")}`,
    `**Nourishment:** ${NUTRITION.filter((n) => d.nutrition[n]).join(", ") || "—"}`,
    `**Anchors:** ${SOUL.filter((a) => d.soul[a.id]).map((a) => a.label).join(", ") || "—"}`,
    `**Sleep:** ${d.sleepHours} h, quality ${d.sleepQuality}/5 · **Screen:** ${d.screenTime || "—"} min`,
    d.visionStep && `**Vision step:** ${d.visionStep}`,
    (d.thanksSelf.some(Boolean) || d.thanksOthers.some(Boolean) || d.proud.some(Boolean)) &&
      `**Thankful to myself:**\n${list(d.thanksSelf)}\n**Thankful to others:**\n${list(d.thanksOthers)}\n**Proud of:**\n${list(d.proud)}`,
    d.joy && `**Joy:** ${d.joy}`, d.inspired && `**Inspired most:** ${d.inspired}`,
    d.win && `**Win:** ${d.win}`, d.lesson && `**Lesson:** ${d.lesson}`,
    d.tomorrow && `**Differently tomorrow:** ${d.tomorrow}`,
    d.kindness && `**To myself, kindly:** ${d.kindness}`,
  ].filter(Boolean).join("\n\n") + "\n";
}
async function exportDays(n, tKey, today) {
  const keys = lastNDays(n);
  const parts = ["# Rhythm — journal export\n"];
  for (const k of keys) {
    const d = k === tKey ? today : await sGet(`rhythm3:${k}`);
    if (d) parts.push(dayToMd(k, d));
  }
  download(`rhythm-days-${keys[0]}-to-${keys[keys.length - 1]}.md`, parts.join("\n---\n\n"));
}

/* ── TODAY ── */
function Today({ day, upd, saved, tKey }) {
  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div className="rt-grid2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Card><Label>Intention for the day</Label>
          <input value={day.intention} onChange={(e) => upd({ intention: e.target.value })}
            placeholder="one word or phrase — calm, precise, generous…" style={inputStyle} /></Card>
        <Card><Label>Compliment & good wishes to yourself</Label>
          <input value={day.compliment} onChange={(e) => upd({ compliment: e.target.value })}
            placeholder="begin the day as your own ally…" style={inputStyle} /></Card>
      </div>

      <PrioritySet title="Priorities of the day — 3 · 3 · 3" value={day.priorities}
        onChange={(v) => upd({ priorities: v })} />
      <Pulses day={day} upd={upd} />
      <Resonance day={day} />

      <Card>
        <Label right={`${NUTRITION.filter((n) => day.nutrition[n]).length}/${NUTRITION.length}`}>Nourishment — tick what held true today</Label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {NUTRITION.map((n) => (
            <TickBtn key={n} on={!!day.nutrition[n]} label={n}
              onClick={() => upd({ nutrition: { ...day.nutrition, [n]: !day.nutrition[n] } })} />
          ))}
        </div>
      </Card>

      <Card>
        <Label>Body & soul anchors</Label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {SOUL.map((a) => (
            <TickBtn key={a.id} on={!!day.soul[a.id]} label={a.label} onColor={C.brass} onBg="#F3EDDE"
              onClick={() => upd({ soul: { ...day.soul, [a.id]: !day.soul[a.id] } })} />
          ))}
        </div>
        <div className="rt-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 18, marginTop: 18 }}>
          <div><Label right={`${day.sleepHours} h`}>Sleep last night</Label>
            <input type="range" min={3} max={11} step={0.5} value={day.sleepHours}
              onChange={(e) => upd({ sleepHours: Number(e.target.value) })} style={{ width: "100%", accentColor: C.brass }} /></div>
          <div><Label>Sleep quality</Label><Dots value={day.sleepQuality} onChange={(v) => upd({ sleepQuality: v })} color={C.sage} /></div>
          <div><Label>Screen time (min, from phone)</Label>
            <input type="number" min={0} value={day.screenTime} placeholder="e.g. 95"
              onChange={(e) => upd({ screenTime: e.target.value })} style={smallInput} /></div>
        </div>
      </Card>

      <Card style={{ borderColor: C.brassSoft, background: "#FBF7EC" }}>
        <Label>Serving the vision</Label>
        <textarea value={day.visionStep} onChange={(e) => upd({ visionStep: e.target.value })}
          placeholder="the one major thing I did today to fulfil my life vision and year goals…" style={taStyle} />
      </Card>

      <Gratitude day={day} upd={upd} />

      <Card>
        <Label>Evening closure</Label>
        <div className="rt-grid2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {[["joy", "One moment of joy or beauty"], ["inspired", "What inspired me most today"],
            ["win", "One win"], ["lesson", "One lesson"],
            ["tomorrow", "What I will do differently tomorrow"],
            ["kindness", "A sentence to yourself, as to a dear friend"]].map(([k, ph]) => (
            <textarea key={k} value={day[k]} placeholder={ph + "…"}
              onChange={(e) => upd({ [k]: e.target.value })} style={taStyle} />
          ))}
        </div>
      </Card>

      <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
        <button style={btn()} onClick={() => download(`rhythm-${tKey}.md`, dayToMd(tKey, day))}>Download today</button>
        <button style={btn()} onClick={() => exportDays(7, tKey, day)}>Download last 7 days</button>
        <button style={btn()} onClick={() => exportDays(30, tKey, day)}>Download last 30 days</button>
      </div>
      <div style={{ textAlign: "center", fontFamily: "'Karla',sans-serif", fontSize: 12, color: saved ? C.sage : C.inkSoft, letterSpacing: "0.08em" }}>
        {saved ? "saved ✓" : "saving…"}
      </div>
    </div>
  );
}

/* ── WEEK ── */
function Week({ days, meta, setMeta, wKey }) {
  const withData = days.filter((d) => d.entry);
  const byHour = {};
  withData.forEach(({ entry }) => (entry.pulses || []).forEach((p) => {
    const h = parseInt(p.time.split(":")[0], 10); if (isNaN(h)) return;
    byHour[h] = byHour[h] || { f: [], c: [], e: [] };
    byHour[h].f.push(p.focus); byHour[h].c.push(p.clarity); byHour[h].e.push(p.energy);
  }));
  const peakOf = (k) => Object.entries(byHour).map(([h, v]) => ({ h: Number(h), v: avg(v[k]) })).sort((a, b) => b.v - a.v).slice(0, 3);
  const hh = (h) => `${String(h).padStart(2, "0")}:00`;

  const acts = {};
  withData.forEach(({ entry }) => (entry.pulses || []).forEach((p) => {
    const key = p.activity.trim().toLowerCase(); if (!key) return;
    acts[key] = acts[key] || { name: p.activity.trim(), gives: 0, drains: 0 };
    if (p.effect === "gives") acts[key].gives++;
    if (p.effect === "drains") acts[key].drains++;
  }));
  const givers = Object.values(acts).filter((a) => a.gives > a.drains).sort((a, b) => b.gives - a.gives).slice(0, 5);
  const drainers = Object.values(acts).filter((a) => a.drains > a.gives).sort((a, b) => b.drains - a.drains).slice(0, 5);

  const practiceCount = (id) => withData.filter(({ entry }) => entry.soul?.[id]).length;
  const pct = prioPct(meta.priorities);

  const th = { fontFamily: "'Karla',sans-serif", fontSize: 10.5, letterSpacing: "0.1em", textTransform: "uppercase",
    color: C.ivory, padding: "9px 10px", textAlign: "left", background: C.night, whiteSpace: "nowrap" };
  const td = { fontFamily: "'Karla',sans-serif", fontSize: 13, color: C.ink, padding: "9px 10px",
    borderBottom: `1px solid ${C.line}`, whiteSpace: "nowrap" };

  const peakBlock = (title, k, col) => {
    const rows = peakOf(k);
    return (
      <div style={{ flex: "1 1 180px" }}>
        <Label>{title}</Label>
        {rows.length ? rows.map((r) => (
          <div key={r.h} style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 6 }}>
            <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 21, color: col, width: 58 }}>{hh(r.h)}</span>
            <div style={{ flex: 1, height: 6, background: C.line, borderRadius: 3 }}>
              <div style={{ height: 6, width: `${(r.v / 5) * 100}%`, background: col, borderRadius: 3 }} /></div>
            <span style={{ fontFamily: "'Karla',sans-serif", fontSize: 12, fontWeight: 700 }}>{r.v.toFixed(1)}</span>
          </div>
        )) : <p style={{ fontFamily: "'Karla',sans-serif", fontSize: 12.5, color: C.inkSoft }}>needs pulse data</p>}
      </div>
    );
  };

  const exportWeek = () => {
    const md = [
      `# Rhythm — week ${wKey}`,
      meta.intention && `**Intention:** ${meta.intention}`,
      pct != null && `**Weekly priorities fulfilled:** ${pct}%`,
      `**Practices:** ${SOUL.map((s) => `${s.label} ${practiceCount(s.id)}×`).join(" · ")}`,
      givers.length && `**Gives energy:** ${givers.map((g) => g.name).join(", ")}`,
      drainers.length && `**Drains energy:** ${drainers.map((g) => g.name).join(", ")}`,
      meta.contemplations && `**Contemplations:** ${meta.contemplations}`,
      meta.experiment && `**Experiment:** ${meta.experiment}`,
      meta.differently && `**Differently next week:** ${meta.differently}`,
      "\n## Days\n",
      ...days.map(({ key, entry }) => dayToMd(key, entry)),
    ].filter(Boolean).join("\n\n");
    download(`rhythm-week-${wKey}.md`, md);
  };

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <Card><Label>Intention for the week</Label>
        <input value={meta.intention || ""} onChange={(e) => setMeta({ ...meta, intention: e.target.value })}
          placeholder="what quality does this week ask of you…" style={inputStyle} /></Card>

      <PrioritySet withDebt title="Weekly priorities — 3 · 3 · 3 + 3 debt tasks"
        value={meta.priorities || emptyPeriod().priorities}
        onChange={(v) => setMeta({ ...meta, priorities: v })} />

      <Reward meta={meta} setMeta={setMeta} pct={pct} periodName="weekly" />

      <Card style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 700 }}>
            <thead><tr>
              <th style={th}>Day</th><th style={th}>Resonance</th><th style={th}>F / C / E</th>
              <th style={th}>Day prios</th><th style={th}>Nourish</th><th style={th}>Sleep</th><th style={th}>Screen</th>
            </tr></thead>
            <tbody>
              {days.map(({ key, entry }, i) => {
                const s = entry ? dayScore(entry) : null;
                const pd = entry ? dayPrioCounts(entry) : null;
                return (
                  <tr key={key} style={{ background: i % 2 ? "#FBF8F0" : C.paper }}>
                    <td style={{ ...td, fontWeight: 700 }}>{dayName(key)} <span style={{ fontWeight: 400, color: C.inkSoft, fontSize: 11 }}>{niceDate(key)}</span></td>
                    {entry ? (
                      <>
                        <td style={td}><span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 20,
                          color: s && s.score >= 70 ? C.sage : s && s.score >= 50 ? C.brass : C.rose }}>{s ? s.score : "—"}</span></td>
                        <td style={td}>{s ? `${s.focus.toFixed(1)} / ${s.clarity.toFixed(1)} / ${s.energy.toFixed(1)}` : "—"}</td>
                        <td style={td}>{pd.big}·{pd.medium}·{pd.quick}</td>
                        <td style={td}>{NUTRITION.filter((n) => entry.nutrition?.[n]).length}/{NUTRITION.length}</td>
                        <td style={td}>{entry.sleepHours} h</td>
                        <td style={td}>{entry.screenTime ? entry.screenTime + "m" : "—"}</td>
                      </>
                    ) : <td style={{ ...td, color: C.inkSoft }} colSpan={6}>no entry — and that's fine</td>}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <Label>Your productivity peaks — best hours this week</Label>
        <div style={{ display: "flex", gap: 26, flexWrap: "wrap", marginTop: 4 }}>
          {peakBlock("Focus peaks", "f", C.brass)}
          {peakBlock("Clear-mind peaks", "c", C.sage)}
          {peakBlock("Energy peaks", "e", C.rose)}
        </div>
        <p style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic", fontSize: 15, color: C.inkSoft, margin: "14px 0 0" }}>
          Schedule deep work and vision serving into your focus-peak hours; let admin and errands live in the valleys.
        </p>
      </Card>

      <Card>
        <Label>Practices this week</Label>
        <div style={{ display: "flex", gap: 22, flexWrap: "wrap" }}>
          {SOUL.map((s) => (
            <div key={s.id} style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 34, color: practiceCount(s.id) >= 5 ? C.sage : C.brass }}>
                {practiceCount(s.id)}<span style={{ fontSize: 15, color: C.inkSoft }}>×</span></div>
              <div style={{ fontFamily: "'Karla',sans-serif", fontSize: 11.5, color: C.inkSoft, maxWidth: 110 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </Card>

      <div className="rt-grid2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Card style={{ background: C.sageSoft, borderColor: C.sage }}>
          <Label>Gives energy ↑</Label>
          {givers.length ? givers.map((a) => (
            <div key={a.name} style={{ fontFamily: "'Karla',sans-serif", fontSize: 14, padding: "5px 0" }}>
              <b>{a.name}</b> <span style={{ color: C.inkSoft }}>· {a.gives}×</span></div>
          )) : <p style={{ fontFamily: "'Karla',sans-serif", fontSize: 13, color: C.inkSoft }}>tag pulses "gives energy"</p>}
        </Card>
        <Card style={{ background: C.roseSoft, borderColor: C.rose }}>
          <Label>Drains energy ↓</Label>
          {drainers.length ? drainers.map((a) => (
            <div key={a.name} style={{ fontFamily: "'Karla',sans-serif", fontSize: 14, padding: "5px 0" }}>
              <b>{a.name}</b> <span style={{ color: C.inkSoft }}>· {a.drains}×</span></div>
          )) : <p style={{ fontFamily: "'Karla',sans-serif", fontSize: 13, color: C.inkSoft }}>tag pulses "drains"</p>}
        </Card>
      </div>

      <Card><Label>Contemplations — what works, what doesn't</Label>
        <textarea value={meta.contemplations || ""} onChange={(e) => setMeta({ ...meta, contemplations: e.target.value })}
          placeholder="my observations on my productivity and resultativity this week…" style={{ ...taStyle, minHeight: 84 }} /></Card>

      <div className="rt-grid2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Card><Label>One experiment for next week</Label>
          <input value={meta.experiment || ""} onChange={(e) => setMeta({ ...meta, experiment: e.target.value })}
            placeholder="only one…" style={inputStyle} /></Card>
        <Card><Label>What I will do differently next week</Label>
          <input value={meta.differently || ""} onChange={(e) => setMeta({ ...meta, differently: e.target.value })}
            placeholder="one honest adjustment…" style={inputStyle} /></Card>
      </div>

      <div style={{ display: "flex", justifyContent: "center" }}>
        <button style={btn()} onClick={exportWeek}>Download week as document</button>
      </div>
    </div>
  );
}

/* ── MONTH ── */
function Month({ meta, setMeta, days, mKey }) {
  const scores = days.map((d) => (d.entry ? dayScore(d.entry) : null)).filter(Boolean);
  const withData = days.filter((d) => d.entry);
  const practiceCount = (id) => withData.filter(({ entry }) => entry.soul?.[id]).length;
  const wheel = meta.wheel || {};
  const lowest = DOMAINS.reduce((low, d) => (wheel[d] || 0) > 0 && (low === null || wheel[d] < wheel[low]) ? d : low, null);
  const pct = prioPct(meta.priorities);

  const exportMonth = () => {
    const md = [
      `# Rhythm — month ${mKey}`,
      meta.intention && `**Intention:** ${meta.intention}`,
      pct != null && `**Monthly priorities fulfilled:** ${pct}%`,
      scores.length && `**Averages:** resonance ${Math.round(avg(scores.map((s) => s.score)))} · focus ${avg(scores.map((s) => s.focus)).toFixed(1)} · clear mind ${avg(scores.map((s) => s.clarity)).toFixed(1)} · energy ${avg(scores.map((s) => s.energy)).toFixed(1)}`,
      `**Practices:** ${SOUL.map((s) => `${s.label} ${practiceCount(s.id)}×`).join(" · ")}`,
      Object.keys(wheel).length && `**Vision wheel:**\n${DOMAINS.map((d) => `  - ${d}: ${wheel[d] || "—"}/5`).join("\n")}`,
      meta.contemplations && `**Contemplations:** ${meta.contemplations}`,
      meta.release && `**Releasing:** ${meta.release}`, meta.claim && `**Claiming:** ${meta.claim}`,
      meta.letter && `**Letter to next month:** ${meta.letter}`,
      meta.differently && `**Differently next month:** ${meta.differently}`,
    ].filter(Boolean).join("\n\n");
    download(`rhythm-month-${mKey}.md`, md);
  };

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <Card><Label>Intention for the month</Label>
        <input value={meta.intention || ""} onChange={(e) => setMeta({ ...meta, intention: e.target.value })}
          placeholder="the month's chapter title…" style={inputStyle} /></Card>

      <PrioritySet withDebt title="Monthly priorities — 3 · 3 · 3 + 3 debt"
        value={meta.priorities || emptyPeriod().priorities}
        onChange={(v) => setMeta({ ...meta, priorities: v })} />

      <Reward meta={meta} setMeta={setMeta} pct={pct} periodName="monthly" />

      <Card>
        <Label right={scores.length ? `avg ${Math.round(avg(scores.map((s) => s.score)))}` : null}>This month so far</Label>
        <p style={{ fontFamily: "'Karla',sans-serif", fontSize: 13.5, color: C.inkSoft, margin: 0, lineHeight: 1.6 }}>
          {scores.length
            ? `${scores.length} logged day(s) · focus ${avg(scores.map((s) => s.focus)).toFixed(1)}/5 · clear mind ${avg(scores.map((s) => s.clarity)).toFixed(1)}/5 · energy ${avg(scores.map((s) => s.energy)).toFixed(1)}/5 · practices: ${SOUL.map((s) => `${s.label.split(" ")[0]} ${practiceCount(s.id)}×`).join(", ")}`
            : "Log days and the month's picture will assemble itself here."}
        </p>
      </Card>

      <Card>
        <Label>Vision wheel — felt sense, not achievement (1–5)</Label>
        <div className="rt-grid2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 26px" }}>
          {DOMAINS.map((d) => (
            <div key={d} style={{ display: "flex", alignItems: "center", gap: 12, justifyContent: "space-between" }}>
              <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 16.5, color: C.ink }}>{d}</span>
              <Dots value={wheel[d] || 0} onChange={(v) => setMeta({ ...meta, wheel: { ...wheel, [d]: v } })} size={16} />
            </div>
          ))}
        </div>
        {lowest && (
          <p style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic", fontSize: 16, color: C.brass, margin: "14px 0 0" }}>
            Quietest domain: <b>{lowest}</b>. One gentle intervention next month — not a life overhaul.
          </p>
        )}
      </Card>

      <Card><Label>Contemplations — what works, what doesn't</Label>
        <textarea value={meta.contemplations || ""} onChange={(e) => setMeta({ ...meta, contemplations: e.target.value })}
          placeholder="my observations across the month…" style={{ ...taStyle, minHeight: 84 }} /></Card>

      <Card>
        <Label>Contemplation</Label>
        {[["release", "What am I ready to release?"], ["claim", "What am I ready to claim?"],
          ["letter", "Three sentences to next month's self…"], ["differently", "What I will do differently next month…"]].map(([k, ph]) => (
          <textarea key={k} value={meta[k] || ""} placeholder={ph}
            onChange={(e) => setMeta({ ...meta, [k]: e.target.value })} style={{ ...taStyle, marginTop: 10 }} />
        ))}
      </Card>

      <div style={{ display: "flex", justifyContent: "center" }}>
        <button style={btn()} onClick={exportMonth}>Download month as document</button>
      </div>
    </div>
  );
}

/* ── GOALS (12 monthly, daily ticks, dashboard) ── */
function Goals({ goals, setGoals, mKey }) {
  const dayKeys = useMemo(() => monthDayKeys(), []);
  const today = todayKey();
  const elapsed = dayKeys.filter((k) => k <= today).length;
  const list = goals.list || Array.from({ length: 12 }, () => "");
  const ticks = goals.ticks || {};
  const setGoal = (i, text) => setGoals({ ...goals, list: list.map((g, j) => (j === i ? text : g)) });
  const toggle = (i, k) => {
    const g = { ...(ticks[i] || {}) }; g[k] = !g[k];
    setGoals({ ...goals, ticks: { ...ticks, [i]: g } });
  };
  const pctOf = (i) => {
    if (!list[i].trim() || !elapsed) return null;
    const done = dayKeys.filter((k) => k <= today && ticks[i]?.[k]).length;
    return Math.round((done / elapsed) * 100);
  };
  const active = list.map((g, i) => ({ g, i })).filter((x) => x.g.trim());
  const overall = active.length ? Math.round(avg(active.map(({ i }) => pctOf(i) ?? 0))) : null;

  const weekKeys = lastNDays(7);
  const weekPct = (i) => {
    if (!list[i].trim()) return null;
    const done = weekKeys.filter((k) => ticks[i]?.[k]).length;
    return Math.round((done / 7) * 100);
  };

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <Card style={{ background: C.night, border: "none" }}>
        <Label><span style={{ color: C.brassSoft }}>Dashboard — {mKey}</span></Label>
        <div style={{ display: "flex", gap: 26, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 56, color: C.ivory, lineHeight: 1 }}>
            {overall != null ? overall + "%" : "—"}</div>
          <div style={{ flex: "1 1 260px" }}>
            {active.slice(0, 12).map(({ g, i }) => {
              const p = pctOf(i) ?? 0;
              return (
                <div key={i} style={{ marginTop: 7 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "'Karla',sans-serif", fontSize: 11.5, color: "#B7B2C7" }}>
                    <span style={{ maxWidth: "75%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{g}</span>
                    <span style={{ color: C.ivory, fontWeight: 700 }}>{p}% <span style={{ color: "#9A94B0", fontWeight: 400 }}>· wk {weekPct(i)}%</span></span>
                  </div>
                  <div style={{ height: 4, background: "#3A3852", borderRadius: 2, marginTop: 2 }}>
                    <div style={{ height: 4, width: `${p}%`, background: p >= 60 ? C.sage : p >= 30 ? C.brass : C.rose, borderRadius: 2 }} />
                  </div>
                </div>
              );
            })}
            {!active.length && <p style={{ fontFamily: "'Karla',sans-serif", fontSize: 13, color: "#9A94B0" }}>Name your goals below and tick each day you served them.</p>}
          </div>
        </div>
        <p style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic", fontSize: 14.5, color: "#B7B2C7", margin: "12px 0 0" }}>
          % = days you did *something* toward the goal, of days elapsed. Small daily faithfulness beats rare heroics.
        </p>
      </Card>

      <Card style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "18px 22px 0" }}>
          <Label>Monthly goals — 12 spaces · tick a day when you moved the goal</Label>
        </div>
        <div style={{ overflowX: "auto", padding: "0 12px 16px" }}>
          <table style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ position: "sticky", left: 0, background: C.paper, minWidth: 180, textAlign: "left",
                  fontFamily: "'Karla',sans-serif", fontSize: 10.5, color: C.inkSoft, padding: "6px 8px" }}>Goal</th>
                {dayKeys.map((k) => (
                  <th key={k} style={{ fontFamily: "'Karla',sans-serif", fontSize: 9.5, color: k === today ? C.brass : C.inkSoft,
                    padding: "4px 2px", fontWeight: k === today ? 700 : 400 }}>{k.slice(-2)}</th>
                ))}
                <th style={{ fontFamily: "'Karla',sans-serif", fontSize: 10, color: C.inkSoft, padding: "4px 6px" }}>%</th>
              </tr>
            </thead>
            <tbody>
              {list.map((g, i) => (
                <tr key={i}>
                  <td style={{ position: "sticky", left: 0, background: C.paper, padding: "3px 8px", borderBottom: `1px solid ${C.line}` }}>
                    <input value={g} placeholder={`goal ${i + 1}…`} onChange={(e) => setGoal(i, e.target.value)}
                      style={{ ...smallInput, fontSize: 12.5, minWidth: 160 }} />
                  </td>
                  {dayKeys.map((k) => {
                    const on = !!ticks[i]?.[k]; const future = k > today;
                    return (
                      <td key={k} style={{ padding: 1, borderBottom: `1px solid ${C.line}` }}>
                        <button disabled={future || !g.trim()} onClick={() => toggle(i, k)} aria-label={`${g} ${k}`}
                          style={{ width: 17, height: 17, borderRadius: 4, cursor: future || !g.trim() ? "default" : "pointer", padding: 0,
                            border: `1px solid ${on ? C.sage : C.line}`, background: on ? C.sage : future ? "#F4F0E5" : "transparent",
                            opacity: future ? 0.4 : 1 }} />
                      </td>
                    );
                  })}
                  <td style={{ fontFamily: "'Karla',sans-serif", fontSize: 11.5, fontWeight: 700, padding: "0 6px",
                    color: (pctOf(i) ?? 0) >= 60 ? C.sage : C.ink, borderBottom: `1px solid ${C.line}` }}>
                    {pctOf(i) != null ? pctOf(i) + "%" : ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

/* ── YEAR GOALS ── */
function Year({ year, setYear }) {
  const list = year.list || Array.from({ length: 12 }, () => ({ text: "", why: "", fulfilled: "", img: "" }));
  const set = (i, patch) => setYear({ ...year, list: list.map((g, j) => (j === i ? { ...g, ...patch } : g)) });
  return (
    <div style={{ display: "grid", gap: 16 }}>
      <Card style={{ background: "#FBF7EC", borderColor: C.brassSoft }}>
        <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 19, fontStyle: "italic", color: C.ink, margin: 0, lineHeight: 1.5 }}>
          Twelve intentions for the year — a reference to return to. Monthly goals and daily vision-steps should each trace back to one of these.
        </p>
      </Card>
      {list.map((g, i) => (
        <Card key={i}>
          <Label>Year goal {i + 1}</Label>
          <div style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
            <div style={{ flex: "2 1 300px" }}>
              <input value={g.text} placeholder="name it…" onChange={(e) => set(i, { text: e.target.value })} style={inputStyle} />
              <div style={{ marginTop: 12 }}>
                <Label>Why it matters · which values it serves</Label>
                <textarea value={g.why || ""} placeholder="the deeper why…"
                  onChange={(e) => set(i, { why: e.target.value })}
                  style={{ ...taStyle, minHeight: 44, fontSize: 14.5, fontFamily: "'Karla',sans-serif" }} />
              </div>
              <div style={{ marginTop: 10 }}>
                <Label>What fulfillment looks like</Label>
                <textarea value={g.fulfilled || ""} placeholder="describe the fulfilled picture in feelings and facts…"
                  onChange={(e) => set(i, { fulfilled: e.target.value })}
                  style={{ ...taStyle, minHeight: 44, fontSize: 14.5, fontFamily: "'Karla',sans-serif" }} />
              </div>
            </div>
            <div style={{ flex: "1 1 170px", maxWidth: 220 }}>
              <Label>A picture of fulfillment</Label>
              {g.img ? (
                <div style={{ position: "relative" }}>
                  <img src={g.img} alt={g.text || "goal"} style={{ width: "100%", height: 150, objectFit: "cover", borderRadius: 10, border: `1px solid ${C.line}` }} />
                  <button onClick={() => set(i, { img: "" })} aria-label="remove picture"
                    style={{ position: "absolute", top: 6, right: 6, width: 22, height: 22, borderRadius: "50%",
                      border: "none", background: "rgba(28,27,46,.75)", color: C.ivory, cursor: "pointer", fontSize: 13, lineHeight: 1 }}>×</button>
                </div>
              ) : (
                <label style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 150,
                  border: `1.5px dashed ${C.brassSoft}`, borderRadius: 10, cursor: "pointer",
                  fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic", fontSize: 15, color: C.inkSoft, textAlign: "center", padding: 8 }}>
                  upload an image that gives the sense of fulfillment
                  <input type="file" accept="image/*" style={{ display: "none" }}
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) compressImage(f, (url) => set(i, { img: url })); }} />
                </label>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

/* ── AFFIRMATIONS ── */
const AFFIRMATIONS = [
  "I am exactly where God placed me to grow, and today I grow with grace.",
  "My focus is a form of prayer: whatever I attend to fully, I offer upward.",
  "I do not chase my potential — I unfold it, hour by faithful hour.",
  "My energy is precious and God-given; I spend it on what blooms.",
  "I release what drains me and welcome what serves my becoming.",
  "Clarity comes to a quiet mind. I choose quiet, and clarity follows.",
  "I am both the work and the worker; both are held with love.",
  "Every small step taken today is a seed planted in the life I envision.",
  "I move through this day unhurried, because what is mine will not pass me by.",
  "My worth was settled before my to-do list existed.",
  "I honour my body as the temple that carries my calling.",
  "Distractions knock; I do not have to answer. My purpose is speaking.",
  "I am trusted with gifts, and I answer that trust with joyful discipline.",
  "The vision written on my heart is patient with me — I return to it gently.",
  "Today I choose depth over noise, presence over performance.",
  "I bless my work, my rest, and the space between them.",
  "What I water grows: today I water faith, focus and gratitude.",
  "I let excellence be an offering, not a demand upon my soul.",
  "My path is being straightened even where I cannot see it.",
  "I finish this day thankful, for the day itself was a gift.",
];
const ART_PALETTES = [
  { sky: ["#2A2940", "#4B3F63", "#B98F4E"], sun: "#D9C29A", hill: "#1C1B2E" },
  { sky: ["#7D8C7C", "#C9CFC0", "#F7F3EA"], sun: "#B98F4E", hill: "#5E6E5D" },
  { sky: ["#A8626A", "#D9AFA6", "#F5E6D3"], sun: "#F7F3EA", hill: "#7E4A50" },
  { sky: ["#1C1B2E", "#3E3A5C", "#7D8C7C"], sun: "#C9CFC0", hill: "#14131F" },
  { sky: ["#B98F4E", "#D9C29A", "#F7F3EA"], sun: "#A8626A", hill: "#8A6A3A" },
];
function AffirmArt({ seed }) {
  const p = ART_PALETTES[seed % ART_PALETTES.length];
  const sunX = 90 + (seed * 37) % 140, sunY = 55 + (seed * 13) % 30, sunR = 26 + (seed % 3) * 6;
  return (
    <svg viewBox="0 0 320 180" style={{ width: "100%", display: "block", borderRadius: "14px 14px 0 0" }} aria-hidden="true">
      <defs>
        <linearGradient id={`sky${seed}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={p.sky[0]} /><stop offset="55%" stopColor={p.sky[1]} /><stop offset="100%" stopColor={p.sky[2]} />
        </linearGradient>
      </defs>
      <rect width="320" height="180" fill={`url(#sky${seed})`} />
      <circle cx={sunX} cy={sunY} r={sunR} fill={p.sun} opacity="0.92" />
      <circle cx={sunX} cy={sunY} r={sunR + 14} fill={p.sun} opacity="0.18" />
      <path d="M0 140 Q 80 108, 160 132 T 320 122 L 320 180 L 0 180 Z" fill={p.hill} opacity="0.85" />
      <path d="M0 158 Q 100 132, 200 150 T 320 146 L 320 180 L 0 180 Z" fill={p.hill} />
    </svg>
  );
}
function Affirm() {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 864e5);
  const [offset, setOffset] = useState(0);
  const idx = (dayOfYear + offset) % AFFIRMATIONS.length;
  const quote = QUOTES[(dayOfYear + offset) % QUOTES.length];
  return (
    <div style={{ display: "grid", gap: 16, maxWidth: 620, margin: "0 auto" }}>
      <Card style={{ padding: 0, overflow: "hidden" }}>
        <AffirmArt seed={dayOfYear + offset} />
        <div style={{ padding: "26px 30px 28px", textAlign: "center" }}>
          <div style={{ fontFamily: "'Karla',sans-serif", fontSize: 11, letterSpacing: "0.25em", textTransform: "uppercase", color: C.brass, marginBottom: 12 }}>
            affirmation of the day</div>
          <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 27, color: C.ink, margin: 0, lineHeight: 1.45 }}>
            {AFFIRMATIONS[idx]}
          </p>
        </div>
      </Card>
      <Card style={{ background: C.night, border: "none", textAlign: "center" }}>
        <p style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic", fontSize: 18, color: C.ivory, margin: 0, lineHeight: 1.5 }}>
          "{quote[0]}"
        </p>
        <div style={{ fontFamily: "'Karla',sans-serif", fontSize: 11.5, letterSpacing: "0.1em", textTransform: "uppercase", color: "#9A94B0", marginTop: 8 }}>
          — {quote[1]}
        </div>
      </Card>
      <div style={{ display: "flex", justifyContent: "center" }}>
        <button style={btn(true)} onClick={() => setOffset(offset + 1)}>I need one more</button>
      </div>
      <p style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic", fontSize: 15, color: C.inkSoft, textAlign: "center", margin: 0 }}>
        Come here whenever the day feels heavy. Support is always one breath away.
      </p>
    </div>
  );
}

/* ── VISION ── */
function Vision({ vision, setVision }) {
  const imgs = vision.images || [];
  const [url, setUrl] = useState(""); const [cap, setCap] = useState("");
  const addImg = () => { if (!url.trim()) return; setVision({ ...vision, images: [...imgs, { url: url.trim(), cap }] }); setUrl(""); setCap(""); };
  return (
    <div style={{ display: "grid", gap: 16 }}>
      <Card style={{ background: C.night, border: "none" }}>
        <Label><span style={{ color: C.brassSoft }}>My life vision</span></Label>
        <textarea value={vision.text || ""} onChange={(e) => setVision({ ...vision, text: e.target.value })}
          placeholder="Write the life you are building — who you are becoming, what you serve, how your days feel. Return here when the way feels foggy…"
          style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 19, color: C.ivory, minHeight: 180, width: "100%",
            background: "transparent", border: `1px solid #3A3852`, borderRadius: 10, outline: "none",
            resize: "vertical", lineHeight: 1.6, padding: "14px 16px" }} />
      </Card>

      <Card>
        <Label>Vision board — images that call you forward</Label>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div style={{ flex: "2 1 220px" }}><input value={url} placeholder="paste image URL…" onChange={(e) => setUrl(e.target.value)} style={smallInput} /></div>
          <div style={{ flex: "1 1 140px" }}><input value={cap} placeholder="caption (optional)…" onChange={(e) => setCap(e.target.value)} style={smallInput} /></div>
          <button style={btn(true)} onClick={addImg}>Add</button>
        </div>
        {imgs.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", gap: 12, marginTop: 16 }}>
            {imgs.map((im, i) => (
              <figure key={i} style={{ margin: 0, position: "relative" }}>
                <img src={im.url} alt={im.cap || "vision"} style={{ width: "100%", height: 130, objectFit: "cover", borderRadius: 10, border: `1px solid ${C.line}` }}
                  onError={(e) => { e.target.style.opacity = 0.25; }} />
                <figcaption style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic", fontSize: 14, color: C.inkSoft, marginTop: 4 }}>{im.cap}</figcaption>
                <button onClick={() => setVision({ ...vision, images: imgs.filter((_, j) => j !== i) })} aria-label="remove"
                  style={{ position: "absolute", top: 6, right: 6, width: 22, height: 22, borderRadius: "50%",
                    border: "none", background: "rgba(28,27,46,.75)", color: C.ivory, cursor: "pointer", fontSize: 13, lineHeight: 1 }}>×</button>
              </figure>
            ))}
          </div>
        )}
        <p style={{ fontFamily: "'Karla',sans-serif", fontSize: 12.5, color: C.inkSoft, margin: "12px 0 0" }}>
          Tip: use direct image links (right-click an image → copy image address).
        </p>
      </Card>
    </div>
  );
}

/* ── reminders ── */
function Reminders({ settings, setSettings }) {
  const [perm, setPerm] = useState(typeof Notification !== "undefined" ? Notification.permission : "unsupported");
  const enable = async () => {
    if (typeof Notification === "undefined") return;
    const p = await Notification.requestPermission();
    setPerm(p);
    if (p === "granted") setSettings({ ...settings, enabled: true });
  };
  const T = (k, label) => (
    <TickBtn on={!!settings[k]} label={label} onColor={C.brass} onBg="#F3EDDE"
      onClick={() => setSettings({ ...settings, [k]: !settings[k] })} />
  );
  return (
    <Card>
      <Label>Reminders</Label>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        {perm !== "granted"
          ? <button style={btn(true)} onClick={enable}>{perm === "unsupported" ? "Not supported here" : "Enable notifications"}</button>
          : <span style={{ fontFamily: "'Karla',sans-serif", fontSize: 13, color: C.sage, fontWeight: 700 }}>✓ enabled</span>}
        {T("hourly", "Hourly pulse (9:00–20:00)")}
        {T("weekly", "Sunday review (18:00)")}
        {T("monthly", "Month ritual (29th–31st, 19:00)")}
      </div>
      <p style={{ fontFamily: "'Karla',sans-serif", fontSize: 12, color: C.inkSoft, margin: "10px 0 0" }}>
        Reminders fire while Rhythm is open in a tab. For fully offline reminders, mirror them in your phone's clock app.
      </p>
    </Card>
  );
}

/* ── APP ── */
export default function App() {
  const [tab, setTab] = useState("today");
  const tKey = useMemo(() => todayKey(), []);
  const wKey = useMemo(() => weekKey(), []);
  const mKey = useMemo(() => monthKey(), []);

  const [day, setDay] = useState(emptyDay());
  const [weekMeta, setWeekMeta] = useState(emptyPeriod());
  const [monthMeta, setMonthMeta] = useState(emptyPeriod());
  const [goals, setGoals] = useState({});
  const [year, setYear] = useState({});
  const [vision, setVision] = useState({});
  const [settings, setSettings] = useState({ hourly: true, weekly: true, monthly: true });
  const [loaded, setLoaded] = useState(false);
  const [saved, setSaved] = useState(true);
  const [weekDays, setWeekDays] = useState([]);
  const [monthDays, setMonthDays] = useState([]);
  const lastFired = useRef("");

  const quote = QUOTES[Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 864e5) % QUOTES.length];

  useEffect(() => {
    (async () => {
      const [d, w, m, g, y, v, s] = await Promise.all([
        sGet(`rhythm3:${tKey}`), sGet(`rhythm3-week:${wKey}`), sGet(`rhythm3-month:${mKey}`),
        sGet(`rhythm3-goals:${mKey}`), sGet("rhythm3-year"), sGet("rhythm3-vision"), sGet("rhythm3-settings"),
      ]);
      if (d) setDay({ ...emptyDay(), ...d });
      if (w) setWeekMeta({ ...emptyPeriod(), ...w });
      if (m) setMonthMeta({ ...emptyPeriod(), ...m });
      if (g) setGoals(g); if (y) setYear(y); if (v) setVision(v); if (s) setSettings(s);
      setLoaded(true);
    })();
  }, [tKey, wKey, mKey]);

  useEffect(() => {
    if (!loaded) return;
    setSaved(false);
    const t = setTimeout(async () => {
      await Promise.all([
        sSet(`rhythm3:${tKey}`, day), sSet(`rhythm3-week:${wKey}`, weekMeta), sSet(`rhythm3-month:${mKey}`, monthMeta),
        sSet(`rhythm3-goals:${mKey}`, goals), sSet("rhythm3-year", year), sSet("rhythm3-vision", vision),
        sSet("rhythm3-settings", settings),
      ]);
      setSaved(true);
    }, 700);
    return () => clearTimeout(t);
  }, [day, weekMeta, monthMeta, goals, year, vision, settings, loaded, tKey, wKey, mKey]);

  useEffect(() => {
    if (tab !== "week" && tab !== "month") return;
    (async () => {
      const keys = lastNDays(tab === "week" ? 7 : 30);
      const rows = [];
      for (const k of keys) rows.push({ key: k, entry: k === tKey ? day : await sGet(`rhythm3:${k}`) });
      tab === "week" ? setWeekDays(rows) : setMonthDays(rows);
    })();
  }, [tab, day, tKey]);

  /* reminder loop */
  useEffect(() => {
    const iv = setInterval(() => {
      if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
      const n = new Date();
      const stamp = `${n.getHours()}:${n.getMinutes()}`;
      if (lastFired.current === stamp) return;
      const fire = (title, body) => { lastFired.current = stamp; try { new Notification(title, { body }); } catch {} };
      if (settings.hourly && n.getMinutes() === 0 && n.getHours() >= 9 && n.getHours() <= 20)
        fire("Rhythm · pulse", "Ten seconds: focus, clear mind, energy — and one honest tally.");
      const lastDay = new Date(n.getFullYear(), n.getMonth() + 1, 0).getDate();
      if (settings.weekly && n.getDay() === 0 && n.getHours() === 18 && n.getMinutes() === 0)
        fire("Rhythm · Sunday review", "Ten quiet minutes for the week — peaks, practices, one experiment.");
      if (settings.monthly && n.getDate() >= Math.min(29, lastDay) && n.getHours() === 19 && n.getMinutes() === 0)
        fire("Rhythm · month ritual", "Matcha, jazz, no phone — the vision wheel awaits.");
    }, 30000);
    return () => clearInterval(iv);
  }, [settings]);

  const upd = (patch) => setDay((d) => ({ ...d, ...patch }));
  const tabs = [
    { id: "today", name: "Today" }, { id: "week", name: "Week" }, { id: "month", name: "Month" },
    { id: "goals", name: "Goals" }, { id: "year", name: "Year" }, { id: "vision", name: "Vision" },
    { id: "affirm", name: "Affirm" }, { id: "reminders", name: "Reminders" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: C.ivory }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Karla:wght@400;500;700&display=swap');
        * { box-sizing: border-box; }
        input::placeholder, textarea::placeholder { color: #B9B4A6; font-style: italic; }
        button:focus-visible, input:focus-visible, textarea:focus-visible { outline: 2px solid ${C.brass}; outline-offset: 2px; }
        @media (max-width: 700px) { .rt-grid { grid-template-columns: 1fr !important; } .rt-grid2 { grid-template-columns: 1fr !important; } }
      `}</style>

      <header style={{ background: C.night, padding: "28px 24px 20px" }}>
        <div style={{ maxWidth: 940, margin: "0 auto" }}>
          <div style={{ fontFamily: "'Karla',sans-serif", fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase", color: C.brassSoft }}>
            body · mind · soul</div>
          <h1 style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 500, fontSize: 40, color: C.ivory, margin: "4px 0 0", lineHeight: 1.05 }}>
            Rhythm<span style={{ color: C.brass }}>.</span></h1>
          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic", fontSize: 16.5, color: C.brassSoft, marginTop: 4 }}>
            fulfilling your highest potential gifted by God</div>
          <p style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic", fontSize: 16, color: "#B7B2C7", margin: "6px 0 0", maxWidth: 560, lineHeight: 1.45 }}>
            Conscious use of time, focus and energy — every faithful hour an offering to His plan.
          </p>
          <div style={{ marginTop: 14, borderLeft: `2px solid ${C.brass}`, paddingLeft: 14 }}>
            <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 17, color: C.ivory, lineHeight: 1.45 }}>"{quote[0]}"</div>
            <div style={{ fontFamily: "'Karla',sans-serif", fontSize: 11.5, letterSpacing: "0.1em", textTransform: "uppercase", color: "#9A94B0", marginTop: 3 }}>— {quote[1]}</div>
          </div>
        </div>
      </header>

      <nav style={{ background: C.night, padding: "6px 24px 0" }}>
        <div style={{ maxWidth: 940, margin: "0 auto", display: "flex", gap: 4, flexWrap: "wrap" }}>
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              fontFamily: "'Karla',sans-serif", fontSize: 13, letterSpacing: "0.05em", padding: "11px 18px",
              cursor: "pointer", border: "none", borderRadius: "10px 10px 0 0",
              background: tab === t.id ? C.ivory : "transparent", color: tab === t.id ? C.ink : "#9A94B0",
              fontWeight: tab === t.id ? 700 : 500, transition: "all .15s" }}>{t.name}</button>
          ))}
        </div>
      </nav>

      <main style={{ maxWidth: 940, margin: "0 auto", padding: "22px 24px 60px" }}>
        <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 21, color: C.ink, marginBottom: 14 }}>
          {tab === "today" ? niceDate(tKey) : tab === "week" ? "The last seven days" :
            tab === "month" ? "The month in view" : tab === "goals" ? "Twelve goals, one faithful month" :
            tab === "year" ? "The year's twelve intentions" : tab === "vision" ? "The life you are building" :
            tab === "affirm" ? "A word of support" : "Gentle reminders"}
        </div>

        {tab === "today" && <Today day={day} upd={upd} saved={saved} tKey={tKey} />}
        {tab === "week" && <Week days={weekDays} meta={weekMeta} setMeta={setWeekMeta} wKey={wKey} />}
        {tab === "month" && <Month meta={monthMeta} setMeta={setMonthMeta} days={monthDays} mKey={mKey} />}
        {tab === "goals" && <Goals goals={goals} setGoals={setGoals} mKey={mKey} />}
        {tab === "year" && <Year year={year} setYear={setYear} />}
        {tab === "vision" && <Vision vision={vision} setVision={setVision} />}
        {tab === "affirm" && <Affirm />}
        {tab === "reminders" && <Reminders settings={settings} setSettings={setSettings} />}
      </main>
    </div>
  );
}
