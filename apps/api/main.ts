import { createApp, startDiscovery } from '@opentuner/core';

console.log('Starting OpenTuner API...');

// Start UDP Discovery in the background
try {
  startDiscovery();
  console.log('Discovery service started.');
} catch (e) {
  console.error('Failed to start discovery:', e);
}

// Initialize and Serve App
try {
  const app = await createApp();
  console.log('HTTP Server ready.');

  Deno.serve({ port: 8000 }, app.fetch);
} catch (e) {
  console.error('Failed to start server:', e);
  Deno.exit(1);
}
