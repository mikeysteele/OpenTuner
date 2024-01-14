export class ProxyCache {
    private cache = new Map<string, {
        body: Uint8Array | string;
        headers: Headers;
        expires: number;
    }>();

    // Default TTLS:
    // Segments: Infinity (immutable)
    // Manifests: 2 seconds
    
    get(key: string): Response | null {
        const item = this.cache.get(key);
        if (!item) return null;

        if (Date.now() > item.expires) {
            this.cache.delete(key);
            return null;
        }

        // Clone headers to prevent side effects
        const headers = new Headers(item.headers);
        headers.set('X-Cache', 'HIT');
        const body = item.body instanceof Uint8Array ? [item.body] : item.body;
        return new Response(body, {
            status: 200,
            headers: headers
        });
    }

    async set(key: string, res: Response, ttlSeconds: number): Promise<void> {
        // We need to clone and read the body to cache it
        const cloned = res.clone();
        
        let body: Uint8Array | string;
        const contentType = res.headers.get('Content-Type');
        
        if (contentType && (contentType.includes('text') || contentType.includes('mpegurl'))) {
            body = await cloned.text();
        } else {
            const buffer = await cloned.arrayBuffer();
            body = new Uint8Array(buffer);
        }

        this.cache.set(key, {
            body,
            headers: res.headers,
            expires: Date.now() + (ttlSeconds * 1000)
        });
    }
}

export const hlsCache = new ProxyCache();
