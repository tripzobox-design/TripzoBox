import React from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { createServer } from 'vite';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const storage = new Map([['tripzobox_auth_status', 'true']]);
globalThis.localStorage = { getItem: (key) => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value), removeItem: (key) => storage.delete(key) };
const server = await createServer({ root: fileURLToPath(new URL('.', import.meta.url)), server: { middlewareMode: true }, appType: 'custom' });
const originalError = console.error;
console.error = (...args) => { if (!String(args[0]).includes('useLayoutEffect does nothing on the server')) originalError(...args); };
try {
  const { AppRoutes } = await server.ssrLoadModule('/src/App.tsx');
  const providers = [];
  for (const name of ['Toast', 'Auth', 'Trips', 'Diary', 'Vault', 'Destinations']) {
    providers.push((await server.ssrLoadModule(`/src/context/${name}Context.tsx`))[`${name}Provider`]);
  }
  for (const [tool, expected] of [['diary/create-story', 'Compose Travel Story'], ['diary', 'Published Stories'], ['vault', 'Travel Vault'], ['messages', 'Messages'], ['notifications', 'Notifications'], ['profile', 'Profile'], ['trips/my', 'My Adventures'], ['explore', 'Explore destinations'], ['trips', 'Find Your Next Trip'], ['trips/trip_munnar_1', 'Munnar'], ['explore/munnar', 'Munnar']]) {
    let content = React.createElement(AppRoutes);
    for (const Provider of providers.toReversed()) content = React.createElement(Provider, null, content);
    content = React.createElement(MemoryRouter, { initialEntries: [tool === 'explore' || tool.startsWith('explore/') || tool === 'trips' ? '/' + tool : '/app/' + tool] }, content);
    const html = renderToString(content);
    assert.ok(!html.includes('Your Journey.'), `Homepage hero leaked into ${tool}`);
    assert.ok(html.includes(expected), `${tool} content missing`);
    assert.ok(!html.includes('<aside'), `Sidebar found for ${tool}`);
    console.log(`PASS: ${tool} renders at its own URL without a sidebar`);
  }
  storage.set('tripzobox_auth_status', 'false');
  let guest = React.createElement(AppRoutes);
  for (const Provider of providers.toReversed()) guest = React.createElement(Provider, null, guest);
  const html = renderToString(React.createElement(MemoryRouter, { initialEntries: ['/app/diary/create-story'] }, guest));

  assert.ok(!html.includes('Compose Travel Story'));
  console.log('PASS: guest cannot access the private story composer');
} finally {
  console.error = originalError;
  await server.close();
}
