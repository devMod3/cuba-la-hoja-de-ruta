import { execFile } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const execFileAsync = promisify(execFile);
const workspaceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = path.resolve(workspaceRoot, '..');
const forbiddenSourceExtension = /\.(?:[cm]?js|jsx)$/u;
const typedSourceExtension = /\.tsx?$/u;
const suppressionPattern = /@ts-(?:ignore|nocheck|expect-error)/u;
const disguisedJavaScriptPattern =
  /\b(?:eval\s*\(|new\s+Function\s*\(|Blob\s*\([^)]*javascript|import\s*\(\s*URL\.createObjectURL)/u;

const { stdout } = await execFileAsync('git', ['-C', repoRoot, 'ls-files'], { encoding: 'utf8' });
const tracked = stdout
  .split('\n')
  .map((entry) => entry.trim())
  .filter(Boolean);

const activeCode = tracked.filter((entry) => entry.startsWith('next/'));
const forbiddenFiles = activeCode.filter((entry) => forbiddenSourceExtension.test(entry));
if (forbiddenFiles.length > 0) {
  throw new Error(
    `TypeScript-only source gate failed; JavaScript source is tracked:\n${forbiddenFiles.join('\n')}`
  );
}

const suspiciousText = activeCode.filter((entry) => /\.(?:txt|html)$/u.test(entry));
const violations: string[] = [];
for (const entry of suspiciousText) {
  const source = await readFile(path.join(repoRoot, entry), 'utf8');
  if (disguisedJavaScriptPattern.test(source)) {
    violations.push(`${entry}: executable JavaScript disguised as a non-code asset`);
  }
}

const typedFiles = activeCode.filter((entry) => typedSourceExtension.test(entry));
for (const repoRelativePath of typedFiles) {
  const absolutePath = path.join(repoRoot, repoRelativePath);
  const source = await readFile(absolutePath, 'utf8');
  if (suppressionPattern.test(source)) {
    violations.push(`${repoRelativePath}: TypeScript suppression directive`);
  }

  const kind = repoRelativePath.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  const sourceFile = ts.createSourceFile(
    repoRelativePath,
    source,
    ts.ScriptTarget.Latest,
    true,
    kind
  );
  const inspect = (node: ts.Node): void => {
    if (node.kind === ts.SyntaxKind.AnyKeyword) {
      const location = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
      violations.push(
        `${repoRelativePath}:${String(location.line + 1)}:${String(location.character + 1)} explicit any`
      );
    }
    ts.forEachChild(node, inspect);
  };
  inspect(sourceFile);
}

if (violations.length > 0) {
  throw new Error(`TypeScript source quality gate failed:\n${violations.join('\n')}`);
}

globalThis.console.log(`TYPESCRIPT_ONLY_SOURCE=PASS files=${String(typedFiles.length)}`);
