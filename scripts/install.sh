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
CHECKER_SOURCE="$REPO_ROOT/checkers"
DOC_SOURCE="$REPO_ROOT/docs"
SKILL_SOURCE="$REPO_ROOT/skills/sarathi"

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
  --target <dir>        Target product workspace. Default: current directory.
  --scope <project|user>
                        Install project-local commands or user-global commands.
                        Default: user.
  --tools <list>        Optional comma-separated subset:
                        codex,copilot,claude-code,gemini,claude,pi.
                        Default: install all tools.
  --no-checkers         Do not copy checkers/ into the target workspace.
  --no-cross-install    Do not install companion targets across Windows/WSL.
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
  - When run in WSL, this script also installs Windows companion targets if
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
  echo "Note: target is the commands repository itself."
  echo "This is okay for dogfooding, but project-local artifacts such as GitHub Copilot"
  echo "prompts and checkers will be installed into the source checkout."
  echo "Use --target <product-workspace> for a product."
fi
if [[ "$DRY_RUN" -eq 1 ]]; then
  echo "Dry run: no files will be written and no companion install will be executed."
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
          echo "  GitHub Copilot direct stage skills -> $(dirname "$skill_dest")"
        done < <(copilot_skill_dests)
        if [[ "$SCOPE" == "user" ]]; then
          echo "    User-scoped VS Code prompt files plus Copilot CLI/agent skill locations."
        fi
        echo "    Copilot CLI direct stages are installed as skills such as /code-review and /code-assess."
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
    echo "Note: checkers are project-local; installing them to $dest even though scope is user."
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
  mkdir -p "$dest"
  cp "$CHECKER_SOURCE"/*.py "$dest"/
  echo "Installed checkers -> $dest"
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

copy_skill_folder() {
  local dest="$1"
  local source_item
  mkdir -p "$dest"
  while IFS= read -r -d '' source_item; do
    if [[ "$(basename "$source_item")" != "SKILL.md" ]]; then
      cp -R "$source_item" "$dest"/
    fi
  done < <(find "$SKILL_SOURCE" -mindepth 1 -maxdepth 1 -print0)
  atomic_copy_file "$SKILL_SOURCE/SKILL.md" "$dest/SKILL.md"

  rm -rf "$dest/docs"
  mkdir -p "$dest/docs"
  cp -R "$DOC_SOURCE"/. "$dest/docs/"

  rm -rf "$dest/prompts"
  mkdir -p "$dest/prompts"
  cp "$PROMPT_SOURCE"/*.prompt.md "$dest/prompts"/

  if [[ -d "$CHECKER_SOURCE" ]]; then
    rm -rf "$dest/checkers"
    mkdir -p "$dest/checkers"
    cp "$CHECKER_SOURCE"/*.py "$dest/checkers"/
  fi
}

copy_copilot_stage_skills() {
  local main_skill_dest="$1"
  local skill_root
  skill_root="$(dirname "$main_skill_dest")"

  for file in "$PROMPT_SOURCE"/*.prompt.md; do
    local stage_name stage_dest prompt_file_name description stage_skill_temp
    stage_name="$(command_name "$file")"
    stage_dest="$skill_root/$stage_name"
    prompt_file_name="$(basename "$file")"
    description="$(printf 'Sarathi stage skill for %s. %s' "$stage_name" "$(prompt_description "$file")" | sed 's/\\/\\\\/g; s/"/\\"/g')"

    mkdir -p "$stage_dest"
    stage_skill_temp="$(mktemp "$stage_dest/.SKILL.md.XXXXXX")"
    cat > "$stage_skill_temp" <<EOF
---
name: $stage_name
description: "$description"
---

# sarathi Stage: $stage_name

This is a direct GitHub Copilot CLI skill alias for the Sarathi $stage_name stage.

Follow the bundled prompt file prompts/$prompt_file_name exactly. Use bundled checker scripts
from checkers/ when the prompt calls for deterministic verification.
Resolve any transitive prompts referenced as prompts/*.prompt.md from
../sarathi/prompts/, and shared docs from ../sarathi/docs/. Load only the files triggered
by the stage; if the sibling Sarathi bundle is missing, report an incomplete installation.

Keep required approvals, safety stops, declared file scope, test evidence, and independent
review. For status and handoff responses, follow ../sarathi/docs/work-in-progress.md and
report engineering state before process state. Do not start later work when the prompt says
to stop for the user.
EOF
    mv -f "$stage_skill_temp" "$stage_dest/SKILL.md"

    rm -rf "$stage_dest/prompts"
    mkdir -p "$stage_dest/prompts"
    cp "$file" "$stage_dest/prompts/"

    if [[ -d "$CHECKER_SOURCE" ]]; then
      rm -rf "$stage_dest/checkers"
      mkdir -p "$stage_dest/checkers"
      cp "$CHECKER_SOURCE"/*.py "$stage_dest/checkers"/
    fi
  done
}

install_copilot() {
  local dest skill_dest
  dest="$(copilot_prompt_dest)"
  if [[ "$DRY_RUN" -eq 1 ]]; then
    echo "Would install GitHub Copilot prompts -> $dest"
    while IFS= read -r skill_dest; do
      echo "Would install GitHub Copilot skill -> $skill_dest"
      echo "Would install GitHub Copilot direct stage skills -> $(dirname "$skill_dest")"
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
    copy_copilot_stage_skills "$skill_dest"
    echo "Installed GitHub Copilot direct stage skills -> $(dirname "$skill_dest")"
  done < <(copilot_skill_dests)
  echo "Copilot prompts are written in agent mode without a tools allowlist; restart VS Code to reload them."
  echo "Copilot CLI can load skills after a new session or /skills reload; check with /skills info sarathi."
  echo "Copilot CLI stage aliases are skills too, so /code-review, /code-verify, and /code-assess can be invoked where skill slash invocation is supported."
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
    echo "Would install Windows companion targets if running in WSL with powershell.exe available."
    return
  fi
  if ! is_wsl; then
    return
  fi
  if ! command -v powershell.exe >/dev/null 2>&1; then
    echo "powershell.exe not available; skipping Windows companion install."
    return
  fi
  if ! command -v wslpath >/dev/null 2>&1; then
    echo "wslpath not available; skipping Windows companion install."
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

  echo "Installing Windows companion targets via $script_win"
  powershell.exe "${args[@]}"
}

if [[ -z "$TOOLS" || "$TOOLS" == "all" ]]; then
  TOOL_LIST=("codex" "copilot" "claude-code" "gemini" "claude" "pi")
else
  IFS=',' read -r -a TOOL_LIST <<< "$TOOLS"
fi

write_destination_summary

copy_checkers

for tool in "${TOOL_LIST[@]}"; do
  case "$tool" in
    codex) install_codex ;;
    copilot) install_copilot ;;
    claude-code) install_claude_code ;;
    gemini) install_gemini ;;
    claude) install_claude_export ;;
    pi) install_pi_export ;;
    *) echo "Unknown tool: $tool" >&2; exit 2 ;;
  esac
done

install_windows_companion

if [[ "$DRY_RUN" -eq 1 ]]; then
  echo "Dry run complete for target: $TARGET_ROOT" >&3
else
  echo "Install complete for target: $TARGET_ROOT" >&3
fi
echo "Tools: $(IFS=', '; echo "${TOOL_LIST[*]}") ($SCOPE scope)" >&3
