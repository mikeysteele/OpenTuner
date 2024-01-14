import { Hono } from 'jsr:@hono/hono@4.11.0';
import { cors } from 'jsr:@hono/hono@4.11.0/cors';
import { Channel, fetchLineup } from './hdhr/lineup.ts';
import { streamProxy, genericProxy } from './streaming/proxy.ts';
import { epgManager, Program } from './hdhr/epg.ts';

export const createApp = async () => {
  const app = new Hono();

  // Enable CORS for development
  app.use('*', cors({
    origin: ['http://localhost:3000'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    exposeHeaders: ['Content-Length', 'X-Kuma-Revision'],
    maxAge: 600,
    credentials: true,
  }));

  // Initialize Lineup
  // In a real app, we might want background refreshing.
  console.log('Fetching Initial Lineup...');
  let channels: Channel[] = await fetchLineup();
  console.log(`Loaded ${channels.length} channels.`);

  // Split into numbered and unnumbered
  const numbered = channels.filter(ch => ch.GuideNumber !== undefined);
  const unnumbered = channels.filter(ch => ch.GuideNumber === undefined);

  // Sort numbered channels numerically
  numbered.sort((a, b) => {
    const numA = parseFloat(a.GuideNumber!);
    const numB = parseFloat(b.GuideNumber!);
    return numA - numB;
  });

  // Find max number to determine starting point for auto-numbering
  let maxNum = 0;
  if (numbered.length > 0) {
      const last = numbered[numbered.length - 1];
      maxNum = parseFloat(last.GuideNumber!);
  }

  // Determine base (next power of 10)
  // e.g. 87 -> 100, 108 -> 1000
  let base = 100;
  if (maxNum >= 100) base = 1000;
  if (maxNum >= 1000) base = 10000;

  // Assign numbers to unnumbered channels
  unnumbered.forEach((ch, index) => {
      ch.GuideNumber = (base + index).toString();
  });

  // Merge back
  channels = [...numbered, ...unnumbered];

  // Initialize EPG (non-blocking in background ideally, but here we await for simplicity or fire and forget)
  // Fire and forget to not block startup
  epgManager.fetchAndParse().then(() => console.log('EPG Initialized'));

  app.get('/', (c) => c.text('OpenTuner Server Running'));

  // HDHomeRun Emulation Endpoints

  // Legacy /lineup.json
  app.get('/lineup.json', (c) => {
    const validChannels = channels.filter(ch => ch.GuideNumber);
    return c.json(validChannels.map((ch) => ({
      GuideNumber: ch.GuideNumber,
      GuideName: ch.GuideName,
      GuideId: ch.GuideId, // Expose ID for client matching
      URL: `http://${c.req.header('host')}/stream/${ch.GuideNumber}`, // Local proxy URL
      // Attach current EPG data if available
      CurrentProgram: ch.GuideId ? epgManager.getCurrentProgram(ch.GuideId) : undefined,
    })));
  });

  // Device Info (discover.json)
  app.get('/discover.json', (c) => {
    return c.json({
      FriendlyName: 'OpenTuner',
      ModelNumber: 'HDHR4-2US', // Emulate a known model
      FirmwareName: 'hdhomerun_4_2us',
      TunerCount: 2,
      DeviceID: '12345678',
      DeviceAuth: 'test',
      BaseURL: `http://${c.req.header('host')}`,
      LineupURL: `http://${c.req.header('host')}/lineup.json`,
    });
  });

  // EPG Endpoint
  app.get('/epg/:id', (c) => {
    const id = c.req.param('id');
    // If client sends numeric ID, we need to map to GuideId?
    // Or client sends the GuideId directly.
    // Let's assume client matches GuideId from lineup.json
    const progs = epgManager.getPrograms(id);
    return c.json(progs);
  });

  // Bulk current EPG for "Now" view
  app.get('/epg/now', (c) => {
    // Returns a map of GuideId -> Current Program
    const nowData: Record<string, Program> = {};
    for (const ch of channels) {
      if (ch.GuideId) {
        const prog = epgManager.getCurrentProgram(ch.GuideId);
        if (prog) nowData[ch.GuideId] = prog;
      }
    }
    return c.json(nowData);
  });

  // Proxy the full XMLTV for Jellyfin
  app.get('/epg.xml', async (c) => {
    const res = await fetch('https://i.mjh.nz/au/Melbourne/epg.xml');
    c.header('Content-Type', 'application/xml');
    if (!res.body) return c.text('No EPG Data', 500);
    return c.body(res.body); 
  });

  // M3U Playlist for HLS Tuners (using ?format=hls)
  app.get('/channels.m3u', (c) => {
    const host = c.req.header('host');
    let m3u = '#EXTM3U\n';
    for(const ch of channels) {
      if (!ch.GuideNumber) continue;
      m3u += `#EXTINF:-1 tvg-id="${ch.GuideId || ''}" tvg-chno="${ch.GuideNumber}" tvg-name="${ch.GuideName}",${ch.GuideName}\n`;
      m3u += `http://${host}/stream/${ch.GuideNumber}?format=hls\n`;
    }
    c.header('Content-Type', 'audio/x-mpegurl'); // Standard M3U mime
    return c.text(m3u);
  });

  // Stream Proxy
  app.get('/stream/:id', streamProxy(channels));
  
  // Generic Proxy mainly for internal HLS segments
  app.get('/proxy', genericProxy);

  return app;
};
