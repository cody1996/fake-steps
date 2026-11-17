// 本地无头截图服务（开发期用）：静态托管 dist/，并按请求渲染页面截图。
// 只监听 127.0.0.1，不会对外暴露。
//
// 用法:
//   node scripts/shot-daemon.mjs
//   curl "http://127.0.0.1:8791/shot?capture=history&out=history.png"
//   curl "http://127.0.0.1:8791/shot?capture=app&out=app.png&w=1440&h=900"
//   curl "http://127.0.0.1:8791/shot?capture=selftest&mode=visit&ms=15000"
//
// 环境变量:
//   EDGE_PATH  Edge/Chrome 可执行文件路径（默认取 Windows 版 Edge）
//   PORT       监听端口，默认 8791
//
// 注意：截图需要一个能正常启动的浏览器进程；在受限沙箱里 Edge 可能起不来，
// 这时请在普通终端里运行本脚本。

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const SHOTS = path.join(ROOT, '.dev', 'shots');
const LOG = path.join(SHOTS, 'daemon.log');
const PORT = Number(process.env.PORT) || 8791;
const EDGE =
  process.env.EDGE_PATH ||
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

fs.mkdirSync(SHOTS, { recursive: true });

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  try {
    fs.appendFileSync(LOG, line);
  } catch {}
  process.stdout.write(line);
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ttf': 'font/ttf',
  '.woff2': 'font/woff2',
  '.json': 'application/json',
};

function runEdge({ capture, out, width, height, wait }) {
  const target = path.join(SHOTS, out);
  fs.rmSync(target, { force: true });
  const args = [
    '--headless=new',
    '--disable-gpu',
    '--hide-scrollbars',
    '--no-first-run',
    '--no-default-browser-check',
    `--window-size=${width || 1179},${height || 2560}`,
    '--force-device-scale-factor=1',
    `--virtual-time-budget=${wait || 4000}`,
    `--screenshot=${target}`,
    `--user-data-dir=${path.join(ROOT, '.dev', 'edge-profile')}`,
    `http://127.0.0.1:${PORT}/index.html?capture=${capture}&t=${Date.now()}`,
  ];
  return new Promise((resolve) => {
    execFile(EDGE, args, { timeout: 120000, windowsHide: true }, (err) => {
      const ok = fs.existsSync(target);
      resolve({
        ok,
        out,
        bytes: ok ? fs.statSync(target).size : 0,
        err: err ? String(err).slice(0, 300) : null,
      });
    });
  });
}

http
  .createServer(async (req, res) => {
    const url = new URL(req.url || '/', `http://127.0.0.1:${PORT}`);

    if (url.pathname === '/ping') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, pid: process.pid }));
      return;
    }

    // 页面把导出的 PNG POST 回来，直接落盘，便于自动化核对导出结果
    if (url.pathname === '/save' && req.method === 'POST') {
      const name = (url.searchParams.get('name') || 'upload.png').replace(/[^\w.\-]/g, '');
      const chunks = [];
      req.on('data', (c) => chunks.push(c));
      req.on('end', () => {
        const buf = Buffer.concat(chunks);
        fs.writeFileSync(path.join(SHOTS, name), buf);
        log(`saved ${name} ${buf.length} bytes`);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, bytes: buf.length }));
      });
      return;
    }

    if (url.pathname === '/shot') {
      const capture = url.searchParams.get('capture') || 'app';
      const out = url.searchParams.get('out') || `${capture}.png`;
      const mode = url.searchParams.get('mode') || 'shot';
      log(`shot start capture=${capture} out=${out} mode=${mode}`);

      if (mode === 'visit') {
        // 只打开页面、不截图：给页面留出真实时间跑完异步任务
        const ms = Number(url.searchParams.get('ms')) || 12000;
        const args = [
          '--headless=new',
          '--disable-gpu',
          '--no-first-run',
          '--no-default-browser-check',
          `--user-data-dir=${path.join(ROOT, '.dev', 'edge-profile')}`,
          `http://127.0.0.1:${PORT}/index.html?capture=${capture}&t=${Date.now()}`,
        ];
        await new Promise((resolve) => {
          const child = execFile(EDGE, args, { windowsHide: true }, () => resolve());
          setTimeout(() => {
            try {
              child.kill();
            } catch {}
            resolve();
          }, ms);
        });
        log('visit done');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, visited: capture, ms }));
        return;
      }

      const r = await runEdge({
        capture,
        out,
        width: Number(url.searchParams.get('w')) || 1179,
        height: Number(url.searchParams.get('h')) || 2560,
        wait: Number(url.searchParams.get('wait')) || 4000,
      });
      log(`shot done ${JSON.stringify(r)}`);
      res.writeHead(r.ok ? 200 : 500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(r));
      return;
    }

    const file = path.join(DIST, url.pathname === '/' ? 'index.html' : url.pathname);
    if (!file.startsWith(DIST)) {
      res.writeHead(403).end();
      return;
    }
    fs.readFile(file, (err, buf) => {
      if (err) {
        res.writeHead(404).end('not found');
        return;
      }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
      res.end(buf);
    });
  })
  .listen(PORT, '127.0.0.1', () => log(`serving ${DIST} on http://127.0.0.1:${PORT}`));
