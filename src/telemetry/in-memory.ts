import type { ExecutionEvent, TelemetrySink } from './types.js';

export class InMemoryTelemetry implements TelemetrySink {
  readonly events: ExecutionEvent[] = [];

  record(event: ExecutionEvent): void {
    this.events.push(event);
  }

  goodput(): number {
    if (this.events.length === 0) return 0;
    const successful = this.events.filter((event) => event.verification.ok).length;
    return successful / this.events.length;
  }
}
