import type { RouteCandidate, RouterWeights, Task, Worker, WorkerEstimate } from './types.js';

const DEFAULT_WEIGHTS: RouterWeights = {
  cost: 0.2,
  latency: 0.2,
  reliability: 0.4,
  cacheAffinity: 0.2,
};

export class OpenJevRouter {
  constructor(private readonly weights: RouterWeights = DEFAULT_WEIGHTS) {
    const total = Object.values(weights).reduce((sum, value) => sum + value, 0);
    if (Math.abs(total - 1) > 0.0001) {
      throw new Error(`Router weights must sum to 1. Received ${total}`);
    }
  }

  async rank(task: Task, workers: Worker[]): Promise<RouteCandidate[]> {
    const eligible = workers.filter((worker) =>
      task.requiredCapabilities.every((capability) => worker.capabilities.includes(capability)),
    );

    if (eligible.length === 0) {
      return [];
    }

    const estimates = await Promise.all(
      eligible.map(async (worker) => ({ worker, estimate: await worker.estimate(task) })),
    );

    const maxCost = Math.max(...estimates.map(({ estimate }) => estimate.estimatedCost), 1);
    const maxLatency = Math.max(...estimates.map(({ estimate }) => estimate.estimatedLatencyMs), 1);

    return estimates
      .map(({ worker, estimate }) => ({
        workerId: worker.id,
        estimate,
        score: this.score(estimate, maxCost, maxLatency),
      }))
      .sort((a, b) => b.score - a.score);
  }

  private score(estimate: WorkerEstimate, maxCost: number, maxLatency: number): number {
    const cheapness = 1 - estimate.estimatedCost / maxCost;
    const speed = 1 - estimate.estimatedLatencyMs / maxLatency;

    return (
      cheapness * this.weights.cost +
      speed * this.weights.latency +
      clamp01(estimate.reliability) * this.weights.reliability +
      clamp01(estimate.cacheAffinity) * this.weights.cacheAffinity
    );
  }
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}
