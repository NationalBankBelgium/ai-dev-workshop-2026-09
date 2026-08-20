import './styles.css';
import { WorkshopApp } from './app';

const root = document.querySelector<HTMLElement>('#app');

if (!root) {
  throw new Error('The workshop app mount point is missing.');
}

new WorkshopApp(root).start();
