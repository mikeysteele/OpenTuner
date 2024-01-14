import { css, customElement, FASTElement, html, observable } from '@microsoft/fast-element';
import Hls from 'hls.js';
import type { Channel } from '../types.ts';

const template = html<Player>`
  ${(x) =>
    x.channel
      ? html`
        <div class="player-header">
          <h2>${x.channel.GuideNumber} - ${x.channel.GuideName}</h2>
        </div>
        <div class="video-wrapper">
           <video id="player" controls autoplay></video>
        </div>
      `
      : html`
        <div class="placeholder">
          <div class="placeholder-icon">📺</div>
          <p>Select a channel to start watching</p>
        </div>
      `}
`;

const styles = css`
  :host {
    display: flex;
    flex-direction: column;
    flex: 1;
    background: black;
    position: relative;
    height: 100%;
    width: 100%;
    overflow: hidden;
  }

  .player-header {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      padding: 1rem;
      background: linear-gradient(to bottom, rgba(0,0,0,0.8), transparent);
      z-index: 5;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.3s;
  }
  
  :host(:hover) .player-header {
      opacity: 1;
  }
  
  h2 {
      margin: 0;
      color: white;
      font-size: 1.1rem;
      text-shadow: 0 2px 4px rgba(0,0,0,0.5);
  }

  .video-wrapper {
      width: 100%;
      height: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
  }

  video {
    width: 100%;
    height: 100%;
    max-height: 100vh;
  }

  .placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: var(--text-secondary);
    height: 100%;
  }
  
  .placeholder-icon {
      font-size: 4rem;
      margin-bottom: 1rem;
      opacity: 0.5;
  }
`;

@customElement({
  name: 'app-player',
  template,
  styles,
})
export class Player extends FASTElement {
  @observable channel: Channel | null = null;
  private hls: Hls | null = null;
  private video: HTMLVideoElement | null = null;

  channelChanged() {
      // Defer to let DOM update if switching from null
      setTimeout(() => this.initPlayer(), 0);
  }

  private initPlayer(): void {
    this.video = this.shadowRoot?.querySelector('video') as HTMLVideoElement;
    if (!this.video || !this.channel) return;

    if (this.hls) {
      this.hls.destroy();
      this.hls = null;
    }

    const streamUrl = `${this.channel.URL}?format=hls`;

    if (Hls.isSupported()) {
      this.hls = new Hls();
      this.hls.loadSource(streamUrl);
      this.hls.attachMedia(this.video);
      this.hls.on(Hls.Events.MANIFEST_PARSED, () => this.video?.play().catch(console.error));
    } else if (this.video.canPlayType('application/vnd.apple.mpegurl')) {
      this.video.src = streamUrl;
      this.video.addEventListener('loadedmetadata', () => this.video?.play().catch(console.error));
    }
  }
}
