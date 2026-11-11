import './portfolio.css';
import './journal-page.css';

const article = document.querySelector('#journal-post');
if (article) {
  const { journalContent, mountJournal } = await import('./journal.js');
  article.innerHTML = journalContent;
  mountJournal(article);
}
