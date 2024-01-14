export { createApp } from './app.ts';
export { Discovery } from './hdhr/discovery.ts';
export { fetchLineup } from './hdhr/lineup.ts';

import { Discovery } from './hdhr/discovery.ts';

export function startDiscovery(): Discovery {
  const discovery = new Discovery();
  discovery.start();
  return discovery;
}
