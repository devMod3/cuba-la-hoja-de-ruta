import { rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const nextRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const webRoot = path.join(nextRoot, 'apps', 'web');
const args = new Set(globalThis.process.argv.slice(2));
const targetRoot = args.has('--public')
  ? path.join(webRoot, 'public', 'zen-admin')
  : path.join(webRoot, 'out', 'zen-admin');

// Next loads /zen-admin/tools/admin/bootstrap.js directly on /admin. The copied
// legacy runtime bootstrap is unreachable in the Pages application and only
// inflates the exported JavaScript budget. Keep source intact; prune the copy.
await rm(path.join(targetRoot, 'tools', 'runtime', 'bootstrap.js'), { force: true });

globalThis.console.log('ZEN_ADMIN_RUNTIME_COMPACT=PASS');
globalThis.console.log(`ZEN_ADMIN_RUNTIME_COMPACT_TARGET=${path.relative(nextRoot, targetRoot)}`);
globalThis.console.log('ZEN_ADMIN_RUNTIME_PRUNED=tools/runtime/bootstrap.js');
