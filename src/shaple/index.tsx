/* @refresh reload */
import "../tailwind.css";
import { render } from 'solid-js/web';

import Shaple from './Shaple';

const root = document.getElementById('root');

if (import.meta.env.DEV && !(root instanceof HTMLElement)) {
  throw new Error(
    'Root element not found. Did you forget to add it to your index.html? Or maybe the id attribute got misspelled?',
  );
}

render(() => <Shaple />, root!);
