# Publishing OpenJEV

The package is ESM-only and requires Node.js 20 or newer. It includes compiled
JavaScript, TypeScript declarations, the offline demo, README, LICENSE, and NOTICE.
It has no runtime npm dependencies.

The launch preparation increments the package to 0.1.1 because the published
v0.1.0 GitHub tag predates the new adapter. Keep that foundation tag unchanged.
npm rejected the unscoped name `openjev` because it is too similar to `open-jev`.
The approved npm package name is `@buildhubglobal/openjev`.

## Release gate

1. Review and merge the preparation PR.
2. On a clean checkout of the resulting commit, run:

   ```bash
   npm install
   npm test
   npm run demo
   npm run check:package
   npm pack --dry-run
   ```

3. Confirm the tarball contains `dist/src/index.js`, declarations, `LICENSE`, and
   `NOTICE`, with no credentials, local state, or provider responses.
4. Create the matching v0.1.1 GitHub release from that reviewed commit.
5. Sign in to the intended npm publisher account using `npm login`, complete
   any required 2FA, and check `npm whoami` and `npm view @buildhubglobal/openjev version`.
6. Publish from the same checkout with `npm publish --access public`, completing
   any required npm confirmation. Do not put an npm token in the repository.
7. Verify `npm view @buildhubglobal/openjev version` returns `0.1.1`, then install `@buildhubglobal/openjev@0.1.1`
   in a fresh directory and run the verification/fallback example.

Publishing is a separate external release step. This preparation does not publish
to npm, change the v0.1.0 tag, or automatically merge the PR.

The package's `prepack` builds artifacts even on a clean checkout, and
`prepublishOnly` runs the test suite. CI tests, runs the offline demo, and checks
the actual tarball in an isolated consumer project before the release gate.
