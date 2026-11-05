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

## Logo artwork

`public/logo-outline.png` is the supplied white-on-black S. The renderer extracts its silhouette at source resolution and lights it with a soft matte finish. Both color modes and the reduced-motion still use that same outline.
