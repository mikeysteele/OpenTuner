export interface Channel {
  GuideNumber?: string;
  GuideName: string;
  GuideId?: string;
  URL: string;
}

export const MELBOURNE_M3U8_URL = 'https://i.mjh.nz/au/Melbourne/raw-tv.m3u8';

export async function fetchLineup(url: string = MELBOURNE_M3U8_URL): Promise<Channel[]> {
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.error(`Failed to fetch lineup: ${res.statusText}`);
      return [];
    }
    const text = await res.text();
    return parseM3U8(text);
  } catch (e) {
    console.error('Error fetching lineup:', e);
    return [];
  }
}

export function parseM3U8(content: string): Channel[] {
  const lines = content.split('\n');
  const channels: Channel[] = [];
  let currentChannel: Partial<Channel> = {};

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('#EXTINF:')) {
      const info = line.substring(8);

      // Basic regex to extract tvg-chno and name
      // Note: This is a loose parser.
      const numberMatch = info.match(/tvg-chno="([^"]+)"/);
      const nameMatch = info.match(/tvg-name="([^"]+)"/);
      const idMatch = info.match(/tvg-id="([^"]+)"/);
      const commaIndex = info.lastIndexOf(',');
      const rawName = commaIndex !== -1 ? info.substring(commaIndex + 1).trim() : 'Unknown';

      currentChannel = {
        GuideNumber: numberMatch ? numberMatch[1] : undefined,
        GuideName: nameMatch ? nameMatch[1] : rawName,
        GuideId: idMatch ? idMatch[1] : undefined,
      };
    } else if (line.startsWith('http')) {
      // Allow channels without guide numbers if name exists
      if (currentChannel.GuideName) {
        currentChannel.URL = line;
        channels.push(currentChannel as Channel);
        currentChannel = {};
      }
    }
  }
  return channels;
}
