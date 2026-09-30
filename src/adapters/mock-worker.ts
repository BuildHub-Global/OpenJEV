import type {
  ExecutionContext,
  ExecutionResult,
  Task,
  Worker,
  WorkerEstimate,
} from '../core/types.js';

export interface MockWorkerOptions<T> {
  id: string;
  capabilities: string[];
  estimate: WorkerEstimate;
  handler: (task: Task, context: ExecutionContext) => Promise<T> | T;
}

export class MockWorker<T = unknown> implements Worker<T> {
  readonly id: string;
  readonly capabilities: string[];

  constructor(private readonly options: MockWorkerOptions<T>) {
    this.id = options.id;
    this.capabilities = options.capabilities;
  }

  estimate(): WorkerEstimate {
    return this.options.estimate;
  }

  async execute(task: Task, context: ExecutionContext): Promise<ExecutionResult<T>> {
    return { output: await this.options.handler(task, context) };
  }
}
