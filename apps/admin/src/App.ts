import { css, customElement, FASTElement, html, observable, repeat, ref } from '@microsoft/fast-element';
import '@opentuner/ui/header';
import '@opentuner/ui/notification';
import type { NotificationComponent } from '@opentuner/ui/notification';
import type { Channel } from '@opentuner/ui/types';

interface AppConfig {
    m3uUrl?: string;
    hiddenChannels: string[];
}

const template = html<AdminApp>`
  <div class="container">
    <ui-header title="OpenTuner Admin">
        <div slot="end" class="status">
            Config Status: ${x => x.configLoaded ? 'Loaded' : 'Loading...'}
        </div>
    </ui-header>

    <main>
      <section class="card settings">
        <h2>Settings</h2>
        <div class="field">
            <label>M3U8 Source URL</label>
            <fluent-text-field 
                current-value="${x => x.m3uUrl}"
                @input="${(x, c) => x.m3uUrl = (c.event.target as any).value}"
            ></fluent-text-field>
        </div>
        <div class="actions">
            <fluent-button appearance="accent" @click="${x => x.saveConfig()}">Save Changes</fluent-button>
            <fluent-button appearance="neutral" @click="${x => x.loadConfig()}">Discard Changes</fluent-button>
        </div>
      </section>

      <section class="card channels">
        <h2>Channel Management</h2>
        <div class="channel-list">
             ${repeat(x => x.channels, html<Channel>`
                <div class="channel-row">
                    <fluent-switch 
                        current-checked="${(x, c) => !c.parent.isHidden(x.GuideNumber)}"
                        @change="${(x, c) => c.parent.toggleChannel(x.GuideNumber, c.event)}"
                    >
                        <span slot="checked-message">Visible</span>
                        <span slot="unchecked-message">Hidden</span>
                    </fluent-switch>
                    <span class="chno">${x => x.GuideNumber}</span>
                    <span class="name">${x => x.GuideName}</span>
                </div>
             `)}
        </div>
      </section>
    </main>
    <ui-notification ${ref('notification')}></ui-notification>
  </div>
`;

const styles = css`
  :host {
    display: block;
    height: 100vh;
    color: white;
  }
  .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0;
  }
  ui-header {
      margin-bottom: 20px;
  }
  .card {
      background: #2d2d2d;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 20px;
  }
  .field {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 16px;
  }
  fluent-text-field {
      width: 100%;
  }
  .channel-list {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 10px;
  }
  .channel-row {
      display: flex;
      align-items: center;
      gap: 12px;
      background: #363636;
      padding: 10px;
      border-radius: 4px;
  }
  .chno {
      font-weight: bold;
      color: #7ab8ff;
      width: 40px;
  }
  .name {
      font-weight: 500;
  }
`;

@customElement({
  name: 'app-root',
  template,
  styles,
})
export class AdminApp extends FASTElement {
  @observable configLoaded = false;
  @observable m3uUrl = '';
  @observable hiddenChannels: string[] = [];
  @observable channels: Channel[] = [];

  async connectedCallback(): Promise<void> {
      super.connectedCallback();
      await this.loadConfig();
      await this.loadChannels();
  }

  async loadConfig(): Promise<void> {
      try {
          const res = await fetch('/api/config');
          const conf = await res.json() as AppConfig;
          this.m3uUrl = conf.m3uUrl || '';
          this.hiddenChannels = conf.hiddenChannels || [];
          this.configLoaded = true;
      } catch (e) {
          console.error(e);
          this.notification.show('Failed to load config', 'error');
      }
  }

  async loadChannels(): Promise<void> {
      try {
          const res = await fetch('/api/channels');
          if (!res.ok) throw new Error('Failed to load channels');
          this.channels = await res.json();
      } catch (e) {
          console.error(e);
      }
  }

  async saveConfig(): Promise<void> {
      const newConfig = {
          m3uUrl: this.m3uUrl,
          hiddenChannels: this.hiddenChannels
      };
      try {
        const res = await fetch('/api/config', {
            method: 'POST',
            body: JSON.stringify(newConfig),
            headers: {'Content-Type': 'application/json'}
        });
        if (!res.ok) throw new Error('Server returned ' + res.status);
        
        this.notification.show('Config Saved! Channels updated.', 'success');
        await this.loadChannels();
      } catch (e) {
          console.error(e);
          this.notification.show('Failed to save config: ' + e, 'error');
      }
  }

  isHidden(guideNumber: string) {
      return this.hiddenChannels.includes(guideNumber);
  }

  toggleChannel(guideNumber: string, event: Event) {
      const target = event.target as any;
      const isVisible = target.checked;
      
      // Update local state only (Batch mode)
      if (!isVisible) {
          // User turned it OFF -> Hide it
          if (!this.hiddenChannels.includes(guideNumber)) {
              this.hiddenChannels = [...this.hiddenChannels, guideNumber];
          }
      } else {
          // User turned it ON -> Unhide it
          this.hiddenChannels = this.hiddenChannels.filter(id => id !== guideNumber);
      }
  }

  notification!: NotificationComponent;
}
