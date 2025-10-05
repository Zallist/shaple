/* @refresh reload */
import "../tailwind.css";
import "animate.css";
import { render } from 'solid-js/web';

import Droptionary from './Droptionary';
import Navbar from "../components/Navbar";

const root = document.getElementById('root');

if (import.meta.env.DEV && !(root instanceof HTMLElement)) {
  throw new Error(
    'Root element not found. Did you forget to add it to your droptionary.html? Or maybe the id attribute got misspelled?',
  );
}

render(() => (
  <>
    <Navbar currentPath={window.location.pathname} />
    <Droptionary />
  </>
), root!);
