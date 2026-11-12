# Swarit Sawarkar Portfolio

Interactive portfolio with the liquid S opening, animated portfolio build, and dark and light editions.

Public site controls share `src/glass-controls.css`: frosted surfaces, shadows, button-shaped navigation, and a drawn tick after successful copies. Navigation demo components retain their standalone styles. The existing velocity engine covers portfolio and journal content, including article reference images and navigation-guide sections; it respects reduced motion and pauses in hidden tabs.

The homepage links to the journal collection at `/journal`. Articles have their own pages, starting with `/journal/ai-web-design-skills`, and open directly without the portfolio introduction. Add each new article HTML entry to `vite.config.js` and `public/sitemap.xml`.

## Run

```powershell
npm install
npm run dev
```

Open the local URL, move the pointer across the S, then scroll down 180vh. Scroll upward to reverse the animation.

After the black hold, ChatGPT, Claude, and Grok assemble the page. Tap the screen or the boost button to speed them up. At the end, they draw a smiley, return to the hero, and leave the screen. Use **Skip build** or Escape to reveal the finished page. The build runs once per page load, and reduced motion skips it.

Continue scrolling beyond the finished page to loop between dark and light editions.

Use `?mode=inverted` to open on the white-S-on-black variant first.

## Signing wall

Production builds use the portfolio project in SWARIT.org. The connected Supabase GitHub integration applies the migration in `supabase/migrations` on pushes to `main`. To use a separate backend, set its URL and **publishable** key using `.env.example`. For local development, copy that file to `.env.local` and fill in the values.

The production owner account is configured in Supabase Auth. To set up a separate backend, create its owner in **Supabase → Authentication → Users**. Set a different email with `VITE_SIGNING_OWNER_EMAIL` if needed, then grant that account moderation access by user ID:

```sql
update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb)
  || '{"portfolio_wall_admin": true}'::jsonb
where id = '<owner user ID>'::uuid;
```

Visit `/admin/` and sign in as `swaritlol` with that password. The owner can review and remove individual signatures. Visitors draw directly on the shared canvas and add their name in the toolbar. **More wall space** extends the same canvas. Both editions share one signature allowance per browser. The database validates the ink budget. On submission, invisible bounds pack signatures and names without overlap; only display positions and scale change, never the stored handwriting. Legacy clients retain collision protection.

## Visitor stats

Open `/admin/stats` or choose **Stats** after signing in to `/admin/`. The dashboard shows anonymous sessions, referral domains, device categories, project and section views, and wall activity. It shows a signer's public display name after a saved mark. Tracking starts with deployment, honors Do Not Track and Global Privacy Control, and does not store IP addresses, full referrer URLs, or what visitors type.

Journal readers, page reads, and per-article activity require the `20261113000100_journal_stats.sql` migration before deploying the tracking update. Each known journal page is counted once per anonymous session; the index counts as a journal page. Add future article paths to both `src/journal-pages.js` and the database event allowlist. Older journal visits cannot be recovered.

## Logo artwork

`public/logo-outline.png` is the supplied white-on-black S. The renderer extracts its silhouette at source resolution and lights it with a soft matte finish. Both color modes and the reduced-motion still use that same outline.

## Bottom navigation guide

`/journal/bottom-navigation-styles` loads its own React entry. Each standalone example in `src/nav-examples` supplies both the live demo and the copyable raw source. `npm run test:nav` checks the interactions and copied components in an isolated app using installed Chrome. It also writes review screenshots and a thumbnail capture into `dist`; the published thumbnail is in `public/journal`. Run `npm test` and `npm run build` before deployment.

The guide hero uses two inert copies of the real navigation previews. Its single animation loop pauses offscreen, in background tabs, for reduced motion, and with the visible pause control. Desktop columns become horizontal rows below 1100px; scrolling briefly increases their speed.

## 3D websites article

`/journal/3d-websites` is a static, directly readable article using three supplied website references. It distinguishes screenshot observations from verified implementation and links to this portfolio’s WebGL and scroll-motion source. Its copy buttons reuse the existing journal handler with the article’s own prompt. Keep the quoted source excerpt aligned with `src/main.js`.

## Live effects guide

`/journal/website-effects` runs four real WebGL demos with copyable example, component, and CSS files. Source under `src/effects` retains its license; examples under `src/effect-examples` are the same files shown in the guide. No new dependencies are required. Demos unmount offscreen, while the tab is hidden, or when paused; reduced motion starts them paused. Apply `20261113000200_effects_journal_stats.sql` before deploying its journal tracking. The homepage does not import the guide or its styles.
