#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';

const ROOT_DIR = process.cwd();
const DEFAULT_BRANCH = 'main';
const DEFAULT_TEMPLATES_PATH = '.dotfiles/templates';
const DEFAULT_MANIFEST_PATH = '.dotfiles/bootstrap-manifest.json';
const DEFAULT_CACHE_ROOT = path.join(ROOT_DIR, '.dotfiles', '.cache');
const DEFAULT_CLONE_DIR = path.join(DEFAULT_CACHE_ROOT, 'global-dotfiles');
const LOCAL_TEMPLATE_DIR = path.join(ROOT_DIR, '.dotfiles', 'templates');
const SYNC_SCRIPT_PATH = path.join(ROOT_DIR, 'scripts', 'sync-dotfiles.mjs');

function printHelp() {
  console.log(`Usage: node scripts/bootstrap-dotfiles.mjs [options]\n\nOptions:\n  --repo <url>            Git URL of your central dotfiles repository\n  --branch <name>         Branch to use from central repo (default: main)\n  --templates-path <path> Path inside central repo containing templates (default: templates)\n  --manifest-path <path>  Path inside central repo to bootstrap manifest (default: bootstrap-manifest.json)\n  --clone-dir <path>      Local clone directory (default: .dotfiles/.cache/global-dotfiles)\n  --target <path>         Forwarded to sync script for single target repo\n  --all-repos             Forwarded to sync script for all discovered repos\n  --scan-root <path>      Forwarded to sync script for repo discovery root\n  --max-depth <n>         Forwarded to sync script for discovery depth\n  --files <csv>           Forwarded to sync script file subset\n  --force                 Forwarded to sync script overwrite behavior\n  --dry-run               Dry run for installs and forwarded to sync script\n  --skip-tools            Skip apt and npm global package enforcement\n  --skip-extensions       Skip VS Code extension enforcement\n  --skip-copilot          Skip Copilot user asset sync\n  --help                  Show this help message\n\nEnvironment:\n  DOTFILES_REPO_URL       Default value for --repo\n\nExamples:\n  node scripts/bootstrap-dotfiles.mjs --repo git@github.com:you/dotfiles.git --dry-run\n  node scripts/bootstrap-dotfiles.mjs --repo git@github.com:you/dotfiles.git --force\n  node scripts/bootstrap-dotfiles.mjs --repo git@github.com:you/dotfiles.git --all-repos --scan-root .. --force\n`);
  console.log(`Usage: node scripts/bootstrap-dotfiles.mjs [options]\n\nOptions:\n  --repo <url>            Git URL of your central dotfiles repository\n  --branch <name>         Branch to use from central repo (default: main)\n  --templates-path <path> Path inside central repo containing templates (default: .dotfiles/templates)\n  --manifest-path <path>  Path inside central repo to bootstrap manifest (default: .dotfiles/bootstrap-manifest.json)\n  --clone-dir <path>      Local clone directory (default: .dotfiles/.cache/global-dotfiles)\n  --target <path>         Forwarded to sync script for single target repo\n  --all-repos             Forwarded to sync script for all discovered repos\n  --scan-root <path>      Forwarded to sync script for repo discovery root\n  --max-depth <n>         Forwarded to sync script for discovery depth\n  --files <csv>           Forwarded to sync script file subset\n  --force                 Forwarded to sync script overwrite behavior\n  --dry-run               Dry run for installs and forwarded to sync script\n  --skip-tools            Skip apt and npm global package enforcement\n  --skip-extensions       Skip VS Code extension enforcement\n  --skip-copilot          Skip Copilot user asset sync\n  --help                  Show this help message\n\nEnvironment:\n  DOTFILES_REPO_URL       Default value for --repo\n\nExamples:\n  node scripts/bootstrap-dotfiles.mjs --repo git@github.com:you/dotfiles.git --dry-run\n  node scripts/bootstrap-dotfiles.mjs --repo git@github.com:you/dotfiles.git --force\n  node scripts/bootstrap-dotfiles.mjs --repo git@github.com:you/dotfiles.git --all-repos --scan-root .. --force\n`);
}

function parseArgs(argv) {
  const options = {
    repo: process.env.DOTFILES_REPO_URL ?? null,
    branch: DEFAULT_BRANCH,
    templatesPath: DEFAULT_TEMPLATES_PATH,
    manifestPath: DEFAULT_MANIFEST_PATH,
    cloneDir: DEFAULT_CLONE_DIR,
    dryRun: false,
    skipTools: false,
    skipExtensions: false,
    skipCopilot: false,
    syncArgs: [],
    help: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];

    if (arg === '--repo') {
      const value = argv[i + 1];
      if (!value || value.startsWith('--')) {
        throw new Error('Missing value for --repo');
      }
      options.repo = value;
      i += 1;
      continue;
    }

    if (arg === '--branch') {
      const value = argv[i + 1];
      if (!value || value.startsWith('--')) {
        throw new Error('Missing value for --branch');
      }
      options.branch = value;
      i += 1;
      continue;
    }

    if (arg === '--templates-path') {
      const value = argv[i + 1];
      if (!value || value.startsWith('--')) {
        throw new Error('Missing value for --templates-path');
      }
      options.templatesPath = value;
      i += 1;
      continue;
    }

    if (arg === '--clone-dir') {
      const value = argv[i + 1];
      if (!value || value.startsWith('--')) {
        throw new Error('Missing value for --clone-dir');
      }
      options.cloneDir = path.resolve(ROOT_DIR, value);
      i += 1;
      continue;
    }

    if (arg === '--manifest-path') {
      const value = argv[i + 1];
      if (!value || value.startsWith('--')) {
        throw new Error('Missing value for --manifest-path');
      }
      options.manifestPath = value;
      i += 1;
      continue;
    }

    if (arg === '--skip-tools') {
      options.skipTools = true;
      continue;
    }

    if (arg === '--skip-extensions') {
      options.skipExtensions = true;
      continue;
    }

    if (arg === '--skip-copilot') {
      options.skipCopilot = true;
      continue;
    }

    if (arg === '--dry-run') {
      options.dryRun = true;
    }

    if (arg === '--help' || arg === '-h') {
      options.help = true;
      continue;
    }

    options.syncArgs.push(arg);
    if (requiresValue(arg)) {
      const value = argv[i + 1];
      if (!value || value.startsWith('--')) {
        throw new Error(`Missing value for ${arg}`);
      }
      options.syncArgs.push(value);
      i += 1;
    }
  }

  return options;
}

function requiresValue(arg) {
  return (
    arg === '--target' ||
    arg === '--scan-root' ||
    arg === '--max-depth' ||
    arg === '--files'
  );
}

function runGit(args, cwd) {
  const result = spawnSync('git', args, {
    cwd,
    stdio: 'inherit',
    shell: false,
  });
  if (result.status !== 0) {
    throw new Error(`Git command failed: git ${args.join(' ')}`);
  }
}

function areSamePath(pathA, pathB) {
  try {
    const realA = fs.realpathSync(pathA);
    const realB = fs.realpathSync(pathB);
    return realA === realB;
  } catch {
    return path.resolve(pathA) === path.resolve(pathB);
  }
}

function ensureSafeCloneDir(cloneDir) {
  if (areSamePath(cloneDir, ROOT_DIR)) {
    throw new Error('Clone directory cannot be the current repository. Use a separate cache path.');
  }
}

function runCommand(command, args, cwd, dryRun = false) {
  if (dryRun) {
    console.log(`[DRY-RUN] ${command} ${args.join(' ')}`);
    return { status: 0 };
  }

  const result = spawnSync(command, args, {
    cwd,
    stdio: 'inherit',
    shell: false,
  });

  return result;
}

function cloneOrUpdateRepo({ repo, branch, cloneDir }) {
  const gitDir = path.join(cloneDir, '.git');

  fs.mkdirSync(path.dirname(cloneDir), { recursive: true });

  if (!fs.existsSync(gitDir)) {
    runGit(['clone', '--branch', branch, '--depth', '1', repo, cloneDir], ROOT_DIR);
    return;
  }

  runGit(['fetch', '--all', '--prune'], cloneDir);
  runGit(['checkout', branch], cloneDir);
  runGit(['pull', '--ff-only', 'origin', branch], cloneDir);
}

function copyDirectory(sourceDir, destinationDir) {
  fs.rmSync(destinationDir, { recursive: true, force: true });
  fs.mkdirSync(destinationDir, { recursive: true });

  for (const entry of fs.readdirSync(sourceDir, { withFileTypes: true })) {
    const sourcePath = path.join(sourceDir, entry.name);
    const destinationPath = path.join(destinationDir, entry.name);

    if (entry.isDirectory()) {
      copyDirectory(sourcePath, destinationPath);
    } else if (entry.isFile()) {
      fs.copyFileSync(sourcePath, destinationPath);
    }
  }
}

function copyDirectoryMerge(sourceDir, destinationDir) {
  fs.mkdirSync(destinationDir, { recursive: true });

  for (const entry of fs.readdirSync(sourceDir, { withFileTypes: true })) {
    const sourcePath = path.join(sourceDir, entry.name);
    const destinationPath = path.join(destinationDir, entry.name);

    if (entry.isDirectory()) {
      copyDirectoryMerge(sourcePath, destinationPath);
      continue;
    }

    if (entry.isFile()) {
      fs.mkdirSync(path.dirname(destinationPath), { recursive: true });
      fs.copyFileSync(sourcePath, destinationPath);
    }
  }
}

function parseJsonFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(content);
}

function commandExists(command) {
  const result = spawnSync('which', [command], {
    cwd: ROOT_DIR,
    stdio: 'ignore',
    shell: false,
  });

  return result.status === 0;
}

function getVscodeCli() {
  const candidates = ['code', 'code-insiders', 'cursor'];
  for (const candidate of candidates) {
    if (commandExists(candidate)) {
      return candidate;
    }
  }
  return null;
}

function resolveHomePath(p) {
  if (p.startsWith('~/')) {
    const home = process.env.HOME;
    if (!home) {
      throw new Error('HOME is not defined, cannot resolve ~/ path.');
    }
    return path.join(home, p.slice(2));
  }
  return p;
}

function isAptPackageInstalled(pkg) {
  const result = spawnSync('dpkg', ['-s', pkg], {
    cwd: ROOT_DIR,
    stdio: 'ignore',
    shell: false,
  });
  return result.status === 0;
}

function installAptPackages(packages, dryRun) {
  if (!Array.isArray(packages) || packages.length === 0) {
    return;
  }

  if (!commandExists('apt-get') || !commandExists('dpkg')) {
    console.log('[INFO] apt/dpkg not available. Skipping apt packages.');
    return;
  }

  const missing = packages.filter(pkg => !isAptPackageInstalled(pkg));
  if (missing.length === 0) {
    console.log('[INFO] apt packages already installed.');
    return;
  }

  const isRoot = typeof process.getuid === 'function' ? process.getuid() === 0 : false;
  const prefix = isRoot ? [] : ['sudo'];

  let updateCommand = ['apt-get', 'update'];
  let installCommand = ['apt-get', 'install', '-y', ...missing];
  if (prefix.length > 0) {
    updateCommand = [...prefix, ...updateCommand];
    installCommand = [...prefix, ...installCommand];
  }

  const updateResult = runCommand(updateCommand[0], updateCommand.slice(1), ROOT_DIR, dryRun);
  if (updateResult.status !== 0) {
    throw new Error('Failed to run apt update.');
  }

  const installResult = runCommand(
    installCommand[0],
    installCommand.slice(1),
    ROOT_DIR,
    dryRun
  );
  if (installResult.status !== 0) {
    throw new Error('Failed to install apt packages.');
  }
}

function isNpmGlobalInstalled(pkg) {
  const result = spawnSync('npm', ['list', '-g', '--depth=0', pkg], {
    cwd: ROOT_DIR,
    stdio: 'ignore',
    shell: false,
  });
  return result.status === 0;
}

function installNpmGlobalPackages(packages, dryRun) {
  if (!Array.isArray(packages) || packages.length === 0) {
    return;
  }

  if (!commandExists('npm')) {
    console.log('[INFO] npm not available. Skipping npm global packages.');
    return;
  }

  const missing = packages.filter(pkg => !isNpmGlobalInstalled(pkg));
  if (missing.length === 0) {
    console.log('[INFO] npm global packages already installed.');
    return;
  }

  const result = runCommand('npm', ['install', '-g', ...missing], ROOT_DIR, dryRun);
  if (result.status !== 0) {
    throw new Error('Failed to install npm global packages.');
  }
}

function installVscodeExtensions(extensionIds, dryRun) {
  if (!Array.isArray(extensionIds) || extensionIds.length === 0) {
    return;
  }

  const cli = getVscodeCli();
  if (!cli) {
    console.log('[INFO] VS Code CLI not found (code/code-insiders/cursor). Skipping extension install.');
    return;
  }

  for (const extensionId of extensionIds) {
    const result = runCommand(cli, ['--install-extension', extensionId], ROOT_DIR, dryRun);
    if (result.status !== 0) {
      throw new Error(`Failed to install VS Code extension: ${extensionId}`);
    }
  }
}

function syncCopilotAssets(manifestRoot, copilotAssetsConfig, dryRun) {
  if (!copilotAssetsConfig || typeof copilotAssetsConfig !== 'object') {
    return;
  }

  const sourceDir = path.join(manifestRoot, copilotAssetsConfig.sourceDir ?? 'copilot-user');
  if (!fs.existsSync(sourceDir) || !fs.statSync(sourceDir).isDirectory()) {
    console.log(`[INFO] Copilot assets source not found: ${sourceDir}`);
    return;
  }

  const envVarName = copilotAssetsConfig.targetEnvVar ?? 'VSCODE_USER_PROMPTS_FOLDER';
  const envTarget = process.env[envVarName];
  const fallbackTarget = copilotAssetsConfig.targetFallback ?? '~/.vscode-remote/data/User/prompts';
  const targetDir = resolveHomePath(envTarget || fallbackTarget);

  if (dryRun) {
    console.log(`[DRY-RUN] copy Copilot assets from ${sourceDir} to ${targetDir}`);
    return;
  }

  copyDirectoryMerge(sourceDir, targetDir);
  console.log(`[INFO] Copilot assets synced to ${targetDir}`);
}

function ensureSyncScriptExists() {
  if (!fs.existsSync(SYNC_SCRIPT_PATH)) {
    throw new Error(`Sync script not found: ${SYNC_SCRIPT_PATH}`);
  }
}

function runSyncScript(syncArgs) {
  const result = spawnSync(process.execPath, [SYNC_SCRIPT_PATH, ...syncArgs], {
    cwd: ROOT_DIR,
    stdio: 'inherit',
    shell: false,
  });

  if (result.status !== 0) {
    throw new Error('Dotfiles sync failed. See output above.');
  }
}

function ensureDryRunForwarded(options) {
  if (!options.dryRun) {
    return;
  }

  if (!options.syncArgs.includes('--dry-run')) {
    options.syncArgs.push('--dry-run');
  }
}

function main() {
  const options = parseArgs(process.argv.slice(2));

  if (options.help) {
    printHelp();
    process.exit(0);
  }

  if (!options.repo) {
    throw new Error('Missing dotfiles repo URL. Use --repo or set DOTFILES_REPO_URL.');
  }

  ensureSyncScriptExists();
  ensureDryRunForwarded(options);
  ensureSafeCloneDir(options.cloneDir);

  cloneOrUpdateRepo({
    repo: options.repo,
    branch: options.branch,
    cloneDir: options.cloneDir,
  });

  const sourceTemplateDir = path.join(options.cloneDir, options.templatesPath);
  if (!fs.existsSync(sourceTemplateDir) || !fs.statSync(sourceTemplateDir).isDirectory()) {
    throw new Error(`Templates path not found in dotfiles repo: ${sourceTemplateDir}`);
  }

  if (areSamePath(sourceTemplateDir, LOCAL_TEMPLATE_DIR)) {
    throw new Error('Source template directory cannot be the same as local template directory.');
  }

  copyDirectory(sourceTemplateDir, LOCAL_TEMPLATE_DIR);

  const manifestFilePath = path.join(options.cloneDir, options.manifestPath);
  let manifest = {};
  if (fs.existsSync(manifestFilePath) && fs.statSync(manifestFilePath).isFile()) {
    manifest = parseJsonFile(manifestFilePath);
  } else {
    console.log(`[INFO] Manifest not found, skipping tools/extensions/copilot setup: ${manifestFilePath}`);
  }

  if (!options.skipTools) {
    installAptPackages(manifest.aptPackages, options.dryRun);
    installNpmGlobalPackages(manifest.npmGlobalPackages, options.dryRun);
  }

  if (!options.skipExtensions) {
    installVscodeExtensions(manifest.vscodeExtensions, options.dryRun);
  }

  if (!options.skipCopilot) {
    syncCopilotAssets(path.dirname(manifestFilePath), manifest.copilotAssets, options.dryRun);
  }

  runSyncScript(options.syncArgs);
}

try {
  main();
} catch (error) {
  console.error(`[ERROR] ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}
