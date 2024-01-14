import { css, customElement, FASTElement, html, attr } from '@microsoft/fast-element';

const template = html<Header>`
  <div class="logo-area">
    <h1>OpenTuner</h1>
    <span class="status-badge ${(x) => x.status === 'Ready' ? 'ready' : ''}">${(x) => x.status}</span>
  </div>
  <div class="actions">
    <span class="theme-label">${(x) => x.theme === 'dark' ? '☾ Dark' : '☀ Light'}</span>
    <fluent-switch 
      ?checked="${(x) => x.theme === 'dark'}"
      @change="${(x, _c) => x.toggleTheme()}">
      <span slot="checked-message">D</span>
      <span slot="unchecked-message">L</span>
    </fluent-switch>
  </div>
`;

const styles = css`
  :host {
    padding: 0.75rem 1.5rem;
    background: var(--sidebar-bg);
    border-bottom: 1px solid var(--border-color);
    display: flex;
    justify-content: space-between;
    align-items: center;
    box-shadow: var(--shadow-sm);
    z-index: 10;
  }

  .logo-area {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .actions {
      display: flex;
      align-items: center;
      gap: 12px;
  }
  
  .theme-label {
      font-size: 0.85rem;
      color: var(--text-secondary);
      min-width: 60px;
      text-align: right;
  }

  h1 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 700;
    background: linear-gradient(45deg, var(--accent-color), #818cf8);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .status-badge {
    font-size: 0.75rem;
    padding: 2px 8px;
    border-radius: 12px;
    background: var(--card-bg);
    color: var(--text-secondary);
    font-weight: 500;
  }
  
  .status-badge.ready {
    background: rgba(16, 185, 129, 0.2);
    color: #10b981;
  }
`;

@customElement({
  name: 'app-header',
  template,
  styles,
})
export class Header extends FASTElement {
  @attr status: string = '';
  @attr theme: 'light' | 'dark' = 'dark';

  toggleTheme(): void {
      this.$emit('theme-toggle');
  }
}
