export type Capability = string;

export interface Task {
  id: string;
  input: unknown;
  requiredCapabilities: Capability[];
  preferredCapabilities?: Capability[];
  metadata?: Record<string, unknown>;
}

export interface WorkerEstimate {
  estimatedCost: number;
  estimatedLatencyMs: number;
  reliability: number;
  cacheAffinity: number;
}

export interface ExecutionContext {
  attempt: number;
  signal?: AbortSignal;
  metadata?: Record<string, unknown>;
}

export interface ExecutionResult<T = unknown> {
  output: T;
  metadata?: Record<string, unknown>;
}

export interface Worker<T = unknown> {
  id: string;
  capabilities: Capability[];
  estimate(task: Task): Promise<WorkerEstimate> | WorkerEstimate;
  execute(task: Task, context: ExecutionContext): Promise<ExecutionResult<T>>;
}

export interface VerificationResult {
  ok: boolean;
  reason?: string;
  score?: number;
}

export interface Verifier<T = unknown> {
  verify(task: Task, result: ExecutionResult<T>): Promise<VerificationResult> | VerificationResult;
}

export interface RouteCandidate {
  workerId: string;
  score: number;
  estimate: WorkerEstimate;
}

export interface RouterWeights {
  cost: number;
  latency: number;
  reliability: number;
  cacheAffinity: number;
}

export interface ExecutionPolicy {
  maxAttempts: number;
}
