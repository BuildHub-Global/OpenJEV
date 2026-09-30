import type {
  ExecutionContext,
  ExecutionResult,
  Task,
  Worker,
  WorkerEstimate,
} from '../core/types.js';

export interface OllamaWorkerOptions {
  id?: string;
  model: string;
  baseUrl?: string;
  capabilities?: string[];
  estimate?: Partial<WorkerEstimate>;
}

export class OllamaWorker implements Worker<string> {
  readonly id: string;
  readonly capabilities: string[];
  private readonly baseUrl: string;
  private readonly model: string;
  private readonly workerEstimate: WorkerEstimate;

  constructor(options: OllamaWorkerOptions) {
    this.id = options.id ?? `ollama:${options.model}`;
    this.model = options.model;
    const runtimeEnv = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env;
    this.baseUrl = options.baseUrl ?? runtimeEnv?.OPENJEV_OLLAMA_URL ?? 'http://127.0.0.1:11434';
    this.capabilities = options.capabilities ?? ['text'];
    this.workerEstimate = {
      estimatedCost: 0,
      estimatedLatencyMs: 1500,
      reliability: 0.75,
      cacheAffinity: 0.5,
      ...options.estimate,
    };
  }

  estimate(): WorkerEstimate {
    return this.workerEstimate;
  }

  async execute(task: Task, _context: ExecutionContext): Promise<ExecutionResult<string>> {
    const response = await fetch(`${this.baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        model: this.model,
        prompt: typeof task.input === 'string' ? task.input : JSON.stringify(task.input),
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama request failed with HTTP ${response.status}`);
    }

    const body = (await response.json()) as { response?: string };
    if (typeof body.response !== 'string') {
      throw new Error('Ollama response did not include a text response');
    }

    return { output: body.response };
  }
}
