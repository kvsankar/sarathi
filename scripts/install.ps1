param(
    [string]$TargetRoot = (Get-Location).Path,
    [string[]]$Tool = @(),
    [ValidateSet("project", "user")]
    [string]$Scope = "user",
    [switch]$NoCheckers,
    [switch]$NoCrossInstall,
    [switch]$DryRun
)

$ErrorActionPreference = "Stop"

$RepoRoot = Split-Path -Parent $PSScriptRoot
$PromptSource = Join-Path $RepoRoot "prompts"
$CheckerSource = Join-Path $RepoRoot "checkers"
$SkillSource = Join-Path $RepoRoot "skills/sarathi"
$TargetRoot = (Resolve-Path -LiteralPath $TargetRoot).Path

function Test-SamePath {
    param([string]$Left, [string]$Right)
    $leftResolved = (Resolve-Path -LiteralPath $Left).Path.TrimEnd('\', '/')
    $rightResolved = (Resolve-Path -LiteralPath $Right).Path.TrimEnd('\', '/')
    return [string]::Equals($leftResolved, $rightResolved, [System.StringComparison]::OrdinalIgnoreCase)
}

function Move-AtomicFile {
    param([string]$TemporaryPath, [string]$Destination)
    Move-Item -LiteralPath $TemporaryPath -Destination $Destination -Force
}

function Copy-AtomicFile {
    param([string]$Source, [string]$Destination)
    $parent = Split-Path -Parent $Destination
    $temporaryPath = Join-Path $parent ".$([System.IO.Path]::GetFileName($Destination)).$([guid]::NewGuid().ToString('N')).tmp"
    try {
        [System.IO.File]::WriteAllBytes($temporaryPath, [System.IO.File]::ReadAllBytes($Source))
        Move-AtomicFile $temporaryPath $Destination
    } finally {
        if (Test-Path -LiteralPath $temporaryPath) {
            Remove-Item -LiteralPath $temporaryPath -Force
        }
    }
}

function Set-AtomicUtf8File {
    param([string]$Destination, [string]$Content)
    $parent = Split-Path -Parent $Destination
    $temporaryPath = Join-Path $parent ".$([System.IO.Path]::GetFileName($Destination)).$([guid]::NewGuid().ToString('N')).tmp"
    try {
        $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
        [System.IO.File]::WriteAllText($temporaryPath, $Content, $utf8NoBom)
        Move-AtomicFile $temporaryPath $Destination
    } finally {
        if (Test-Path -LiteralPath $temporaryPath) {
            Remove-Item -LiteralPath $temporaryPath -Force
        }
    }
}

if (-not (Test-Path -LiteralPath $PromptSource)) {
    throw "Prompt source folder not found: $PromptSource"
}
if (-not $NoCheckers -and -not (Test-Path -LiteralPath $CheckerSource)) {
    throw "Checker source folder not found: $CheckerSource"
}
if (-not (Test-Path -LiteralPath $SkillSource)) {
    throw "Skill source folder not found: $SkillSource"
}
if (Test-SamePath $TargetRoot $RepoRoot) {
    Write-Warning (
        "TargetRoot is the commands repository itself. This is okay for dogfooding, " +
        "but project-local artifacts such as GitHub Copilot prompts and checkers will be " +
        "installed into the source checkout. Use -TargetRoot <product-workspace> for a product."
    )
}
if ($DryRun) {
    Write-Host "Dry run: no files will be written and no companion install will be executed."
}

$InstallableTools = @("codex", "copilot", "claude-code", "gemini", "claude", "pi")
$AllowedTools = $InstallableTools + @("all")
$Tool = @(
    $Tool | ForEach-Object { $_ -split "," } | ForEach-Object { $_.Trim() } | Where-Object { $_ }
)
$invalidTools = @($Tool | Where-Object { $AllowedTools -notcontains $_ })
if ($invalidTools.Count -gt 0) {
    throw "Unknown tool(s): $($invalidTools -join ', '). Allowed: $($InstallableTools -join ', ')"
}

function Get-CommandName {
    param([System.IO.FileInfo]$File)
    return $File.Name -replace '\.prompt\.md$', ''
}

function Get-PromptBody {
    param([string]$Path)
    $text = Get-Content -LiteralPath $Path -Raw
    return ($text -replace '(?s)^---\s*.*?\s*---\s*', '')
}

function Get-PromptDescription {
    param([string]$Path)
    $text = Get-Content -LiteralPath $Path -Raw
    if ($text -match '(?m)^description:\s*(.+)$') {
        return $Matches[1].Trim()
    }
    return "Command prompt installed from commands repository."
}

function Get-CopilotPromptText {
    param([string]$Path)
    $text = Get-Content -LiteralPath $Path -Raw
    return ($text -replace '(?m)^agent:\s*agent\s*$', 'mode: agent')
}

function Copy-CodexPromptFiles {
    param([string]$Destination)
    New-Item -ItemType Directory -Force -Path $Destination | Out-Null
    Get-ChildItem -LiteralPath $PromptSource -Filter "*.prompt.md" | ForEach-Object {
        $name = Get-CommandName $_
        Copy-Item -LiteralPath $_.FullName -Destination (Join-Path $Destination "$name.md") -Force
    }
}

function Get-CodexDestinations {
    if ($Scope -eq "user") {
        $codexHome = if ($env:CODEX_HOME) { $env:CODEX_HOME } else { Join-Path $HOME ".codex" }
        return @{
            Skill = Join-Path $codexHome "skills/sarathi"
            Prompts = Join-Path $codexHome "prompts"
        }
    }
    return @{
        Skill = Join-Path $TargetRoot ".codex/skills/sarathi"
        Prompts = Join-Path $TargetRoot ".codex/prompts"
    }
}

function Get-CopilotPromptDestination {
    if ($Scope -ne "user") {
        return Join-Path $TargetRoot ".github/prompts"
    }
    if ($env:SARATHI_COPILOT_PROMPTS_DIR) {
        return $env:SARATHI_COPILOT_PROMPTS_DIR
    }
    if ($env:AGENT_SDLC_COPILOT_PROMPTS_DIR) {
        return $env:AGENT_SDLC_COPILOT_PROMPTS_DIR
    }
    if ($env:APPDATA) {
        return Join-Path $env:APPDATA "Code/User/prompts"
    }
    if ((Get-Variable -Name IsMacOS -ErrorAction SilentlyContinue) -and $IsMacOS) {
        return Join-Path $HOME "Library/Application Support/Code/User/prompts"
    }
    return Join-Path $HOME ".config/Code/User/prompts"
}

function Get-CopilotSkillDestinations {
    if ($Scope -eq "user") {
        return @(
            Join-Path $HOME ".copilot/skills/sarathi"
            Join-Path $HOME ".agents/skills/sarathi"
        )
    }
    return @(
        Join-Path $TargetRoot ".github/skills/sarathi"
        Join-Path $TargetRoot ".agents/skills/sarathi"
    )
}

function Write-DestinationSummary {
    param([string[]]$Entries)
    Write-Host "Destination folders:"
    if (-not $NoCheckers) {
        Write-Host "  Checkers -> $(Join-Path $TargetRoot 'checkers')"
    }
    foreach ($entry in $Entries) {
        switch ($entry) {
            "codex" {
                $dest = Get-CodexDestinations
                Write-Host "  Codex skill -> $($dest.Skill)"
                Write-Host "  Codex direct prompts -> $($dest.Prompts)"
                Write-Host "    Invoke as /prompts:spec-create, /prompts:design-create, etc. after restarting Codex."
            }
            "copilot" {
                Write-Host "  GitHub Copilot prompts -> $(Get-CopilotPromptDestination)"
                foreach ($skillDest in Get-CopilotSkillDestinations) {
                    Write-Host "  GitHub Copilot skill -> $skillDest"
                    Write-Host "  GitHub Copilot direct stage skills -> $(Split-Path -Parent $skillDest)"
                }
                if ($Scope -eq "user") {
                    Write-Host "    User-scoped VS Code prompt files plus Copilot CLI/agent skill locations."
                }
                Write-Host "    Copilot CLI direct stages are installed as skills such as /code-review and /code-assess."
                Write-Host "    Reload Copilot CLI skills with /skills reload, then check /skills info sarathi."
            }
            "claude-code" {
                if ($Scope -eq "user") {
                    $cmdDest = Join-Path $HOME ".claude/commands"
                    $skillDest = Join-Path $HOME ".claude/skills/sarathi"
                } else {
                    $cmdDest = Join-Path $TargetRoot ".claude/commands"
                    $skillDest = Join-Path $TargetRoot ".claude/skills/sarathi"
                }
                Write-Host "  Claude Code commands -> $cmdDest"
                Write-Host "  Claude Code skill -> $skillDest"
            }
            "gemini" {
                $dest = if ($Scope -eq "user") {
                    Join-Path $HOME ".gemini/commands"
                } else {
                    Join-Path $TargetRoot ".gemini/commands"
                }
                Write-Host "  Gemini CLI commands -> $dest"
            }
            "claude" {
                $dest = if ($Scope -eq "user") {
                    Join-Path $HOME ".ai-prompts/claude"
                } else {
                    Join-Path $TargetRoot ".ai-prompts/claude"
                }
                Write-Host "  Claude prompt export -> $dest"
                Write-Host "  Claude skill export -> $(Join-Path $dest 'skills/sarathi')"
            }
            "pi" {
                $dest = if ($Scope -eq "user") {
                    Join-Path $HOME ".ai-prompts/pi"
                } else {
                    Join-Path $TargetRoot ".ai-prompts/pi"
                }
                Write-Host "  Pi prompt export -> $dest"
                Write-Host "  Pi skill export -> $(Join-Path $dest 'skills/sarathi')"
            }
        }
    }
}

function Copy-Checkers {
    if ($NoCheckers) {
        return
    }
    $dest = Join-Path $TargetRoot "checkers"
    if ($Scope -eq "user") {
        Write-Warning (
            "Checkers are project-local; installing them to " +
            "$TargetRoot\checkers even though Scope is user. Use -NoCheckers to skip them."
        )
    }
    if ($DryRun) {
        Write-Host "Would install checkers -> $dest"
        return
    }
    $sourceResolved = (Resolve-Path -LiteralPath $CheckerSource).Path.TrimEnd("\", "/")
    if (Test-Path -LiteralPath $dest) {
        $destResolved = (Resolve-Path -LiteralPath $dest).Path.TrimEnd("\", "/")
        if ($sourceResolved -ieq $destResolved) {
            Write-Host "Checker destination is source folder; skipping checker copy."
            return
        }
    }
    New-Item -ItemType Directory -Force -Path $dest | Out-Null
    Get-ChildItem -LiteralPath $CheckerSource -Filter "*.py" |
        Copy-Item -Destination $dest -Force
    Write-Host "Installed checkers -> $dest"
}

function Copy-SkillFolder {
    param([string]$Destination)
    New-Item -ItemType Directory -Force -Path $Destination | Out-Null
    Get-ChildItem -Force -LiteralPath $SkillSource |
        Where-Object { $_.Name -ne "SKILL.md" } |
        Copy-Item -Destination $Destination -Recurse -Force
    Copy-AtomicFile (Join-Path $SkillSource "SKILL.md") (Join-Path $Destination "SKILL.md")

    $promptDest = Join-Path $Destination "prompts"
    if (Test-Path -LiteralPath $promptDest) {
        Remove-Item -LiteralPath $promptDest -Recurse -Force
    }
    New-Item -ItemType Directory -Force -Path $promptDest | Out-Null
    Get-ChildItem -LiteralPath $PromptSource -Filter "*.prompt.md" |
        Copy-Item -Destination $promptDest -Force

    if (Test-Path -LiteralPath $CheckerSource) {
        $checkerDest = Join-Path $Destination "checkers"
        if (Test-Path -LiteralPath $checkerDest) {
            Remove-Item -LiteralPath $checkerDest -Recurse -Force
        }
        New-Item -ItemType Directory -Force -Path $checkerDest | Out-Null
        Get-ChildItem -LiteralPath $CheckerSource -Filter "*.py" |
            Copy-Item -Destination $checkerDest -Force
    }
}

function Copy-CopilotStageSkills {
    param([string]$MainSkillDestination)

    $skillRoot = Split-Path -Parent $MainSkillDestination
    Get-ChildItem -LiteralPath $PromptSource -Filter "*.prompt.md" | ForEach-Object {
        $stageName = Get-CommandName $_
        $stageDest = Join-Path $skillRoot $stageName
        $promptFileName = $_.Name
        $description = (
            "Sarathi stage skill for $stageName. " +
            (Get-PromptDescription $_.FullName)
        ).Replace('"', '\"')

        New-Item -ItemType Directory -Force -Path $stageDest | Out-Null

        $stageSkill = @"
---
name: $stageName
description: "$description"
---

# Sarathi Stage: $stageName

This is a direct GitHub Copilot CLI skill alias for the Sarathi $stageName stage.

Follow the bundled prompt file prompts/$promptFileName exactly. Use bundled checker scripts
from checkers/ when the prompt calls for deterministic verification.
Resolve any transitive prompts referenced as prompts/*.prompt.md from
../sarathi/prompts/, and shared docs from ../sarathi/docs/. Load only the files triggered
by the stage; if the sibling Sarathi bundle is missing, report an incomplete installation.

This stage is part of the broader Sarathi workflow. Preserve input gates, human
review gates, readiness gates, Planned Touch Sets, upstream-blocker stops, and YOLO-mode
limits.
"@
        Set-AtomicUtf8File (Join-Path $stageDest "SKILL.md") $stageSkill

        $promptDest = Join-Path $stageDest "prompts"
        if (Test-Path -LiteralPath $promptDest) {
            Remove-Item -LiteralPath $promptDest -Recurse -Force
        }
        New-Item -ItemType Directory -Force -Path $promptDest | Out-Null
        Copy-Item -LiteralPath $_.FullName -Destination $promptDest -Force

        if (Test-Path -LiteralPath $CheckerSource) {
            $checkerDest = Join-Path $stageDest "checkers"
            if (Test-Path -LiteralPath $checkerDest) {
                Remove-Item -LiteralPath $checkerDest -Recurse -Force
            }
            New-Item -ItemType Directory -Force -Path $checkerDest | Out-Null
            Get-ChildItem -LiteralPath $CheckerSource -Filter "*.py" |
                Copy-Item -Destination $checkerDest -Force
        }
    }
}

function Install-Copilot {
    $dest = Get-CopilotPromptDestination
    $skillDests = Get-CopilotSkillDestinations
    if ($DryRun) {
        Write-Host "Would install GitHub Copilot prompts -> $dest"
        foreach ($skillDest in $skillDests) {
            Write-Host "Would install GitHub Copilot skill -> $skillDest"
            Write-Host "Would install GitHub Copilot direct stage skills -> $(Split-Path -Parent $skillDest)"
        }
        return
    }
    New-Item -ItemType Directory -Force -Path $dest | Out-Null
    Get-ChildItem -LiteralPath $PromptSource -Filter "*.prompt.md" | ForEach-Object {
        $body = Get-CopilotPromptText $_.FullName
        Set-Content -LiteralPath (Join-Path $dest $_.Name) -Value $body -NoNewline
    }
    Write-Host "Installed GitHub Copilot prompts -> $dest"
    foreach ($skillDest in $skillDests) {
        Copy-SkillFolder $skillDest
        Write-Host "Installed GitHub Copilot skill -> $skillDest"
        Copy-CopilotStageSkills $skillDest
        Write-Host "Installed GitHub Copilot direct stage skills -> $(Split-Path -Parent $skillDest)"
    }
    Write-Host "Copilot prompts are written in agent mode without a tools allowlist; restart VS Code to reload them."
    Write-Host "Copilot CLI can load skills after a new session or /skills reload; check with /skills info sarathi."
    Write-Host "Copilot CLI stage aliases are skills too, so /code-review, /code-verify, and /code-assess can be invoked where skill slash invocation is supported."
}

function Install-Codex {
    $dest = Get-CodexDestinations
    if ($DryRun) {
        Write-Host "Would install Codex skill -> $($dest.Skill)"
        Write-Host "Would install Codex direct prompts -> $($dest.Prompts)"
        return
    }
    Copy-SkillFolder $dest.Skill
    Write-Host "Installed Codex skill -> $($dest.Skill)"
    Copy-CodexPromptFiles $dest.Prompts
    Write-Host "Installed Codex direct prompts -> $($dest.Prompts)"
    Write-Host "Codex direct prompts are available as /prompts:spec-create, /prompts:design-create, etc. after restart."
}

function Install-ClaudeCode {
    if ($Scope -eq "user") {
        $dest = Join-Path $HOME ".claude/commands"
        $skillDest = Join-Path $HOME ".claude/skills/sarathi"
    } else {
        $dest = Join-Path $TargetRoot ".claude/commands"
        $skillDest = Join-Path $TargetRoot ".claude/skills/sarathi"
    }
    if ($DryRun) {
        Write-Host "Would install Claude Code slash commands -> $dest"
        Write-Host "Would install Claude Code skill -> $skillDest"
        return
    }
    New-Item -ItemType Directory -Force -Path $dest | Out-Null
    Get-ChildItem -LiteralPath $PromptSource -Filter "*.prompt.md" | ForEach-Object {
        $name = Get-CommandName $_
        $body = Get-PromptBody $_.FullName
        Set-Content -LiteralPath (Join-Path $dest "$name.md") -Value $body -NoNewline
    }
    Write-Host "Installed Claude Code slash commands -> $dest"
    Copy-SkillFolder $skillDest
    Write-Host "Installed Claude Code skill -> $skillDest"
}

function Install-Gemini {
    if ($Scope -eq "user") {
        $dest = Join-Path $HOME ".gemini/commands"
    } else {
        $dest = Join-Path $TargetRoot ".gemini/commands"
    }
    if ($DryRun) {
        Write-Host "Would install Gemini CLI commands -> $dest"
        return
    }
    New-Item -ItemType Directory -Force -Path $dest | Out-Null
    Get-ChildItem -LiteralPath $PromptSource -Filter "*.prompt.md" | ForEach-Object {
        $name = Get-CommandName $_
        $description = Get-PromptDescription $_.FullName
        $body = Get-PromptBody $_.FullName
        if ($body.Contains("'''")) {
            throw "Cannot write Gemini TOML for $($_.Name): prompt contains triple single quotes."
        }
        $toml = @"
description = "$($description.Replace('"', '\"'))"
prompt = '''
$body
'''
"@
        Set-Content -LiteralPath (Join-Path $dest "$name.toml") -Value $toml -NoNewline
    }
    Write-Host "Installed Gemini CLI commands -> $dest"
}

function Install-ClaudeExport {
    if ($Scope -eq "user") {
        $dest = Join-Path $HOME ".ai-prompts/claude"
    } else {
        $dest = Join-Path $TargetRoot ".ai-prompts/claude"
    }
    if ($DryRun) {
        Write-Host "Would export Claude prompt pack -> $dest"
        Write-Host "Would include skill bundle -> $(Join-Path $dest 'skills/sarathi')"
        return
    }
    New-Item -ItemType Directory -Force -Path $dest | Out-Null
    Get-ChildItem -LiteralPath $PromptSource -Filter "*.prompt.md" | ForEach-Object {
        $name = Get-CommandName $_
        $body = Get-PromptBody $_.FullName
        Set-Content -LiteralPath (Join-Path $dest "$name.md") -Value $body -NoNewline
    }
    Copy-SkillFolder (Join-Path $dest "skills/sarathi")
    Write-Host "Exported Claude prompt pack -> $dest"
    Write-Host "Note: Claude web/desktop has no stable local slash-command folder; import/copy these prompts manually."
}

function Install-PiExport {
    if ($Scope -eq "user") {
        $dest = Join-Path $HOME ".ai-prompts/pi"
    } else {
        $dest = Join-Path $TargetRoot ".ai-prompts/pi"
    }
    if ($DryRun) {
        Write-Host "Would export Pi prompt pack -> $dest"
        Write-Host "Would include skill bundle -> $(Join-Path $dest 'skills/sarathi')"
        return
    }
    New-Item -ItemType Directory -Force -Path $dest | Out-Null
    Get-ChildItem -LiteralPath $PromptSource -Filter "*.prompt.md" | ForEach-Object {
        $name = Get-CommandName $_
        $body = Get-PromptBody $_.FullName
        Set-Content -LiteralPath (Join-Path $dest "$name.md") -Value $body -NoNewline
    }
    Copy-SkillFolder (Join-Path $dest "skills/sarathi")
    Write-Host "Exported Pi prompt pack -> $dest"
    Write-Host "Note: Pi has no stable local slash-command folder; import/copy these prompts manually."
}

function Test-WslAvailable {
    if (-not (Get-Command wsl.exe -ErrorAction SilentlyContinue)) {
        return $false
    }
    $probe = & wsl.exe -e sh -lc "printf ready" 2>$null
    return ($LASTEXITCODE -eq 0 -and $probe -eq "ready")
}

function ConvertTo-WslPath {
    param([string]$WindowsPath)
    if ($WindowsPath -match "^([A-Za-z]):\\(.*)$") {
        $drive = $Matches[1].ToLowerInvariant()
        $rest = $Matches[2] -replace "\\", "/"
        return "/mnt/$drive/$rest"
    }

    $converted = & wsl.exe wslpath -a -u $WindowsPath 2>$null
    if ($LASTEXITCODE -ne 0 -or -not $converted) {
        throw "Could not convert Windows path to WSL path: $WindowsPath"
    }
    return $converted.Trim()
}

function Invoke-WslInstallScript {
    param(
        [string]$ScriptPath,
        [string]$TargetPath,
        [string]$ScopeValue,
        [string]$ToolsValue,
        [bool]$SkipCheckers
    )

    $skipCheckersFlag = if ($SkipCheckers) { "1" } else { "0" }
    $runner = @'
script_path=$1
target_path=$2
scope_value=$3
tools_value=$4
skip_checkers=$5
repo_root=$(cd "$(dirname "$script_path")/.." && pwd -P)

tmp_script=$(mktemp)
trap 'rm -f "$tmp_script"' EXIT
tr -d '\r' < "$script_path" > "$tmp_script"
chmod +x "$tmp_script"

args=(--target "$target_path" --scope "$scope_value" --tools "$tools_value" --no-cross-install)
if [ "$skip_checkers" = "1" ]; then
  args=("${args[@]}" --no-checkers)
fi

SARATHI_REPO_ROOT="$repo_root" bash "$tmp_script" "${args[@]}"
'@

    $runnerPath = [System.IO.Path]::GetTempFileName()
    try {
        $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
        [System.IO.File]::WriteAllText(
            $runnerPath,
            ($runner -replace "`r`n", "`n"),
            $utf8NoBom
        )
        $runnerWsl = ConvertTo-WslPath $runnerPath
        & wsl.exe -e bash $runnerWsl $ScriptPath $TargetPath $ScopeValue $ToolsValue $skipCheckersFlag
    } finally {
        Remove-Item -LiteralPath $runnerPath -Force -ErrorAction SilentlyContinue
    }
}

function Install-WslCompanion {
    if ($NoCrossInstall) {
        return
    }
    if ($DryRun) {
        Write-Host "Would install WSL companion targets if WSL is available."
        return
    }
    if (-not (Test-WslAvailable)) {
        Write-Host "WSL not available; skipping WSL companion install."
        return
    }

    $repoWsl = ConvertTo-WslPath $RepoRoot
    $targetWsl = ConvertTo-WslPath $TargetRoot
    $scriptWsl = "$repoWsl/scripts/install.sh"
    $toolList = $expandedTools -join ","

    Write-Host "Installing WSL companion targets via $scriptWsl"
    Invoke-WslInstallScript `
        -ScriptPath $scriptWsl `
        -TargetPath $targetWsl `
        -ScopeValue $Scope `
        -ToolsValue $toolList `
        -SkipCheckers $NoCheckers
    if ($LASTEXITCODE -ne 0) {
        throw "WSL companion install failed with exit code $LASTEXITCODE"
    }
}

$expandedTools = if ($Tool.Count -eq 0 -or $Tool -contains "all") {
    $InstallableTools
} else {
    $Tool
}

Write-DestinationSummary $expandedTools

Copy-Checkers
foreach ($entry in $expandedTools) {
    switch ($entry) {
        "codex" { Install-Codex }
        "copilot" { Install-Copilot }
        "claude-code" { Install-ClaudeCode }
        "gemini" { Install-Gemini }
        "claude" { Install-ClaudeExport }
        "pi" { Install-PiExport }
    }
}

Install-WslCompanion

if ($DryRun) {
    Write-Host "Dry run complete for target: $TargetRoot"
} else {
    Write-Host "Install complete for target: $TargetRoot"
}
