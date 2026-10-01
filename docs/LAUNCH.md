# OpenJEV public launch — ready for review, not published

## Short announcement

OpenJEV is an Apache 2.0, vendor-neutral execution routing and verification framework for AI agents, tools, models, and computer-use systems. Its TypeScript/ESM core routes by capability, scores cost, latency, reliability and cache affinity, and verifies results before accepting them, with fallback on failure.

Install: `npm install @buildhubglobal/openjev`

GitHub: https://github.com/BuildHub-Global/OpenJEV
npm: https://www.npmjs.com/package/@buildhubglobal/openjev

Try it, open an issue, or contribute feedback and adapters.

## Longer launch post

OpenJEV v0.1.2 is an experimental, open-source execution router. It asks which execution path can satisfy a task and its verifier, rather than only which model should answer.

The current implementation filters workers by required capabilities and ranks them using estimated cost, latency, reliability, and cache affinity. The engine executes a candidate, verifies its output, and falls back when execution or verification fails. In-memory telemetry provides a goodput foundation; a cache abstraction keeps storage replaceable.

Included adapters are MockWorker, OllamaWorker, and an OpenAI-compatible non-streaming text worker. The npm package provides an ESM runtime and TypeScript declarations, with no runtime dependencies. An offline demo demonstrates a rejected answer followed by a verified fallback and telemetry for both attempts.

MCP adapters, browser/computer-use executors, persistent telemetry, SLO-aware goodput, and regression generation from verified failures are roadmap work, not current bundled functionality. Privileged executors require explicit opt-in.

OpenJEV is independent and is not affiliated with or endorsed by NVIDIA, H Company, OpenAI, Anthropic, Ollama, or other vendors. Apache 2.0 licensed. Issues, feedback, and contributions are welcome.

## Installation

Node.js 20 or newer; ESM only.

```bash
npm install @buildhubglobal/openjev
```

## Minimal TypeScript / ESM example

Save as `example.mjs` and run `node example.mjs`, or use in an ESM TypeScript project.

```ts
import { MockWorker, OpenJevEngine } from '@buildhubglobal/openjev';

const worker = new MockWorker({
  id: 'example',
  capabilities: ['text'],
  estimate: { estimatedCost: 0, estimatedLatencyMs: 1, reliability: 1, cacheAffinity: 0 },
  handler: () => 'PASS',
});

const result = await new OpenJevEngine().run(
  { id: 'launch-example', input: 'Return PASS', requiredCapabilities: ['text'] },
  [worker],
  { verify: (_task, execution) => ({ ok: execution.output === 'PASS' }) },
);
console.log(result);
```

For the verified-fallback demo, clone the repository and run `npm install`, then `npm run demo`. No API key or model server is needed.

## Technical summary

- Capability-based execution routing.
- Cost / latency / reliability / cache-affinity scoring.
- Verification-first fallback.
- In-memory telemetry / goodput foundation and cache abstraction.
- Ollama and OpenAI-compatible text adapters.
- TypeScript / ESM package with declaration and clean consumer validation.
- Apache 2.0.

GitHub: https://github.com/BuildHub-Global/OpenJEV
npm: https://www.npmjs.com/package/@buildhubglobal/openjev
Issues: https://github.com/BuildHub-Global/OpenJEV/issues
Roadmap: [ROADMAP.md](ROADMAP.md)
Contributing: [CONTRIBUTING.md](../CONTRIBUTING.md)
Security: [SECURITY.md](../SECURITY.md)
License: [Apache 2.0](../LICENSE)
