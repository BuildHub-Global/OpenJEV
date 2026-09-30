import type { VerificationResult, WorkerEstimate } from '../core/types.js';

export interface ExecutionEvent {
  taskId: string;
  workerId: string;
  attempt: number;
  startedAt: number;
  finishedAt: number;
  estimate: WorkerEstimate;
  verification: VerificationResult;
  error?: string;
}

export interface TelemetrySink {
  record(event: ExecutionEvent): Promise<void> | void;
}
