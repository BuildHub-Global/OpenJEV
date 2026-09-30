# Security policy

OpenJEV routes execution across models, tools, and potentially privileged executors. Treat adapters as trust boundaries.

## Safe adapter requirements

Adapters that can mutate systems or external services should:

- be opt-in
- document permissions clearly
- support least-privilege configuration
- avoid logging secrets
- provide dry-run or confirmation hooks where practical
- return structured execution metadata for verification

## Reporting vulnerabilities

Until a dedicated private security channel is published, do not include live secrets, credentials, or exploit payloads in public issues. Open a minimal issue asking maintainers for a private reporting channel.
