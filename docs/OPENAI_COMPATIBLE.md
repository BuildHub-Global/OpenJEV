# OpenAI-compatible worker

`OpenAICompatibleWorker` implements the existing text worker contract using a
non-streaming `POST /chat/completions` request. The core has no provider SDK dependency.

```ts
import { OpenAICompatibleWorker, OpenJevEngine } from '@buildhubglobal/openjev';

const worker = new OpenAICompatibleWorker({
  baseUrl: 'http://127.0.0.1:1234/v1',
  model: 'your-local-model',
  timeoutMs: 30_000,
  // For an authenticated service, supply apiKey from your application's secret store.
  estimate: { estimatedCost: 0, estimatedLatencyMs: 1500, reliability: 0.8 },
});

const result = await new OpenJevEngine().run(
  { id: 'pass-check', input: 'Return exactly PASS', requiredCapabilities: ['text'] },
  [worker],
  { verify: (_task, execution) => ({ ok: execution.output.trim() === 'PASS' }) },
);
console.log(result.result.output);
```

Construction does not make a network call. Running the example requires an
explicitly configured endpoint; normal tests and `npm run demo` stay offline.
Use HTTPS for remote authenticated endpoints. HTTP is supported for local servers.
Redirects are rejected so authentication is not forwarded to another endpoint.

The adapter accepts string inputs, serializes other task inputs as JSON, and
returns text plus measured latency and numeric token usage when supplied.
Configure routing cost estimates yourself: token counts are not an actual billed
cost, and estimates are not calibrated automatically.

Timeouts cover the request and response-body read. A caller invoking `execute`
directly can pass `ExecutionContext.signal`; the current engine does not expose
caller cancellation through `run`. HTTP failures, malformed responses, and
transport failures become errors that the existing engine can record and fall
back from. Provider error bodies and credentials are excluded from adapter errors
and metadata. Successful output still belongs to the caller and may be sensitive.

Streaming, tool calls, images, and structured chat histories are out of scope for
this initial text adapter. An injected `fetch` transport is available for offline
tests and must honor the provided abort signal, like the built-in transport.
