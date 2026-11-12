import './portfolio.css';
import './journal-page.css';
import './spatial-article.css';
import { mountPortfolioVelocity } from './portfolio-velocity.js';
import './glass-controls.css';

const article = document.querySelector('#journal-post');
if (article) {
  const { journalContent, mountJournal } = await import('./journal.js');
  article.innerHTML = journalContent;
  mountJournal(article);
}

const promptArticle = document.querySelector('[data-journal-prompt]');
if (promptArticle) {
  const { mountJournal } = await import('./journal.js');
  mountJournal(promptArticle, promptArticle.querySelector('#master-prompt code').textContent);
}

mountPortfolioVelocity(document.body, matchMedia('(prefers-reduced-motion: reduce)'));
