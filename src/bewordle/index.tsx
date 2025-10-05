/* @refresh reload */
import "../tailwind.css";
import "animate.css";
import { render } from 'solid-js/web';

import Bewordle from './Bewordle';
import Navbar from "../components/Navbar";

const root = document.getElementById('root');

if (import.meta.env.DEV && !(root instanceof HTMLElement)) {
  throw new Error(
    'Root element not found. Did you forget to add it to your bewordle.html? Or maybe the id attribute got misspelled?',
  );
}

render(() => (
  <>
    <Navbar currentPath={window.location.pathname} />
    <Bewordle />
  </>
), root!);
