import type {
  ExecutionPolicy,
  ExecutionResult,
  Task,
  Verifier,
  VerificationResult,
  Worker,
} from './types.js';
import { OpenJevRouter } from './router.js';
import type { TelemetrySink } from '../telemetry/types.js';

export interface EngineOptions {
  router?: OpenJevRouter;
  telemetry?: TelemetrySink;
  policy?: Partial<ExecutionPolicy>;
}

export interface EngineResult<T = unknown> {
  workerId: string;
  result: ExecutionResult<T>;
  verification: VerificationResult;
  attempts: number;
}

export class OpenJevEngine {
  private readonly router: OpenJevRouter;
  private readonly telemetry?: TelemetrySink;
  private readonly maxAttempts: number;

  constructor(options: EngineOptions = {}) {
    this.router = options.router ?? new OpenJevRouter();
    this.telemetry = options.telemetry;
    this.maxAttempts = options.policy?.maxAttempts ?? 3;
  }

  async run<T>(task: Task, workers: Worker<T>[], verifier: Verifier<T>): Promise<EngineResult<T>> {
    const ranked = await this.router.rank(task, workers);
    if (ranked.length === 0) {
      throw new Error(`No eligible worker for task ${task.id}`);
    }

    const attempts = Math.min(this.maxAttempts, ranked.length);
    let lastReason = 'No worker succeeded';

    for (let index = 0; index < attempts; index += 1) {
      const candidate = ranked[index]!;
      const worker = workers.find((item) => item.id === candidate.workerId)!;
      const startedAt = Date.now();

      try {
        const result = await worker.execute(task, { attempt: index + 1 });
        const verification = await verifier.verify(task, result);
        const finishedAt = Date.now();

        await this.telemetry?.record({
          taskId: task.id,
          workerId: worker.id,
          attempt: index + 1,
          startedAt,
          finishedAt,
          estimate: candidate.estimate,
          verification,
        });

        if (verification.ok) {
          return {
            workerId: worker.id,
            result,
            verification,
            attempts: index + 1,
          };
        }

        lastReason = verification.reason ?? `Worker ${worker.id} failed verification`;
      } catch (error) {
        const finishedAt = Date.now();
        lastReason = error instanceof Error ? error.message : String(error);
        await this.telemetry?.record({
          taskId: task.id,
          workerId: worker.id,
          attempt: index + 1,
          startedAt,
          finishedAt,
          estimate: candidate.estimate,
          verification: { ok: false, reason: lastReason },
          error: lastReason,
        });
      }
    }

    throw new Error(`Task ${task.id} failed after ${attempts} attempt(s): ${lastReason}`);
  }
}
