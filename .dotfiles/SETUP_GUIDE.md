# Pulse360 Reusable Dotfiles Setup Guide

Complete automation system for syncing dotfiles across multiple repositories with optional bootstrap from a global dotfiles repo.

## System Architecture

```
Your Central Dotfiles Repo (e.g., you/dotfiles.git)
  ├── templates/
  │   ├── .gitignore
  │   ├── .npmrc
  │   └── ... (all supported dotfiles)
  └── bootstrap-manifest.json
         (optional tools, extensions, agents)

↓ (clone + copy templates via bootstrap)

Local Project (Pulse360)
  ├── .dotfiles/
  │   ├── templates/ (local copies of central templates)
  │   ├── .cache/ (cloned central repo)
  │   └── copilot-user/ (synced Copilot assets)
  ├── scripts/
  │   ├── sync-dotfiles.mjs (sync templates to repos)
  │   └── bootstrap-dotfiles.mjs (clone + sync)
  └── package.json
         (npm run dotfiles:* commands)

↓ (sync templates to all target repos)

Target Repos (../another-repo, ../project-x, etc.)
  ├── .gitignore
  ├── .npmrc
  └── ... (synced from templates)
```

## Workflows

### Workflow 1: Sync Only (No Bootstrap)

Use this if your templates live in this repo already.

**Single repo:**
```bash
npm run dotfiles:check              # Preview
npm run dotfiles:sync               # Apply
npm run dotfiles:sync -- --force    # Overwrite existing
```

**Single other repo:**
```bash
npm run dotfiles:sync -- --target ../another-repo --force
```

**All repos under parent folder:**
```bash
npm run dotfiles:sync:all                           # Safe mode
npm run dotfiles:sync:all -- --force                # Overwrite
npm run dotfiles:sync:all -- --max-depth 2 --force # Limit depth
```

**Subset of files:**
```bash
npm run dotfiles:sync -- --files .gitignore,.npmrc --target ../another-repo
```

### Workflow 2: Bootstrap + Sync

Use this to clone a central dotfiles repo first, then sync templates.

**Setup (once per shell session):**
```bash
export DOTFILES_REPO_URL=git@github.com:you/dotfiles.git
```

Or pass `--repo` directly:
```bash
npm run dotfiles:bootstrap -- --repo git@github.com:you/dotfiles.git --dry-run
```

**Bootstrap this repo:**
```bash
npm run dotfiles:bootstrap -- --force
```

**Bootstrap all repos under parent:**
```bash
npm run dotfiles:bootstrap:all -- --force
```

**With custom central repo paths:**
```bash
npm run dotfiles:bootstrap -- \
  --repo git@github.com:you/dotfiles.git \
  --templates-path my-templates \
  --manifest-path bootstrap.json \
  --force
```

## Central Dotfiles Repo Setup

Create your own `you/dotfiles.git` with:

```
your-dotfiles/
├── templates/
│   ├── .gitignore
│   ├── .npmrc
│   ├── .prettierrc
│   ├── .nvmrc
│   ├── .eslintrc.json
│   ├── .gitattributes
│   ├── .cursorignore
│   └── .github/copilot/mcp.json (optional)
├── bootstrap-manifest.json
├── copilot-user/ (optional)
│   ├── .instructions.md
│   └── agents/
└── README.md
```

### bootstrap-manifest.json Example

```json
{
  "aptPackages": [
    "curl",
    "git",
    "gh"
  ],
  "npmGlobalPackages": [
    {
      "name": "pnpm",
      "version": ">=9.0.0"
    }
  ],
  "vscodeExtensions": [
    "github.copilot",
    "esbenp.prettier-vscode"
  ],
  "copilotAssets": {
    "copilot-instructions": ".instructions.md",
    "agent-customizations": "agents/"
  }
}
```

## Supported Files

These files are synced:
- `.gitignore`
- `.gitattributes`
- `.nvmrc`
- `.npmrc`
- `.prettierrc`
- `.cursorignore`
- `.eslintrc.json`
- `.github/copilot/mcp.json` (optional)

## Command Reference

### Sync Script

```bash
node scripts/sync-dotfiles.mjs [options]

Options:
  --target <path>     Target repo (default: current dir)
  --all-repos         Sync all discovered repos
  --scan-root <path>  Scan root for --all-repos (default: parent dir)
  --max-depth <n>     Max directory depth (default: 3)
  --force             Overwrite differing files
  --dry-run           Preview only
  --files <csv>       Comma-separated file subset
  --list              Show supported files
  --help              Show help
```

### Bootstrap Script

```bash
node scripts/bootstrap-dotfiles.mjs [options]

Options:
  --repo <url>            Central dotfiles repo URL
  --branch <name>         Branch name (default: main)
  --templates-path <path> Path in central repo (default: templates)
  --manifest-path <path>  Manifest path (default: bootstrap-manifest.json)
  --clone-dir <path>      Local clone dir (default: .dotfiles/.cache/global-dotfiles)
  --force                 Overwrite + apply changes
  --dry-run               Preview only
  --skip-tools            Skip apt + npm packages
  --skip-extensions       Skip VS Code extensions
  --skip-copilot          Skip Copilot assets
  --all-repos             Forwarded to sync script
  --scan-root <path>      Forwarded to sync script
  --help                  Show help

Environment:
  DOTFILES_REPO_URL      Default repo URL
```

## File Sync Behavior

**New files:** Always created (no --force needed).

**Existing files:**
- **Same content:** Skipped (reported as "already in sync").
- **Different content:** Skipped unless `--force` is used.

**Dry-run mode:** No files written; shows planned actions.

## Examples

### Scenario 1: Single-Repo Team

Team shares templates in this repo. Everyone runs:

```bash
npm run dotfiles:sync -- --force
```

### Scenario 2: Multi-Repo Workspace

You maintain `/workspace/` with 5 projects. Sync all from parent:

```bash
cd /workspace/project-1
npm run dotfiles:sync:all -- --scan-root .. --force
```

### Scenario 3: Global Dotfiles

You maintain `~/.dotfiles/my-repo.git` with all templates + manifest.

Everyone sets:
```bash
export DOTFILES_REPO_URL=git@github.com:you/my-dotfiles.git
```

Then:
```bash
npm run dotfiles:bootstrap -- --force
npm run dotfiles:bootstrap:all -- --force
```

## Troubleshooting

**JSON parse error:**
```
npm error JSON.parse Invalid package.json...
```
Fix: Check `package.json` syntax (missing commas, trailing characters).

**No git repositories found:**
```
[ERROR] No git repositories found under: ...
```
Fix: Use `--scan-root` to point to a valid parent folder with `.git` subdirs.

**Target is not a git repository:**
```
[ERROR] Target is not a git repository: ...
```
Fix: Ensure target path has a `.git/` folder. Use `--all-repos` instead of `--target`.

**Clone failed:**
```
[ERROR] Failed to clone central repo...
```
Fix: Check repo URL, SSH keys, network access, and branch name.

## Caching & Updates

The bootstrap script clones your central dotfiles repo to `.dotfiles/.cache/global-dotfiles/`.

To update templates from the latest central repo:
```bash
npm run dotfiles:bootstrap -- --force
```

The clone is fetched (pulled) before templates are copied, so you always get the latest.

## Safety Tips

1. **Always dry-run first:**
   ```bash
   npm run dotfiles:check
   npm run dotfiles:bootstrap -- --dry-run
   ```

2. **Use --force sparingly** on production repos—review differences first.

3. **Exclude repos as needed:**
   Edit `.dotfiles/templates/` and rebuild; or use `--files` to sync only what you need.

4. **Backup before --force:**
   ```bash
   git diff --stat HEAD
   npm run dotfiles:sync:all -- --dry-run --force
   git add -A && git commit -m "backup"
   npm run dotfiles:sync:all -- --force
   ```

## Integration with CI/CD

Add to `.github/workflows/dotfiles.yml`:

```yaml
name: Sync Dotfiles

on:
  workflow_dispatch:

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 24
      - run: npm run dotfiles:bootstrap -- \
          --repo ${{ secrets.DOTFILES_REPO_URL }} \
          --force
```

Then trigger manually in Actions tab, or add to your release workflow.
