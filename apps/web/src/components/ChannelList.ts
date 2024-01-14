import { css, customElement, FASTElement, html, repeat, observable } from '@microsoft/fast-element';
import type { Channel } from '../types.ts';

const template = html<ChannelList>`
  <div class="search-box">
    <fluent-text-field placeholder="Search Channels..." @input="${(x, c) =>
      x.handleInput(c.event as InputEvent)}"> </fluent-text-field>
  </div>

  <div class="list-container">
    ${repeat(
      (x) => x.filteredChannels,
      html<Channel>`
        <fluent-card class="channel-card ${(x, c) => c.parent.currentChannel === x ? 'active' : ''}" 
                     @click="${(x, c) => c.parent.selectChannel(x)}">
          <div class="ch-info">
            <div class="row header-row">
              <span class="ch-number">${(x) => x.GuideNumber}</span>
              <span class="ch-name">${(x) => x.GuideName}</span>
            </div>
            <div class="row epg">
              ${(x) => x.CurrentProgram ? x.CurrentProgram.title : 'No Info'}
            </div>
          </div>
          <fluent-button class="guide-btn" appearance="stealth" @click="${(x, c) => c.parent.requestEpg(x, c.event)}">Guide</fluent-button>
        </fluent-card>
      `,
    )}
  </div>
`;

const styles = css`
  :host {
    width: 320px;
    background: var(--sidebar-bg);
    border-right: 1px solid var(--border-color);
    display: flex;
    flex-direction: column;
    height: 100%; /* Fix layout bug: ensure full height in flex container */
  }

  .search-box {
    padding: 1rem;
    border-bottom: 1px solid var(--border-color);
  }
  
  fluent-text-field {
      width: 100%;
  }

  .list-container {
    flex: 1;
    overflow-y: auto;
    padding: 10px;
  }

  .channel-card {
    padding: 12px;
    margin-bottom: 8px;
    cursor: pointer;
    display: flex;
    flex-direction: row;
    align-items: center;
    border-radius: 8px;
    background: var(--card-bg);
    border: 1px solid transparent; 
    transition: all 0.2s ease;
    box-shadow: var(--shadow-sm);
    min-height: auto; /* Fix layout bug: prevent unintended stretching */
    height: auto;
  }

  .channel-card:hover {
    background: var(--card-hover);
    transform: translateY(-1px);
    box-shadow: var(--shadow-md);
  }
  
  .channel-card.active {
      border-color: var(--accent-color);
      background: var(--card-hover);
  }

  .ch-info {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-width: 0; 
  }

  .header-row {
    display: flex;
    align-items: baseline;
    gap: 8px;
    margin-bottom: 4px;
  }

  .ch-number {
    font-weight: 700;
    color: var(--accent-color);
    font-size: 0.9rem;
    min-width: 30px;
  }

  .ch-name {
    font-weight: 600;
    font-size: 1rem;
    color: var(--text-primary);
  }

  .epg {
    font-size: 0.85rem;
    color: var(--text-secondary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .guide-btn {
      margin-left: 8px;
      color: var(--text-secondary);
  }
  
  .row {
      display: flex;
      width: 100%;
  }
`;

@customElement({
  name: 'app-channel-list',
  template,
  styles,
})
export class ChannelList extends FASTElement {
  @observable channels: Channel[] = [];
  @observable currentChannel: Channel | null = null;
  @observable filteredChannels: Channel[] = [];

  channelsChanged(): void {
      this.filteredChannels = this.channels;
  }

  handleInput(e: InputEvent): void {
      const term = (e.target as HTMLInputElement).value.toLowerCase();
      this.filteredChannels = this.channels.filter((ch) =>
        ch.GuideName.toLowerCase().includes(term) ||
        ch.GuideNumber.includes(term)
      );
  }

  selectChannel(channel: Channel): void {
      this.$emit('channel-selected', channel);
  }

  requestEpg(channel: Channel, event: Event): void {
      event.stopPropagation();
      this.$emit('request-epg', channel);
  }
}
