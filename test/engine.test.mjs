import test from 'node:test';
import assert from 'node:assert/strict';
import { InMemoryTelemetry, MockWorker, OpenJevEngine } from '../dist/src/index.js';

test('falls back when verification fails', async () => {
  const telemetry = new InMemoryTelemetry();
  const engine = new OpenJevEngine({ telemetry, policy: { maxAttempts: 2 } });
  const task = { id: 'verify-1', input: 'x', requiredCapabilities: ['text'] };

  const wrong = new MockWorker({
    id: 'wrong',
    capabilities: ['text'],
    estimate: { estimatedCost: 0, estimatedLatencyMs: 10, reliability: 1, cacheAffinity: 1 },
    handler: () => 'wrong',
  });
  const correct = new MockWorker({
    id: 'correct',
    capabilities: ['text'],
    estimate: { estimatedCost: 1, estimatedLatencyMs: 100, reliability: 0.8, cacheAffinity: 0 },
    handler: () => 'correct',
  });

  const result = await engine.run(task, [wrong, correct], {
    verify: (_task, execution) => ({ ok: execution.output === 'correct' }),
  });

  assert.equal(result.result.output, 'correct');
  assert.equal(result.attempts, 2);
  assert.equal(telemetry.events.length, 2);
  assert.equal(telemetry.goodput(), 0.5);
});
