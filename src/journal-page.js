import './portfolio.css';
import './journal-page.css';
import { mountPortfolioVelocity } from './portfolio-velocity.js';

const article = document.querySelector('#journal-post');
if (article) {
  const { journalContent, mountJournal } = await import('./journal.js');
  article.innerHTML = journalContent;
  mountJournal(article);
}

mountPortfolioVelocity(document.body, matchMedia('(prefers-reduced-motion: reduce)'));
