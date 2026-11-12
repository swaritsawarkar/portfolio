alter table public.portfolio_activity
  drop constraint portfolio_activity_check,
  add constraint portfolio_activity_check check (
    (kind = 'section' and detail in ('home', 'work', 'creative', 'about', 'achievements', 'timeline', 'skills', 'signatures', 'contact'))
    or (kind = 'project' and detail in (
      'strikeout-os', 'pixelcut-pro', '10thhojayega', 'shorts-channel-os', 'ai-attention-analyzer',
      'chess-tracker-ai', 'dust-to-dollars', 'gen-z-is-cooked', 'gesture-to-text-wearable', 'webcam-latency-tester'
    ))
    or (kind = 'experience' and detail in ('entered', 'build-completed', 'build-skipped', 'boosted', 'light', 'dark'))
    or (kind = 'wall' and detail = 'started')
    or (kind = 'signed' and detail ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$')
    or (kind = 'outbound' and detail in ('github', 'linkedin', 'instagram', 'spotify', 'email', 'project-site', 'hotstar'))
    or (kind = 'journal' and detail in ('/journal', '/journal/ai-web-design-skills', '/journal/bottom-navigation-styles', '/journal/3d-websites', '/journal/website-effects'))
  );

