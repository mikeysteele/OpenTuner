import type { Context } from 'jsr:@hono/hono@4.11.0';
import type { Channel } from '../hdhr/lineup.ts';
import { streamManager } from './stream-manager.ts';
import { hlsCache } from './cache.ts';
// Helper to resolve redirects (e.g. 302 -> final URL)
async function resolveStreamUrl(url: string): Promise<string> {
  const controller = new AbortController();
  try {
    const res = await fetch(url, {
      redirect: 'follow',
      signal: controller.signal,
    });
    // We only care about the final URL, abort immediately to save BW
    controller.abort();
    return res.url;
  } catch (_e) {
    return url;
  }
}

const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36'
// Helper to rewrite M3U8 content

function rewriteUrl(url: string, finalUrl: string, proxyBase?: string): string {
        const absoluteUrl = new URL(url, finalUrl).toString();
        if (proxyBase) {
            return `${proxyBase}${encodeURIComponent(absoluteUrl)}`;
        }
        return absoluteUrl;
    };

function rewriteManifest(manifest: string, finalUrl: string, proxyBase?: string): string {
    return manifest.split('\n').map(line => {
        line = line.trim();
        if (!line) return line;

        if (line.startsWith('#')) {
            return line.replace(/URI="([^"]+)"/, (_match, uri) => {
                return `URI="${rewriteUrl(uri, finalUrl, proxyBase)}"`;
            });
        }

        if (line.startsWith('http') || !line.startsWith('#')) {
            return rewriteUrl(line, finalUrl, proxyBase);
        }
        
        return line;
    }).join('\n');
}

// Headers to forward to avoid bot detection
const FORWARD_HEADERS = [
    'accept',
    'accept-language',
    'range',
    'referer',
    'origin',
    'sec-fetch-dest',
    'sec-fetch-mode',
    'sec-fetch-site',
    'sec-fetch-user'
];

function getForwardHeaders(c: Context): Headers {
    const headers = new Headers();
    // Always set our fake User-Agent
    headers.set('User-Agent', USER_AGENT);

    // Forward specific headers from client
    for (const key of FORWARD_HEADERS) {
        const value = c.req.header(key);
        if (value) {
            headers.set(key, value);
        }
    }
    return headers;
}

export const genericProxy = async (c: Context) => {
  const url = c.req.query('url');
  if (!url) return c.text('Missing URL param', 400);
  // Check Cache
  const cached = hlsCache.get(url);
  if (cached) {
      console.log(`[Cache] HIT for ${url}`);
      // If it's an M3U8, we technically should rewrite it again just to be safe about the proxyBase
      // (e.g. if host changed), but usually host is stable.
      // However, we MUST check if it's a playlist to determine if we need to rewrite.
      // The cache stores the *raw* body or the *rewritten* body?
      // If we cache the rewritten body, we don't need to do anything.
      // BUT `streamProxy` caches the *rewritten* body.
      // `genericProxy` below caches the *raw* fetch response for segments.
      // Let's decide: Generic Proxy should cache the *upstream* content (raw), 
      // and ALWAYS rewrite if it's M3U8. This handles dynamic host headers best.
      
      // Wait, my `streamProxy` currently caches the REWRITTEN response.
      // That's fine for the master playlist.
      // For `genericProxy`, let's try to act smartly.
      // If we simply return cached response, and it was cached as raw upstream M3U8, it lacks rewriting.
      // We need to inspect content-type or extension.
  }

  try {
    let response: Response;
    let finalUrl = url;

    if (cached) {
        response = cached;
    } else {
        const headers = getForwardHeaders(c);
        const res = await fetch(url, {
            headers: headers
        });
        finalUrl = await resolveStreamUrl(res.url); // Capture final URL after redirects

        // Forward headers
        const respHeaders = new Headers(res.headers);
        respHeaders.set('Access-Control-Allow-Origin', '*');
        respHeaders.set('Cache-Control', 'max-age=3600'); 
        
        // Handle undefined body for 304s etc, though fetch usually has body
        const body = res.body || null;
        
        response = new Response(body, {
            status: res.status,
            headers: respHeaders
        });

        // Cache the raw response
        const isPlaylist = url.includes('.m3u8') || (res.headers.get('Content-Type') || '').includes('mpegurl');
        const ttl = isPlaylist ? 4 : 3600 * 24; // Slightly longer TTL for playlists? 2s is very short.
        await hlsCache.set(url, response, ttl);
    }

    // Now, if it IS a playlist, we must read it and rewrite it.
    // Content-Type check
    const contentType = response.headers.get('Content-Type') || '';
    if (url.includes('.m3u8') || contentType.includes('mpegurl') || contentType.includes('application/x-mpegURL')) {
        // It's a playlist! Rewrite it.
        const text = await response.text(); // Consumes the response body
        
        const host = c.req.header('host') || 'localhost:8000';
        const proto = c.req.header('x-forwarded-proto') || 'http';
        const proxyBase = `${proto}://${host}/proxy?url=`;
        
        const rewritten = rewriteManifest(text, finalUrl, proxyBase);
        
        return new Response(rewritten, {
            status: response.status,
            headers: response.headers
        });
    }

    return response;

  } catch (e) {
    console.error('Generic Proxy Error:', e);
    return c.text('Proxy Error', 502);
  }
};

export const streamProxy = (channels: Channel[]) => async (c: Context) => {
  const id = c.req.param('id');
  const format = c.req.query('format');
  const channel = channels.find((ch) => ch.GuideNumber === id);

  if (!channel) {
    return c.text('Channel not found', 404);
  }

  const clientHeaders = getForwardHeaders(c);

  // HLS Direct Mode: Proxy the M3U8 manifest
  if (format === 'hls') {
      const cacheKey = `manifest:${id}`;
      const cached = hlsCache.get(cacheKey);
      if (cached) return cached;
      
      console.log(`Proxying HLS stream for ${id}`);
      try {
        const finalUrl = await resolveStreamUrl(channel.URL); // Capture final URL after redirects
        console.log(`Final URL: ${finalUrl}`);
        const host = c.req.header('host') || 'localhost:8000';
        const proto = c.req.header('x-forwarded-proto') || 'http';
        const proxyBase = `${proto}://${host}/proxy?url=`;

        const res = await fetch(finalUrl, {
            headers: clientHeaders
        });
        const manifest = await res.text();

        const rewritten = rewriteManifest(manifest, finalUrl, proxyBase);

        const headers = new Headers(res.headers);
        headers.set('Access-Control-Allow-Origin', '*');
        headers.set('Content-Type', 'application/vnd.apple.mpegurl');
        headers.set('Cache-Control', 'max-age=2'); // Short cache for manifest
        
        const response = new Response(rewritten, {
            status: res.status,
            headers: headers
        });
        
        // Cache rewritten manifest for 2 seconds
        await hlsCache.set(cacheKey, response, 2);
        
        return response;
      } catch (e) {
          console.error(`HLS Proxy failed for ${id}:`, e);
          return c.text('Stream Proxy Failed', 502);
      }
  }

  // HDHomeRun/MPEG-TS Mode: Shared Stream Manager
  console.log(`Joining shared stream for channel ${id} (ts)...`);
  
  // Format headers for FFMPEG
  // Format: "Name: Value\r\nName2: Value2"
  let ffmpegHeaders = '';
  clientHeaders.forEach((value, key) => {
      ffmpegHeaders += `${key}: ${value}\r\n`;
  });

  const stream = streamManager.getOrCreate(id, () => {
      console.log(`Spawning FFMPEG for ${id}`);
      const args = [
          '-user_agent', USER_AGENT,
      ];
      
      if (ffmpegHeaders) {
          args.push('-headers', ffmpegHeaders);
      }

      args.push(
          '-i', channel.URL,
          '-c', 'copy',
          '-f', 'mpegts',
          '-loglevel', 'warning',
          'pipe:1',
      );

      const ffmpeg = new Deno.Command('ffmpeg', {
        args: args,
        stdout: 'piped',
        stderr: 'inherit',
      });
      return ffmpeg.spawn();
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'video/mp2t',
      'Access-Control-Allow-Origin': '*',
    },
  });
};
