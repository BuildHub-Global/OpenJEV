# Roadmap

## v0.1 — foundation

- Capability-based worker routing
- Cost / latency / reliability / cache-affinity scoring
- Verification-first fallback loop
- In-memory telemetry and cache
- Mock and Ollama reference adapters

## v0.1.1 — launch preparation

- OpenAI-compatible non-streaming text adapter
- Offline verification/fallback demo
- npm packaging, declarations, and isolated consumer validation

## v0.2 — adapter ecosystem

- Streaming and richer OpenAI-compatible adapter capabilities
- MCP adapter
- HTTP/API adapter
- Browser/computer-use adapter interface
- Structured-output verifier helpers

## v0.3 — operational routing

- SLO-aware goodput metrics
- Circuit breakers and health checks
- Per-worker concurrency limits
- Artifact / multimodal cache keys
- Persistent telemetry interface

## v0.4 — adaptive policies

- Historical reliability by task class
- Policy plug-ins
- Learned routing experiments
- Regression-task generation from verified failures

## Non-goals

OpenJEV does not aim to become a model server, Kubernetes replacement, or proprietary orchestration platform. It should remain a small execution-routing and verification layer that integrates with those systems.
