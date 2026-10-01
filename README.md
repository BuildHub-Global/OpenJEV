# OpenJEV

**Open execution routing and verification for AI agents, tools, and models.**

OpenJEV is a vendor-neutral TypeScript runtime for deciding **how a task should be executed**, not only which model should answer it.

A worker can be an LLM, local model, API, MCP server, shell executor, browser/computer-use agent, GUI agent, or a composite workflow. OpenJEV ranks eligible workers, executes the best candidate, verifies the result, falls back when necessary, and records telemetry that can improve future routing.

> Status: **v0.1.0 foundation** — intentionally small, inspectable, and experimental.

## Why

Most routers answer one question: *which model?*

OpenJEV asks a broader question:

```text
What is the best execution path for this task right now?
```

That can depend on:

- required capabilities
- expected cost
- expected latency
- observed reliability
- cache or context affinity
- verification requirements

## Core loop

```text
Task
  -> capability filter
  -> ranked execution candidates
  -> execute
  -> verify
      -> PASS: return result
      -> FAIL: try next candidate
  -> record telemetry
```

## Quick start

```bash
npm install
npm test
npm run demo
```

The offline demo ranks two workers, rejects the first answer, falls back to a
verified answer, and displays both attempts with goodput `0.5`. It requires no
API key or running model server.

The npm package is being prepared for publication. Until it is published, run the
demo from a checkout. See [`docs/PUBLISHING.md`](docs/PUBLISHING.md) for the release gate.

A minimal worker (ESM API):

```ts
import { MockWorker, OpenJevEngine } from '@buildhubglobal/openjev';

const worker = new MockWorker({
  id: 'local-text',
  capabilities: ['text'],
  estimate: {
    estimatedCost: 0,
    estimatedLatencyMs: 300,
    reliability: 0.9,
    cacheAffinity: 0.7,
  },
  handler: () => 'PASS',
});

const engine = new OpenJevEngine();

const result = await engine.run(
  {
    id: 'demo',
    input: 'Return PASS',
    requiredCapabilities: ['text'],
  },
  [worker],
  {
    verify: (_task, execution) => ({ ok: execution.output === 'PASS' }),
  },
);

console.log(result);
```

## Included in v0.1

- `OpenJevRouter` — capability filtering and weighted ranking
- `OpenJevEngine` — execution, verification, fallback, and retry control
- `InMemoryTelemetry` — reference event sink and simple goodput metric
- `InMemoryCache` — tiny cache interface and implementation
- `MockWorker` — testing and examples
- `OllamaWorker` — minimal local-model reference adapter
- `OpenAICompatibleWorker` — non-streaming text adapter for compatible endpoints

See [`docs/OPENAI_COMPATIBLE.md`](docs/OPENAI_COMPATIBLE.md) for endpoint configuration
and limits. Live calls require an explicitly configured endpoint; the demo and
tests stay offline.

## Architecture

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

The project deliberately keeps vendor integrations outside the core. The long-term shape is:

```text
                         OpenJEV
                           |
                     Execution Router
                           |
        +------------------+------------------+
        |                  |                  |
      Models             Tools            Executors
        |                  |                  |
   local/cloud          MCP/API          code/shell
   frontier LLMs        search           browser/GUI
        |                  |                  |
        +------------------+------------------+
                           |
                       Verifier
                           |
                  PASS / FALLBACK
                           |
                       Telemetry
```

## Project principles

1. **Execution routing > model routing**
2. **Verification is mandatory for important work**
3. **Adapters stay replaceable**
4. **Telemetry should drive routing decisions**
5. **Dangerous executors must be opt-in**
6. **The core stays small enough to audit**

## Inspiration and independence

OpenJEV is informed by public research and public engineering patterns in agent routing, inference serving, computer-use systems, verification harnesses, and cache-aware scheduling.

No NVIDIA Dynamo, H Company, OpenAI, Anthropic, Ollama, or other third-party source code is copied into this project. OpenJEV is an independent implementation and is not affiliated with or endorsed by those organizations.

## Roadmap

See [`docs/ROADMAP.md`](docs/ROADMAP.md).

Near-term priorities:

- MCP worker adapter
- browser/computer-use worker interface
- persistent telemetry
- SLO-aware goodput
- failure-to-regression workflow

## Contributing

Community contributions are welcome. Start with [`CONTRIBUTING.md`](CONTRIBUTING.md).

## Security

Please read [`SECURITY.md`](SECURITY.md) before adding adapters that can execute code, shell commands, browser actions, or GUI automation.

## License

Apache License 2.0. See [`LICENSE`](LICENSE).
