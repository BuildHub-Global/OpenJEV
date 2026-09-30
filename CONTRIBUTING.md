# Contributing to OpenJEV

Thanks for helping improve OpenJEV.

## Before opening a PR

1. Keep the core vendor-neutral.
2. Put vendor-specific behavior behind an adapter.
3. Add or update tests for behavior changes.
4. Avoid hidden network calls, telemetry, or credentials.
5. Document any executor that can mutate files, systems, browsers, or remote services.

## Development

```bash
npm install
npm test
```

## Pull requests

A good PR explains:

- the problem being solved
- why the change belongs in OpenJEV
- how it was tested
- any security or compatibility implications

Small, composable changes are preferred over large framework rewrites.
