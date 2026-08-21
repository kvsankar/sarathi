#!/usr/bin/env bash

if [ -z "${BASH_VERSION:-}" ]; then
  if command -v bash >/dev/null 2>&1; then
    exec bash "$0" "$@"
  fi
  echo "Sarathi installer requires bash. Run: bash scripts/install.sh ..." >&2
  exit 2
fi

set -euo pipefail

if [[ -n "${SARATHI_REPO_ROOT:-}" ]]; then
  REPO_ROOT="$(cd "$SARATHI_REPO_ROOT" && pwd -P)"
  SCRIPT_DIR="$REPO_ROOT/scripts"
elif [[ -n "${AGENT_SDLC_REPO_ROOT:-}" ]]; then
  REPO_ROOT="$(cd "$AGENT_SDLC_REPO_ROOT" && pwd -P)"
  SCRIPT_DIR="$REPO_ROOT/scripts"
else
  SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
fi
PROMPT_SOURCE="$REPO_ROOT/prompts"
LEGACY_CHECKER_SOURCE="$REPO_ROOT/checkers"
COMPILED_CHECKER_SOURCE="$REPO_ROOT/dist/checkers"
if [[ -f "$COMPILED_CHECKER_SOURCE/check_plan.mjs" ]]; then
  CHECKER_SOURCE="$COMPILED_CHECKER_SOURCE"
  CHECKER_STATUS_SOURCE="$REPO_ROOT/dist/status"
else
  CHECKER_SOURCE="$LEGACY_CHECKER_SOURCE"
  CHECKER_STATUS_SOURCE=""
fi
DOC_SOURCE="$REPO_ROOT/docs"
PACKAGED_SKILL_SOURCE="$REPO_ROOT/bundle/skills/sarathi"
if [[ -f "$PACKAGED_SKILL_SOURCE/scripts/check_update.mjs" ]]; then
  SKILL_SOURCE="$PACKAGED_SKILL_SOURCE"
else
  SKILL_SOURCE="$REPO_ROOT/skills/sarathi"
fi

TARGET_ROOT="$(pwd)"
SCOPE="user"
TOOLS=""
NO_CHECKERS=0
NO_CROSS_INSTALL=0
DRY_RUN=0
VERBOSE=0

usage() {
  cat <<'EOF'
Usage: scripts/install.sh [options]

Options:
  --target <dir>        Project folder. Default: current directory.
  --scope <project|user>
                        Install commands for this project or the current user.
                        Default: user.
  --tools <list>        Optional comma-separated subset:
                        codex,copilot,claude-code,gemini,claude,pi.
                        Default: install all tools.
  --no-checkers         Do not copy checkers/ into the target workspace.
  --no-cross-install    Do not also install Sarathi on Windows or WSL.
  --dry-run             Show what would be installed without writing files.
  -v, --verbose         Show destinations, per-tool actions, and install notes.
  -h, --help            Show this help.

Notes:
  - GitHub Copilot prompts install to the VS Code user prompts folder by default,
    or to <target>/.github/prompts with --scope project. Copilot skills install
    to ~/.copilot/skills and ~/.agents/skills by default, or to <target>/.github/skills
    and <target>/.agents/skills with --scope project.
  - Codex skills install to <target>/.codex/skills or ~/.codex/skills.
  - Codex direct prompts install to <target>/.codex/prompts or ~/.codex/prompts
    and are invoked as /prompts:<name> after restarting Codex.
  - Claude Code commands install to <target>/.claude/commands or ~/.claude/commands,
    and the skill installs to <target>/.claude/skills or ~/.claude/skills.
  - Gemini CLI commands install to <target>/.gemini/commands or ~/.gemini/commands.
  - Claude and Pi exports install to .ai-prompts/ because they do not expose a stable
    local slash-command folder.
  - When run in WSL, this script also installs Sarathi on Windows if
    powershell.exe is available. Use --no-cross-install to disable that.
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --target)
      TARGET_ROOT="$2"
      shift 2
      ;;
    --scope)
      SCOPE="$2"
      shift 2
      ;;
    --tools)
      TOOLS="$2"
      shift 2
      ;;
    --no-checkers)
      NO_CHECKERS=1
      shift
      ;;
    --no-cross-install)
      NO_CROSS_INSTALL=1
      shift
      ;;
    --dry-run)
      DRY_RUN=1
      shift
      ;;
    -v|--verbose)
      VERBOSE=1
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      usage >&2
      exit 2
      ;;
  esac
done

exec 3>&1
if [[ "$VERBOSE" -eq 0 ]]; then
  exec 1>/dev/null
fi

TARGET_ROOT="$(cd "$TARGET_ROOT" && pwd)"

if [[ "$TARGET_ROOT" == "$REPO_ROOT" ]]; then
  echo "You are installing into Sarathi's own source folder."
  echo "This is useful for testing Sarathi, but it will add prompts and checkers here."
  echo "Use --target <project-folder> to install into a product project."
fi
if [[ "$DRY_RUN" -eq 1 ]]; then
  echo "Dry run: no files will be written and nothing will be installed on Windows."
fi

if [[ ! -d "$PROMPT_SOURCE" ]]; then
  echo "Prompt source folder not found: $PROMPT_SOURCE" >&2
  exit 1
fi
if [[ ! -d "$DOC_SOURCE" ]]; then
  echo "Documentation source folder not found: $DOC_SOURCE" >&2
  exit 1
fi
if [[ "$NO_CHECKERS" -eq 0 && ! -d "$CHECKER_SOURCE" ]]; then
  echo "Checker source folder not found: $CHECKER_SOURCE" >&2
  exit 1
fi
if [[ -f "$CHECKER_SOURCE/check_plan.mjs" ]]; then
  STATUS_CLI="$CHECKER_SOURCE/status/cli.mjs"
  if [[ -n "$CHECKER_STATUS_SOURCE" ]]; then
    STATUS_CLI="$CHECKER_STATUS_SOURCE/cli.mjs"
  fi
  for required in \
    "$CHECKER_SOURCE/lib/approvals.mjs" \
    "$CHECKER_SOURCE/render_workflow_status.mjs" \
    "$STATUS_CLI"; do
    if [[ ! -f "$required" ]]; then
      echo "Compiled checker bundle is incomplete; missing: $required" >&2
      exit 1
    fi
  done
fi
if [[ ! -d "$SKILL_SOURCE" ]]; then
  echo "Skill source folder not found: $SKILL_SOURCE" >&2
  exit 1
fi
if [[ "$SCOPE" != "project" && "$SCOPE" != "user" ]]; then
  echo "--scope must be project or user" >&2
  exit 2
fi

command_name() {
  local file="$1"
  basename "$file" .prompt.md
}

prompt_body() {
  awk '
    BEGIN { in_fm = 0; done = 0 }
    NR == 1 && $0 == "---" { in_fm = 1; next }
    in_fm && $0 == "---" { in_fm = 0; done = 1; next }
    !in_fm { print }
  ' "$1"
}

prompt_description() {
  local line
  line="$(grep -m 1 '^description:' "$1" || true)"
  if [[ -n "$line" ]]; then
    printf '%s\n' "${line#description: }"
  else
    printf '%s\n' "Command prompt installed from commands repository."
  fi
}

copilot_prompt_body() {
  awk '
    BEGIN { replaced = 0 }
    !replaced && $0 ~ /^agent:[[:space:]]*agent[[:space:]]*$/ {
      print "mode: agent"
      replaced = 1
      next
    }
    { print }
  ' "$1"
}

codex_skill_dest() {
  if [[ "$SCOPE" == "user" ]]; then
    printf '%s\n' "${CODEX_HOME:-$HOME/.codex}/skills/sarathi"
  else
    printf '%s\n' "$TARGET_ROOT/.codex/skills/sarathi"
  fi
}

codex_prompt_dest() {
  if [[ "$SCOPE" == "user" ]]; then
    printf '%s\n' "${CODEX_HOME:-$HOME/.codex}/prompts"
  else
    printf '%s\n' "$TARGET_ROOT/.codex/prompts"
  fi
}

copilot_prompt_dest() {
  if [[ "$SCOPE" != "user" ]]; then
    printf '%s\n' "$TARGET_ROOT/.github/prompts"
    return
  fi
  if [[ -n "${SARATHI_COPILOT_PROMPTS_DIR:-}" ]]; then
    printf '%s\n' "$SARATHI_COPILOT_PROMPTS_DIR"
    return
  fi
  if [[ -n "${AGENT_SDLC_COPILOT_PROMPTS_DIR:-}" ]]; then
    printf '%s\n' "$AGENT_SDLC_COPILOT_PROMPTS_DIR"
    return
  fi
  case "$(uname -s)" in
    Darwin)
      printf '%s\n' "$HOME/Library/Application Support/Code/User/prompts"
      ;;
    *)
      printf '%s\n' "${XDG_CONFIG_HOME:-$HOME/.config}/Code/User/prompts"
      ;;
  esac
}

copilot_skill_dests() {
  if [[ "$SCOPE" == "user" ]]; then
    printf '%s\n' "$HOME/.copilot/skills/sarathi"
    printf '%s\n' "$HOME/.agents/skills/sarathi"
  else
    printf '%s\n' "$TARGET_ROOT/.github/skills/sarathi"
    printf '%s\n' "$TARGET_ROOT/.agents/skills/sarathi"
  fi
}

legacy_stage_skill_roots() {
  local skill_dest
  while IFS= read -r skill_dest; do
    dirname "$skill_dest"
  done < <(copilot_skill_dests)
}

copy_codex_prompt_files() {
  local dest="$1"
  mkdir -p "$dest"
  for file in "$PROMPT_SOURCE"/*.prompt.md; do
    cp "$file" "$dest/$(command_name "$file").md"
  done
}

write_destination_summary() {
  echo "Destination folders:"
  if [[ "$NO_CHECKERS" -eq 0 ]]; then
    echo "  Checkers -> $TARGET_ROOT/checkers"
  fi
  for tool in "${TOOL_LIST[@]}"; do
    case "$tool" in
      codex)
        echo "  Codex skill -> $(codex_skill_dest)"
        echo "  Codex direct prompts -> $(codex_prompt_dest)"
        echo "    Invoke as /prompts:spec-create, /prompts:design-create, etc. after restarting Codex."
        ;;
      copilot)
        echo "  GitHub Copilot prompts -> $(copilot_prompt_dest)"
        while IFS= read -r skill_dest; do
          echo "  GitHub Copilot skill -> $skill_dest"
          echo "  Explicit Sarathi command skills -> $(dirname "$skill_dest")"
        done < <(copilot_skill_dests)
        if [[ "$SCOPE" == "user" ]]; then
          echo "    VS Code prompts and Copilot skills for the current user."
        fi
        echo "    Explicit commands use prefixed skills such as sarathi-code-review and sarathi-code-assess."
        echo "    Reload Copilot CLI skills with /skills reload, then check /skills info sarathi."
        ;;
      claude-code)
        if [[ "$SCOPE" == "user" ]]; then
          echo "  Claude Code commands -> $HOME/.claude/commands"
          echo "  Claude Code skill -> $HOME/.claude/skills/sarathi"
        else
          echo "  Claude Code commands -> $TARGET_ROOT/.claude/commands"
          echo "  Claude Code skill -> $TARGET_ROOT/.claude/skills/sarathi"
        fi
        ;;
      gemini)
        if [[ "$SCOPE" == "user" ]]; then
          echo "  Gemini CLI commands -> $HOME/.gemini/commands"
        else
          echo "  Gemini CLI commands -> $TARGET_ROOT/.gemini/commands"
        fi
        ;;
      claude)
        if [[ "$SCOPE" == "user" ]]; then
          echo "  Claude prompt export -> $HOME/.ai-prompts/claude"
          echo "  Claude skill export -> $HOME/.ai-prompts/claude/skills/sarathi"
        else
          echo "  Claude prompt export -> $TARGET_ROOT/.ai-prompts/claude"
          echo "  Claude skill export -> $TARGET_ROOT/.ai-prompts/claude/skills/sarathi"
        fi
        ;;
      pi)
        if [[ "$SCOPE" == "user" ]]; then
          echo "  Pi prompt export -> $HOME/.ai-prompts/pi"
          echo "  Pi skill export -> $HOME/.ai-prompts/pi/skills/sarathi"
        else
          echo "  Pi prompt export -> $TARGET_ROOT/.ai-prompts/pi"
          echo "  Pi skill export -> $TARGET_ROOT/.ai-prompts/pi/skills/sarathi"
        fi
        ;;
    esac
  done
}

toml_escape_basic() {
  sed 's/\\/\\\\/g; s/"/\\"/g'
}

copy_checkers() {
  if [[ "$NO_CHECKERS" -eq 1 ]]; then
    return
  fi
  local dest="$TARGET_ROOT/checkers"
  if [[ "$SCOPE" == "user" ]]; then
    echo "Checkers belong in a project folder. They will be installed in $dest."
    echo "Use --no-checkers to skip them."
  fi
  if [[ "$DRY_RUN" -eq 1 ]]; then
    echo "Would install checkers -> $dest"
    return
  fi
  local source_resolved dest_resolved
  source_resolved="$(cd "$CHECKER_SOURCE" && pwd -P)"
  if [[ -d "$dest" ]]; then
    dest_resolved="$(cd "$dest" && pwd -P)"
    if [[ "$source_resolved" == "$dest_resolved" ]]; then
      echo "Checker destination is source folder; skipping checker copy."
      return
    fi
  fi
  copy_checker_bundle "$dest"
  remove_retired_python_checkers "$dest"
  echo "Installed checkers -> $dest"
}

remove_retired_python_checkers() {
  local checker_dest="$1"
  [[ -f "$CHECKER_SOURCE/check_plan.mjs" ]] || return 0
  local hash_command file expected actual
  if command -v sha256sum >/dev/null 2>&1; then
    hash_command="sha256sum"
  else
    hash_command="shasum -a 256"
  fi
  while IFS=' ' read -r file expected; do
    [[ -f "$checker_dest/$file" ]] || continue
    actual="$($hash_command "$checker_dest/$file" | awk '{print $1}')"
    if [[ "$actual" == "$expected" ]]; then
      rm -f "$checker_dest/$file"
      echo "Removed retired Python checker -> $checker_dest/$file"
    fi
  done <<'EOF'
approvals.py 2931574e9f5371f1b743a9a2a83449e82cf8f884c973761b1a4e6be345912353
check_code.py b398aa796b1e8735153196cc298ed28dd102d0361a03ad48765baac32ac603eb
check_design.py 6a8feece57461530a38c76b9c4fdd6c03e12acef54906774f67acc099ce19eac
check_plan.py 6b5d832b0a6ef4dca3d76cd7fe634b07cb8c662315eb05872af05dc9873583d8
check_spec.py 70f3b1c1dd1594bc218c11315295954a117b49d92ead7a93e57fa7930454b4b5
markdown_structure.py 43a25b09ae995a3653a16497837b99f20fb312001ef37175fe2358c0e71c3e60
render_workflow_status.py e85dce50c6a777d240bbf624c334863bea485e9a935172e4d458be3e1ed77863
schemas.py ff557809bc3e4614c4af5a5cfc4949bd0bca7a94d54bde945eb485f9970fd627
waves.py be7aa29a767e1923490e70a3d95ffdd8c7e8b6cb7c4af9f431f9a3115c3eb19d
workflow_state.py 855dd03e6af23404e379d0b6ec5c5fbdefbda56bf17bf3e6460d88fd3e610419
EOF
}

copy_tree_files() {
  local source="$1"
  local dest="$2"
  local source_file relative target
  mkdir -p "$dest"
  while IFS= read -r -d '' source_file; do
    relative="${source_file#"$source"/}"
    target="$dest/$relative"
    mkdir -p "$(dirname "$target")"
    atomic_copy_file "$source_file" "$target"
  done < <(
    find "$source" -type f \
      ! -path '*/__pycache__/*' \
      ! -name '*.pyc' \
      ! -name '*.pyo' \
      -print0
  )
}

copy_checker_bundle() {
  local dest="$1"
  copy_tree_files "$CHECKER_SOURCE" "$dest"
  if [[ -n "$CHECKER_STATUS_SOURCE" && -d "$CHECKER_STATUS_SOURCE" ]]; then
    copy_tree_files "$CHECKER_STATUS_SOURCE" "$dest/status"
  fi
}

atomic_copy_file() {
  local source="$1"
  local dest="$2"
  local temp
  temp="$(mktemp "$(dirname "$dest")/.$(basename "$dest").XXXXXX")"
  if ! cp "$source" "$temp"; then
    rm -f "$temp"
    return 1
  fi
  mv -f "$temp" "$dest"
}

remove_retired_srs_authoring() {
  local skill_root="$1"
  local retired="$skill_root/srs-authoring"
  local skill_hash agent_hash reference_hash hash_command
  if command -v sha256sum >/dev/null 2>&1; then
    hash_command="sha256sum"
  else
    hash_command="shasum -a 256"
  fi
  if [[ -d "$retired" ]] &&
    [[ "$(find "$retired" -type f | wc -l | tr -d ' ')" == "3" ]] &&
    [[ "$(find "$retired" -type d | wc -l | tr -d ' ')" == "3" ]] &&
    [[ "$(find "$retired" -mindepth 1 ! -type f ! -type d | wc -l | tr -d ' ')" == "0" ]] &&
    [[ -f "$retired/SKILL.md" ]] &&
    [[ -f "$retired/agents/openai.yaml" ]] &&
    [[ -f "$retired/references/srs-quality.md" ]]; then
    skill_hash="$($hash_command "$retired/SKILL.md" | awk '{print $1}')"
    agent_hash="$($hash_command "$retired/agents/openai.yaml" | awk '{print $1}')"
    reference_hash="$($hash_command "$retired/references/srs-quality.md" | awk '{print $1}')"
  else
    return 0
  fi

  if [[ "$agent_hash" == "960503fe7ddf3a3bd675cc2373438eb271e29bcef84eaf65eb3914e5640a3c0b" ]] &&
    { [[ "$skill_hash" == "cd6f56c6759a2ab9c1f15e926b1f0f254a12fe7d7ceecb3b574794345d6a0647" &&
      "$reference_hash" == "092fa2f148f507e84b1cb6374d272c94ad9e7f9dce9d7974ebd7354910c7969b" ]] ||
      [[ "$skill_hash" == "2e9aa5cb0c985397b5ecdfcdf74985fbef4205e8e81aa2d73bbefbbeea6550ee" &&
      "$reference_hash" == "824c0bbc14f8fc0788a6ec78d6c4f88a9c416473b9f7fd2d5be2c9133aa520b2" ]]; }; then
    rm -rf "$retired"
    echo "Removed retired Sarathi skill -> $retired"
  fi
  return 0
}

copy_skill_folder() {
  local dest="$1"
  local source_item
  mkdir -p "$dest"
  remove_retired_python_updater "$dest"
  while IFS= read -r -d '' source_item; do
    if [[ "$(basename "$source_item")" != "SKILL.md" ]]; then
      cp -R "$source_item" "$dest"/
    fi
  done < <(find "$SKILL_SOURCE" -mindepth 1 -maxdepth 1 -print0)
  atomic_copy_file "$SKILL_SOURCE/SKILL.md" "$dest/SKILL.md"

  rm -rf "$dest/docs"
  mkdir -p "$dest/docs"
  while IFS= read -r -d '' source_item; do
    if [[ "$(basename "$source_item")" != "reviews" && "$(basename "$source_item")" != "research" ]]; then
      cp -R "$source_item" "$dest/docs/"
    fi
  done < <(find "$DOC_SOURCE" -mindepth 1 -maxdepth 1 -print0)

  rm -rf "$dest/prompts"
  mkdir -p "$dest/prompts"
  cp "$PROMPT_SOURCE"/*.prompt.md "$dest/prompts"/

  if [[ -d "$CHECKER_SOURCE" ]]; then
    rm -rf "$dest/checkers"
    copy_checker_bundle "$dest/checkers"
  fi
}

remove_retired_python_updater() {
  local skill_dest="$1"
  [[ -f "$SKILL_SOURCE/scripts/check_update.mjs" ]] || return 0
  local legacy="$skill_dest/scripts/check_update.py"
  [[ -f "$legacy" ]] || return 0
  local actual
  if command -v sha256sum >/dev/null 2>&1; then
    actual="$(sha256sum "$legacy" | awk '{print $1}')"
  else
    actual="$(shasum -a 256 "$legacy" | awk '{print $1}')"
  fi
  case "$actual" in
    4aa1f3e43045f08b980e7088c4ae913240e7967061408b99509aba576b8e851b|\
    778a02aef55b0966b390bc2718cc31342979e811cdc3a9a5bc394eab9736bff5|\
    2458e2ac4dd567d35146009bad0af690d4f57163f378b6d797a0c3b262165929|\
    9446a600bc6e3e35aa720c39fff57d9bf0a1ad1138ba0bf2b18e67171748119b)
      rm -f "$legacy"
      echo "Removed retired Python updater -> $legacy"
      ;;
  esac
}

archive_retired_unprefixed_stage_skills() {
  local skill_root="$1"
  local preview="${2:-0}"
  local archive_root file stage_name retired archived archive_suffix
  archive_root="$(dirname "$skill_root")/sarathi-retired-stage-skills"

  for file in "$PROMPT_SOURCE"/*.prompt.md; do
    stage_name="$(command_name "$file")"
    retired="$skill_root/$stage_name"
    [[ -d "$retired" && -f "$retired/SKILL.md" ]] || continue
    tr -d '\r' < "$retired/SKILL.md" | grep -Fx "name: $stage_name" >/dev/null || continue
    grep -Fq "This is a direct GitHub Copilot CLI skill alias for the Sarathi $stage_name stage." "$retired/SKILL.md" || continue
    archived="$archive_root/$stage_name"
    archive_suffix=1
    while [[ -e "$archived" ]]; do
      archived="$archive_root/$stage_name-$archive_suffix"
      archive_suffix=$((archive_suffix + 1))
    done
    if [[ "$preview" -eq 1 ]]; then
      echo "Would archive retired unprefixed Sarathi command skill -> $archived" >&3
    else
      mkdir -p "$archive_root"
      mv "$retired" "$archived"
      echo "Archived retired unprefixed Sarathi command skill -> $archived"
    fi
  done
}

archive_retired_stage_skills_for_scope() {
  local preview="${1:-0}"
  local skill_root
  while IFS= read -r skill_root; do
    [[ -d "$skill_root" ]] || continue
    archive_retired_unprefixed_stage_skills "$skill_root" "$preview"
  done < <(legacy_stage_skill_roots)
}

copy_explicit_stage_skills() {
  local main_skill_dest="$1"
  local skill_root
  skill_root="$(dirname "$main_skill_dest")"

  for file in "$PROMPT_SOURCE"/*.prompt.md; do
    local stage_name skill_name stage_dest prompt_file_name description
    local stage_skill_temp stage_agent_temp
    stage_name="$(command_name "$file")"
    skill_name="sarathi-$stage_name"
    stage_dest="$skill_root/$skill_name"
    prompt_file_name="$(basename "$file")"
    description="$(printf 'Explicit-only Sarathi command %s. Use only when the user explicitly invokes %s. %s' "$stage_name" "$skill_name" "$(prompt_description "$file")" | sed 's/\\/\\\\/g; s/"/\\"/g')"

    mkdir -p "$stage_dest"
    stage_skill_temp="$(mktemp "$stage_dest/.SKILL.md.XXXXXX")"
    cat > "$stage_skill_temp" <<EOF
---
name: $skill_name
description: "$description"
---

# Sarathi Command: $stage_name

This skill runs the Sarathi $stage_name command. Use it only when the user asks for that
command.

Read ../sarathi/SKILL.md, including its rules for deciding when earlier documents must
change. Then follow prompts/$prompt_file_name exactly. Use this command; do not switch to
another one. If it links to another prompt or document, read that file from the Sarathi
bundle. Read only the files this command or its linked instructions require. When the prompt
asks for a checker, use the bundled checker in ../sarathi/checkers/. If a required file is
missing, say that the installation is incomplete.

Respect approvals, safety limits, the file scope declared by the command, actual test
evidence, and independent review. Follow ../sarathi/docs/result-reporting.md and
../sarathi/docs/work-in-progress.md when reporting the result. Start with what changed or
what was found, then explain any Sarathi status. When the prompt tells you to wait for the
user, stop and do not start later work.
EOF
    mv -f "$stage_skill_temp" "$stage_dest/SKILL.md"

    rm -rf "$stage_dest/agents"
    mkdir -p "$stage_dest/agents"
    stage_agent_temp="$(mktemp "$stage_dest/agents/.openai.yaml.XXXXXX")"
    cat > "$stage_agent_temp" <<EOF
interface:
  display_name: "Sarathi $stage_name"
  short_description: "Explicit Sarathi command: $stage_name"
  default_prompt: "Use \$$skill_name to run the Sarathi $stage_name command."

policy:
  allow_implicit_invocation: false
EOF
    mv -f "$stage_agent_temp" "$stage_dest/agents/openai.yaml"

    rm -rf "$stage_dest/prompts"
    mkdir -p "$stage_dest/prompts"
    cp "$file" "$stage_dest/prompts/"

    if [[ -d "$CHECKER_SOURCE" ]]; then
      rm -rf "$stage_dest/checkers"
      copy_checker_bundle "$stage_dest/checkers"
    fi
  done
  archive_retired_unprefixed_stage_skills "$skill_root"
  remove_retired_srs_authoring "$skill_root"
}

install_copilot() {
  local dest skill_dest
  dest="$(copilot_prompt_dest)"
  if [[ "$DRY_RUN" -eq 1 ]]; then
    echo "Would install GitHub Copilot prompts -> $dest"
    while IFS= read -r skill_dest; do
      echo "Would install GitHub Copilot skill -> $skill_dest"
      echo "Would install explicit Sarathi command skills -> $(dirname "$skill_dest")"
    done < <(copilot_skill_dests)
    return
  fi
  mkdir -p "$dest"
  for file in "$PROMPT_SOURCE"/*.prompt.md; do
    copilot_prompt_body "$file" > "$dest/$(basename "$file")"
  done
  echo "Installed GitHub Copilot prompts -> $dest"
  while IFS= read -r skill_dest; do
    copy_skill_folder "$skill_dest"
    echo "Installed GitHub Copilot skill -> $skill_dest"
    copy_explicit_stage_skills "$skill_dest"
    echo "Installed explicit Sarathi command skills -> $(dirname "$skill_dest")"
  done < <(copilot_skill_dests)
  echo "Copilot prompts are written in agent mode without a tools allowlist; restart VS Code to reload them."
  echo "Copilot CLI can load skills after a new session or /skills reload; check with /skills info sarathi."
  echo "Explicit command skills use the sarathi- prefix, such as sarathi-code-review and sarathi-code-assess."
}

install_codex() {
  local skill_dest prompt_dest
  skill_dest="$(codex_skill_dest)"
  prompt_dest="$(codex_prompt_dest)"
  if [[ "$DRY_RUN" -eq 1 ]]; then
    echo "Would install Codex skill -> $skill_dest"
    echo "Would install Codex direct prompts -> $prompt_dest"
    return
  fi
  copy_skill_folder "$skill_dest"
  remove_retired_srs_authoring "$(dirname "$skill_dest")"
  echo "Installed Codex skill -> $skill_dest"
  copy_codex_prompt_files "$prompt_dest"
  echo "Installed Codex direct prompts -> $prompt_dest"
  echo "Codex direct prompts are available as /prompts:spec-create, /prompts:design-create, etc. after restart."
}

install_claude_code() {
  local dest skill_dest
  if [[ "$SCOPE" == "user" ]]; then
    dest="$HOME/.claude/commands"
    skill_dest="$HOME/.claude/skills/sarathi"
  else
    dest="$TARGET_ROOT/.claude/commands"
    skill_dest="$TARGET_ROOT/.claude/skills/sarathi"
  fi
  if [[ "$DRY_RUN" -eq 1 ]]; then
    echo "Would install Claude Code slash commands -> $dest"
    echo "Would install Claude Code skill -> $skill_dest"
    return
  fi
  mkdir -p "$dest"
  for file in "$PROMPT_SOURCE"/*.prompt.md; do
    prompt_body "$file" > "$dest/$(command_name "$file").md"
  done
  echo "Installed Claude Code slash commands -> $dest"
  copy_skill_folder "$skill_dest"
  remove_retired_srs_authoring "$(dirname "$skill_dest")"
  echo "Installed Claude Code skill -> $skill_dest"
}

install_gemini() {
  local dest
  if [[ "$SCOPE" == "user" ]]; then
    dest="$HOME/.gemini/commands"
  else
    dest="$TARGET_ROOT/.gemini/commands"
  fi
  if [[ "$DRY_RUN" -eq 1 ]]; then
    echo "Would install Gemini CLI commands -> $dest"
    return
  fi
  mkdir -p "$dest"
  for file in "$PROMPT_SOURCE"/*.prompt.md; do
    if grep -q "'''" "$file"; then
      echo "Cannot write Gemini TOML for $(basename "$file"): prompt contains triple single quotes." >&2
      exit 1
    fi
    local name description
    name="$(command_name "$file")"
    description="$(prompt_description "$file" | toml_escape_basic)"
    {
      printf 'description = "%s"\n' "$description"
      printf "prompt = '''\n"
      prompt_body "$file"
      printf "\n'''\n"
    } > "$dest/$name.toml"
  done
  echo "Installed Gemini CLI commands -> $dest"
}

install_claude_export() {
  local dest
  if [[ "$SCOPE" == "user" ]]; then
    dest="$HOME/.ai-prompts/claude"
  else
    dest="$TARGET_ROOT/.ai-prompts/claude"
  fi
  if [[ "$DRY_RUN" -eq 1 ]]; then
    echo "Would export Claude prompt pack -> $dest"
    echo "Would include skill bundle -> $dest/skills/sarathi"
    return
  fi
  mkdir -p "$dest"
  for file in "$PROMPT_SOURCE"/*.prompt.md; do
    prompt_body "$file" > "$dest/$(command_name "$file").md"
  done
  copy_skill_folder "$dest/skills/sarathi"
  remove_retired_srs_authoring "$dest/skills"
  echo "Exported Claude prompt pack -> $dest"
  echo "Note: Claude web/desktop has no stable local slash-command folder; import/copy these prompts manually."
}

install_pi_export() {
  local dest
  if [[ "$SCOPE" == "user" ]]; then
    dest="$HOME/.ai-prompts/pi"
  else
    dest="$TARGET_ROOT/.ai-prompts/pi"
  fi
  if [[ "$DRY_RUN" -eq 1 ]]; then
    echo "Would export Pi prompt pack -> $dest"
    echo "Would include skill bundle -> $dest/skills/sarathi"
    return
  fi
  mkdir -p "$dest"
  for file in "$PROMPT_SOURCE"/*.prompt.md; do
    prompt_body "$file" > "$dest/$(command_name "$file").md"
  done
  copy_skill_folder "$dest/skills/sarathi"
  remove_retired_srs_authoring "$dest/skills"
  echo "Exported Pi prompt pack -> $dest"
  echo "Note: Pi has no stable local slash-command folder; import/copy these prompts manually."
}

is_wsl() {
  [[ -n "${WSL_DISTRO_NAME:-}" ]] || grep -qiE 'microsoft|wsl' /proc/version 2>/dev/null
}

install_windows_companion() {
  if [[ "$NO_CROSS_INSTALL" -eq 1 ]]; then
    return
  fi
  if [[ "$DRY_RUN" -eq 1 ]]; then
    echo "Would also install Sarathi on Windows if powershell.exe is available."
    return
  fi
  if ! is_wsl; then
    return
  fi
  if ! command -v powershell.exe >/dev/null 2>&1; then
    echo "powershell.exe is not available; skipping the Windows installation."
    return
  fi
  if ! command -v wslpath >/dev/null 2>&1; then
    echo "wslpath is not available; skipping the Windows installation."
    return
  fi

  local repo_win target_win script_win tools_for_windows
  repo_win="$(wslpath -w "$REPO_ROOT")"
  target_win="$(wslpath -w "$TARGET_ROOT")"
  script_win="$repo_win\\scripts\\install.ps1"
  tools_for_windows="$(IFS=,; echo "${TOOL_LIST[*]}")"

  local args=(
    -NoProfile
    -ExecutionPolicy Bypass
    -File "$script_win"
    -TargetRoot "$target_win"
    -Tool "$tools_for_windows"
    -Scope "$SCOPE"
    -NoCrossInstall
  )
  if [[ "$NO_CHECKERS" -eq 1 ]]; then
    args+=(-NoCheckers)
  fi
  if [[ "$VERBOSE" -eq 1 ]]; then
    args+=(-v)
  fi

  echo "Installing Sarathi on Windows via $script_win"
  powershell.exe "${args[@]}"
}

if [[ -z "$TOOLS" || "$TOOLS" == "all" ]]; then
  TOOL_LIST=("codex" "copilot" "claude-code" "gemini" "claude" "pi")
else
  IFS=',' read -r -a TOOL_LIST <<< "$TOOLS"
fi

for tool in "${TOOL_LIST[@]}"; do
  case "$tool" in
    codex|copilot|claude-code|gemini|claude|pi) ;;
    *) echo "Unknown tool: $tool" >&2; exit 2 ;;
  esac
done

write_destination_summary

archive_retired_stage_skills_for_scope "$DRY_RUN"

copy_checkers

for tool in "${TOOL_LIST[@]}"; do
  case "$tool" in
    codex) install_codex ;;
    copilot) install_copilot ;;
    claude-code) install_claude_code ;;
    gemini) install_gemini ;;
    claude) install_claude_export ;;
    pi) install_pi_export ;;
  esac
done

install_windows_companion

if [[ "$DRY_RUN" -eq 1 ]]; then
  echo "Dry run complete for target: $TARGET_ROOT" >&3
else
  echo "Install complete for target: $TARGET_ROOT" >&3
fi
echo "Tools: $(IFS=', '; echo "${TOOL_LIST[*]}") ($SCOPE scope)" >&3
