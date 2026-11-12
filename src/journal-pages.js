export const journalPages = {
  '/journal': 'Journal index',
  '/journal/ai-web-design-skills': '4 AI web design skills',
  '/journal/bottom-navigation-styles': '8 bottom navigation styles',
  '/journal/3d-websites': '3D websites',
};

export function journalPage(pathname) {
  const path = pathname.replace(/\/+$/, '');
  return Object.hasOwn(journalPages, path) ? path : null;
}
