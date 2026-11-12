import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './portfolio.css';
import './journal-page.css';
import './nav-guide.css';
import { mountNavHeroMotion } from './nav-hero-motion.js';
import { mountPortfolioVelocity } from './portfolio-velocity.js';
import './glass-controls.css';
import { mountJournalAnalytics } from './portfolio-analytics.js';

mountJournalAnalytics();

const components = import.meta.glob('./nav-examples/*.jsx', { eager: true, import: 'default' });
const sources = import.meta.glob('./nav-examples/*.jsx', { eager: true, query: '?raw', import: 'default' });

function Hero() {
  const hero = useRef(null);
  useEffect(() => mountNavHeroMotion(hero.current), []);
  const columns = [
    ['minimal', 'floating-pill', 'pill-highlight', 'center-action'],
    ['glassmorphism', 'tab-indicator', 'ios-inspired-dock', 'expanding-label'],
  ];
  const rail = (slugs, index) => <div className={`hero-rail hero-rail-${index}`} aria-hidden="true" inert>
    <div className="hero-track">{[0, 1].map((copy) => <div className="hero-group" key={copy}>
      {slugs.map((slug) => { const Component = components[`./nav-examples/${slug}.jsx`]; return <div className="hero-nav-preview" key={slug}><Component /></div>; })}
    </div>)}</div>
  </div>;
  return <div className="hero-layout" ref={hero}>
    {rail(columns[0], 0)}
    <div className="hero-heading"><h1>8 bottom navs<br />worth <em>stealing.</em></h1><p>A small part of the screen. A big part of how your app feels.</p><p>Try every style, find the one that fits, and copy the complete React component right beside it.</p><button className="hero-motion-toggle" type="button" data-hero-pause aria-pressed="false">Pause motion</button></div>
    {rail(columns[1], 1)}
  </div>;
}
const styles = [
  ["minimal", "Minimal clean", "A straightforward starting point for utilities, reading apps, and interfaces with a lot to say."],
  ["floating-pill", "Floating pill", "Useful when the bar should feel separate from a scrolling feed or a full-bleed canvas."],
  ["pill-highlight", "Pill highlight", "A soft background groups the selected icon and label into one clear target."],
  ["center-action", "Center action button", "A useful fit when creating a note, recording, or posting is central to the app. Try creating a note here."],
  ["glassmorphism", "Glassmorphism", "Works when there is meaningful visual content behind the navigation. The subtle background here makes the material visible."],
  ["tab-indicator", "Tab indicator", "A precise active marker works well in restrained interfaces where the navigation needs little decoration."],
  ["ios-inspired-dock", "iOS-inspired dock", "An interpretation of a dock for the web, with a generous selected area and persistent labels."],
  ["expanding-label", "Expanding label", "Useful for a compact set of familiar destinations. Select each icon to reveal its label."],
];

function Example({ entry }) {
  const [slug, title, usage] = entry;
  const key = `./nav-examples/${slug}.jsx`;
  const Component = components[key];
  const code = sources[key];
  const [status, setStatus] = useState('');
  const [copying, setCopying] = useState(false);
  const pre = useRef(null);
  async function copy() {
    setCopying(true);
    try {
      await navigator.clipboard.writeText(code);
      setStatus('Copied — paste into a .jsx file.');
    } catch {
      setStatus('Clipboard unavailable. Select the code below and copy it manually.');
      pre.current.focus();
      const selection = window.getSelection();
      selection?.selectAllChildren(pre.current);
    } finally { setCopying(false); }
  }
  return <section className="nav-example" id={slug} aria-labelledby={`${slug}-heading`}>
    <header><h2 id={`${slug}-heading`}>{title}</h2><p>{usage}</p></header>
    <div className="example-columns">
      <div className="preview-side">
        <div className="demo-row"><Component /><button className="copy-component" type="button" onClick={copy} disabled={copying} data-copy-state={copying ? 'loading' : status.startsWith('Copied') ? 'success' : 'idle'} aria-label={status.startsWith('Copied') && !copying ? `Copied React component: ${title}` : `Copy React component: ${title}`} title="Copy complete React component">{copying ? 'Copying' : status.startsWith('Copied') ? 'Copied' : 'Copy'}</button></div>
        <p role="status" className="component-status">{status}</p>
      </div>
      <div className="source-side"><pre ref={pre} tabIndex="0" aria-label={`${title} React source`}><code>{code}</code></pre></div>
    </div>
  </section>;
}

function Guide() {
  return <>
    {styles.map((entry) => <Example key={entry[0]} entry={entry} />)}
    <section className="guide-ending"><h2>Choose by the job.</h2><div className="comparison-scroll"><table aria-label="A starting point for choosing a bottom navigation style"><thead><tr><th>Style</th><th>Reach for it when…</th></tr></thead><tbody>{[
      ["Minimal", "Content needs the attention"],
      ["Floating pill", "Navigation should sit apart from content"],
      ["Pill highlight", "Selection needs to be unmistakable"],
      ["Center action", "Creating is a primary task"],
      ["Glass", "There is a visual background to reveal"],
      ["Tab indicator", "You want restrained visual structure"],
      ["iOS-inspired dock", "A soft material fits your interface"],
      ["Expanding label", "Your audience recognizes the icons"],

    ].map((row) => <tr key={row[0]}>{row.map((text, index) => index === 0 ? <th key={index} scope="row">{text}</th> : <td key={index}>{text}</td>)}</tr>)}</tbody></table></div>
    </section>
  </>;
}

createRoot(document.querySelector('#nav-guide-examples')).render(<Guide />);
createRoot(document.querySelector('.nav-hero')).render(<Hero />);
mountPortfolioVelocity(document.body, matchMedia('(prefers-reduced-motion: reduce)'));
