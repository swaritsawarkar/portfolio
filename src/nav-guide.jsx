import React, { useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './portfolio.css';
import './journal-page.css';
import './nav-guide.css';

const components = import.meta.glob('./nav-examples/*.jsx', { eager: true, import: 'default' });
const sources = import.meta.glob('./nav-examples/*.jsx', { eager: true, query: '?raw', import: 'default' });
const styles = [
  ['minimal', 'Minimal clean', 'Let the content lead.', 'A straightforward starting point for utilities, reading apps, and interfaces with a lot to say.', 'Quiet should still be clear. Keep the selected destination visible through shape and weight as well as color.'],
  ['floating-pill', 'Floating pill', 'Give the navigation room to breathe.', 'Useful when the bar should feel separate from a scrolling feed or a full-bleed canvas.', 'Leave space beneath the content. A floating bar must never cover the last item or a key action.'],
  ['pill-highlight', 'Pill highlight', 'Make the current destination easy to spot.', 'A soft background groups the selected icon and label into one clear target.', 'Keep the highlight calm. Strong borders, shadows, and tints together can overpower the content.'],
  ['center-action', 'Center action button', 'Give the app’s main action its own place.', 'A useful fit when creating a note, recording, or posting is central to the app. Try creating a note here.', 'An action is not a destination. The plus opens a creation dialog; the other controls switch sections.'],
  ['glassmorphism', 'Glassmorphism', 'Let the surface behind it show through.', 'Works when there is meaningful visual content behind the navigation. The subtle background here makes the material visible.', 'Contrast changes with the background. Test light and dark scenes, and provide an opaque fallback when blur is unavailable.'],
  ['tab-indicator', 'Tab indicator', 'A small line can do a lot.', 'A precise active marker works well in restrained interfaces where the navigation needs little decoration.', 'Do not rely on a thin line alone. Keep the active label distinct and the full control easy to tap.'],
  ['ios-inspired-dock', 'iOS-inspired dock', 'Soft edges, a translucent surface, familiar rhythm.', 'An interpretation of a dock for the web, with a generous selected area and persistent labels.', 'This is a React web component. Native platform behavior comes from native controls, not from rounded corners.'],
  ['expanding-label', 'Expanding label', 'Give the active destination more space.', 'Useful for a compact set of familiar destinations. Select each icon to reveal its label.', 'Hidden labels make unfamiliar icons harder to understand. Accessible names remain available, but visible labels are usually easier for everyone.'],
];

function Example({ entry }) {
  const [slug, title, line, usage, caution] = entry;
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
    <header><h2 id={`${slug}-heading`}>{title}</h2><p className="example-line">{line}</p><p>{usage}</p></header>
    <div className="example-columns">
      <div className="preview-side">
        <div className="demo-row"><Component /><button className="copy-component" type="button" onClick={copy} disabled={copying} aria-label={`Copy React component: ${title}`} title="Copy complete React component">{copying ? 'Copying' : status.startsWith('Copied') ? 'Copied' : 'Copy'}<span>React</span></button></div>
        <p role="status" className="component-status">{status}</p>
        <p className="example-caution"><strong>Watch for:</strong> {caution}</p>
      </div>
      <div className="source-side"><div className="source-caption"><span>{code.match(/export default function (\w+)/)[1]}.jsx</span><span>Complete component</span></div><pre ref={pre} tabIndex="0" aria-label={`${title} React source`}><code>{code}</code></pre></div>
    </div>
  </section>;
}

function Guide() {
  return <>
    <nav className="guide-jumps" aria-label="Jump to navigation style">{styles.map(([slug, title]) => <a key={slug} href={`#${slug}`}>{title}</a>)}</nav>
    <details className="guide-setup"><summary>How to use these React components</summary><p>Each Copy button includes the exact React component running beside it: imports, state, SVG icons, and scoped CSS. No Tailwind, icon library, or separate stylesheet. Save it as a JSX file, import its default export into your React app, and render it.</p><pre tabIndex="0"><code>{'import MinimalNav from "./MinimalNav.jsx";\n\nexport default function App() {\n  return <MinimalNav onNavigate={(destination) => {\n    console.log(destination); // Connect your router here.\n  }} />;\n}'}</code></pre><p>The panels are sample content, not a complete app. Replace them with your screens and connect <code>onNavigate</code> to your router. For the center action, replace the local note handler with your own save action. Styles stay inside the component; if your site blocks inline styles with a Content Security Policy, move that CSS into an approved stylesheet.</p></details>
    {styles.map((entry) => <Example key={entry[0]} entry={entry} />)}
    <section className="guide-ending"><h2>Choose by the job.</h2><div className="comparison-scroll"><table><caption>A starting point for choosing a bottom navigation style</caption><thead><tr><th>Style</th><th>Reach for it when…</th><th>Watch for</th></tr></thead><tbody>{[
      ['Minimal', 'Content needs the attention', 'An active state that is too quiet'],
      ['Floating pill', 'Navigation should sit apart from content', 'Content hidden behind the bar'],
      ['Pill highlight', 'Selection needs to be unmistakable', 'Overdecorating the selected item'],
      ['Center action', 'Creating is a primary task', 'Confusing an action with a destination'],
      ['Glass', 'There is a visual background to reveal', 'Contrast and blur performance'],
      ['Tab indicator', 'You want restrained visual structure', 'A marker too small to notice'],
      ['iOS-inspired dock', 'A soft material fits your interface', 'Assuming a web clone behaves natively'],
      ['Expanding label', 'Your audience recognizes the icons', 'Unclear hidden destinations'],
    ].map((row) => <tr key={row[0]}>{row.map((text, index) => index === 0 ? <th key={index} scope="row">{text}</th> : <td key={index}>{text}</td>)}</tr>)}</tbody></table></div>
    <h2>Before you ship it</h2><ul><li><strong>Keep the hierarchy small.</strong> Three to five main destinations is a common recommendation for bottom navigation, not a universal limit for every interface. Reconsider the navigation structure when the app needs more.</li><li><strong>Make selection obvious.</strong> Use a marker, shape, or weight change alongside color.</li><li><strong>Name destinations clearly.</strong> Persistent labels are the safest starting point; familiar to you does not mean familiar to your users.</li><li><strong>Give fingers enough room.</strong> These examples aim for at least 48 × 48 CSS pixels per control. That is our design target; WCAG 2.2 AA’s target-size criterion uses 24 × 24 CSS pixels with exceptions.</li><li><strong>Respect the device.</strong> When pinning a bar to a screen edge, include safe-area padding and enough bottom spacing in your content. Test it on a real phone.</li><li><strong>Try it without a mouse.</strong> Check keyboard focus, screen-reader names, reduced motion, and glass without blur support.</li></ul>
    <p>Sources: <a href="https://developer.android.com/develop/ui/compose/components/navigation-bar">Android navigation guidance</a>, <a href="https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html">WCAG target size</a>, and <a href="https://developer.apple.com/design/human-interface-guidelines/tab-bars">Apple tab bars</a>.</p><p className="guide-signoff">A better navbar helps people find their way. Pick the style that makes that easier.</p></section>
  </>;
}

createRoot(document.querySelector('#nav-guide-examples')).render(<Guide />);
