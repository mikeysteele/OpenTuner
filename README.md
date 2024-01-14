# OpenTuner

OpenTuner is a robust stream proxy and lineup manager designed to bridge arbitrary M3U8 streams (like those from regional broadcasters) into a compliant standard that can be consumed by Jellyfin, Plex, or other IPTV clients. It handles stream rewrites, bot protection mitigation (header forwarding), and EPG proxying.

## Quick Start

### Local Development

Prerequisites: [Deno](https://deno.land/) (v1.46+ or v2.0+).

```bash
# Install dependencies and start both API and Web UI concurrrently
deno task start
```

- **API**: http://localhost:8000
- **Web UI**: http://localhost:5173

### Docker Deployment

You can also run OpenTuner with Docker.

```bash
docker compose up -d
```

## Features

- **Stream Proxying**: Rewrites HLS manifests to route segments through the server, allowing for header injection (e.g., User-Agent) to bypass bot protections.
- **Smart Channel Numbering**: Automatically preserves channel numbers from upstream if available (`tvg-chno`), and safely auto-assigns numbers for others.
- **Header Forwarding**: Mimics browser behavior by forwarding essential headers (`Accept`, `Referer`, `Origin`, etc.) to upstream servers.
- **Jellyfin Compatible**: Provides endpoints specifically formatted for Jellyfin Live TV.

## Configuration

### Jellyfin Live TV Setup

To add OpenTuner to Jellyfin:

1. **Tuner Device**:
   - Go to **Dashboard** -> **Live TV** -> **Tuner Devices**.
   - Click **(+) Add**.
   - **Tuner Type**: `M3U Tuner`.
   - **File or URL**: `http://<YOUR_LAN_IP>:8000/channels.m3u`
     _(Note: Use your actual LAN IP, e.g., `192.168.1.x`, not `localhost` if Jellyfin is running inside a container)._

2. **Guide Data (EPG)**:
   - Go to **Tv Guide Data Providers**.
   - Click **(+) Add**.
   - **Type**: `XMLTV`.
   - **File or URL**: `http://<YOUR_LAN_IP>:8000/epg.xml`

3. **Refresh Guide Data**:
   - Click "Refresh Guide Data" to populate the channels and schedule.

## Endpoints

- `GET /lineup.json`: HDHomeRun-compatible lineup JSON.
- `GET /channels.m3u`: M3U playlist for players/tuners.
- `GET /epg.xml`: Proxy for the XMLTV guide.
- `GET /stream/:id`: Direct stream proxy for a specific channel.
