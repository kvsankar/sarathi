param(
    [string]$TargetRoot = (Get-Location).Path,
    [string[]]$Tool = @(),
    [ValidateSet("project", "user")]
    [string]$Scope = "user",
    [switch]$NoCheckers,
    [switch]$NoCrossInstall,
    [switch]$DryRun,
    [Alias("v")]
    [switch]$Verbose
)

$ErrorActionPreference = "Stop"

$RepoRoot = Split-Path -Parent $PSScriptRoot
$PromptSource = Join-Path $RepoRoot "prompts"
$LegacyCheckerSource = Join-Path $RepoRoot "checkers"
$CompiledCheckerSource = Join-Path $RepoRoot "dist/checkers"
$CheckerSource = if (Test-Path -LiteralPath (Join-Path $CompiledCheckerSource "check_plan.mjs")) {
    $CompiledCheckerSource
} else {
    $LegacyCheckerSource
}
$CheckerStatusSource = if ($CheckerSource -eq $CompiledCheckerSource) {
    Join-Path $RepoRoot "dist/status"
} else {
    $null
}
$DocSource = Join-Path $RepoRoot "docs"
$PackagedSkillSource = Join-Path $RepoRoot "bundle/skills/sarathi"
$SkillSource = if (Test-Path -LiteralPath (Join-Path $PackagedSkillSource "scripts/check_update.mjs")) {
    $PackagedSkillSource
} else {
    Join-Path $RepoRoot "skills/sarathi"
}
$TargetRoot = (Resolve-Path -LiteralPath $TargetRoot).ProviderPath

function Write-Detail {
    param([string]$Message)
    if ($Verbose) {
        Write-Host $Message
    }
}

function Test-SamePath {
    param([string]$Left, [string]$Right)
    $leftResolved = (Resolve-Path -LiteralPath $Left).ProviderPath.TrimEnd('\', '/')
    $rightResolved = (Resolve-Path -LiteralPath $Right).ProviderPath.TrimEnd('\', '/')
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

function Remove-RetiredSrsAuthoring {
    param([string]$SkillRoot)
    $retired = Join-Path $SkillRoot "srs-authoring"
    $marker = Join-Path $retired "SKILL.md"
    if (-not (Test-Path -LiteralPath $marker)) {
        return
    }
    $expectedVariants = @(
        @{
            "SKILL.md" = "cd6f56c6759a2ab9c1f15e926b1f0f254a12fe7d7ceecb3b574794345d6a0647"
            "agents/openai.yaml" = "960503fe7ddf3a3bd675cc2373438eb271e29bcef84eaf65eb3914e5640a3c0b"
            "references/srs-quality.md" = "092fa2f148f507e84b1cb6374d272c94ad9e7f9dce9d7974ebd7354910c7969b"
        },
        @{
            "SKILL.md" = "2e9aa5cb0c985397b5ecdfcdf74985fbef4205e8e81aa2d73bbefbbeea6550ee"
            "agents/openai.yaml" = "960503fe7ddf3a3bd675cc2373438eb271e29bcef84eaf65eb3914e5640a3c0b"
            "references/srs-quality.md" = "824c0bbc14f8fc0788a6ec78d6c4f88a9c416473b9f7fd2d5be2c9133aa520b2"
        }
    )
    $entries = @(Get-ChildItem -LiteralPath $retired -Force -Recurse)
    $files = @($entries | Where-Object { -not $_.PSIsContainer })
    $directories = @($entries | Where-Object { $_.PSIsContainer })
    $reparsePoints = @(
        $entries | Where-Object {
            $_.Attributes -band [System.IO.FileAttributes]::ReparsePoint
        }
    )
    if ($entries.Count -ne 5 -or $files.Count -ne 3 -or $directories.Count -ne 2 -or
        $reparsePoints.Count -ne 0) {
        return
    }
    $actual = @{}
    foreach ($file in $files) {
        $relative = $file.FullName.Substring($retired.Length).TrimStart('\', '/') -replace '\\', '/'
        $actual[$relative] = (Get-FileHash -Algorithm SHA256 -LiteralPath $file.FullName).Hash.ToLowerInvariant()
    }
    foreach ($expected in $expectedVariants) {
        if (($actual.Keys | Where-Object { -not $expected.ContainsKey($_) }).Count -eq 0 -and
            ($expected.Keys | Where-Object { -not $actual.ContainsKey($_) -or $actual[$_] -ne $expected[$_] }).Count -eq 0) {
            Remove-Item -LiteralPath $retired -Recurse -Force
            Write-Detail "Removed retired Sarathi skill -> $retired"
            return
        }
    }
}

if (-not (Test-Path -LiteralPath $PromptSource)) {
    throw "Prompt source folder not found: $PromptSource"
}
if (-not (Test-Path -LiteralPath $DocSource)) {
    throw "Documentation source folder not found: $DocSource"
}
if (-not $NoCheckers -and -not (Test-Path -LiteralPath $CheckerSource)) {
    throw "Checker source folder not found: $CheckerSource"
}
if (Test-Path -LiteralPath (Join-Path $CheckerSource "check_plan.mjs")) {
    $statusCli = if ($CheckerStatusSource) {
        Join-Path $CheckerStatusSource "cli.mjs"
    } else {
        Join-Path $CheckerSource "status/cli.mjs"
    }
    foreach ($required in @(
        (Join-Path $CheckerSource "lib/approvals.mjs"),
        (Join-Path $CheckerSource "render_workflow_status.mjs"),
        $statusCli
    )) {
        if (-not (Test-Path -LiteralPath $required -PathType Leaf)) {
            throw "Compiled checker bundle is incomplete; missing: $required"
        }
    }
}
if (-not (Test-Path -LiteralPath $SkillSource)) {
    throw "Skill source folder not found: $SkillSource"
}
if (Test-SamePath $TargetRoot $RepoRoot) {
    Write-Detail (
        "You are installing into Sarathi's own source folder. This is useful for testing " +
        "Sarathi, but it will add prompts and checkers here. Use -TargetRoot <project-folder> " +
        "to install into a product project."
    )
}
if ($DryRun) {
    Write-Detail "Dry run: no files will be written and nothing will be installed in WSL."
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

function Get-LegacyStageSkillRoots {
    foreach ($skillDest in Get-CopilotSkillDestinations) {
        Split-Path -Parent $skillDest
    }
}

function Write-DestinationSummary {
    param([string[]]$Entries)
    Write-Detail "Destination folders:"
    if (-not $NoCheckers) {
        Write-Detail "  Checkers -> $(Join-Path $TargetRoot 'checkers')"
    }
    foreach ($entry in $Entries) {
        switch ($entry) {
            "codex" {
                $dest = Get-CodexDestinations
                Write-Detail "  Codex skill -> $($dest.Skill)"
                Write-Detail "  Codex direct prompts -> $($dest.Prompts)"
                Write-Detail "    Invoke as /prompts:spec-create, /prompts:design-create, etc. after restarting Codex."
            }
            "copilot" {
                Write-Detail "  GitHub Copilot prompts -> $(Get-CopilotPromptDestination)"
                foreach ($skillDest in Get-CopilotSkillDestinations) {
                    Write-Detail "  GitHub Copilot skill -> $skillDest"
                    Write-Detail "  Explicit Sarathi command skills -> $(Split-Path -Parent $skillDest)"
                }
                if ($Scope -eq "user") {
                    Write-Detail "    VS Code prompts and Copilot skills for the current user."
                }
                Write-Detail "    Explicit commands use prefixed skills such as sarathi-code-review and sarathi-code-assess."
                Write-Detail "    Reload Copilot CLI skills with /skills reload, then check /skills info sarathi."
            }
            "claude-code" {
                if ($Scope -eq "user") {
                    $cmdDest = Join-Path $HOME ".claude/commands"
                    $skillDest = Join-Path $HOME ".claude/skills/sarathi"
                } else {
                    $cmdDest = Join-Path $TargetRoot ".claude/commands"
                    $skillDest = Join-Path $TargetRoot ".claude/skills/sarathi"
                }
                Write-Detail "  Claude Code commands -> $cmdDest"
                Write-Detail "  Claude Code skill -> $skillDest"
            }
            "gemini" {
                $dest = if ($Scope -eq "user") {
                    Join-Path $HOME ".gemini/commands"
                } else {
                    Join-Path $TargetRoot ".gemini/commands"
                }
                Write-Detail "  Gemini CLI commands -> $dest"
            }
            "claude" {
                $dest = if ($Scope -eq "user") {
                    Join-Path $HOME ".ai-prompts/claude"
                } else {
                    Join-Path $TargetRoot ".ai-prompts/claude"
                }
                Write-Detail "  Claude prompt export -> $dest"
                Write-Detail "  Claude skill export -> $(Join-Path $dest 'skills/sarathi')"
            }
            "pi" {
                $dest = if ($Scope -eq "user") {
                    Join-Path $HOME ".ai-prompts/pi"
                } else {
                    Join-Path $TargetRoot ".ai-prompts/pi"
                }
                Write-Detail "  Pi prompt export -> $dest"
                Write-Detail "  Pi skill export -> $(Join-Path $dest 'skills/sarathi')"
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
        Write-Detail (
            "Checkers belong in a project folder. They will be installed in " +
            "$TargetRoot\checkers. Use -NoCheckers to skip them."
        )
    }
    if ($DryRun) {
        Write-Detail "Would install checkers -> $dest"
        return
    }
    $sourceResolved = (Resolve-Path -LiteralPath $CheckerSource).Path.TrimEnd("\", "/")
    if (Test-Path -LiteralPath $dest) {
        $destResolved = (Resolve-Path -LiteralPath $dest).Path.TrimEnd("\", "/")
        if ($sourceResolved -ieq $destResolved) {
            Write-Detail "Checker destination is source folder; skipping checker copy."
            return
        }
    }
    Copy-CheckerBundle $dest
    Remove-RetiredPythonCheckers $dest
    Write-Detail "Installed checkers -> $dest"
}

function Remove-RetiredPythonCheckers {
    param([string]$CheckerDestination)
    if (-not (Test-Path -LiteralPath (Join-Path $CheckerSource "check_plan.mjs") -PathType Leaf)) {
        return
    }
    $knownFiles = @{
        "approvals.py" = "2931574e9f5371f1b743a9a2a83449e82cf8f884c973761b1a4e6be345912353"
        "check_code.py" = "b398aa796b1e8735153196cc298ed28dd102d0361a03ad48765baac32ac603eb"
        "check_design.py" = "6a8feece57461530a38c76b9c4fdd6c03e12acef54906774f67acc099ce19eac"
        "check_plan.py" = "6b5d832b0a6ef4dca3d76cd7fe634b07cb8c662315eb05872af05dc9873583d8"
        "check_spec.py" = "70f3b1c1dd1594bc218c11315295954a117b49d92ead7a93e57fa7930454b4b5"
        "markdown_structure.py" = "43a25b09ae995a3653a16497837b99f20fb312001ef37175fe2358c0e71c3e60"
        "render_workflow_status.py" = "e85dce50c6a777d240bbf624c334863bea485e9a935172e4d458be3e1ed77863"
        "schemas.py" = "ff557809bc3e4614c4af5a5cfc4949bd0bca7a94d54bde945eb485f9970fd627"
        "waves.py" = "be7aa29a767e1923490e70a3d95ffdd8c7e8b6cb7c4af9f431f9a3115c3eb19d"
        "workflow_state.py" = "855dd03e6af23404e379d0b6ec5c5fbdefbda56bf17bf3e6460d88fd3e610419"
    }
    foreach ($entry in $knownFiles.GetEnumerator()) {
        $legacy = Join-Path $CheckerDestination $entry.Key
        if (-not (Test-Path -LiteralPath $legacy -PathType Leaf)) {
            continue
        }
        $sha256 = [System.Security.Cryptography.SHA256]::Create()
        try {
            $hashBytes = $sha256.ComputeHash([System.IO.File]::ReadAllBytes($legacy))
            $actual = [System.BitConverter]::ToString($hashBytes).Replace("-", "").ToLowerInvariant()
        } finally {
            $sha256.Dispose()
        }
        if ($actual -eq $entry.Value) {
            Remove-Item -LiteralPath $legacy -Force
            Write-Detail "Removed retired Python checker -> $legacy"
        }
    }
}

function Copy-TreeFiles {
    param([string]$Source, [string]$Destination)
    Get-ChildItem -LiteralPath $Source -File -Recurse |
        Where-Object {
            $_.Extension -notin @(".pyc", ".pyo") -and
            $_.FullName -notmatch "[\\/]__pycache__[\\/]"
        } |
        ForEach-Object {
            $relative = $_.FullName.Substring($Source.Length).TrimStart('\', '/')
            $target = Join-Path $Destination $relative
            New-Item -ItemType Directory -Force -Path (Split-Path -Parent $target) | Out-Null
            Copy-AtomicFile $_.FullName $target
        }
}

function Copy-CheckerBundle {
    param([string]$Destination)
    New-Item -ItemType Directory -Force -Path $Destination | Out-Null
    Copy-TreeFiles $CheckerSource $Destination
    if ($CheckerStatusSource -and (Test-Path -LiteralPath $CheckerStatusSource)) {
        Copy-TreeFiles $CheckerStatusSource (Join-Path $Destination "status")
    }
}

function Copy-SkillFolder {
    param([string]$Destination)
    New-Item -ItemType Directory -Force -Path $Destination | Out-Null
    Remove-RetiredPythonUpdater $Destination
    Get-ChildItem -Force -LiteralPath $SkillSource |
        Where-Object { $_.Name -ne "SKILL.md" } |
        Copy-Item -Destination $Destination -Recurse -Force
    Copy-AtomicFile (Join-Path $SkillSource "SKILL.md") (Join-Path $Destination "SKILL.md")

    $docDest = Join-Path $Destination "docs"
    if (Test-Path -LiteralPath $docDest) {
        Remove-Item -LiteralPath $docDest -Recurse -Force
    }
    New-Item -ItemType Directory -Force -Path $docDest | Out-Null
    Get-ChildItem -Force -LiteralPath $DocSource |
        Where-Object { $_.Name -notin @("research", "reviews") } |
        Copy-Item -Destination $docDest -Recurse -Force

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
        Copy-CheckerBundle $checkerDest
    }
}

function Remove-RetiredPythonUpdater {
    param([string]$SkillDestination)
    if (-not (Test-Path -LiteralPath (Join-Path $SkillSource "scripts/check_update.mjs") -PathType Leaf)) {
        return
    }
    $legacy = Join-Path $SkillDestination "scripts/check_update.py"
    if (-not (Test-Path -LiteralPath $legacy -PathType Leaf)) {
        return
    }
    $knownHashes = @(
        "4aa1f3e43045f08b980e7088c4ae913240e7967061408b99509aba576b8e851b",
        "778a02aef55b0966b390bc2718cc31342979e811cdc3a9a5bc394eab9736bff5",
        "2458e2ac4dd567d35146009bad0af690d4f57163f378b6d797a0c3b262165929",
        "9446a600bc6e3e35aa720c39fff57d9bf0a1ad1138ba0bf2b18e67171748119b"
    )
    $sha256 = [System.Security.Cryptography.SHA256]::Create()
    try {
        $hashBytes = $sha256.ComputeHash([System.IO.File]::ReadAllBytes($legacy))
        $actual = [System.BitConverter]::ToString($hashBytes).Replace("-", "").ToLowerInvariant()
    } finally {
        $sha256.Dispose()
    }
    if ($knownHashes -contains $actual) {
        Remove-Item -LiteralPath $legacy -Force
        Write-Detail "Removed retired Python updater -> $legacy"
    }
}

function Archive-RetiredUnprefixedStageSkills {
    param(
        [string]$SkillRoot,
        [switch]$Preview
    )

    $archiveRoot = Join-Path (Split-Path -Parent $SkillRoot) "sarathi-retired-stage-skills"
    Get-ChildItem -LiteralPath $PromptSource -Filter "*.prompt.md" | ForEach-Object {
        $stageName = Get-CommandName $_
        $retired = Join-Path $SkillRoot $stageName
        $skillFile = Join-Path $retired "SKILL.md"
        if (-not (Test-Path -LiteralPath $skillFile -PathType Leaf)) {
            return
        }
        $skillText = Get-Content -LiteralPath $skillFile -Raw
        if (
            $skillText -notmatch "(?m)^name: $([regex]::Escape($stageName))\r?$" -or
            $skillText -notlike "*This is a direct GitHub Copilot CLI skill alias for the Sarathi $stageName stage.*"
        ) {
            return
        }

        $archived = Join-Path $archiveRoot $stageName
        $archiveSuffix = 1
        while (Test-Path -LiteralPath $archived) {
            $archived = Join-Path $archiveRoot "$stageName-$archiveSuffix"
            $archiveSuffix += 1
        }

        if ($Preview) {
            Write-Host "Would archive retired unprefixed Sarathi command skill -> $archived"
        } else {
            New-Item -ItemType Directory -Force -Path $archiveRoot | Out-Null
            Move-Item -LiteralPath $retired -Destination $archived
            Write-Detail "Archived retired unprefixed Sarathi command skill -> $archived"
        }
    }
}

function Archive-RetiredStageSkillsForScope {
    param([switch]$Preview)

    foreach ($skillRoot in Get-LegacyStageSkillRoots) {
        if (Test-Path -LiteralPath $skillRoot -PathType Container) {
            Archive-RetiredUnprefixedStageSkills $skillRoot -Preview:$Preview
        }
    }
}

function Copy-ExplicitStageSkills {
    param([string]$MainSkillDestination)

    $skillRoot = Split-Path -Parent $MainSkillDestination
    Get-ChildItem -LiteralPath $PromptSource -Filter "*.prompt.md" | ForEach-Object {
        $stageName = Get-CommandName $_
        $skillName = "sarathi-$stageName"
        $stageDest = Join-Path $skillRoot $skillName
        $promptFileName = $_.Name
        $description = (
            "Explicit-only Sarathi command $stageName. " +
            "Use only when the user explicitly invokes $skillName. " +
            (Get-PromptDescription $_.FullName)
        ).Replace('"', '\"')

        New-Item -ItemType Directory -Force -Path $stageDest | Out-Null

        $stageSkill = @"
---
name: $skillName
description: "$description"
---

# Sarathi Command: $stageName

This skill runs the Sarathi $stageName command. Use it only when the user asks for that
command.

Read ../sarathi/SKILL.md, including its rules for deciding when earlier documents must
change. Then follow prompts/$promptFileName exactly. Use this command; do not switch to
another one. If it links to another prompt or document, read that file from the Sarathi
bundle. Read only the files this command or its linked instructions require. When the prompt
asks for a checker, use the bundled checker in ../sarathi/checkers/. If a required file is
missing, say that the installation is incomplete.

Respect approvals, safety limits, the file scope declared by the command, actual test
evidence, and independent review. Follow ../sarathi/docs/result-reporting.md and
../sarathi/docs/work-in-progress.md when reporting the result. Start with what changed or
what was found, then explain any Sarathi status. When the prompt tells you to wait for the
user, stop and do not start later work.
"@
        Set-AtomicUtf8File (Join-Path $stageDest "SKILL.md") $stageSkill

        $agentDest = Join-Path $stageDest "agents"
        if (Test-Path -LiteralPath $agentDest) {
            Remove-Item -LiteralPath $agentDest -Recurse -Force
        }
        New-Item -ItemType Directory -Force -Path $agentDest | Out-Null
        $agentMetadata = @"
interface:
  display_name: "Sarathi $stageName"
  short_description: "Explicit Sarathi command: $stageName"
  default_prompt: "Use `$$skillName to run the Sarathi $stageName command."

policy:
  allow_implicit_invocation: false
"@
        Set-AtomicUtf8File (Join-Path $agentDest "openai.yaml") $agentMetadata

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
            Copy-CheckerBundle $checkerDest
        }
    }
    Archive-RetiredUnprefixedStageSkills $skillRoot
    Remove-RetiredSrsAuthoring $skillRoot
}

function Install-Copilot {
    $dest = Get-CopilotPromptDestination
    $skillDests = Get-CopilotSkillDestinations
    if ($DryRun) {
        Write-Detail "Would install GitHub Copilot prompts -> $dest"
        foreach ($skillDest in $skillDests) {
            Write-Detail "Would install GitHub Copilot skill -> $skillDest"
            Write-Detail "Would install explicit Sarathi command skills -> $(Split-Path -Parent $skillDest)"
        }
        return
    }
    New-Item -ItemType Directory -Force -Path $dest | Out-Null
    Get-ChildItem -LiteralPath $PromptSource -Filter "*.prompt.md" | ForEach-Object {
        $body = Get-CopilotPromptText $_.FullName
        Set-Content -LiteralPath (Join-Path $dest $_.Name) -Value $body -NoNewline
    }
    Write-Detail "Installed GitHub Copilot prompts -> $dest"
    foreach ($skillDest in $skillDests) {
        Copy-SkillFolder $skillDest
        Write-Detail "Installed GitHub Copilot skill -> $skillDest"
        Copy-ExplicitStageSkills $skillDest
        Write-Detail "Installed explicit Sarathi command skills -> $(Split-Path -Parent $skillDest)"
    }
    Write-Detail "Copilot prompts are written in agent mode without a tools allowlist; restart VS Code to reload them."
    Write-Detail "Copilot CLI can load skills after a new session or /skills reload; check with /skills info sarathi."
    Write-Detail "Explicit command skills use the sarathi- prefix, such as sarathi-code-review and sarathi-code-assess."
}

function Install-Codex {
    $dest = Get-CodexDestinations
    if ($DryRun) {
        Write-Detail "Would install Codex skill -> $($dest.Skill)"
        Write-Detail "Would install Codex direct prompts -> $($dest.Prompts)"
        return
    }
    Copy-SkillFolder $dest.Skill
    Remove-RetiredSrsAuthoring (Split-Path -Parent $dest.Skill)
    Write-Detail "Installed Codex skill -> $($dest.Skill)"
    Copy-CodexPromptFiles $dest.Prompts
    Write-Detail "Installed Codex direct prompts -> $($dest.Prompts)"
    Write-Detail "Codex direct prompts are available as /prompts:spec-create, /prompts:design-create, etc. after restart."
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
        Write-Detail "Would install Claude Code slash commands -> $dest"
        Write-Detail "Would install Claude Code skill -> $skillDest"
        return
    }
    New-Item -ItemType Directory -Force -Path $dest | Out-Null
    Get-ChildItem -LiteralPath $PromptSource -Filter "*.prompt.md" | ForEach-Object {
        $name = Get-CommandName $_
        $body = Get-PromptBody $_.FullName
        Set-Content -LiteralPath (Join-Path $dest "$name.md") -Value $body -NoNewline
    }
    Write-Detail "Installed Claude Code slash commands -> $dest"
    Copy-SkillFolder $skillDest
    Remove-RetiredSrsAuthoring (Split-Path -Parent $skillDest)
    Write-Detail "Installed Claude Code skill -> $skillDest"
}

function Install-Gemini {
    if ($Scope -eq "user") {
        $dest = Join-Path $HOME ".gemini/commands"
    } else {
        $dest = Join-Path $TargetRoot ".gemini/commands"
    }
    if ($DryRun) {
        Write-Detail "Would install Gemini CLI commands -> $dest"
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
    Write-Detail "Installed Gemini CLI commands -> $dest"
}

function Install-ClaudeExport {
    if ($Scope -eq "user") {
        $dest = Join-Path $HOME ".ai-prompts/claude"
    } else {
        $dest = Join-Path $TargetRoot ".ai-prompts/claude"
    }
    if ($DryRun) {
        Write-Detail "Would export Claude prompt pack -> $dest"
        Write-Detail "Would include skill bundle -> $(Join-Path $dest 'skills/sarathi')"
        return
    }
    New-Item -ItemType Directory -Force -Path $dest | Out-Null
    Get-ChildItem -LiteralPath $PromptSource -Filter "*.prompt.md" | ForEach-Object {
        $name = Get-CommandName $_
        $body = Get-PromptBody $_.FullName
        Set-Content -LiteralPath (Join-Path $dest "$name.md") -Value $body -NoNewline
    }
    Copy-SkillFolder (Join-Path $dest "skills/sarathi")
    Remove-RetiredSrsAuthoring (Join-Path $dest "skills")
    Write-Detail "Exported Claude prompt pack -> $dest"
    Write-Detail "Note: Claude web/desktop has no stable local slash-command folder; import/copy these prompts manually."
}

function Install-PiExport {
    if ($Scope -eq "user") {
        $dest = Join-Path $HOME ".ai-prompts/pi"
    } else {
        $dest = Join-Path $TargetRoot ".ai-prompts/pi"
    }
    if ($DryRun) {
        Write-Detail "Would export Pi prompt pack -> $dest"
        Write-Detail "Would include skill bundle -> $(Join-Path $dest 'skills/sarathi')"
        return
    }
    New-Item -ItemType Directory -Force -Path $dest | Out-Null
    Get-ChildItem -LiteralPath $PromptSource -Filter "*.prompt.md" | ForEach-Object {
        $name = Get-CommandName $_
        $body = Get-PromptBody $_.FullName
        Set-Content -LiteralPath (Join-Path $dest "$name.md") -Value $body -NoNewline
    }
    Copy-SkillFolder (Join-Path $dest "skills/sarathi")
    Remove-RetiredSrsAuthoring (Join-Path $dest "skills")
    Write-Detail "Exported Pi prompt pack -> $dest"
    Write-Detail "Note: Pi has no stable local slash-command folder; import/copy these prompts manually."
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
        [bool]$SkipCheckers,
        [bool]$Detailed
    )

    $skipCheckersFlag = if ($SkipCheckers) { "1" } else { "0" }
    $runner = @'
script_path=$1
target_path=$2
scope_value=$3
tools_value=$4
skip_checkers=$5
detailed=$6
repo_root=$(cd "$(dirname "$script_path")/.." && pwd -P)

tmp_script=$(mktemp)
trap 'rm -f "$tmp_script"' EXIT
tr -d '\r' < "$script_path" > "$tmp_script"
chmod +x "$tmp_script"

args=(--target "$target_path" --scope "$scope_value" --tools "$tools_value" --no-cross-install)
if [ "$skip_checkers" = "1" ]; then
  args=("${args[@]}" --no-checkers)
fi
if [ "$detailed" = "1" ]; then
  args=("${args[@]}" --verbose)
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
        $detailedFlag = if ($Detailed) { "1" } else { "0" }
        & wsl.exe -e bash $runnerWsl $ScriptPath $TargetPath $ScopeValue $ToolsValue $skipCheckersFlag $detailedFlag
    } finally {
        Remove-Item -LiteralPath $runnerPath -Force -ErrorAction SilentlyContinue
    }
}

function Install-WslCompanion {
    if ($NoCrossInstall) {
        return
    }
    if ($DryRun) {
        Write-Detail "Would also install Sarathi in WSL if WSL is available."
        return
    }
    if (-not (Test-WslAvailable)) {
        Write-Detail "WSL is not available; skipping the WSL installation."
        return
    }

    $repoWsl = ConvertTo-WslPath $RepoRoot
    $targetWsl = ConvertTo-WslPath $TargetRoot
    $scriptWsl = "$repoWsl/scripts/install.sh"
    $toolList = $expandedTools -join ","

    Write-Detail "Installing Sarathi in WSL via $scriptWsl"
    Invoke-WslInstallScript `
        -ScriptPath $scriptWsl `
        -TargetPath $targetWsl `
        -ScopeValue $Scope `
        -ToolsValue $toolList `
        -SkipCheckers $NoCheckers `
        -Detailed $Verbose
    if ($LASTEXITCODE -ne 0) {
        throw "WSL installation failed with exit code $LASTEXITCODE"
    }
}

$expandedTools = if ($Tool.Count -eq 0 -or $Tool -contains "all") {
    $InstallableTools
} else {
    $Tool
}

Write-DestinationSummary $expandedTools

Archive-RetiredStageSkillsForScope -Preview:$DryRun

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
Write-Host "Tools: $($expandedTools -join ', ') ($Scope scope)"
