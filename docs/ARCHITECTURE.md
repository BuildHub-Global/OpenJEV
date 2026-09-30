# OpenJEV architecture

OpenJEV is intentionally small. It separates five concerns that are often mixed together in agent systems:

1. **Task description** — what must be done and which capabilities are mandatory.
2. **Routing** — which worker is the best current candidate.
3. **Execution** — model, tool, API, shell, browser, GUI agent, or composite worker.
4. **Verification** — whether the result is actually acceptable.
5. **Telemetry** — what succeeded, failed, cost, and how long it took.

```text
Task
  |
  v
Capability filter
  |
  v
Router ---- estimates: cost / latency / reliability / cache affinity
  |
  v
Worker 1 ------> Verifier ---- PASS ----> result
  |                |
  |                FAIL
  v                |
Worker 2 <----------+
  |
  v
Telemetry / regression data
```

## Design principles

- **Execution routing, not only model routing.** A worker can be an LLM, API, MCP server, shell process, browser agent, GUI agent, or a composite workflow.
- **Verification is first-class.** Successful execution is not the same as a correct result.
- **Vendor-neutral core.** Vendor integrations live behind adapters.
- **Observability before cleverness.** Routing should improve from measured outcomes, not intuition alone.
- **Safe defaults.** Potentially destructive executors should be opt-in adapters, not part of the core runtime.

## Current scoring

The reference router scores eligible workers using four normalized signals:

- estimated cost
- estimated latency
- reliability
- cache affinity

The default weights are deliberately simple and configurable. Future releases should support learned policies and SLO-aware goodput routing without making those features mandatory.
