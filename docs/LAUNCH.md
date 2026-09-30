# Launch copy — draft

Publish after the preparation PR is merged and its CI passes. Add npm installation
instructions only after the package is actually published and verified.

## Short announcement

Introducing OpenJEV: an open-source, vendor-neutral execution router and
verification framework for AI agents, tools, and models.

OpenJEV filters workers by capability, ranks execution paths using cost, latency,
reliability, and cache affinity, verifies results, and falls back when verification
fails. The TypeScript core includes telemetry, a cache abstraction, an Ollama
adapter, and an OpenAI-compatible text worker adapter.

Try the offline demo: clone the repository, run `npm install`, then `npm run demo`.
It shows a fast worker producing the wrong answer, a verifier rejecting it, and a
second worker returning the verified result—with telemetry for both attempts.

This is an experimental foundation. MCP and browser/computer-use adapters,
persistent telemetry, and SLO-aware goodput are next on the roadmap.

Apache 2.0 licensed. Contributions and feedback are welcome.

Repository: https://github.com/BuildHub-Global/OpenJEV
Roadmap: https://github.com/BuildHub-Global/OpenJEV/issues
