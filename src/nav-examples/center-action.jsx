"use client";
import React, { useId, useState, useRef } from "react";

// Use onNavigate to connect a destination to your router.
export default function CenterActionNav({ onNavigate = () => {} }) {
  const [active, setActive] = useState("Home");
  const noteId = useId();
  const dialog = useRef(null);
  const [created, setCreated] = useState("");
  const items = ['Home', 'Search', 'Inbox', 'Profile'];
  const paths = ["M3 10 12 3l9 7v11h-6v-7H9v7H3Z", "M21 21l-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0", "M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4", "M20 21v-2a6 6 0 0 0-6-6h-4a6 6 0 0 0-6 6v2M16 6a4 4 0 1 1-8 0 4 4 0 0 1 8 0"];
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
  return <div className="bn-center-action">
    <style>{`.bn-center-action { color:#25241f; font:14px/1.5 system-ui,sans-serif; width:100%; }
.bn-center-action * { box-sizing:border-box; }
.bn-center-action .stage { overflow-x:auto; padding:28px 8px 12px; border-radius:16px; background:#e9e5dc; }
.bn-center-action nav { border-radius:999px; min-width:252px; display:flex; align-items:center; padding:6px; background:#fffdf8; padding-bottom:max(6px, env(safe-area-inset-bottom)); }
.bn-center-action button { font:inherit; color:inherit; cursor:pointer; }
.bn-center-action nav button { border-radius:12px; position:relative; border:0; background:transparent; display:flex; flex:1; flex-direction:column; align-items:center; justify-content:center; gap:4px; min-width:48px; min-height:60px; padding:8px 2px; font-size:12px; transition:background 180ms ease,color 180ms ease,flex 180ms ease; }
@media (hover:hover) and (pointer:fine) { .bn-center-action nav button:not([aria-pressed="true"]):not(.create):hover { background:#e6e3d9; } }
.bn-center-action button:focus-visible, .bn-center-action input:focus-visible { outline:2px solid #3e5031; outline-offset:3px; }
.bn-center-action svg { width:22px; height:22px; flex-shrink:0; }
.bn-center-action button[aria-pressed="true"] { color:#35482a; font-weight:650; }
.bn-center-action button[aria-pressed="true"]::after { content:""; position:absolute; bottom:2px; width:24px; height:3px; background:currentColor; border-radius:2px; }
.bn-center-action dialog { width:min(90vw,360px); border:1px solid #aaa497; border-radius:12px; background:#f7f4ec; color:#25241f; padding:24px; }
.bn-center-action dialog::backdrop { background:#25241f66; }
.bn-center-action dialog label { display:block; margin-bottom:8px; }
.bn-center-action dialog input { width:100%; padding:12px; font:inherit; }
.bn-center-action dialog button { margin:16px 8px 0 0; min-height:48px; padding:8px 16px; }
@media(prefers-reduced-motion:reduce) { .bn-center-action nav button { transition:none; } }

.bn-center-action { .create { flex: 0 0 52px; min-height:52px; border-radius:50%; background:#3e5031; color:#fff; transform:translateY(-16px); box-shadow:0 6px 14px #38312633; } }`}</style>
    <div className="stage">
      <nav aria-label="CenterActionNav demo" onKeyDown={onKeyDown}>
        {items.map((item, index) => <React.Fragment key={item}>
          {index === 2 && <button className="create" type="button" aria-label="Create a note" aria-haspopup="dialog" onClick={() => dialog.current.showModal()}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M12 4v16M4 12h16" /></svg>
          </button>}
          <button type="button" data-destination aria-pressed={active === item} aria-label={item} onClick={() => select(item)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[index]} /></svg>
            <span>{item}</span>
          </button>
        </React.Fragment>)}
      </nav>
    </div>
    {created && <p role="status">Created locally: {created}</p>}
    <dialog ref={dialog} aria-label="Create a note">
      <form onSubmit={(event) => {
        event.preventDefault();
        const title = new FormData(event.currentTarget).get("title").trim();
        if (!title) return;
        setCreated(title);
        event.currentTarget.reset();
        dialog.current.close();
      }}>
        <label htmlFor={`${noteId}-title`}>Note title</label>
        <input id={`${noteId}-title`} name="title" required maxLength={120} />
        <button type="submit">Create note</button>
        <button type="button" onClick={() => dialog.current.close()}>Cancel</button>
        <p>This example keeps your note in memory until the page reloads.</p>
      </form>
    </dialog>
  </div>;
}
