import {
  InMemoryTelemetry,
  MockWorker,
  OpenJevEngine,
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
const engine = new OpenJevEngine({ telemetry, policy: { maxAttempts: 2 } });

const result = await engine.run(task, [fastButWrong, slowerButCorrect], verifier);
console.log(result);
console.log({ goodput: telemetry.goodput(), events: telemetry.events });
