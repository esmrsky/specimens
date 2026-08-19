#!/usr/bin/env node
// audit harness — drives real headless Chrome over CDP. No npm deps (Node ≥ 22 for built-in WebSocket).
//
//   node harness.mjs shots   <url> [--widths 375,1024,1280] [--themes light,dark] [--at sections|0,800,1600] [--out dir] [--reduced-motion]
//   node harness.mjs eval    <url> [--width 1280] [--theme light] --js "<expression>"      (prints JSON)
//   node harness.mjs paths   <url> --paths paths.json [--out dir] [--only name]           (runs interaction paths, prints pass/fail)
//
// Common flags: --wait ms (settle after load, default 3000)  --chrome /path/to/chrome  --mobile (touch + UA when width<700, default)
// `--at sections` = every element matching  main section, [data-audit-section]  or  --sections "<css selector>"
//
// paths.json shape:
// { "defaults": {"width":1280,"theme":"light"},
//   "paths": [ { "name": "tooltip-pins-on-click", "width": 1280, "theme": "light",
//                "steps": [ {"click": ".ref-link"}, {"wait": 1500},
//                           {"assert": "document.querySelector('.verse-tooltip').classList.contains('open')", "name": "tooltip open"},
//                           {"key": "Escape"}, {"wait": 300},
//                           {"assert": "!document.querySelector('.verse-tooltip').classList.contains('open')", "name": "Escape closes"},
//                           {"shot": "after-escape"} ] } ] }
// step kinds: click, hover, dblclick, type, key, scroll (y or selector), drag {from,to,steps}, wheel {selector,dx,dy}, eval, assert, wait, shot, reload
// Every step may carry "name". Assertions are JS expressions evaluated in-page; truthy = pass. Console errors + failed requests are collected per path.

import { spawn } from 'node:child_process';
import { writeFileSync, readFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const argv = process.argv.slice(2);
const cmd = argv[0]; const url = argv[1];
const flag = (n, d) => { const i = argv.indexOf('--' + n); return i > -1 ? (argv[i + 1] ?? true) : d; };
const has = n => argv.includes('--' + n);
if (!cmd || !url || !['shots', 'eval', 'paths'].includes(cmd)) { console.error('usage: harness.mjs shots|eval|paths <url> [flags]'); process.exit(2); }

const CHROME = flag('chrome', process.env.CHROME_BIN || ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/Applications/Chromium.app/Contents/MacOS/Chromium', '/usr/bin/google-chrome', '/usr/bin/chromium'].find(p => existsSync(p)));
if (!CHROME) { console.error('No Chrome found; pass --chrome or set CHROME_BIN'); process.exit(2); }
const OUT = flag('out', 'audit-out'); mkdirSync(OUT, { recursive: true });
const SETTLE = +flag('wait', 3000);
const sleep = ms => new Promise(r => setTimeout(r, ms));

// ---------- CDP plumbing ----------
async function launch() {
  const port = 9222 + Math.floor(Math.random() * 3000);
  const proc = spawn(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run', '--no-default-browser-check',
    '--user-data-dir=/tmp/audit-cdp-' + port, `--remote-debugging-port=${port}`, '--window-size=1280,800', 'about:blank'], { stdio: 'ignore' });
  let wsUrl;
  for (let i = 0; i < 60 && !wsUrl; i++) { try { wsUrl = (await (await fetch(`http://127.0.0.1:${port}/json/version`)).json()).webSocketDebuggerUrl; } catch { await sleep(200); } }
  if (!wsUrl) { proc.kill(); throw new Error('Chrome did not start'); }
  const ws = new WebSocket(wsUrl); await new Promise(r => ws.onopen = r);
  let id = 0; const pending = new Map(); const listeners = [];
  ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } else if (m.method) listeners.forEach(fn => fn(m)); };
  const send = (method, params = {}, sessionId) => new Promise((res, rej) => { const i = ++id; pending.set(i, m => m.error ? rej(new Error(method + ': ' + m.error.message)) : res(m.result)); ws.send(JSON.stringify({ id: i, method, params, sessionId })); });
  return { proc, ws, send, listeners, close() { try { ws.close(); } catch {} proc.kill(); } };
}

async function openPage(b, { width = 1280, height = 800, theme = 'light', reduced = false } = {}) {
  const { targetId } = await b.send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await b.send('Target.attachToTarget', { targetId, flatten: true });
  const s = (m, p) => b.send(m, p, sessionId);
  const log = { console: [], failed: [] };
  b.listeners.push(m => {
    if (m.sessionId !== sessionId) return;
    if (m.method === 'Runtime.consoleAPICalled' && ['error', 'warning'].includes(m.params.type)) log.console.push(m.params.type + ': ' + m.params.args.map(a => a.value ?? a.description ?? '').join(' ').slice(0, 300));
    if (m.method === 'Runtime.exceptionThrown') log.console.push('exception: ' + (m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text).slice(0, 300));
    if (m.method === 'Network.loadingFailed') log.failed.push('FAILED ' + (m.params.errorText || '') + ' ' + (log._urls?.[m.params.requestId] || m.params.requestId));
    if (m.method === 'Network.requestWillBeSent') { (log._urls ||= {})[m.params.requestId] = m.params.request.url; }
    if (m.method === 'Network.responseReceived' && m.params.response.status >= 400) log.failed.push(m.params.response.status + ' ' + m.params.response.url);
  });
  await s('Page.enable'); await s('Runtime.enable'); await s('Network.enable');
  const mobile = has('mobile') ? true : width < 700;
  await s('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile, screenWidth: width, screenHeight: height });
  if (mobile) { await s('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 }); await s('Emulation.setUserAgentOverride', { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1' }); }
  const features = [{ name: 'prefers-color-scheme', value: theme }];
  if (reduced) features.push({ name: 'prefers-reduced-motion', value: 'reduce' });
  await s('Emulation.setEmulatedMedia', { features });
  const ev = async (expression) => { const r = await s('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }); if (r.exceptionDetails) throw new Error('eval: ' + (r.exceptionDetails.exception?.description || r.exceptionDetails.text)); return r.result.value; };
  const nav = async (u) => { await s('Page.navigate', { url: u }); await sleep(SETTLE); };
  const shot = async (file) => { const r = await s('Page.captureScreenshot', { format: 'png' }); writeFileSync(file, Buffer.from(r.data, 'base64')); return file; };
  const center = async (sel) => { const r = await ev(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return null; e.scrollIntoView({block:'center', inline:'nearest'}); const b = e.getBoundingClientRect(); return {x: b.left + b.width/2, y: b.top + b.height/2}; })()`); if (!r) throw new Error('no element: ' + sel); await sleep(120); return r; };
  const mouse = async (type, x, y, extra = {}) => s('Input.dispatchMouseEvent', { type, x, y, button: 'left', clickCount: 1, ...extra });
  const click = async (sel, count = 1) => { const c = await center(sel); await mouse('mouseMoved', c.x, c.y); await mouse('mousePressed', c.x, c.y, { clickCount: count }); await mouse('mouseReleased', c.x, c.y, { clickCount: count }); };
  const hover = async (sel) => { const c = await center(sel); await mouse('mouseMoved', c.x, c.y); };
  const key = async (k) => { const code = k.length === 1 ? undefined : k; await s('Input.dispatchKeyEvent', { type: 'keyDown', key: k, code, windowsVirtualKeyCode: k === 'Escape' ? 27 : k === 'Enter' ? 13 : k === 'Tab' ? 9 : k === 'ArrowDown' ? 40 : k === 'ArrowUp' ? 38 : undefined }); await s('Input.dispatchKeyEvent', { type: 'keyUp', key: k, code }); };
  const type = async (text) => { for (const ch of text) await s('Input.dispatchKeyEvent', { type: 'char', text: ch }); };
  const drag = async ({ from, to, steps = 12, x, y, dx = 0, dy = 0 }) => { const a = from ? await center(from) : { x, y }; const b = to ? await center(to) : { x: a.x + dx, y: a.y + dy }; await mouse('mouseMoved', a.x, a.y); await mouse('mousePressed', a.x, a.y); for (let i = 1; i <= steps; i++) { await mouse('mouseMoved', a.x + (b.x - a.x) * i / steps, a.y + (b.y - a.y) * i / steps); await sleep(16); } await mouse('mouseReleased', b.x, b.y); };
  const wheel = async ({ selector, dx = 0, dy = 0 }) => { const c = selector ? await center(selector) : { x: width / 2, y: height / 2 }; await s('Input.dispatchMouseEvent', { type: 'mouseWheel', x: c.x, y: c.y, deltaX: dx, deltaY: dy }); };
  return { s, ev, nav, shot, click, hover, key, type, drag, wheel, log, mobile };
}

const themes = String(flag('themes', 'light')).split(',').filter(Boolean);
const widths = String(flag('widths', '1280')).split(',').map(Number).filter(Boolean);
const heightFor = w => (w < 700 ? 812 : w < 1100 ? 768 : 800);

// ---------- commands ----------
if (cmd === 'eval') {
  const b = await launch();
  try { const p = await openPage(b, { width: +flag('width', 1280), height: heightFor(+flag('width', 1280)), theme: flag('theme', 'light'), reduced: has('reduced-motion') }); await p.nav(url); const v = await p.ev(flag('js', 'document.title')); console.log(JSON.stringify(v, null, 1)); if (p.log.console.length || p.log.failed.length) console.error('console/network:', JSON.stringify({ console: p.log.console, failed: p.log.failed }, null, 1)); }
  finally { b.close(); }
}

if (cmd === 'shots') {
  const b = await launch();
  const at = flag('at', 'sections'); const sectionSel = flag('sections', 'main section, [data-audit-section]');
  const index = [];
  try {
    for (const theme of themes) for (const width of widths) {
      const p = await openPage(b, { width, height: heightFor(width), theme, reduced: has('reduced-motion') });
      await p.nav(url);
      let stops;
      if (at === 'sections') stops = await p.ev(`[...document.querySelectorAll(${JSON.stringify(sectionSel)})].map((e,i) => ({name: e.id || e.dataset.auditSection || ('s'+i), y: Math.round(e.getBoundingClientRect().top + scrollY)}))`);
      else stops = String(at).split(',').map(y => ({ name: 'y' + y, y: +y }));
      if (!stops.length) stops = [{ name: 'top', y: 0 }];
      for (const st of stops) {
        await p.ev(`window.scrollTo(0, ${st.y})`); await sleep(650);
        const file = join(OUT, `${theme}-${width}-${st.name}.png`); await p.shot(file); index.push(file);
      }
      const meta = await p.ev(`({ innerWidth, innerHeight, docW: document.documentElement.scrollWidth, docH: document.documentElement.scrollHeight, hScroll: document.documentElement.scrollWidth > innerWidth })`);
      console.log(`${theme} ${width}px: ${stops.length} shots · doc ${meta.docW}×${meta.docH}${meta.hScroll ? ' · HORIZONTAL OVERFLOW' : ''}${p.log.console.length ? ' · console: ' + p.log.console.length : ''}${p.log.failed.length ? ' · failed requests: ' + p.log.failed.length : ''}`);
      if (p.log.console.length || p.log.failed.length) console.log('  ' + [...p.log.console, ...p.log.failed].slice(0, 12).join('\n  '));
    }
  } finally { b.close(); }
  writeFileSync(join(OUT, 'index.txt'), index.join('\n') + '\n');
  console.log('wrote', index.length, 'files to', OUT);
}

if (cmd === 'paths') {
  const spec = JSON.parse(readFileSync(flag('paths'), 'utf8'));
  const only = flag('only', null);
  const b = await launch();
  const results = [];
  try {
    for (const path of spec.paths) {
      if (only && path.name !== only) continue;
      const cfg = { ...(spec.defaults || {}), ...path };
      const width = cfg.width || 1280;
      const p = await openPage(b, { width, height: heightFor(width), theme: cfg.theme || 'light', reduced: !!cfg.reducedMotion });
      const res = { name: path.name, width, theme: cfg.theme || 'light', asserts: [], errors: [], notes: [], shots: [] };
      try {
        await p.nav(cfg.url || url);
        for (const step of path.steps) {
          const label = step.name || Object.keys(step)[0] + ' ' + JSON.stringify(Object.values(step)[0]).slice(0, 60);
          try {
            if ('click' in step) await p.click(step.click);
            else if ('dblclick' in step) await p.click(step.dblclick, 2);
            else if ('hover' in step) await p.hover(step.hover);
            else if ('type' in step) await p.type(step.type);
            else if ('key' in step) await p.key(step.key);
            else if ('scroll' in step) { if (typeof step.scroll === 'number') await p.ev(`window.scrollTo(0, ${step.scroll})`); else await p.ev(`document.querySelector(${JSON.stringify(step.scroll)}).scrollIntoView({block:'start'})`); }
            else if ('drag' in step) await p.drag(step.drag);
            else if ('wheel' in step) await p.wheel(step.wheel);
            else if ('eval' in step) { const v = await p.ev(step.eval); if (step.print !== false) res.notes.push((step.name || 'eval') + ' → ' + JSON.stringify(v).slice(0, 400)); }
            else if ('assert' in step) { const v = await p.ev(step.assert); res.asserts.push({ name: step.name || step.assert.slice(0, 80), passed: !!v, value: JSON.stringify(v).slice(0, 200) }); }
            else if ('wait' in step) await sleep(step.wait);
            else if ('shot' in step) { const f = join(OUT, `${path.name}-${step.shot}.png`); await p.shot(f); res.shots.push(f); }
            else if ('reload' in step) await p.nav(cfg.url || url);
            else res.errors.push('unknown step ' + JSON.stringify(step));
          } catch (e) { res.errors.push(label + ': ' + e.message); if (step.assert) res.asserts.push({ name: step.name || step.assert.slice(0, 80), passed: false, value: 'ERROR ' + e.message }); }
        }
      } catch (e) { res.errors.push('path aborted: ' + e.message); }
      res.console = p.log.console.slice(0, 10); res.failedRequests = p.log.failed.slice(0, 10);
      results.push(res);
      const passed = res.asserts.filter(a => a.passed).length;
      console.log(`${res.asserts.length && passed === res.asserts.length && !res.errors.length ? 'PASS' : 'FAIL'}  ${path.name}  (${passed}/${res.asserts.length} asserts, ${width}px ${res.theme})`);
      res.asserts.filter(a => !a.passed).forEach(a => console.log(`      ✗ ${a.name}  → ${a.value}`));
      res.errors.forEach(e => console.log(`      ! ${e}`));
      res.notes.forEach(e => console.log(`      · ${e}`));
      if (res.console.length) console.log(`      console: ${res.console.join(' | ')}`);
      if (res.failedRequests.length) console.log(`      requests: ${res.failedRequests.join(' | ')}`);
    }
  } finally { b.close(); }
  writeFileSync(join(OUT, 'paths-results.json'), JSON.stringify(results, null, 1));
  const total = results.reduce((n, r) => n + r.asserts.length, 0), ok = results.reduce((n, r) => n + r.asserts.filter(a => a.passed).length, 0);
  console.log(`\n${ok}/${total} assertions passed across ${results.length} paths → ${join(OUT, 'paths-results.json')}`);
  process.exitCode = ok === total && results.every(r => !r.errors.length) ? 0 : 1;
}
