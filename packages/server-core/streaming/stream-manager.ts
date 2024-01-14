export class SharedStream {
  private listeners: Set<ReadableStreamDefaultController<Uint8Array>> = new Set();
  private process: Deno.ChildProcess | null = null;
  private killed = false;

  constructor(
    public id: string,
    private spawnFn: () => Deno.ChildProcess,
    private onStop: () => void
  ) {}

  addConsumer(): ReadableStream<Uint8Array> {
    if (!this.process && !this.killed) {
      this.start();
    }

    let streamController: ReadableStreamDefaultController<Uint8Array>;

    return new ReadableStream({
      start: (controller) => {
        streamController = controller;
        this.listeners.add(controller);
      },
      cancel: () => {
        this.listeners.delete(streamController);
        if (this.listeners.size === 0) {
          this.stop();
        }
      },
    });
  }

  private async start() {
    console.log(`[StreamManager] Starting shared stream for ${this.id}`);
    this.process = this.spawnFn();
    this.killed = false;

    // Read stdout and fan out
    try {
        const reader = this.process.stdout.getReader();
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            // Fan out to all listeners
            for (const controller of this.listeners) {
                try {
                    controller.enqueue(value);
                } catch(_e) {
                    console.error(`[StreamManager] Error enqueueing to listener:`, _e);
                    this.listeners.delete(controller);
                }
            }
        }
    } catch (e) {
        console.error(`[StreamManager] Stream error for ${this.id}:`, e);
    } finally {
        this.stop();
    }
  }

  stop() {
    if (this.killed) return;
    this.killed = true;
    console.log(`[StreamManager] Stopping shared stream for ${this.id}`);
    
    // Close all listeners
    for (const controller of this.listeners) {
        try { controller.close(); } catch(_e) { /* ignore */ }
    }
    this.listeners.clear();

    if (this.process) {
        try { this.process.kill(); } catch (_e) { /* ignore */ }
        this.process = null;
    }
    
    this.onStop();
  }
}

export class StreamManager {
    private streams: Map<string, SharedStream> = new Map();

    getOrCreate(id: string, spawnFn: () => Deno.ChildProcess): ReadableStream<Uint8Array> {
        let stream = this.streams.get(id);
        if (!stream) {
            stream = new SharedStream(id, spawnFn, () => {
                this.streams.delete(id);
            });
            this.streams.set(id, stream);
        }
        return stream.addConsumer();
    }
}

export const streamManager = new StreamManager();
