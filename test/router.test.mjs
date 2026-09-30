import test from 'node:test';
import assert from 'node:assert/strict';
import { MockWorker, OpenJevRouter } from '../dist/src/index.js';

const task = {
  id: 'route-1',
  input: 'hello',
  requiredCapabilities: ['text'],
};

test('filters workers missing required capabilities', async () => {
  const router = new OpenJevRouter();
  const text = new MockWorker({
    id: 'text',
    capabilities: ['text'],
    estimate: { estimatedCost: 1, estimatedLatencyMs: 100, reliability: 0.9, cacheAffinity: 0.5 },
    handler: () => 'ok',
  });
  const vision = new MockWorker({
    id: 'vision',
    capabilities: ['vision'],
    estimate: { estimatedCost: 0, estimatedLatencyMs: 1, reliability: 1, cacheAffinity: 1 },
    handler: () => 'ok',
  });

  const ranked = await router.rank(task, [vision, text]);
  assert.deepEqual(ranked.map((candidate) => candidate.workerId), ['text']);
});
