const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const root = __dirname;
const port = Number(process.argv[2] || 8104);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Puerto no valido.');
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/manifest+json', '.png': 'image/png' };
http.createServer(async (req, res) => {
  if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405, { Allow: 'GET, HEAD' }); res.end(); return; }
  let file;
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    file = path.resolve(root, `.${pathname.endsWith('/') ? `${pathname}index.html` : pathname}`);
    const relative = path.relative(root, file);
    if (relative.startsWith('..') || path.isAbsolute(relative) || !types[path.extname(file)]) {
      res.writeHead(403); res.end('Acceso no permitido'); return;
    }
  } catch (error) { console.warn('URL no valida:', error.message); res.writeHead(400); res.end('URL no valida'); return; }
  try {
    const body = await fs.readFile(file);
    res.writeHead(200, { 'Content-Type': types[path.extname(file)], 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
    res.end(req.method === 'HEAD' ? undefined : body);
  } catch (error) {
    const status = error.code === 'ENOENT' || error.code === 'ENOTDIR' ? 404 : 500;
    if (status === 500) console.error('Error al leer archivo:', error);
    res.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end(status === 404 ? 'Pagina no encontrada' : 'Error del servidor');
  }
}).listen(port, '127.0.0.1', () => console.log(`Ejercicio 4: http://localhost:${port}`))
  .on('error', (error) => { console.error('No se pudo iniciar el servidor:', error); process.exitCode = 1; });
