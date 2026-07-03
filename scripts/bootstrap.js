#!/usr/bin/env node

import { spawn, spawnSync } from 'node:child_process'
import { existsSync, lstatSync, readFileSync, symlinkSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { stdin as input, stdout as output } from 'node:process'
import { createInterface } from 'node:readline/promises'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'

const SCRIPT_PATH = fileURLToPath(import.meta.url)
const __dirname = resolve(SCRIPT_PATH, '..')
const ROOT_DIR = resolve(__dirname, '..')
const SENTINEL_FILE = join(ROOT_DIR, '.bootstrapped')
const DEFAULT_PROJECT_NAME = 'vibe-saas'

// Kebab-case validation pattern
const KEBAB_CASE_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/

// The shared, agent-agnostic build-journey playbook the chosen agent is told to read.
const PLAYBOOK_PATH = '.agents/journey/build-app.md'

// Per-agent adapter table: how to detect, launch, and run each supported coding
// agent in full-auto mode. `autoFlag` is the agent's "stop asking me" flag.
const SUPPORTED_AGENTS = [
  {
    key: 'claude',
    bin: 'claude',
    label: 'Claude Code',
    autoFlag: ['--permission-mode', 'acceptEdits'],
    install: 'npm i -g @anthropic-ai/claude-code',
  },
  {
    key: 'opencode',
    bin: 'opencode',
    label: 'opencode',
    autoFlag: [],
    install: 'npm i -g opencode-ai',
  },
  {
    key: 'cursor',
    bin: 'cursor-agent',
    label: 'Cursor',
    autoFlag: ['-f'],
    install: 'curl https://cursor.com/install -fsSL | bash',
  },
]

// Files to update with template substitution
const FILES_TO_UPDATE = [
  'packages/db/package.json',
  'packages/contracts/package.json',
  'apps/api/package.json',
  'apps/web/package.json',
  'apps/api/app/services/db.ts',
  'apps/web/src/utils/api.ts',
  'apps/api/Dockerfile',
  'apps/web/Dockerfile',
  'package.json',
  'AGENTS.md',
  'README.md',
]

/**
 * Create .claude as a junction (Windows) or symlink (Unix) pointing to .agents.
 * Junctions need no admin rights on Windows; symlinks do on some Unix setups.
 * No-op if .claude already exists.
 */
function createClaudeLink() {
  const claudePath = join(ROOT_DIR, '.claude')
  const agentsPath = join(ROOT_DIR, '.agents')

  try {
    lstatSync(claudePath)
    return // already exists — symlink, junction, or real dir
  } catch {
    // doesn't exist yet, create it
  }

  try {
    if (process.platform === 'win32') {
      // junction requires absolute target and works without elevated privileges
      symlinkSync(agentsPath, claudePath, 'junction')
    } else {
      symlinkSync('.agents', claudePath, 'dir')
    }
    console.log('✓ Created .claude link → .agents')
  } catch (err) {
    console.warn(`⚠ Could not create .claude link: ${err.message}`)
    console.warn('  Claude Code project settings will be unavailable until the link is created.')
  }
}

/**
 * Parse command-line arguments
 */
function parseCliArgs() {
  const { values } = parseArgs({
    options: {
      name: {
        type: 'string',
        short: 'n',
      },
      link: {
        type: 'boolean',
      },
      help: {
        type: 'boolean',
        short: 'h',
      },
    },
    allowPositionals: false,
    strict: true,
  })

  if (values.help) {
    console.log(`
Usage: node scripts/bootstrap.js [options]

With no options in an interactive terminal, launches the guided journey:
pick a coding agent, name your project, then hand off to the agent to build
your app. With --name (or in CI/headless), runs the rename engine only.

Options:
  -n, --name <name>    Project name in kebab-case (rename-only, no agent launch)
      --link           Create .claude → .agents link only, then exit
  -h, --help          Display this help message
    `)
    process.exit(0)
  }

  return { name: values.name, link: !!values.link }
}

/**
 * Check if running in CI environment or non-interactive mode.
 * Uses stdin.isTTY — more reliable than stdout.isTTY on Windows.
 */
function isNonInteractive() {
  return process.env.CI === 'true' || !process.stdin.isTTY
}

/**
 * Check sentinel file - if .bootstrapped exists, exit immediately
 */
function checkSentinel() {
  if (existsSync(SENTINEL_FILE)) {
    console.log('✓ Project already bootstrapped. Exiting.')
    process.exit(0)
  }
}

/**
 * Validate kebab-case format
 */
function validateKebabCase(str) {
  return KEBAB_CASE_PATTERN.test(str)
}

/**
 * Prompt user for project name using readline/promises
 */
async function promptForProjectName(cliName) {
  const rl = createInterface({ input, output })

  if (cliName) {
    if (!validateKebabCase(cliName)) {
      console.error(`✗ Invalid project name: "${cliName}". Must be kebab-case (e.g., my-project).`)
      rl.close()
      process.exit(1)
    }
    rl.close()
    return cliName
  }

  // If non-interactive (CI/piped), use default
  if (isNonInteractive()) {
    console.log(`Using default project name: ${DEFAULT_PROJECT_NAME}`)
    rl.close()
    return DEFAULT_PROJECT_NAME
  }

  // Interactive prompt loop
  let projectName = null

  while (!projectName) {
    const answer = await rl.question(
      `\nWhat is your project name? (default: ${DEFAULT_PROJECT_NAME}) [kebab-case]: `
    )
    const input = answer.trim() || DEFAULT_PROJECT_NAME

    if (!validateKebabCase(input)) {
      console.error(`✗ Invalid format: "${input}". Use kebab-case only (e.g., my-project).`)
      continue
    }

    projectName = input
  }

  rl.close()
  return projectName
}

/**
 * Read file and return content
 */
function readFile(filePath) {
  return readFileSync(join(ROOT_DIR, filePath), 'utf8')
}

/**
 * Write file with content
 */
function writeFile(filePath, content) {
  writeFileSync(join(ROOT_DIR, filePath), content, 'utf8')
}

/**
 * Replace @template with @<projectName> in file content
 */
function replaceTemplate(content, projectName) {
  return content.replace(/@template/g, `@${projectName}`)
}

/**
 * Update root package.json name
 */
function updateRootPackageJson(projectName) {
  const filePath = 'package.json'
  const content = JSON.parse(readFile(filePath))
  content.name = `${projectName}-monorepo`
  writeFile(filePath, `${JSON.stringify(content, null, 2)}\n`)
}

/**
 * Update all template files
 */
function updateTemplateFiles(projectName) {
  console.log(`\n📝 Updating template files with project name: "${projectName}"...`)

  let updated = 0
  for (const file of FILES_TO_UPDATE) {
    try {
      const filePath = join(ROOT_DIR, file)

      if (!existsSync(filePath)) {
        console.warn(`⚠ File not found: ${file}`)
        continue
      }

      // Special handling for package.json root
      if (file === 'package.json') {
        updateRootPackageJson(projectName)
      } else if (file.endsWith('.json')) {
        // Handle other JSON files
        const content = readFile(file)
        const updated = replaceTemplate(content, projectName)
        writeFile(file, updated)
      } else {
        // Handle non-JSON files
        const content = readFile(file)
        const updated = replaceTemplate(content, projectName)
        writeFile(file, updated)
      }

      console.log(`  ✓ ${file}`)
      updated++
    } catch (err) {
      console.error(`  ✗ Error updating ${file}:`, err.message)
    }
  }

  console.log(`\n✓ Updated ${updated}/${FILES_TO_UPDATE.length} files.`)
}

/**
 * Write sentinel file with project name
 */
function writeSentinel(projectName) {
  writeFileSync(SENTINEL_FILE, projectName, 'utf8')
  console.log(`✓ Sentinel file created: .bootstrapped`)
}

/**
 * Spawn pnpm install silently
 */
function runPnpmInstall() {
  return new Promise((resolve, reject) => {
    console.log('\n📦 Running pnpm install to rebuild symlinks...')

    const pnpmPath = resolveBin('pnpm')
    if (!pnpmPath) {
      reject(
        new Error(
          'pnpm not found on PATH. Install it (https://pnpm.io/installation) or run "corepack enable", then run "pnpm install" manually.'
        )
      )
      return
    }

    const pnpm = spawnBinary(pnpmPath, ['install'], {
      cwd: ROOT_DIR,
      stdio: 'pipe',
    })

    let stderr = ''
    pnpm.stderr.on('data', (chunk) => {
      stderr += chunk
    })

    pnpm.on('close', (code) => {
      if (code === 0) {
        console.log('✓ pnpm install completed successfully.')
        resolve()
      } else {
        console.error(`✗ pnpm install failed with exit code ${code}`)
        if (stderr) console.error(stderr)
        reject(new Error(`pnpm install exited with code ${code}`))
      }
    })

    pnpm.on('error', (err) => {
      console.error('✗ Failed to spawn pnpm:', err.message)
      reject(err)
    })
  })
}

/**
 * Resolve the absolute path of a binary (cross-platform), or null if not found.
 * We resolve the full path here and spawn it directly later, so detection and
 * launch always agree — bare-name spawning can fail even when the shell can
 * resolve the command (e.g. PATH differences, app-bundled binaries).
 */
function resolveBin(bin) {
  const probe = process.platform === 'win32' ? `where ${bin}` : `command -v ${bin}`
  const result = spawnSync(probe, { shell: true, encoding: 'utf8' })
  if (result.status !== 0 || !result.stdout) {
    return null
  }
  // `where` (and occasionally `command -v`) can print multiple lines; take the first.
  const resolved = result.stdout.split('\n')[0].trim()
  return resolved && existsSync(resolved) ? resolved : null
}

/**
 * Detect which supported coding agents are installed, resolving each to an
 * absolute path so the chosen agent can be spawned reliably.
 */
function detectAgents() {
  return SUPPORTED_AGENTS.map((agent) => ({ ...agent, path: resolveBin(agent.bin) })).filter(
    (agent) => agent.path
  )
}

/**
 * Read the project name recorded in the sentinel file (if any)
 */
function readSentinelName() {
  try {
    return readFileSync(SENTINEL_FILE, 'utf8').trim() || DEFAULT_PROJECT_NAME
  } catch {
    return DEFAULT_PROJECT_NAME
  }
}

/**
 * Render a tiny braille spinner; returns a stop() that prints a checkmark
 */
function startSpinner(text) {
  const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']
  let i = 0
  const timer = setInterval(() => {
    i = (i + 1) % frames.length
    output.write(`\r${frames[i]} ${text}`)
  }, 80)
  return () => {
    clearInterval(timer)
    output.write(`\r✓ ${text}\n`)
  }
}

/**
 * Prompt the user to pick one of the detected agents
 */
async function selectAgent(rl, agents) {
  if (agents.length === 1) {
    console.log(
      `\nUsing the only detected agent: ${agents[0].label} \x1b[2m(${agents[0].path})\x1b[0m`
    )
    return agents[0]
  }

  console.log('\nWhich coding agent should build your app?\n')
  agents.forEach((agent, idx) => {
    console.log(`  ${idx + 1}) ${agent.label}  \x1b[2m${agent.path}\x1b[0m`)
  })

  while (true) {
    const answer = await rl.question(`\nSelect an agent [1-${agents.length}] (default: 1): `)
    const choice = answer.trim() === '' ? 1 : Number.parseInt(answer.trim(), 10)

    if (Number.isInteger(choice) && choice >= 1 && choice <= agents.length) {
      return agents[choice - 1]
    }
    console.error(`✗ Please enter a number between 1 and ${agents.length}.`)
  }
}

/**
 * Run the rename engine in a child process (`--name <name>`) with a spinner,
 * reusing the exact same tested path that CI uses.
 */
function runRenameChild(projectName) {
  return new Promise((resolve, reject) => {
    const stop = startSpinner(
      `Personalizing your project as "${projectName}" (this can take a minute)…`
    )
    const child = spawn(process.execPath, [SCRIPT_PATH, '--name', projectName], {
      cwd: ROOT_DIR,
      stdio: ['ignore', 'pipe', 'pipe'],
    })

    let stderr = ''
    child.stderr.on('data', (chunk) => {
      stderr += chunk
    })

    child.on('close', (code) => {
      stop()
      if (code === 0) {
        resolve()
      } else {
        if (stderr) console.error(stderr)
        reject(new Error(`Rename failed with exit code ${code}`))
      }
    })

    child.on('error', (err) => {
      stop()
      reject(err)
    })
  })
}

/**
 * Single-quote an argument for safe inclusion in a POSIX shell command string.
 */
function shellQuote(arg) {
  return `'${String(arg).replace(/'/g, "'\\''")}'`
}

/**
 * Double-quote an argument for safe inclusion in a cmd.exe command string.
 */
function shellQuoteWindows(arg) {
  return `"${String(arg).replace(/"/g, '""')}"`
}

/**
 * Windows can only CreateProcess .exe files directly — .cmd/.bat are shell
 * scripts and must be routed through cmd.exe. Native .exe binaries (e.g.
 * WinGet-installed tools) must NOT be routed through cmd.exe: it requires
 * re-quoting the whole command line, and nested quotes there conflict with
 * argument quotes, corrupting the parse.
 */
function isWindowsShellScript(filePath) {
  const ext = String(filePath).split('.').pop().toLowerCase()
  return ext === 'cmd' || ext === 'bat'
}

/**
 * Spawn a resolved absolute binary path directly, routing through cmd.exe
 * only when required (.cmd/.bat). Never uses shell:true with a bare
 * command+args pair: Node's shell:true naively space-joins command and args
 * before quoting once, which corrupts paths containing spaces (e.g.
 * "C:\Users\John Doe\...\pnpm.exe").
 */
function spawnBinary(binPath, args, opts) {
  if (process.platform === 'win32' && isWindowsShellScript(binPath)) {
    const command = [binPath, ...args].map(shellQuoteWindows).join(' ')
    return spawn(process.env.ComSpec || 'cmd.exe', ['/d', '/s', '/c', command], {
      ...opts,
      windowsVerbatimArguments: true,
    })
  }
  return spawn(binPath, args, opts)
}

/**
 * Hand the terminal off to the chosen agent, primed to read the playbook
 */
function launchAgent(agent, projectName) {
  const prompt = `Read ${PLAYBOOK_PATH} and follow it to build my app. The project is named "${projectName}".`
  console.log(`\n🚀 Launching ${agent.label}…\n`)

  const target = agent.path || agent.bin

  return new Promise((resolve) => {
    let child
    if (process.platform === 'win32') {
      // .cmd/.bat shims (npm global installs) route through cmd.exe; native
      // .exe binaries (e.g. WinGet-installed Claude Code) spawn directly.
      child = spawnBinary(target, [...agent.autoFlag, prompt], {
        cwd: ROOT_DIR,
        stdio: 'inherit',
      })
    } else {
      // Launch through the user's login + interactive shell so the agent runs
      // with the same PATH/environment they get in their terminal. Some agents
      // are wrapper scripts (e.g. cmux's `claude`) that resolve the real CLI via
      // PATH at runtime and fail under the stripped, non-interactive env a bare
      // spawn inherits.
      const shell = process.env.SHELL || '/bin/sh'
      const command = [target, ...agent.autoFlag, prompt].map(shellQuote).join(' ')
      child = spawn(shell, ['-lic', command], { cwd: ROOT_DIR, stdio: 'inherit' })
    }

    child.on('close', (code) => resolve(code ?? 0))
    child.on('error', (err) => {
      console.error(`\n✗ Failed to launch ${agent.label}:`, err.message)
      resolve(1)
    })
  })
}

/**
 * Rename-only mode: the original, tested personalization flow.
 * Triggered by `--name <name>` or any non-interactive/CI environment.
 */
async function renameMode(cliName) {
  console.log('\n🚀 Fullstack AI Project Starter - Bootstrap\n')

  checkSentinel()

  const projectName = await promptForProjectName(cliName)
  updateTemplateFiles(projectName)
  writeSentinel(projectName)

  try {
    await runPnpmInstall()
    console.log(`\n✨ Bootstrap complete! Your project "${projectName}" is ready to develop.`)
  } catch (err) {
    console.error(`\n⚠ Bootstrap succeeded but pnpm install failed: ${err.message}`)
    console.error('Please run "pnpm install" manually to rebuild symlinks.')
    process.exit(1)
  }
}

/**
 * Prompt for a kebab-case project name using an already-open readline interface
 */
async function askProjectName(rl) {
  while (true) {
    const answer = await rl.question(
      `\nWhat is your project name? (default: ${DEFAULT_PROJECT_NAME}) [kebab-case]: `
    )
    const value = answer.trim() || DEFAULT_PROJECT_NAME

    if (validateKebabCase(value)) {
      return value
    }
    console.error(`✗ Invalid format: "${value}". Use kebab-case only (e.g., my-project).`)
  }
}

/**
 * Launcher mode: interactive, agent-driven journey.
 * Pick an agent, personalize the project, then hand off to build the app.
 */
async function launcherMode() {
  console.log('\n🚀 Fullstack AI Project Starter\n')
  console.log("Let's pick your coding agent, name your project, and build your app.")

  const agents = detectAgents()
  if (agents.length === 0) {
    console.error('\n✗ No supported coding agent found on your PATH.')
    console.error('Install one of these, then re-run this command:\n')
    for (const agent of SUPPORTED_AGENTS) {
      console.error(`  • ${agent.label.padEnd(12)} ${agent.install}`)
    }
    process.exit(0)
  }

  // Decide before opening readline; the rename runs after the prompt closes.
  const needsRename = !existsSync(SENTINEL_FILE)
  const rl = createInterface({ input, output })

  let agent
  let projectName
  try {
    agent = await selectAgent(rl, agents)

    if (needsRename) {
      projectName = await askProjectName(rl)
    } else {
      projectName = readSentinelName()
      console.log(`\n✓ Project already personalized as "${projectName}" — skipping rename.`)
    }
  } finally {
    rl.close()
  }

  if (needsRename) {
    await runRenameChild(projectName)
  }

  await launchAgent(agent, projectName)
}

/**
 * Entry point: choose rename-only mode vs the interactive launcher journey.
 */
async function bootstrap() {
  const { name: cliName, link } = parseCliArgs()

  createClaudeLink()

  if (link) return

  if (cliName !== undefined || isNonInteractive()) {
    await renameMode(cliName)
  } else {
    await launcherMode()
  }
}

// Run bootstrap
bootstrap().catch((err) => {
  console.error('\n✗ Bootstrap failed:', err.message)
  process.exit(1)
})
