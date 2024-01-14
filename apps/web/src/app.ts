import { css, customElement, FASTElement, html, observable, when } from '@microsoft/fast-element';
import type { Channel, Program } from './types.ts';
import './components/Header.ts';
import './components/ChannelList.ts';
import './components/Player.ts';
import './components/EpgModal.ts';

const template = html<OpenTunerApp>`
  <app-header 
    status="${x => x.status}" 
    theme="${x => x.theme}"
    @theme-toggle="${(x) => x.toggleTheme()}">
  </app-header>

  <div class="content">
    <app-channel-list 
      :channels="${x => x.channels}" 
      :currentChannel="${x => x.currentChannel}"
      @channel-selected="${(x, c) => x.playChannel((c.event as CustomEvent).detail)}"
      @request-epg="${(x, c) => x.showEpg((c.event as CustomEvent).detail)}">
    </app-channel-list>

    <app-player :channel="${x => x.currentChannel}"></app-player>

    ${when(x => x.epgModalOpen, html<OpenTunerApp>`
      <app-epg-modal
        :channel="${x => x.epgChannel}"
        :programs="${x => x.epgPrograms}"
        ?loading="${x => x.epgLoading}"
        @close="${x => x.closeEpg()}">
      </app-epg-modal>
    `)}
  </div>
`;

const styles = css`
  /* Modern Theme Variables */
  :host {
    /* Dark Theme (Default) */
    --bg-color: #0f172a; /* Slate 900 */
    --sidebar-bg: #1e293b; /* Slate 800 */
    --card-bg: #334155; /* Slate 700 */
    --card-hover: #475569; /* Slate 600 */
    --text-primary: #f8fafc; /* Slate 50 */
    --text-secondary: #94a3b8; /* Slate 400 */
    --accent-color: #38bdf8; /* Sky 400 */
    --accent-hover: #0ea5e9; /* Sky 500 */
    --border-color: #334155;
    --modal-bg: #1e293b;
    --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
    --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
    
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  }

  :host(.light) {
    /* Light Theme Overrides */
    --bg-color: #f8fafc; /* Slate 50 */
    --sidebar-bg: #ffffff;
    --card-bg: #ffffff;
    --card-hover: #f1f5f9; /* Slate 100 */
    --text-primary: #0f172a; /* Slate 900 */
    --text-secondary: #64748b; /* Slate 500 */
    --accent-color: #0284c7; /* Sky 600 */
    --accent-hover: #0369a1; /* Sky 700 */
    --border-color: #e2e8f0; /* Slate 200 */
    --modal-bg: #ffffff;
  }

  :host {
    display: flex;
    flex-direction: column;
    height: 100vh;
    background: var(--bg-color);
    color: var(--text-primary);
    transition: background-color 0.3s ease, color 0.3s ease;
  }

  .content {
      display: flex;
      flex: 1;
      overflow: hidden;
  }
`;

@customElement({
  name: 'open-tuner-app',
  template,
  styles,
})
export class OpenTunerApp extends FASTElement {
  @observable channels: Channel[] = [];
  @observable currentChannel: Channel | null = null;
  @observable status: string = 'Connecting...';
  
  // Theme State
  @observable theme: 'light' | 'dark' = 'dark';

  // EPG Viewer State
  @observable epgModalOpen = false;
  @observable epgChannel: Channel | null = null;
  @observable epgPrograms: Program[] = [];
  @observable epgLoading = false;

  private isFetching = false;

  override async connectedCallback(): Promise<void> {
    super.connectedCallback();
    this.loadTheme();
    if (!this.isFetching) {
      await this.fetchLineup();
    }
  }
  
  loadTheme() {
      const saved = localStorage.getItem('theme') as 'light' | 'dark';
      if (saved) {
          this.theme = saved;
      }
      this.applyTheme();
  }
  
  toggleTheme() {
      this.theme = this.theme === 'light' ? 'dark' : 'light';
      localStorage.setItem('theme', this.theme);
      this.applyTheme();
  }
  
  applyTheme() {
      if (this.theme === 'light') {
          this.classList.add('light');
      } else {
          this.classList.remove('light');
      }
  }

  async fetchLineup(): Promise<void> {
    if (this.isFetching) return;
    this.isFetching = true;

    try {
      this.status = 'Loading...';
      const res = await fetch('/lineup.json');
      if (!res.ok) throw new Error('Failed to load lineup');
      const data = await res.json();
      this.channels = data;
      this.status = 'Ready';
    } catch (e) {
      console.error(e);
      this.status = 'Error';
    } finally {
        this.isFetching = false;
    }
  }

  playChannel(channel: Channel): void {
    this.currentChannel = channel;
  }

  // EPG Methods
  showEpg(channel: Channel): void {
      this.epgChannel = channel;
      this.epgModalOpen = true;
      this.fetchEpg(channel.GuideId);
  }

  closeEpg(): void {
      this.epgModalOpen = false;
      this.epgChannel = null;
      this.epgPrograms = [];
  }

  async fetchEpg(guideId?: string): Promise<void> {
      if(!guideId) return;
      this.epgLoading = true;
      this.epgPrograms = [];
      try {
          const res = await fetch(`/epg/${guideId}`);
          if(res.ok) {
              this.epgPrograms = await res.json();
          }
      } catch(e) {
          console.error(e);
      } finally {
          this.epgLoading = false;
      }
  }
}
