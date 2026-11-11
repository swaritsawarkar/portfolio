"use client";
import React, { useId, useState } from "react";

// Use onNavigate to connect a destination to your router.
export default function FloatingPillNav({ onNavigate = () => {} }) {
  const [active, setActive] = useState("Home");
  const panelId = useId();
  const items = ['Home', 'Search', 'Saved', 'Inbox', 'Profile'];
  const paths = ["M3 10 12 3l9 7v11h-6v-7H9v7H3Z", "M21 21l-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0", "M6 3h12v19l-6-4-6 4Z", "M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4", "M20 21v-2a6 6 0 0 0-6-6h-4a6 6 0 0 0-6 6v2M16 6a4 4 0 1 1-8 0 4 4 0 0 1 8 0"];
  function select(item) { setActive(item); onNavigate(item); }
  function onKeyDown(event) {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    const buttons = [...event.currentTarget.querySelectorAll("button[data-destination]")];
    const index = buttons.indexOf(document.activeElement);
    if (index < 0) return;
    event.preventDefault();
    const next = event.key === "Home" ? 0 : event.key === "End" ? buttons.length - 1
      : (index + (event.key === "ArrowRight" ? 1 : -1) + buttons.length) % buttons.length;
    buttons[next].focus();
    buttons[next].click();
  }
  return <div className="bn-floating-pill">
    <style>{`.bn-floating-pill { color:#25241f; font:14px/1.5 system-ui,sans-serif; width:100%; }
.bn-floating-pill * { box-sizing:border-box; }
.bn-floating-pill .panel { min-height:110px; padding:20px 12px; }
.bn-floating-pill .panel strong { display:block; font-size:20px; font-weight:600; }
.bn-floating-pill .panel p { margin:8px 0 0; color:#5e5a51; }
.bn-floating-pill .stage { overflow-x:auto; padding:28px 8px 12px; border-radius:16px; background:#e9e5dc; }
.bn-floating-pill nav { min-width:252px; display:flex; align-items:center; padding:6px; background:#fffdf8; padding-bottom:max(6px, env(safe-area-inset-bottom)); }
.bn-floating-pill button { font:inherit; color:inherit; cursor:pointer; }
.bn-floating-pill nav button { border-radius:999px; position:relative; border:0; background:transparent; display:flex; flex:1; flex-direction:column; align-items:center; justify-content:center; gap:4px; min-width:48px; min-height:60px; padding:8px 2px; font-size:12px; transition:background 180ms ease,color 180ms ease,flex 180ms ease; }
@media (hover:hover) and (pointer:fine) { .bn-floating-pill nav button:not([aria-pressed="true"]):not(.create):hover { background:#e6e3d9; } }
.bn-floating-pill button:focus-visible, .bn-floating-pill input:focus-visible { outline:2px solid #3e5031; outline-offset:3px; }
.bn-floating-pill svg { width:22px; height:22px; flex-shrink:0; }
.bn-floating-pill button[aria-pressed="true"] { color:#35482a; font-weight:650; }
.bn-floating-pill button[aria-pressed="true"]::after { content:""; position:absolute; bottom:2px; width:24px; height:3px; background:currentColor; border-radius:2px; }
.bn-floating-pill dialog { width:min(90vw,360px); border:1px solid #aaa497; border-radius:12px; background:#f7f4ec; color:#25241f; padding:24px; }
.bn-floating-pill dialog::backdrop { background:#25241f66; }
.bn-floating-pill dialog label { display:block; margin-bottom:8px; }
.bn-floating-pill dialog input { width:100%; padding:12px; font:inherit; }
.bn-floating-pill dialog button { margin:16px 8px 0 0; min-height:48px; padding:8px 16px; }
@media(prefers-reduced-motion:reduce) { .bn-floating-pill nav button { transition:none; } }

.bn-floating-pill { nav { border-radius: 999px; box-shadow: 0 10px 24px #38312622; margin: 0 8px 12px; } }`}</style>
    <div className="panel" id={panelId} role="region" aria-label={`${active} sample`} aria-live="polite">
      <strong>{active}</strong>
      <p>{({ Home: "Your starting point. What will you explore?", Search: "Find your next idea here.", Saved: "Keep the things worth coming back to.", Inbox: "Your conversations belong here.", Profile: "A little space of your own." })[active]}</p>
    </div>
    <div className="stage">
      <nav aria-label="FloatingPillNav demo" onKeyDown={onKeyDown}>
        {items.map((item, index) => <React.Fragment key={item}>
          <button type="button" data-destination aria-pressed={active === item} aria-controls={panelId} aria-label={item} onClick={() => select(item)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[index]} /></svg>
            <span>{item}</span>
          </button>
        </React.Fragment>)}
      </nav>
    </div>
  </div>;
}
