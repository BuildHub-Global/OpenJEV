import test from 'node:test';
import assert from 'node:assert/strict';
import { InMemoryTelemetry, MockWorker, OpenAICompatibleWorker, OpenJevEngine } from '../dist/src/index.js';

const task = { id: 'adapter-test', input: 'Return PASS', requiredCapabilities: ['text'] };
const options = { baseUrl: 'https://worker.example/v1/', model: 'local-model' };
const json = (body) => new Response(JSON.stringify(body), { headers: { 'content-type': 'application/json' } });

test('sends a non-streaming request and returns text with sanitized usage', async () => {
  const worker = new OpenAICompatibleWorker({
    ...options,
    apiKey: 'test-secret',
    fetch: async (url, init) => {
      assert.equal(url, 'https://worker.example/v1/chat/completions');
      assert.equal(init.headers.authorization, 'Bearer test-secret');
      assert.equal(init.redirect, 'error');
      assert.deepEqual(JSON.parse(init.body), {
        model: 'local-model', messages: [{ role: 'user', content: 'Return PASS' }], stream: false,
      });
      return json({ choices: [{ message: { content: 'PASS' } }], usage: { prompt_tokens: 3, completion_tokens: 1, total_tokens: 4, secret: 'test-secret' } });
    },
  });
  const result = await worker.execute(task, { attempt: 1 });
  assert.equal(result.output, 'PASS');
  assert.deepEqual(result.metadata.usage, { prompt_tokens: 3, completion_tokens: 1, total_tokens: 4 });
  assert.ok(result.metadata.latencyMs >= 0);
  assert.ok(!JSON.stringify(result).includes('test-secret'));
});

test('provider errors and transport errors do not disclose response bodies or credentials', async () => {
  const httpWorker = new OpenAICompatibleWorker({ ...options, fetch: async () => new Response('test-secret', { status: 401 }) });
  await assert.rejects(httpWorker.execute(task, { attempt: 1 }), /^Error: OpenAI-compatible request failed with HTTP 401$/);
  const transportWorker = new OpenAICompatibleWorker({ ...options, fetch: async () => { throw new Error('test-secret'); } });
  await assert.rejects(transportWorker.execute(task, { attempt: 1 }), /^Error: OpenAI-compatible transport failed$/);
});

test('rejects invalid JSON and missing text content', async () => {
  const malformed = new OpenAICompatibleWorker({ ...options, fetch: async () => new Response('not JSON') });
  await assert.rejects(malformed.execute(task, { attempt: 1 }), /not valid JSON/);
  for (const body of [null, {}, { choices: [] }, { choices: [{ message: { content: null } }] }]) {
    const worker = new OpenAICompatibleWorker({ ...options, fetch: async () => json(body) });
    await assert.rejects(worker.execute(task, { attempt: 1 }), /did not include text content/);
  }
});

const abortableFetch = async (_url, { signal }) => new Promise((_resolve, reject) => {
  if (signal.aborted) return reject(new Error('aborted'));
  signal.addEventListener('abort', () => reject(new Error('aborted')), { once: true });
});

test('aborts a stalled request at the configured deadline', async () => {
  const worker = new OpenAICompatibleWorker({ ...options, timeoutMs: 10, fetch: abortableFetch });
  await assert.rejects(worker.execute(task, { attempt: 1 }), /timed out/);
});

test('deadline covers reading the response body too', async () => {
  const worker = new OpenAICompatibleWorker({ ...options, timeoutMs: 10, fetch: async (_url, { signal }) => ({
    ok: true,
    json: () => new Promise((_resolve, reject) => signal.addEventListener('abort', () => reject(new Error('aborted')), { once: true })),
  }) });
  await assert.rejects(worker.execute(task, { attempt: 1 }), /timed out/);
});

test('honors an already-aborted execution context without calling the endpoint', async () => {
  const controller = new AbortController();
  controller.abort();
  const worker = new OpenAICompatibleWorker({ ...options, fetch: async () => { assert.fail('must not call transport'); } });
  await assert.rejects(worker.execute(task, { attempt: 1, signal: controller.signal }), /cancelled/);
});

test('honors cancellation during execution', async () => {
  const controller = new AbortController();
  const worker = new OpenAICompatibleWorker({ ...options, fetch: abortableFetch });
  const execution = worker.execute(task, { attempt: 1, signal: controller.signal });
  controller.abort();
  await assert.rejects(execution, /cancelled/);
});

test('integrates verification failure and provider failure with engine fallback', async () => {
  for (const fetch of [async () => json({ choices: [{ message: { content: 'FAIL' } }] }), async () => new Response('unavailable', { status: 503 })]) {
    const telemetry = new InMemoryTelemetry();
    const first = new OpenAICompatibleWorker({ ...options, id: 'first', fetch, estimate: { estimatedLatencyMs: 1, reliability: 1, cacheAffinity: 1 } });
    const fallback = new MockWorker({ id: 'fallback', capabilities: ['text'], estimate: { estimatedCost: 1, estimatedLatencyMs: 100, reliability: 0.5, cacheAffinity: 0 }, handler: () => 'PASS' });
    const result = await new OpenJevEngine({ telemetry }).run(task, [first, fallback], { verify: (_task, execution) => ({ ok: execution.output === 'PASS' }) });
    assert.equal(result.workerId, 'fallback');
    assert.equal(result.attempts, 2);
    assert.equal(telemetry.goodput(), 0.5);
    assert.equal(telemetry.events[0].verification.ok, false);
  }
});

test('validates configuration before any request', () => {
  for (const baseUrl of ['file:///tmp/model', 'https://user:secret@worker.example', 'https://worker.example?key=secret']) {
    assert.throws(() => new OpenAICompatibleWorker({ ...options, baseUrl }));
  }
  for (const timeoutMs of [0, -1, 1.5, Infinity, 2_147_483_648]) {
    assert.throws(() => new OpenAICompatibleWorker({ ...options, timeoutMs }));
  }
  assert.throws(() => new OpenAICompatibleWorker({ ...options, model: ' ' }));
});
