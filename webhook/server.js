#!/usr/bin/env node
'use strict';

const http = require('http');
const crypto = require('crypto');
const { execFile } = require('child_process');

// ── Configuration ──────────────────────────────────────────────────────────
const PORT         = process.env.WEBHOOK_PORT   || 9000;
const SECRET       = process.env.WEBHOOK_SECRET || '';   // must match GitHub webhook secret
// Local git working directory (NOT inside nginx web root)
const REPO_DIR     = process.env.REPO_DIR       || '/opt/firestige-blog';
// Nginx serving directory (only static files, no .git)
const SITE_DIR     = process.env.SITE_DIR       || '/var/www/html/firestige';
const BRANCH       = process.env.WEBHOOK_BRANCH || 'blog';
const WEBHOOK_PATH = '/webhook';
// ──────────────────────────────────────────────────────────────────────────

if (!SECRET) {
  console.warn('[webhook] WARNING: WEBHOOK_SECRET is not set. Signature verification is disabled.');
}

/**
 * Verify GitHub's HMAC-SHA256 signature.
 * Header: X-Hub-Signature-256: sha256=<hex>
 */
function verifySignature(body, signature) {
  if (!SECRET) return true;
  if (!signature) return false;
  const expected = 'sha256=' + crypto.createHmac('sha256', SECRET).update(body).digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}

function run(cmd, args, opts) {
  return new Promise((resolve, reject) => {
    execFile(cmd, args, { timeout: 60_000, ...opts }, (err, stdout, stderr) => {
      if (err) {
        console.error(`[webhook] ${cmd} ${args.join(' ')} failed: ${err.message}`);
        if (stderr) console.error(stderr.trim());
        return reject(err);
      }
      if (stdout.trim()) console.log(`[webhook] ${stdout.trim()}`);
      resolve();
    });
  });
}

async function deploy() {
  // 1. Fetch latest from remote; use reset --hard to handle force pushes
  //    (peaceiris/actions-gh-pages replaces branch content each run)
  console.log(`[webhook] Fetching ${BRANCH} into ${REPO_DIR} ...`);
  await run('git', ['-C', REPO_DIR, 'fetch', 'origin', BRANCH]);
  await run('git', ['-C', REPO_DIR, 'reset', '--hard', `origin/${BRANCH}`]);

  // 2. Sync static files to nginx web root (no .git leaking into web root)
  console.log(`[webhook] Syncing to ${SITE_DIR} ...`);
  await run('rsync', [
    '-rl', '--delete',
    '--exclude=.git',
    REPO_DIR + '/',
    SITE_DIR + '/',
  ]);

  console.log('[webhook] Deploy completed.');
}

const server = http.createServer((req, res) => {
  const { method, url } = req;

  if (url !== WEBHOOK_PATH || method !== 'POST') {
    res.writeHead(404).end('Not Found');
    return;
  }

  const chunks = [];
  req.on('data', chunk => chunks.push(chunk));
  req.on('end', () => {
    const body = Buffer.concat(chunks);
    const signature = req.headers['x-hub-signature-256'];

    if (!verifySignature(body, signature)) {
      console.warn('[webhook] Invalid signature, request rejected.');
      res.writeHead(401).end('Unauthorized');
      return;
    }

    let payload;
    try {
      payload = JSON.parse(body.toString('utf8'));
    } catch {
      res.writeHead(400).end('Bad Request');
      return;
    }

    // Only react to pushes on the target branch
    const ref = payload.ref || '';
    if (ref !== `refs/heads/${BRANCH}`) {
      console.log(`[webhook] Ignored ref: ${ref}`);
      res.writeHead(200).end('Ignored');
      return;
    }

    console.log(`[webhook] Push to ${BRANCH} detected.`);
    res.writeHead(202).end('Accepted');

    deploy().catch(err => console.error('[webhook] Deploy failed:', err.message));
  });

  req.on('error', err => {
    console.error('[webhook] Request error:', err);
  });
});

server.listen(PORT, () => {
  console.log(`[webhook] Server listening on port ${PORT}, path ${WEBHOOK_PATH}`);
  console.log(`[webhook] Repo directory : ${REPO_DIR}`);
  console.log(`[webhook] Site directory : ${SITE_DIR}`);
  console.log(`[webhook] Watching branch: ${BRANCH}`);
});
