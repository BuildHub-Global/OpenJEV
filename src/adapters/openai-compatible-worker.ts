import type { ExecutionContext, ExecutionResult, Task, Worker, WorkerEstimate } from '../core/types.js';

export interface OpenAICompatibleWorkerOptions {
  id?: string;
  model: string;
  /** Explicit API root, for example https://provider.example/v1. */
  baseUrl: string;
  /** Supply externally; never stored in execution metadata or errors. */
  apiKey?: string;
  timeoutMs?: number;
  capabilities?: string[];
  estimate?: Partial<WorkerEstimate>;
  /** Injectable transport for offline tests. */
  fetch?: typeof globalThis.fetch;
}

/** Minimal non-streaming chat-completions adapter; no provider SDK required. */
export class OpenAICompatibleWorker implements Worker<string> {
  readonly id: string;
  readonly capabilities: string[];
  private readonly baseUrl: string;
  private readonly model: string;
  private readonly apiKey?: string;
  private readonly timeoutMs: number;
  private readonly transport: typeof globalThis.fetch;
  private readonly workerEstimate: WorkerEstimate;

  constructor(options: OpenAICompatibleWorkerOptions) {
    const url = new URL(options.baseUrl);
    if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) {
      throw new Error('baseUrl must be an HTTP(S) API root without credentials, query, or fragment');
    }
    if (!options.model.trim()) throw new Error('model must not be empty');
    this.timeoutMs = options.timeoutMs ?? 30_000;
    if (!Number.isSafeInteger(this.timeoutMs) || this.timeoutMs <= 0 || this.timeoutMs > 2_147_483_647) {
      throw new Error('timeoutMs must be a positive 32-bit integer');
    }
    this.baseUrl = url.href.replace(/\/$/, '');
    this.model = options.model;
    this.apiKey = options.apiKey;
    this.id = options.id ?? `openai-compatible:${options.model}`;
    this.capabilities = options.capabilities ?? ['text'];
    this.transport = options.fetch ?? globalThis.fetch;
    this.workerEstimate = {
      estimatedCost: 0,
      estimatedLatencyMs: 1500,
      reliability: 0.75,
      cacheAffinity: 0,
      ...options.estimate,
    };
  }

  estimate(): WorkerEstimate {
    return this.workerEstimate;
  }

  async execute(task: Task, context: ExecutionContext): Promise<ExecutionResult<string>> {
    const controller = new AbortController();
    let timedOut = false;
    const cancel = () => controller.abort();
    context.signal?.addEventListener('abort', cancel, { once: true });
    if (context.signal?.aborted) cancel();
    const timer = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, this.timeoutMs);
    const startedAt = Date.now();

    try {
      if (controller.signal.aborted) throw new Error('cancelled');
      const headers: Record<string, string> = { 'content-type': 'application/json' };
      if (this.apiKey) headers.authorization = `Bearer ${this.apiKey}`;
      const response = await this.transport(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers,
        signal: controller.signal,
        // Do not follow redirects carrying authentication to a different endpoint.
        redirect: 'error',
        body: JSON.stringify({
          model: this.model,
          messages: [{ role: 'user', content: typeof task.input === 'string' ? task.input : JSON.stringify(task.input) }],
          stream: false,
        }),
      });
      if (!response.ok) throw new Error(`OpenAI-compatible request failed with HTTP ${response.status}`);
      let body: unknown;
      try {
        body = await response.json();
      } catch {
        if (controller.signal.aborted) throw new Error('aborted');
        throw new Error('OpenAI-compatible response was not valid JSON');
      }
      if (controller.signal.aborted) throw new Error('aborted');
      const data = body as {
        choices?: { message?: { content?: unknown } }[];
        usage?: Record<string, unknown>;
      } | null;
      const output = Array.isArray(data?.choices) ? data.choices[0]?.message?.content : undefined;
      if (typeof output !== 'string') throw new Error('OpenAI-compatible response did not include text content');
      const usage: Record<string, number> = {};
      for (const key of ['prompt_tokens', 'completion_tokens', 'total_tokens']) {
        const value = data?.usage?.[key];
        if (typeof value === 'number' && Number.isSafeInteger(value) && value >= 0) usage[key] = value;
      }
      return {
        output,
        metadata: {
          latencyMs: Date.now() - startedAt,
          ...(Object.keys(usage).length ? { usage } : {}),
        },
      };
    } catch (error) {
      if (timedOut) throw new Error('OpenAI-compatible request timed out');
      if (context.signal?.aborted) throw new Error('OpenAI-compatible request cancelled');
      // Preserve only our fixed diagnostics, never provider response bodies/transport errors.
      if (error instanceof Error && /^OpenAI-compatible (request failed with HTTP \d+|response was not valid JSON|response did not include text content)$/.test(error.message)) {
        throw error;
      }
      throw new Error('OpenAI-compatible transport failed');
    } finally {
      clearTimeout(timer);
      context.signal?.removeEventListener('abort', cancel);
    }
  }
}
