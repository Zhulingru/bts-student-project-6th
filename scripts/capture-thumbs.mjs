#!/usr/bin/env node
/**
 * 造訪與網站 modal 相同的「可嵌入」網址並截圖，存成 assets/thumbs/{id}.png。
 * 需本機網路。若畫面是登入頁，代表該連結未公開；請改為「發布／任何人可檢視」後再跑，或手動匯出圖片放到 assets/thumbs/{id}.png。
 *
 * 使用：
 *   npm install
 *   npx playwright install chromium
 *   npm run capture-thumbs
 *   或只截指定學生縮圖：node scripts/capture-thumbs.mjs a4 a8
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

function projectEmbedUrl(raw) {
  const u = String(raw || '').trim().replace(/^["'\s]+|["'\s]+$/g, '');
  if (!u || u === '#') return '';
  let m = u.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (m) return `https://drive.google.com/file/d/${m[1]}/preview`;
  m = u.match(/docs\.google\.com\/presentation\/d\/([a-zA-Z0-9_-]+)/);
  if (m) return `https://docs.google.com/presentation/d/${m[1]}/embed`;
  m = u.match(/canva\.com\/design\/([^/?#]+)\/([^/?#]+)/);
  if (m) return `https://www.canva.com/design/${m[1]}/${m[2]}/view?embed`;
  return u;
}

const PAUSE_MS = Number(process.env.THUMB_PAUSE_MS || 5500);

async function main() {
  const targetIds = process.argv.slice(2).map((s) => String(s).trim()).filter(Boolean);
  const jsonPath = path.join(root, 'data/students.json');
  const json = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  const outDir = path.join(root, 'assets/thumbs');
  fs.mkdirSync(outDir, { recursive: true });

  let browser;
  try {
    browser = await chromium.launch({ channel: 'chrome', headless: true });
  } catch (e) {
    console.warn('無法使用本機 Google Chrome，改試 Playwright 內建 Chromium：', e.message);
    browser = await chromium.launch({ headless: true });
  }
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 1,
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });

  const page = await context.newPage();

  const all = [...(json.A || []), ...(json.B || [])];
  for (const s of all) {
    if (targetIds.length > 0 && !targetIds.includes(s.id)) continue;
    const url = projectEmbedUrl(s.projectUrl);
    if (!url) {
      console.warn(`skip ${s.id} (no embed url)`);
      continue;
    }
    const out = path.join(outDir, `${s.id}.png`);
    try {
      console.log(`${s.id} ${s.name || ''} → ${url}`);
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 });
      await new Promise((r) => setTimeout(r, PAUSE_MS));
      await page.screenshot({ path: out, type: 'png' });
    } catch (e) {
      console.error(`${s.id} failed:`, e.message);
    }
  }

  await browser.close();
  console.log('Done. Files in assets/thumbs/');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
