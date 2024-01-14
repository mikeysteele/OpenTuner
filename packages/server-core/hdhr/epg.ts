import { XMLParser } from 'npm:fast-xml-parser@4.3.4';

export interface Program {
  title: string;
  start: Date;
  end: Date;
  desc?: string;
  channelId: string;
}

// Map of Channel ID -> Programs
type EpgData = Map<string, Program[]>;

const EPG_URL = 'https://i.mjh.nz/au/Melbourne/epg.xml';

export class EpgManager {
  private epgData: EpgData = new Map();
  private parser: XMLParser;

  constructor() {
    this.parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '',
    });
  }

  async fetchAndParse(url: string = EPG_URL): Promise<void> {
    try {
      console.log('Fetching EPG...');
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch EPG');
      const xmlData = await res.text();

      console.log('Parsing EPG...');
      const result = this.parser.parse(xmlData);

      if (!result.tv || !result.tv.programme) {
        console.error('Invalid XMLTV format');
        return;
      }

      const programmes = Array.isArray(result.tv.programme)
        ? result.tv.programme
        : [result.tv.programme];

      this.epgData.clear();

      for (const prog of programmes) {
        // XMLTV time format: YYYYMMDDhhmmss +0000
        // e.g. 20231214120000 +1100
        const start = this.parseXmlDate(prog.start);
        const end = this.parseXmlDate(prog.stop);
        const channelId = prog.channel;

        const program: Program = {
          title: prog.title?.['#text'] || prog.title || 'No Title',
          start,
          end,
          desc: prog.desc?.['#text'] || prog.desc,
          channelId,
        };

        if (!this.epgData.has(channelId)) {
          this.epgData.set(channelId, []);
        }
        this.epgData.get(channelId)!.push(program);
      }

      // Sort programs by time for each channel
      for (const [, progs] of this.epgData) {
        progs.sort((a, b) => a.start.getTime() - b.start.getTime());
      }

      console.log(`EPG Loaded. Covered channels: ${this.epgData.size}`);
    } catch (e) {
      console.error('EPG Error:', e);
    }
  }

  getPrograms(channelId: string): Program[] {
    return this.epgData.get(channelId) || [];
  }

  getCurrentProgram(channelId: string): Program | undefined {
    const now = new Date();
    const progs = this.epgData.get(channelId);
    if (!progs) return undefined;

    return progs.find((p) => p.start <= now && p.end > now);
  }

  private parseXmlDate(dateStr: string): Date {
    // Format: 20250614230000 +1100
    // Regex separation
    if (!dateStr) return new Date();
    const match = dateStr.match(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})\s?([+-]\d{4})?/);
    if (!match) return new Date();

    const [, year, month, day, hour, min, sec, offset] = match;

    // Construct ISO string with offset
    // logic: ISO requires YYYY-MM-DDTHH:mm:ss+HH:MM
    let offsetStr = 'Z';
    if (offset) {
      // +1100 -> +11:00
      offsetStr = `${offset.substring(0, 3)}:${offset.substring(3)}`;
    }

    const iso = `${year}-${month}-${day}T${hour}:${min}:${sec}${offsetStr}`;
    return new Date(iso);
  }
}

export const epgManager = new EpgManager();
