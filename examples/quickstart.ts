import {
  InMemoryTelemetry,
  MockWorker,
  OpenJevEngine,
  OpenJevRouter,
  type Task,
  type Verifier,
} from '../src/index.js';

const task: Task = {
  id: 'hello-openjev',
  input: 'Return the word PASS',
  requiredCapabilities: ['text'],
};

const fastButWrong = new MockWorker({
  id: 'fast-worker',
  capabilities: ['text'],
  estimate: {
    estimatedCost: 0.001,
    estimatedLatencyMs: 100,
    reliability: 0.7,
    cacheAffinity: 0.8,
  },
  handler: () => 'FAIL',
});

const slowerButCorrect = new MockWorker({
  id: 'reliable-worker',
  capabilities: ['text'],
  estimate: {
    estimatedCost: 0.002,
    estimatedLatencyMs: 250,
    reliability: 0.99,
    cacheAffinity: 0.4,
  },
  handler: () => 'PASS',
});

const verifier: Verifier<string> = {
  verify: (_task, result) => ({
    ok: result.output === 'PASS',
    reason: result.output === 'PASS' ? undefined : 'Expected PASS',
  }),
};

const telemetry = new InMemoryTelemetry();
// Make the demo's first choice deterministic: prioritize latency over reliability.
const router = new OpenJevRouter({ cost: 0.2, latency: 0.5, reliability: 0.2, cacheAffinity: 0.1 });
const engine = new OpenJevEngine({ router, telemetry, policy: { maxAttempts: 2 } });

console.log('Ranked execution candidates:', await router.rank(task, [fastButWrong, slowerButCorrect]));
const result = await engine.run(task, [fastButWrong, slowerButCorrect], verifier);
if (result.workerId !== 'reliable-worker' || result.attempts !== 2 || telemetry.goodput() !== 0.5) {
  throw new Error('Demo did not exercise verified fallback');
}
console.log('Verified result:', result);
console.table(telemetry.events.map((event) => ({
  worker: event.workerId,
  attempt: event.attempt,
  verified: event.verification.ok,
  reason: event.verification.reason ?? 'PASS',
  latencyMs: event.finishedAt - event.startedAt,
})));
console.log('Goodput (verified successes / execution attempts):', telemetry.goodput());
