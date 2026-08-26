import { gzipSync } from 'node:zlib';
import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const workspaceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputRoot = path.join(workspaceRoot, 'apps/web/out');
const budget = JSON.parse(
  await readFile(path.join(workspaceRoot, 'performance/budget.json'), 'utf8')
);

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(full)));
    else files.push(full);
  }
  return files;
}

try {
  const outputStat = await stat(outputRoot);
  if (!outputStat.isDirectory()) throw new Error('static export output is not a directory');
} catch (error) {
  globalThis.console.error('PERFORMANCE_BUDGET=FAIL');
  globalThis.console.error(`Missing static export at ${outputRoot}: ${String(error)}`);
  globalThis.process.exit(1);
}

const assets = await walk(outputRoot);
const metrics = {
  totalJavaScriptGzipBytes: 0,
  largestJavaScriptGzipBytes: 0,
  totalCssGzipBytes: 0,
  largestCssGzipBytes: 0
};
let javascriptFiles = 0;
let cssFiles = 0;

for (const file of assets) {
  const extension = path.extname(file);
  if (extension !== '.js' && extension !== '.css') continue;
  const bytes = await readFile(file);
  const gzipBytes = gzipSync(bytes, { level: 9 }).byteLength;

  if (extension === '.js') {
    javascriptFiles += 1;
    metrics.totalJavaScriptGzipBytes += gzipBytes;
    metrics.largestJavaScriptGzipBytes = Math.max(metrics.largestJavaScriptGzipBytes, gzipBytes);
  } else {
    cssFiles += 1;
    metrics.totalCssGzipBytes += gzipBytes;
    metrics.largestCssGzipBytes = Math.max(metrics.largestCssGzipBytes, gzipBytes);
  }
}

const errors = [];
if (javascriptFiles === 0) errors.push('static export contains no JavaScript assets');
if (cssFiles === 0) errors.push('static export contains no CSS assets');

for (const [metric, value] of Object.entries(metrics)) {
  const maximum = budget[metric];
  if (!Number.isFinite(maximum)) errors.push(`missing numeric budget for ${metric}`);
  else if (value > maximum) errors.push(`${metric} exceeded: ${value} > ${maximum}`);
}

if (errors.length) {
  globalThis.console.error('PERFORMANCE_BUDGET=FAIL');
  for (const error of errors) globalThis.console.error(`- ${error}`);
  globalThis.process.exit(1);
}

globalThis.console.log('PERFORMANCE_BUDGET=PASS');
globalThis.console.log(`JS_FILES=${javascriptFiles}`);
globalThis.console.log(`CSS_FILES=${cssFiles}`);
for (const [metric, value] of Object.entries(metrics)) {
  globalThis.console.log(`${metric}=${value}/${budget[metric]}`);
}
