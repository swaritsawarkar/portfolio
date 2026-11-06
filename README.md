# Swarit Sawarkar Portfolio

Interactive portfolio with the liquid S opening, animated portfolio build, and dark and light editions.

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

Visit `/admin/` and sign in as `swaritlol` with that password. The owner can review and remove individual signatures. Visitors draw directly on the shared canvas and add their name in the toolbar. **More wall space** extends the same canvas. Both editions share one signature allowance per browser. The database validates the ink budget and rejects overlapping signatures.

## Logo artwork

`public/logo-outline.png` is the supplied white-on-black S. The renderer extracts its silhouette at source resolution and lights it with a soft matte finish. Both color modes and the reduced-motion still use that same outline.
