# Publishing OpenJEV

The official package is `@buildhubglobal/openjev`, ESM-only, Node.js 20 or newer, with TypeScript declarations and no runtime dependencies.

## Release history and consistency

npm rejected the historical unscoped name `openjev` as too similar to `open-jev`.
GitHub v0.1.1 predates the scoped-name change, while the published scoped npm v0.1.1 includes that change. Its recorded gitHead does not capture those working-tree edits. Preserve the historical tag and npm version. v0.1.2 aligns the source, documentation, package name, and publication from a clean main commit.

## Release gate

1. Review the focused release PR and merge only with passing checks.
2. Validate `npm install`, `npm test`, `npm run demo`, `npm run check:package`, and `npm pack --dry-run`.
3. Inspect tarball contents: compiled runtime, declarations, README, LICENSE, NOTICE, package metadata; no credentials or local state.
4. Wait for main CI and create the versioned GitHub release at that exact main commit. Never rewrite existing public tags.
5. Publish from the clean tagged checkout: confirm `npm whoami`, check the target version, then `npm publish --access public`. Complete required npm security confirmation without bypassing authentication.
6. Verify `npm view @buildhubglobal/openjev version` returns `0.1.2` and the npm gitHead matches the release commit.
7. Install `@buildhubglobal/openjev@0.1.2` from the public registry in a fresh directory; compile a TypeScript consumer and execute the ESM verification/fallback example.

The package's prepack builds artifacts and prepublishOnly runs tests. CI tests the offline demo and an isolated tarball consumer. Public announcements require separate user approval; docs/LAUNCH.md remains a review draft.
