"use client";
import React, { useState } from "react";

// Use onNavigate to connect a destination to your router.
export default function PillHighlightNav({ onNavigate = () => {} }) {
  const [active, setActive] = useState("Home");
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
  return <div className="bn-pill-highlight">
    <style>{`.bn-pill-highlight { color:#25241f; font:14px/1.5 system-ui,sans-serif; width:100%; }
.bn-pill-highlight * { box-sizing:border-box; }
.bn-pill-highlight .stage { overflow-x:auto; padding:28px 8px 12px; border-radius:16px; background:#e9e5dc; }
.bn-pill-highlight nav { border-radius:999px; min-width:252px; display:flex; align-items:center; padding:6px; background:#fffdf8; padding-bottom:max(6px, env(safe-area-inset-bottom)); }
.bn-pill-highlight button { font:inherit; color:inherit; cursor:pointer; }
.bn-pill-highlight nav button { border-radius:999px; position:relative; border:0; background:transparent; display:flex; flex:1; flex-direction:column; align-items:center; justify-content:center; gap:4px; min-width:48px; min-height:60px; padding:8px 2px; font-size:12px; transition:background 180ms ease,color 180ms ease,flex 180ms ease; }
@media (hover:hover) and (pointer:fine) { .bn-pill-highlight nav button:not([aria-pressed="true"]):not(.create):hover { background:#e6e3d9; } }
.bn-pill-highlight button:focus-visible, .bn-pill-highlight input:focus-visible { outline:2px solid #3e5031; outline-offset:3px; }
.bn-pill-highlight svg { width:22px; height:22px; flex-shrink:0; }
.bn-pill-highlight button[aria-pressed="true"] { color:#35482a; font-weight:650; }
.bn-pill-highlight button[aria-pressed="true"]::after { content:""; position:absolute; bottom:2px; width:24px; height:3px; background:currentColor; border-radius:2px; }
.bn-pill-highlight dialog { width:min(90vw,360px); border:1px solid #aaa497; border-radius:12px; background:#f7f4ec; color:#25241f; padding:24px; }
.bn-pill-highlight dialog::backdrop { background:#25241f66; }
.bn-pill-highlight dialog label { display:block; margin-bottom:8px; }
.bn-pill-highlight dialog input { width:100%; padding:12px; font:inherit; }
.bn-pill-highlight dialog button { margin:16px 8px 0 0; min-height:48px; padding:8px 16px; }
@media(prefers-reduced-motion:reduce) { .bn-pill-highlight nav button { transition:none; } }

.bn-pill-highlight { nav { border-radius: 16px; } button[aria-pressed="true"] { background: #dce3cf; border-radius: 999px; } button[aria-pressed="true"]::after { display:none; } }`}</style>
    <div className="stage">
      <nav aria-label="PillHighlightNav demo" onKeyDown={onKeyDown}>
        {items.map((item, index) => <React.Fragment key={item}>
          <button type="button" data-destination aria-pressed={active === item} aria-label={item} onClick={() => select(item)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[index]} /></svg>
            <span>{item}</span>
          </button>
        </React.Fragment>)}
      </nav>
    </div>
  </div>;
}
