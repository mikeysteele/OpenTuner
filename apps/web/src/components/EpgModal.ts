import { css, customElement, FASTElement, html, observable, repeat, when, attr } from '@microsoft/fast-element';
import type { Channel, Program } from '../types.ts';

const template = html<EpgModal>`
  <div class="modal-overlay" @click="${(x) => x.close()}">
    <div class="modal-content" @click="${(x, c) => c.event.stopPropagation()}">
      <div class="modal-header">
        <h3>Guide: ${x => x.channel?.GuideName}</h3>
        <fluent-button appearance="stealth" @click="${(x) => x.close()}">✕</fluent-button>
      </div>
      <div class="epg-list">
          ${when(x => x.loading, html`<div class="loading">Loading schedule...</div>`)}
          ${repeat(x => x.programs, html<Program>`
            <div class="epg-item">
              <div class="epg-time">
                ${(x) => new Date(x.start).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - 
                ${(x) => new Date(x.end).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </div>
              <div class="epg-main">
                  <div class="epg-title">${x => x.title}</div>
                  ${when(x => x.subTitle, html`<div class="epg-subtitle">${x => x.subTitle}</div>`)}
              </div>
            </div>
          `)}
          ${when(x => !x.loading && x.programs.length === 0, html`<div class="empty">No schedule available.</div>`)}
      </div>
    </div>
  </div>
`;

const styles = css`
  :host {
      display: block;
      z-index: 1000;
  }

  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.7);
    backdrop-filter: blur(4px);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  }

  .modal-content {
    background: var(--modal-bg);
    width: 600px;
    max-width: 90%;
    height: 80vh;
    border-radius: 12px;
    display: flex;
    flex-direction: column;
    box-shadow: 0 10px 25px rgba(0,0,0,0.5);
    border: 1px solid var(--border-color);
  }

  .modal-header {
    padding: 1rem 1.5rem;
    border-bottom: 1px solid var(--border-color);
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: var(--sidebar-bg);
    border-radius: 12px 12px 0 0;
  }

  .modal-header h3 { 
      margin: 0; 
      color: var(--text-primary);
  }

  .epg-list {
    flex: 1;
    overflow-y: auto;
    padding: 1rem;
  }
  
  .loading, .empty {
      text-align: center;
      padding: 2rem;
      color: var(--text-secondary);
  }

  .epg-item {
    background: var(--card-bg);
    padding: 12px;
    margin-bottom: 8px;
    border-radius: 6px;
    border-left: 3px solid var(--accent-color);
  }

  .epg-time {
    font-size: 0.8rem;
    color: var(--accent-color);
    font-weight: 600;
    margin-bottom: 4px;
    display: block;
  }
  
  .epg-main {
      display: flex;
      flex-direction: column;
  }

  .epg-title {
    font-weight: 600;
    font-size: 1rem;
    color: var(--text-primary);
  }

  .epg-subtitle {
    font-size: 0.9rem;
    color: var(--text-secondary);
    margin-top: 2px;
  }
`;

@customElement({
  name: 'app-epg-modal',
  template,
  styles,
})
export class EpgModal extends FASTElement {
  @observable channel: Channel | null = null;
  @observable programs: Program[] = [];
  @attr({ mode: 'boolean' }) loading: boolean = false;

  close() {
      this.$emit('close');
  }
}
