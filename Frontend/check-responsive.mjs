import { spawn } from 'node:child_process';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const directory = await mkdtemp(join(tmpdir(), 'tripzobox-responsive-'));
const browser = spawn('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', ['--headless=new', '--disable-gpu', '--no-first-run', '--remote-debugging-port=9332', `--user-data-dir=${directory}`, 'about:blank'], { windowsHide: true, stdio: 'ignore' });
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let socket;
try {
  let pages;
  for (let attempt = 0; attempt < 40; attempt++) {
    try { pages = await (await fetch('http://127.0.0.1:9332/json')).json(); if (pages.some((page) => page.type === 'page')) break; } catch {}
    await delay(250);
  }
  if (!pages) throw new Error('Headless browser could not start');
  socket = new WebSocket(pages.find((page) => page.type === 'page').webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
  let nextId = 0;
  const pending = new Map();
  socket.onmessage = ({ data }) => { const message = JSON.parse(data); const entry = pending.get(message.id); if (entry) { pending.delete(message.id); message.error ? entry.reject(new Error(message.error.message)) : entry.resolve(message.result); } };
  const call = (method, params = {}) => new Promise((resolve, reject) => { const id = ++nextId; pending.set(id, { resolve, reject }); socket.send(JSON.stringify({ id, method, params })); });
  const evaluate = async (expression) => (await call('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })).result.value;
  await call('Page.enable');
  await call('Page.addScriptToEvaluateOnNewDocument', { source: "localStorage.setItem('tripzobox_auth_status','true');" });
  const failures = [];
  const routes = process.argv.includes('--carousel-only') ? ['/'] : process.argv.includes('--stories-only') ? ['/stories'] : process.argv.includes('--about-only') ? ['/about'] : ['/', '/explore', '/trips', '/app/diary/create-story', '/app/vault', '/app/profile', '/app/messages', '/about', '/app/diary/add', '/app/trips/create', '/explore/create', '/login', '/signup', '/forgot-password', '/safety', '/contact', '/community-rules', '/stories', '/privacy', '/app/profile?tab=settings'];
  const widths = process.argv.includes('--carousel-only') ? [390] : [320, 390, 768, 900, 1024, 1440];
  for (const width of widths) {
    await call('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: width < 640 });
    for (const route of routes) {
      await call('Page.navigate', { url: `http://127.0.0.1:5173${route}` });
      for (let attempt = 0; attempt < 80; attempt++) {
        if (await evaluate(`location.pathname === ${JSON.stringify(route.split('?')[0])} && Boolean(document.querySelector('#root h1, #root h2'))`)) break;
        await delay(100);
      }
      await delay(250);
      const result = await evaluate(`(() => {
        const width = document.documentElement.clientWidth;
        const overflow = document.documentElement.scrollWidth > width + 2;
        return { overflow, width, scroll: document.documentElement.scrollWidth, title: document.querySelector('#root h1, #root h2')?.textContent,
          elements: overflow ? [...document.querySelectorAll('main *, header *')].filter(e => { const r=e.getBoundingClientRect(); return r.width>0 && (r.right>width+2 || r.left < -2) && getComputedStyle(e).position!=='absolute'; }).slice(0,8).map(e=>({tag:e.tagName, class:e.className, text:e.textContent?.slice(0,45)})) : [] };
      })()`);
      if (route === '/' && width >= 640 && width < 1024) {
        const heroFits = await evaluate("document.querySelector('[data-layout=hero-content]').getBoundingClientRect().width >= innerWidth * .95");
        if (!heroFits) failures.push({ route, width, issue: 'Tablet hero leaves excessive side margins' });
        await mkdir('.responsive-check', { recursive: true });
        await writeFile(`.responsive-check/tablet-home-${width}.png`, Buffer.from((await call('Page.captureScreenshot', { format: 'png' })).data, 'base64'));
      }
      if (!result.title || result.overflow) { failures.push({ route, width, ...result }); console.log(JSON.stringify(failures.at(-1))); }
      if (width === 390 && route === '/') {
        await mkdir('.responsive-check', { recursive: true });
        await writeFile('.responsive-check/mobile-home.png', Buffer.from((await call('Page.captureScreenshot', { format: 'png' })).data, 'base64'));
      }
    }
    console.log(`Checked ${routes.length} routes at ${width}px`);
  }
  await call('Emulation.setDeviceMetricsOverride', { width: 390, height: 700, deviceScaleFactor: 1, mobile: true });
  const navigate = async (path) => {
    await call('Page.navigate', { url: `http://127.0.0.1:5173${path}` });
    for (let i = 0; i < 80; i++) { if (await evaluate(`location.pathname === ${JSON.stringify(path.split('?')[0])} && Boolean(document.querySelector('#root h1, #root h2'))`)) break; await delay(100); }
    await delay(200);
  };
  await navigate('/');
  for (let i = 0; i < 30; i++) {
    if (await evaluate("document.querySelector('[aria-label=\"Trending destination carousel\"]')?.scrollLeft > 100")) break;
    await delay(100);
  }
  await evaluate("document.querySelector('button[aria-label=\"Show Manali, India\"]')?.click()");
  await delay(700);
  const carousel = await evaluate("document.querySelector('button[aria-label=\"Show Manali, India\"]')?.getAttribute('aria-pressed') === 'true'");
  if (!carousel) { console.log(await evaluate(`JSON.stringify({dots:[...document.querySelectorAll('button[aria-label^="Show "]')].map(b=>[b.ariaLabel,b.getAttribute('aria-pressed')]), row: [...document.querySelectorAll('[aria-label="Trending destination carousel"]')].map(e=>({scroll:e.scrollLeft,width:e.clientWidth,cards:[...e.children].map(c=>({offset:c.offsetLeft,width:c.clientWidth}))}))})`)); failures.push({ interaction: 'Mobile destination carousel dots' }); }
  const beforeMenuHeight = await evaluate('document.documentElement.scrollHeight');
  await evaluate("document.querySelector('[aria-label=\"Toggle Navigation Menu\"]')?.click()");
  await delay(300);
  const menu = await evaluate(`(() => { const d=document.querySelector('#mobile-navigation[open]'); if(!d) return false; const r=d.getBoundingClientRect(); return r.left>0 && r.right<=390 && r.bottom<=700 && document.body.style.overflow==='hidden' && document.documentElement.scrollHeight===${beforeMenuHeight}; })()`);
  await evaluate("document.querySelector('#mobile-navigation a[href=\"/explore\"]')?.click()");
  await delay(350);
  const menuClosed = await evaluate("location.pathname==='/explore' && !document.querySelector('#mobile-navigation[open]') && document.body.style.overflow!=='hidden'");
  if (!menu || !menuClosed) failures.push({ interaction: 'Animated menu overlays page and closes after navigation', menu, menuClosed });
  await navigate('/app/messages');
  await evaluate("[...document.querySelectorAll('main button')].find(b=>b.querySelector('img'))?.click()");
  await delay(100);
  const chat = await evaluate("document.querySelector('input[aria-label=Message]')?.getBoundingClientRect().width > 0");
  await evaluate("document.querySelector('[aria-label=\"Back to conversations\"]')?.click()");
  await delay(100);
  const list = await evaluate("document.querySelector('input[aria-label=\"Search trip chats\"]')?.getBoundingClientRect().width > 0");
  if (!chat || !list) failures.push({ interaction: 'Mobile conversation navigation', chat, list });
  await navigate('/trips');
  const heightBeforeFilters = await evaluate('document.documentElement.scrollHeight');
  await evaluate("[...document.querySelectorAll('button')].find(b=>b.textContent.includes('Filters'))?.click()");
  await delay(300);
  const filters = await evaluate(`(() => { const d=document.querySelector('dialog[open]'); if(!d) return false; const r=d.getBoundingClientRect(); return r.right<=390 && r.left>=0 && r.bottom<=700 && document.documentElement.scrollHeight === ${heightBeforeFilters}; })()`);
  await evaluate("[...document.querySelectorAll('dialog footer button')].find(b=>b.textContent.startsWith('Show'))?.click()");
  await delay(300);
  const filtersClosed = await evaluate("!document.querySelector('dialog[open]')");
  if (!filters || !filtersClosed) failures.push({ interaction: 'Filter drawer opens without stretching page and Show Results closes it', filters, filtersClosed });
  await evaluate("[...document.querySelectorAll('button')].find(b=>b.textContent.includes('Create a trip'))?.click()");
  await delay(200);
  const dialog = await evaluate(`(() => { const d=document.querySelector('[role=dialog]'); if(!d) return false; const r=d.getBoundingClientRect(); const title=d.querySelector('#create-trip-room-title'); const before=title.getBoundingClientRect().top; d.scrollTop=250; return r.left>=0 && r.right<=390 && r.top>=0 && r.bottom<=700 && d.scrollHeight>d.clientHeight && title.getBoundingClientRect().top<before-100 && document.body.style.overflow==='hidden'; })()`);
  if (!dialog) failures.push({ interaction: 'Trip dialog fits mobile viewport and scrolls' });
  await navigate('/app/notifications');
  const notificationCount = await evaluate("[...document.querySelectorAll('main button')].filter(b=>b.textContent.includes('Trip Invite Accepted') || b.textContent.includes('New Story Kudos') || b.textContent.includes('Story Trending in Community')).length");
  await evaluate("[...document.querySelectorAll('main button')].find(b=>b.textContent.includes('Trip Invite Accepted'))?.click()");
  await delay(350);
  const notificationRedirect = await evaluate("location.pathname==='/app/trips/trip_munnar_1'");
  await navigate('/app/notifications');
  const notificationRead = await evaluate("[...document.querySelectorAll('main button')].find(b=>b.textContent.includes('Trip Invite Accepted'))?.className.includes('bg-white hover')");
  if (notificationCount < 3 || !notificationRedirect || !notificationRead) failures.push({ interaction: 'Notifications show all items, redirect, and retain read status', notificationCount, notificationRedirect, notificationRead });
  await navigate('/app/diary/create-story');
  await evaluate("[...document.querySelectorAll('main button')].find(b=>b.textContent.includes('Search & select experiences'))?.click()");
  await delay(300);
  const pickerLimited = await evaluate("document.querySelectorAll('dialog button[aria-pressed]').length<=5 && document.querySelectorAll('dialog button[aria-pressed]').length>0");
  await evaluate(`(() => { const input=document.querySelector('input[aria-label="Search diary experiences"]'); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'Varkala'); input.dispatchEvent(new Event('input',{bubbles:true})); })()`);
  await delay(100);
  await evaluate("[...document.querySelectorAll('dialog button[aria-pressed]')].find(b=>b.textContent.includes('Varkala'))?.click()");
  await evaluate("document.querySelector('dialog footer button')?.click()");
  await delay(300);
  const pickerSelection = await evaluate("!!document.querySelector('button[aria-label=\"Remove Varkala from story\"]') && !document.querySelector('dialog[open]')");
  if (!pickerLimited || !pickerSelection) failures.push({ interaction: 'Experience picker limits rows, searches, and retains selections', pickerLimited, pickerSelection });
  console.log(JSON.stringify({ checks: routes.length * widths.length, mobileInteractions: { carousel, menu, menuClosed, chat, list, filters, filtersClosed, dialog, notificationRedirect, notificationRead, pickerLimited, pickerSelection }, failures: failures.length }));
  process.exitCode = failures.length ? 1 : 0;
} finally {
  socket?.close();
  browser.kill();
}
