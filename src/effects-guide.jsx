import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './portfolio.css';
import './journal-page.css';
import './effects-guide.css';
import './glass-controls.css';
import { mountJournalAnalytics } from './portfolio-analytics.js';
import { mountPortfolioVelocity } from './portfolio-velocity.js';

const demos = import.meta.glob('./effect-examples/*Demo.jsx', { eager: true, import: 'default' });
const exampleSources = import.meta.glob('./effect-examples/*Demo.jsx', { eager: true, query: '?raw', import: 'default' });
const components = import.meta.glob('./effects/*.jsx', { eager: true, query: '?raw', import: 'default' });
const styles = import.meta.glob('./effects/*.css', { eager: true, query: '?raw', import: 'default' });
const effects = [
  ['FluxLines', 'Flux Lines', 'Flowing contours that bend with your pointer. Move across the scene or tap to stir the lines.'],
  ['CRTWarp', 'CRT Warp', 'Plasma, scanlines, and the curve of an old screen. Move across it, then click to change the pattern.'],
  ['LaserFlow', 'Laser Flow', 'A beam lands on a curved surface and spills over its edges. Move your pointer to shift the light.'],
  ['HalftoneReveal', 'Halftone Reveal', 'A dot print turns into a photograph under your pointer. Drag or tap to reveal it. Use your own image when copying the example.'],
];

function Effect({ entry, stopped, supported }) {
  const [name, title, description] = entry;
  const root = useRef(null);
  const pre = useRef(null);
  const [visible, setVisible] = useState(false);
  const [paused, setPaused] = useState(false);
  const [version, setVersion] = useState(0);
  const [file, setFile] = useState('Example');
  const [status, setStatus] = useState('');
  const [copying, setCopying] = useState(false);
  const Demo = demos[`./effect-examples/${name}Demo.jsx`];
  const files = {
    Example: exampleSources[`./effect-examples/${name}Demo.jsx`],
    Component: components[`./effects/${name}.jsx`],
    Styles: styles[`./effects/${name}.css`],
  };
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { rootMargin: '100px' });
    observer.observe(root.current);
    return () => observer.disconnect();
  }, []);
  async function copy() {
    setCopying(true);
    try {
      await navigator.clipboard.writeText(files[file]);
      setStatus(`Copied ${file.toLowerCase()} code.`);
    } catch {
      setStatus('Clipboard unavailable. Select the code and copy it manually.');
      pre.current.focus();
      window.getSelection()?.selectAllChildren(pre.current);
    } finally { setCopying(false); }
  }
  return <section className="effect-section" ref={root} id={name.toLowerCase()} aria-labelledby={`${name}-title`}>
    <header><h2 id={`${name}-title`}>{title}</h2><p>{description}</p></header>
    <div className="effect-columns">
      <div className="effect-preview-side">
        <div className="effect-preview" role="img" aria-label={`${title} interactive demonstration`}>
          {visible && !stopped && !paused && supported ? <Demo key={version} /> : <div className="effect-still">{title}<span>{supported === false ? 'WebGL 2 unavailable. The code is still below.' : stopped || paused ? 'Motion paused' : 'Preview ready'}</span></div>}
        </div>
        <div className="effect-controls">
          <button type="button" disabled={stopped} onClick={() => setPaused(!paused)} aria-pressed={paused}>{paused ? 'Play' : 'Pause'} {title}</button>
          <button type="button" disabled={stopped} onClick={() => { setPaused(false); setVersion(version + 1); }}>Restart {title}</button>
        </div>
      </div>
      <div className="effect-source">
        <div className="effect-files" role="group" aria-label={`${title} source files`}>
          {Object.keys(files).map(label => <button type="button" key={label} aria-pressed={file === label}
            onClick={() => { setFile(label); setStatus(''); }}>{label}</button>)}
        </div>
        <p className="effect-filename">{file === 'Example' ? `effect-examples/${name}Demo.jsx` : `effects/${name}.${file === 'Component' ? 'jsx' : 'css'}`}</p>
        <pre ref={pre} tabIndex="0" aria-label={`${title} ${file.toLowerCase()} code`}><code>{files[file]}</code></pre>
        <button type="button" className="effect-copy" onClick={copy} disabled={copying}
          data-copy-state={copying ? 'loading' : status.startsWith('Copied') ? 'success' : 'idle'}
          aria-label={`${status.startsWith('Copied') ? 'Copied' : 'Copy'} ${title} ${file.toLowerCase()} code`}>{copying ? 'Copying…' : status.startsWith('Copied') ? 'Copied' : 'Copy code'}</button>
        <p role="status" className="effect-status">{status}</p>
      </div>
    </div>
  </section>;
}

function Guide() {
  const [paused, setPaused] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [hidden, setHidden] = useState(document.hidden);
  const [supported, setSupported] = useState(null);
  useEffect(() => {
    const probe = document.createElement('canvas').getContext('webgl2');
    setSupported(Boolean(probe));
    probe?.getExtension('WEBGL_lose_context')?.loseContext();
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    const onMotion = () => setPaused(media.matches);
    const onVisibility = () => setHidden(document.hidden);
    media.addEventListener('change', onMotion);
    document.addEventListener('visibilitychange', onVisibility);
    return () => { media.removeEventListener('change', onMotion); document.removeEventListener('visibilitychange', onVisibility); };
  }, []);
  return <>
    <button className="effects-toggle" type="button" aria-pressed={paused} onClick={() => setPaused(!paused)}>{paused ? 'Play all effects' : 'Pause all effects'}</button>
    {effects.map(entry => <Effect entry={entry} key={entry[0]} stopped={paused || hidden} supported={supported} />)}
  </>;
}

createRoot(document.querySelector('#effects-demos')).render(<Guide />);
mountJournalAnalytics();
mountPortfolioVelocity(document.body, matchMedia('(prefers-reduced-motion: reduce)'));
