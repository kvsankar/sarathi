# Release Process

Sarathi releases publish a coherent prompt, skill, checker, installer, and
documentation snapshot. Release tags are lightweight to consume but should be
prepared deliberately.

## Versioning

- Use `vMAJOR.MINOR.PATCH` Git tags, for example `v0.1.0`.
- Keep the tag version aligned with `pyproject.toml`.
- Use patch releases for fixes that do not change the intended SDLC behavior.
- Use minor releases for new prompts, checker rules, skill guidance, installer
  targets, or meaningful process behavior changes.
- Reserve major releases for incompatible command, artifact, checker, or install
  contract changes.

## Changelog Rules

- Every user-visible prompt, skill, checker, installer, or documentation change
  gets a `CHANGELOG.md` entry.
- Keep unreleased work under `## Unreleased`.
- Group entries under `Added`, `Changed`, `Fixed`, `Deprecated`, `Removed`,
  `Security`, or `Docs` as applicable.
- Before tagging, rename `## Unreleased` to `## X.Y.Z - YYYY-MM-DD`, add a fresh
  empty `## Unreleased` section above it, and make sure the date is the tag date.
- Do not list private implementation noise unless it affects maintainers,
  installers, checkers, prompt behavior, or generated artifacts.

## Release Preparation

1. Confirm the working tree is clean:

   ```sh
   git status --short --branch
   ```

2. Choose the next version and update `pyproject.toml`.

3. Update `CHANGELOG.md`:

   - Move relevant entries from `Unreleased` into the versioned section.
   - Add or prune categories so the section is readable.
   - Keep a new empty `Unreleased` section at the top.

4. Run the full local gate:

   ```sh
   uv run python -m pre_commit run --all-files
   ```

5. Run installer dry runs for the platforms available on the release machine:

   ```powershell
   .\scripts\install.ps1 -DryRun
   ```

   ```sh
   bash scripts/install.sh --dry-run
   sh scripts/install.sh --dry-run
   ```

   On Windows, the PowerShell dry run may also exercise the WSL companion path
   when WSL is available. On WSL, the Bash dry run may exercise the Windows
   companion path when `powershell.exe` is available.

6. Commit the release prep:

   ```sh
   git add pyproject.toml CHANGELOG.md
   git commit -m "Release vX.Y.Z"
   ```

7. Create an annotated tag:

   ```sh
   git tag -a vX.Y.Z -m "Sarathi vX.Y.Z"
   ```

8. Push the branch and tag:

   ```sh
   git push origin master
   git push origin vX.Y.Z
   ```

9. Optionally deploy locally from the tagged commit:

   ```powershell
   .\scripts\install.ps1
   ```

## Tag Corrections

Avoid rewriting a published tag. If a pushed release tag is wrong, prefer a new
patch release. Delete and recreate a tag only when it has not been consumed and
the maintainers explicitly agree.
