#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const ROOT_DIR = process.cwd();
const TEMPLATE_DIR = path.join(ROOT_DIR, '.dotfiles', 'templates');
const SUPPORTED_FILES = [
  '.gitignore',
  '.gitattributes',
  '.nvmrc',
  '.npmrc',
  '.prettierrc',
  '.cursorignore',
  '.eslintrc.json',
  '.github/copilot/mcp.json',
];

function printHelp() {
  console.log(`Usage: node scripts/sync-dotfiles.mjs [options]\n\nOptions:\n  --target <path>      Path to the repository to receive dotfiles (default: current directory)\n  --all-repos          Sync to every git repo found under --scan-root\n  --scan-root <path>   Root directory to scan for git repositories (default for --all-repos: parent of current directory)\n  --max-depth <n>      Maximum directory depth to scan when using --all-repos (default: 3)\n  --force              Overwrite existing files when content differs\n  --dry-run            Print planned changes without writing files\n  --files <csv>        Comma-separated subset of files to sync\n  --list               Print supported files and exit\n  --help               Show this help message\n\nExamples:\n  node scripts/sync-dotfiles.mjs --dry-run\n  node scripts/sync-dotfiles.mjs --target ../another-repo\n  node scripts/sync-dotfiles.mjs --target ../another-repo --force\n  node scripts/sync-dotfiles.mjs --all-repos --scan-root .. --force\n  node scripts/sync-dotfiles.mjs --files .gitignore,.nvmrc --target ../another-repo\n`);
}

function parseArgs(argv) {
  const options = {
    target: ROOT_DIR,
    allRepos: false,
    scanRoot: null,
    maxDepth: 3,
    force: false,
    dryRun: false,
    files: null,
    list: false,
    help: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];

    if (arg === '--target') {
      const value = argv[i + 1];
      if (!value || value.startsWith('--')) {
        throw new Error('Missing value for --target');
      }
      options.target = path.resolve(ROOT_DIR, value);
      i += 1;
      continue;
    }

    if (arg === '--all-repos') {
      options.allRepos = true;
      continue;
    }

    if (arg === '--scan-root') {
      const value = argv[i + 1];
      if (!value || value.startsWith('--')) {
        throw new Error('Missing value for --scan-root');
      }
      options.scanRoot = path.resolve(ROOT_DIR, value);
      i += 1;
      continue;
    }

    if (arg === '--max-depth') {
      const value = argv[i + 1];
      if (!value || value.startsWith('--')) {
        throw new Error('Missing value for --max-depth');
      }
      const parsed = Number.parseInt(value, 10);
      if (!Number.isInteger(parsed) || parsed < 0) {
        throw new Error('Invalid value for --max-depth. Expected a non-negative integer.');
      }
      options.maxDepth = parsed;
      i += 1;
      continue;
    }

    if (arg === '--force') {
      options.force = true;
      continue;
    }

    if (arg === '--dry-run') {
      options.dryRun = true;
      continue;
    }

    if (arg === '--files') {
      const value = argv[i + 1];
      if (!value || value.startsWith('--')) {
        throw new Error('Missing value for --files');
      }
      options.files = value
        .split(',')
        .map(entry => entry.trim())
        .filter(Boolean);
      i += 1;
      continue;
    }

    if (arg === '--list') {
      options.list = true;
      continue;
    }

    if (arg === '--help' || arg === '-h') {
      options.help = true;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}

function assertTemplateDirExists() {
  if (!fs.existsSync(TEMPLATE_DIR) || !fs.statSync(TEMPLATE_DIR).isDirectory()) {
    throw new Error(`Template directory not found: ${TEMPLATE_DIR}`);
  }
}

function ensureTargetIsRepo(targetPath) {
  const gitDir = path.join(targetPath, '.git');
  if (!fs.existsSync(gitDir)) {
    throw new Error(`Target is not a git repository: ${targetPath}`);
  }
}

function isGitRepo(dirPath) {
  return fs.existsSync(path.join(dirPath, '.git'));
}

function findGitRepos(scanRoot, maxDepth) {
  const repos = [];

  function visit(dirPath, depth) {
    if (depth > maxDepth) {
      return;
    }

    if (isGitRepo(dirPath)) {
      repos.push(dirPath);
      return;
    }

    let entries = [];
    try {
      entries = fs.readdirSync(dirPath, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      if (!entry.isDirectory()) {
        continue;
      }

      if (entry.name === '.git' || entry.name === 'node_modules') {
        continue;
      }

      visit(path.join(dirPath, entry.name), depth + 1);
    }
  }

  visit(scanRoot, 0);
  return repos;
}

function readText(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function resolveFilesToSync(selectedFiles) {
  if (!selectedFiles) {
    return [...SUPPORTED_FILES];
  }

  const invalid = selectedFiles.filter(file => !SUPPORTED_FILES.includes(file));
  if (invalid.length > 0) {
    throw new Error(
      `Unsupported file(s): ${invalid.join(', ')}. Use --list to see allowed files.`
    );
  }

  return selectedFiles;
}

function syncFiles({ target, force, dryRun, files }) {
  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const fileName of files) {
    const source = path.join(TEMPLATE_DIR, fileName);
    const destination = path.join(target, fileName);

    if (!fs.existsSync(source)) {
      console.warn(`[WARN] Missing template: ${fileName}`);
      skipped += 1;
      continue;
    }

    const sourceContent = readText(source);

    if (!fs.existsSync(destination)) {
      if (dryRun) {
        console.log(`[DRY-RUN] create ${fileName}`);
      } else {
        fs.mkdirSync(path.dirname(destination), { recursive: true });
        fs.writeFileSync(destination, sourceContent, 'utf8');
        console.log(`[CREATE] ${fileName}`);
      }
      created += 1;
      continue;
    }

    const destinationContent = readText(destination);
    if (destinationContent === sourceContent) {
      console.log(`[SKIP] ${fileName} already in sync`);
      skipped += 1;
      continue;
    }

    if (!force) {
      console.log(`[SKIP] ${fileName} differs (use --force to overwrite)`);
      skipped += 1;
      continue;
    }

    if (dryRun) {
      console.log(`[DRY-RUN] update ${fileName}`);
    } else {
      fs.mkdirSync(path.dirname(destination), { recursive: true });
      fs.writeFileSync(destination, sourceContent, 'utf8');
      console.log(`[UPDATE] ${fileName}`);
    }
    updated += 1;
  }

  return { created, updated, skipped };
}

function main() {
  const options = parseArgs(process.argv.slice(2));

  if (options.help) {
    printHelp();
    process.exit(0);
  }

  if (options.list) {
    console.log('Supported files:');
    for (const file of SUPPORTED_FILES) {
      console.log(`- ${file}`);
    }
    process.exit(0);
  }

  assertTemplateDirExists();
  const filesToSync = resolveFilesToSync(options.files);
  const targets = [];

  if (options.allRepos) {
    const scanRoot = options.scanRoot ?? path.dirname(ROOT_DIR);
    const repos = findGitRepos(scanRoot, options.maxDepth);

    if (repos.length === 0) {
      throw new Error(`No git repositories found under: ${scanRoot}`);
    }

    targets.push(...repos);
  } else {
    ensureTargetIsRepo(options.target);
    targets.push(options.target);
  }

  let totalCreated = 0;
  let totalUpdated = 0;
  let totalSkipped = 0;

  for (const targetRepo of targets) {
    console.log(`\nTarget: ${targetRepo}`);
    const summary = syncFiles({
      target: targetRepo,
      force: options.force,
      dryRun: options.dryRun,
      files: filesToSync,
    });

    totalCreated += summary.created;
    totalUpdated += summary.updated;
    totalSkipped += summary.skipped;
  }

  console.log(
    `\nSummary: repos=${targets.length}, created=${totalCreated}, updated=${totalUpdated}, skipped=${totalSkipped}`
  );
}

try {
  main();
} catch (error) {
  console.error(`[ERROR] ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}
