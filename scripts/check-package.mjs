import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const root = process.cwd();
const directory = mkdtempSync(join(tmpdir(), 'openjev-package-'));
const npm = process.env.npm_execpath;
assert.ok(npm, 'Run this check with npm run check:package');
const runNpm = (args, cwd) => execFileSync(process.execPath, [npm, ...args], { cwd, encoding: 'utf8' });

try {
  const [pack] = JSON.parse(runNpm(['pack', '--ignore-scripts', '--json', '--pack-destination', directory], root));
  const files = pack.files.map((file) => file.path);
  for (const required of ['dist/src/index.js', 'dist/src/index.d.ts', 'dist/examples/quickstart.js', 'LICENSE', 'NOTICE', 'README.md']) {
    assert.ok(files.includes(required), `Missing ${required} in tarball`);
  }
  assert.ok(files.every((file) => file.startsWith('dist/') || ['package.json', 'README.md', 'LICENSE', 'NOTICE'].includes(file)), 'Unexpected file in tarball');
  const consumer = join(directory, 'consumer');
  mkdirSync(consumer);
  writeFileSync(join(consumer, 'package.json'), JSON.stringify({ private: true, type: 'module' }));
  runNpm(['install', join(directory, pack.filename), '--ignore-scripts', '--offline', '--no-audit', '--no-fund'], consumer);
  writeFileSync(join(consumer, 'check.mts'), `
import assert from 'node:assert/strict';
import { InMemoryTelemetry, MockWorker, OpenAICompatibleWorker, OpenJevEngine, type Worker } from 'openjev';
const telemetry = new InMemoryTelemetry();
const wrong = new MockWorker({ id: 'wrong', capabilities: ['text'], estimate: { estimatedCost: 0, estimatedLatencyMs: 1, reliability: 1, cacheAffinity: 1 }, handler: () => 'FAIL' });
const right = new MockWorker({ id: 'right', capabilities: ['text'], estimate: { estimatedCost: 1, estimatedLatencyMs: 100, reliability: 0.5, cacheAffinity: 0 }, handler: () => 'PASS' });
const compatible: Worker<string> = new OpenAICompatibleWorker({ baseUrl: 'https://worker.example/v1', model: 'test' });
const result = await new OpenJevEngine({ telemetry }).run({ id: 'package-test', input: 'PASS', requiredCapabilities: ['text'] }, [wrong, right], { verify: (_task, execution) => ({ ok: execution.output === 'PASS' }) });
assert.equal(result.attempts, 2);
assert.equal(telemetry.goodput(), 0.5);
assert.equal(compatible.capabilities[0], 'text');
console.log('Packed ESM consumer: PASS');
`);
  // Compile with the installed declarations, then run the generated consumer.
  // A lightweight assert shim avoids adding @types/node to this package solely for the smoke test.
  writeFileSync(join(consumer, 'assert.d.ts'), "declare module 'node:assert/strict' { const assert: { equal(a: unknown, b: unknown): void }; export default assert; }\n");
  execFileSync(process.execPath, [resolve(root, 'node_modules/typescript/bin/tsc'), '--module', 'NodeNext', '--moduleResolution', 'NodeNext', '--target', 'ES2022', '--strict', 'check.mts', 'assert.d.ts'], { cwd: consumer, stdio: 'inherit' });
  execFileSync(process.execPath, [join(consumer, 'check.mjs')], { cwd: consumer, stdio: 'inherit' });
  console.log(`Tarball ${pack.filename}: ${files.length} files, ${pack.size} bytes — PASS`);
} finally {
  rmSync(directory, { recursive: true, force: true });
}
