import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/im-fell-english/400.css';
import '@fontsource/im-fell-english/400-italic.css';
import '@fontsource-variable/eb-garamond';
import './styles/base.css';
import './styles/masthead.css';
import './styles/ritual.css';
import './styles/cards.css';
import './styles/album.css';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
