const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const vm = require('node:vm');
const zlib = require('node:zlib');
const { spawn } = require('node:child_process');
const { once } = require('node:events');
const root = path.join(__dirname, '..');
const folders = [
  'ejercicio-1-manifest', 'ejercicio-2-app-shell', 'ejercicio-3-service-worker',
  'ejercicio-4-cache-first', 'ejercicio-5-offline'
];
function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}
for (const [index, folder] of folders.entries()) {
  test(`Ejercicio ${index + 1}: manifiesto, referencias, PNG y sintaxis`, async () => {
    const directory = path.join(root, folder);
    const manifest = JSON.parse(await fs.readFile(path.join(directory, 'manifest.json'), 'utf8'));
    for (const property of ['name', 'short_name', 'start_url', 'display', 'theme_color', 'background_color']) assert.ok(manifest[property]);
    assert.equal(manifest.display, 'standalone');
    assert.equal(manifest.start_url, './');
    assert.equal(manifest.scope, './');
    assert.equal(manifest.theme_color, '#123c69');
    assert.equal(manifest.background_color, '#eef4fa');
    assert.deepEqual(manifest.icons.map((icon) => icon.sizes), ['192x192', '512x512']);
    const html = await fs.readFile(path.join(directory, 'index.html'), 'utf8');
    assert.match(html, /rel="manifest" href="\.\/manifest.json"/);
    for (const name of await fs.readdir(directory)) {
      if (/\.(js|cjs)$/.test(name)) new vm.Script(await fs.readFile(path.join(directory, name), 'utf8'), { filename: name });
      if (!name.endsWith('.html')) continue;
      const content = await fs.readFile(path.join(directory, name), 'utf8');
      for (const match of content.matchAll(/(?:src|href)="(\.\/[^"#]+)"/g)) {
        const target = path.join(directory, match[1]);
        assert.ok(await fs.stat(target), `Referencia inexistente: ${name} → ${match[1]}`);
      }
    }
    assert.match(html, /rel="apple-touch-icon" href="\.\/icons\/icon-192\.png"/);
    if (index === 1) {
      assert.match(html, /name="apple-mobile-web-app-capable" content="yes"/);
      const startup = [...html.matchAll(/rel="apple-touch-startup-image" href="(\.\/splash\/iphone-(\d+)x(\d+)\.png)" media="\(device-width: (\d+)px\) and \(device-height: (\d+)px\) and \(-webkit-device-pixel-ratio: (\d)\)/g)];
      assert.equal(startup.length, 12);
      for (const [, href, width, height, cssWidth, cssHeight, ratio] of startup) {
        assert.equal(Number(width), Number(cssWidth) * Number(ratio), href);
        assert.equal(Number(height), Number(cssHeight) * Number(ratio), href);
        const png = await fs.readFile(path.join(directory, href));
        assert.equal(png.readUInt32BE(16), Number(width));
        assert.equal(png.readUInt32BE(20), Number(height));
      }
    }
    for (const icon of manifest.icons) {
      assert.equal(icon.type, 'image/png');
      const size = Number(icon.sizes.split('x')[0]);
      const png = await fs.readFile(path.join(directory, icon.src));
      assert.deepEqual(png.subarray(0, 8), Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
      assert.equal(png.readUInt32BE(16), size);
      assert.equal(png.readUInt32BE(20), size);
      const data = [];
      let end = false;
      for (let offset = 8; offset < png.length;) {
        const length = png.readUInt32BE(offset);
        const type = png.toString('ascii', offset + 4, offset + 8);
        assert.equal(png.readUInt32BE(offset + 8 + length), crc32(png.subarray(offset + 4, offset + 8 + length)));
        if (type === 'IDAT') data.push(png.subarray(offset + 8, offset + 8 + length));
        if (type === 'IEND') end = true;
        offset += length + 12;
      }
      assert.ok(end);
      assert.equal(zlib.inflateSync(Buffer.concat(data)).length, (size * 3 + 1) * size);
    }
  });
}
async function worker(number, options = {}) {
  const directory = path.join(root, folders[number - 1]);
  const scope = `https://example.test/repositorio-${number}/`;
  const listeners = new Map();
  const stores = new Map();
  const network = [];
  const messages = [];
  const logs = [];
  let claimed = false;
  let offline = false;
  const key = (request) => typeof request === 'string' ? request : request.url;
  const fetchMock = async (request) => {
    const url = key(request);
    network.push(url);
    if (offline || url.endsWith(options.failFile || '/imposible')) throw new TypeError('Network offline');
    let relative = url.slice(scope.length).split('?')[0] || 'index.html';
    if (relative.endsWith('/')) relative += 'index.html';
    try {
      const body = await fs.readFile(path.join(directory, relative));
      return new Response(body, { headers: { 'Content-Type': relative.endsWith('.html') ? 'text/html; charset=utf-8' : 'application/octet-stream' } });
    } catch (error) {
      if (error.code !== 'ENOENT' && error.code !== 'ENOTDIR') throw error;
      return new Response('No encontrado', { status: 404 });
    }
  };
  const caches = {
    async open(name) {
      if (!stores.has(name)) stores.set(name, new Map());
      const items = stores.get(name);
      return {
        async match(request) { return items.get(key(request))?.clone(); },
        async addAll(requests) {
          const pending = [];
          for (const request of requests) {
            const response = await fetchMock(request);
            if (!response.ok) throw new TypeError('Precache failed');
            pending.push([key(request), response]);
          }
          for (const [url, response] of pending) items.set(url, response.clone());
        }
      };
    },
    async keys() { return [...stores.keys()]; },
    async delete(name) { return stores.delete(name); }
  };
  const self = {
    registration: { scope },
    location: { origin: new URL(scope).origin },
    addEventListener(type, listener) { listeners.set(type, listener); },
    clients: {
      async claim() { claimed = true; },
      async matchAll() {
        return [
          { url: scope, postMessage: (message) => messages.push(message) },
          { url: 'https://example.test/otra/', postMessage: () => assert.fail('Mensaje fuera del scope') }
        ];
      }
    }
  };
  const context = vm.createContext({
    self, caches, fetch: fetchMock, URL, Request, Response,
    console: Object.fromEntries(['info', 'warn', 'error'].map((level) => [level, (...args) => logs.push({ level, args })]))
  });
  new vm.Script(await fs.readFile(path.join(directory, 'sw.js'), 'utf8')).runInContext(context);
  async function lifecycle(type) {
    let promise;
    listeners.get(type)({ waitUntil(value) { promise = value; } });
    assert.ok(promise);
    await promise;
  }
  async function request(relative, extra = {}) {
    let promise;
    listeners.get('fetch')({
      request: { url: new URL(relative, scope).href, method: 'GET', mode: 'navigate', ...extra },
      respondWith(value) { promise = value; }
    });
    return promise ? await promise : undefined;
  }
  return {
    scope, listeners, stores, network, messages, logs, lifecycle, request,
    setOffline(value) { offline = value; },
    get claimed() { return claimed; }
  };
}
test('Ejercicio 3: install, activate, control de clientes y fetch de red', async () => {
  const w = await worker(3);
  assert.deepEqual([...w.listeners.keys()], ['install', 'activate', 'fetch']);
  await w.lifecycle('install');
  await w.lifecycle('activate');
  assert.ok(w.claimed);
  assert.equal(w.messages.map((message) => message.phase).join(','), 'install,activate');
  assert.equal((await w.request('./')).status, 200);
  assert.equal(w.stores.size, 0);
  assert.equal(await w.request('./', { method: 'POST' }), undefined);
  assert.equal(await w.request('https://external.test/'), undefined);
  w.setOffline(true);
  await assert.rejects(w.request('./'), /Network offline/);
});
for (const number of [4, 5]) {
  test(`Ejercicio ${number}: precache completo y limpieza aislada`, async () => {
    const w = await worker(number);
    const prefix = `pwa-e${number}-${new URL(w.scope).pathname}-`;
    w.stores.set(`${prefix}v0`, new Map());
    w.stores.set(`pwa-e${number}-/otro-repositorio/-v0`, new Map());
    w.stores.set('cache-ajena', new Map());
    await w.lifecycle('install');
    const active = w.stores.get(`${prefix}v1`);
    assert.equal(active.size, number === 4 ? 7 : 9);
    assert.ok(active.has(w.scope));
    assert.ok(active.has(`${w.scope}icons/icon-512.png`));
    assert.ok(!active.has(`${w.scope}pagina-no-cacheada.html`));
    await w.lifecycle('activate');
    assert.ok(w.claimed);
    assert.ok(!w.stores.has(`${prefix}v0`));
    assert.ok(w.stores.has(`pwa-e${number}-/otro-repositorio/-v0`));
    assert.ok(w.stores.has('cache-ajena'));
  });
  test(`Ejercicio ${number}: instalación fallida no anuncia éxito`, async () => {
    const w = await worker(number, { failFile: 'icon-512.png' });
    await assert.rejects(w.lifecycle('install'), /Network offline/);
    assert.ok(!w.claimed);
    assert.ok(!w.logs.some((entry) => entry.level === 'info'));
    const entries = [...w.stores.values()][0];
    assert.equal(entries.size, 0);
  });
  test(`Ejercicio ${number}: Cache-First real sin red para el App Shell`, async () => {
    const w = await worker(number);
    await w.lifecycle('install');
    await w.lifecycle('activate');
    w.network.length = 0;
    w.setOffline(true);
    for (const resource of ['./', './index.html', './styles.css', './app.js', './manifest.json', './icons/icon-192.png', './icons/icon-512.png']) {
      assert.equal((await w.request(resource)).status, 200);
    }
    assert.equal(w.network.length, 0);
    assert.equal(await w.request('./', { method: 'POST' }), undefined);
    assert.equal(await w.request('https://external.test/resource'), undefined);
  });
  test(`Ejercicio ${number}: no oculta HTTP 404 ni almacena recursos dinámicos`, async () => {
    const w = await worker(number);
    await w.lifecycle('install');
    w.network.length = 0;
    assert.equal((await w.request('./no-existe.html')).status, 404);
    assert.equal((await w.request('./index.html?consulta=1')).status, 200);
    assert.equal(w.network.length, 2);
    for (const items of w.stores.values()) assert.ok(!items.has(`${w.scope}index.html?consulta=1`));
  });
}
test('Ejercicio 4: recurso no cacheado offline devuelve texto y HTTP 503', async () => {
  const w = await worker(4);
  await w.lifecycle('install');
  w.setOffline(true);
  const response = await w.request('./no-guardado.html');
  assert.equal(response.status, 503);
  assert.match(response.headers.get('Content-Type'), /text\/plain/);
  assert.match(await response.text(), /Sin conexión/);
  assert.ok(w.logs.some((entry) => entry.level === 'warn'));
});
test('Ejercicio 5: fallback HTML, subrutas, reintento y recursos no HTML', async () => {
  const w = await worker(5);
  await w.lifecycle('install');
  assert.match(await (await w.request('./pagina-no-cacheada.html')).text(), /Esta página llegó desde la red/);
  w.setOffline(true);
  for (const resource of ['./pagina-no-cacheada.html', './subruta/profunda/no-guardada.html']) {
    const response = await w.request(resource);
    assert.equal(response.status, 503);
    assert.match(response.headers.get('Content-Type'), /text\/html/);
    const body = await response.text();
    assert.match(body, /Modo Sin Conexión/);
    assert.ok(body.includes(`<base href="${w.scope}">`));
    assert.match(body, /id="retry"/);
  }
  const script = await w.request('./recurso-no-guardado.js', { mode: 'cors' });
  assert.equal(script.status, 503);
  assert.match(script.headers.get('Content-Type'), /text\/plain/);
  assert.doesNotMatch(await script.text(), /<!doctype/);
  w.setOffline(false);
  assert.match(await (await w.request('./pagina-no-cacheada.html')).text(), /Esta página llegó desde la red/);
});
test('Ejercicio 5: fallback ausente registra error y devuelve 503', async () => {
  const w = await worker(5);
  await w.lifecycle('install');
  for (const items of w.stores.values()) items.delete(`${w.scope}offline.html`);
  w.setOffline(true);
  assert.equal((await w.request('./no-guardado.html')).status, 503);
  assert.ok(w.logs.some((entry) => entry.level === 'error'));
});
for (const [index, folder] of folders.entries()) {
  test(`Ejercicio ${index + 1}: servidor independiente HTTP`, { timeout: 15000 }, async (t) => {
    const port = 18101 + index;
    const child = spawn(process.execPath, [path.join(root, folder, 'servidor.cjs'), String(port)], { stdio: ['ignore', 'pipe', 'pipe'] });
    let errors = '';
    child.stderr.on('data', (data) => { errors += data; });
    t.after(async () => {
      if (child.exitCode === null && child.signalCode === null) {
        const exited = once(child, 'exit');
        child.kill();
        await exited;
      }
    });
    await Promise.race([
      once(child.stdout, 'data'),
      once(child, 'exit').then(() => { throw new Error(`Servidor no inició: ${errors}`); })
    ]);
    const base = `http://127.0.0.1:${port}`;
    for (const name of ['/', '/styles.css', '/app.js', '/manifest.json', '/icons/icon-192.png', '/icons/icon-512.png']) {
      const response = await fetch(`${base}${name}`);
      assert.equal(response.status, 200, name);
      assert.equal(response.headers.get('Cache-Control'), 'no-store');
      await response.arrayBuffer();
    }
    const head = await fetch(base, { method: 'HEAD' });
    assert.equal(head.status, 200);
    assert.equal((await head.arrayBuffer()).byteLength, 0);
    assert.equal((await fetch(`${base}/missing.html`)).status, 404);
    assert.equal((await fetch(base, { method: 'POST' })).status, 405);
    assert.equal((await fetch(`${base}/servidor.cjs`)).status, 403);
  });
}
