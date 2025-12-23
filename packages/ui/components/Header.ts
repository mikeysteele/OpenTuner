import { css, customElement, FASTElement, html, attr } from '@microsoft/fast-element';

const template = html<HeaderComponent>`
  <div class="logo-area">
    <h1>${x => x.title}</h1>
    <slot name="start"></slot>
  </div>
  <div class="actions">
    <slot name="end"></slot>
    <div class="theme-switch">
        <span class="theme-label">${(x) => x.theme === 'dark' ? '☾ Dark' : '☀ Light'}</span>
        <fluent-switch 
        current-checked="${(x) => x.theme === 'dark'}"
        @change="${(x, _c) => x.toggleTheme()}">
        <span slot="checked-message">D</span>
        <span slot="unchecked-message">L</span>
        </fluent-switch>
    </div>
  </div>
`;

const styles = css`
  :host {
    padding: 0.75rem 1.5rem;
    background: var(--sidebar-bg, #2d2d2d);
    border-bottom: 1px solid var(--border-color, #444);
    display: flex;
    justify-content: space-between;
    align-items: center;
    box-shadow: var(--shadow-sm, 0 1px 2px 0 rgb(0 0 0 / 0.05));
    height: 64px;
    box-sizing: border-box;
  }

  .logo-area {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .actions {
      display: flex;
      align-items: center;
      gap: 16px;
  }

  .theme-switch {
      display: flex;
      align-items: center;
      gap: 8px;
  }
  
  .theme-label {
      font-size: 0.85rem;
      color: var(--text-secondary, #9ca3af);
      min-width: 60px;
      text-align: rights;
      display: none;
  }
  
  @media(min-width: 768px) {
      .theme-label {
          display: block;
      }
  }

  h1 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 700;
    background: linear-gradient(45deg, var(--accent-color, #818cf8), #818cf8);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    color: var(--text-primary, white); /* Fallback */
  }

  ::slotted(*) {
      display: flex;
      align-items: center;
  }
`;

@customElement({
  name: 'ui-header',
  template,
  styles,
})
export class HeaderComponent extends FASTElement {
  @attr title: string = 'OpenTuner';
  @attr theme: 'light' | 'dark' = 'dark';

  override connectedCallback() {
      super.connectedCallback();
      // Initialize theme from document if not set
      if (document.documentElement.getAttribute('data-theme') === 'light') {
          this.theme = 'light';
      }
  }

  toggleTheme(): void {
      this.theme = this.theme === 'light' ? 'dark' : 'light';
      this.dispatchEvent(new CustomEvent('theme-toggle', { 
          detail: { theme: this.theme },
          bubbles: true,
          composed: true
      }));
  }
}
