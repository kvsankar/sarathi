# Release Process

Sarathi releases publish one coherent npm package containing the CLI, prompts, skill,
compiled checkers, status renderer, installers, and documentation.

## Versioning

- Use `vMAJOR.MINOR.PATCH` Git tags, for example `v0.10.0`.
- Keep the version aligned in `package.json`, `package-lock.json`,
  `skills/sarathi/manifest.json`, and `CHANGELOG.md`.
- Use patch releases for compatible fixes, minor releases for meaningful new behavior, and
  major releases for incompatible command, document, checker, or install contracts.

## Changelog

- Record every user-visible prompt, skill, checker, installer, CLI, or documentation change.
- Keep unreleased work under `## Unreleased`.
- Before tagging, move release entries under `## X.Y.Z - YYYY-MM-DD` and leave a new empty
  `## Unreleased` section above it.

## Preparation

1. Confirm the working tree is clean.

   ```sh
   git status --short --branch
   ```

2. Set the version without creating a tag, then update the skill manifest and changelog.

   ```sh
   npm version X.Y.Z --no-git-tag-version
   ```

3. Run the complete local gate.

   ```sh
   npm ci
   npm run check
   ```

4. Build and inspect the exact package.

   ```sh
   npm pack --dry-run --json
   mkdir -p artifacts
   npm pack --json --pack-destination artifacts
   ```

   The archive must contain no Python runtime, TypeScript loader, build-only source, local
   review files, or production dependency.

5. Run source installer dry runs on available platforms.

   ```powershell
   .\scripts\install.ps1 -DryRun
   ```

   ```sh
   bash scripts/install.sh --dry-run
   ```

6. Verify metadata with the intended tag.

   ```sh
   npm run verify:release -- vX.Y.Z
   ```

7. Commit the release preparation and merge it through a reviewed PR.

8. After explicit authorization, create and push the annotated tag from the merged `master`
   commit.

   ```sh
   git tag -a vX.Y.Z -m "sarathi vX.Y.Z"
   git push origin vX.Y.Z
   ```

The tag workflow reruns the Node and browser checks, builds the `.tgz`, publishes it through
the protected `npm` environment and npm Trusted Publishing with provenance, then creates the
GitHub Release and attaches the package. Configure the npm trusted publisher before the first
authorized release. For the first release of a new package, use a short-lived granular token
in the `npm` environment's `NPM_TOKEN` secret because npm requires the package to exist before
trusted publishing can be configured. After that release, configure the trusted publisher,
delete the secret, and rely on OIDC. Never use a long-lived npm token.

## Verification

Confirm the version on npm and GitHub, then install the exact approved version:

```sh
npx --yes sarathi-sdlc@X.Y.Z install --dry-run
npx --yes sarathi-sdlc@X.Y.Z install
```

Avoid rewriting a published tag or package version. Correct a bad release with a new patch
version.
