import { initializeTheme } from '@opentuner/ui';
import './App.ts';

// Initialize Fluent UI Theme
initializeTheme();

const root = document.querySelector('app-root');
if (!root) {
  const app = document.createElement('app-root');
  document.body.appendChild(app);
}
