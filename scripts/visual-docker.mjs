import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

const { devDependencies } = JSON.parse(readFileSync('package.json', 'utf8'))
const playwrightVersion = devDependencies['@playwright/test'].replace(/^[\^~]/, '')
const image = `mcr.microsoft.com/playwright:v${playwrightVersion}-noble`
const yarn = 'node .yarn/releases/yarn-4.18.0.cjs'
const extraArgs = process.argv.slice(2).join(' ')

const command = [
  `${yarn} install --immutable`,
  `${yarn} playwright test --project=visual-desktop --project=visual-mobile ${extraArgs}`.trim(),
].join(' && ')

const result = spawnSync(
  'docker',
  [
    'run',
    '--rm',
    '--ipc=host',
    '-e',
    'CI=1',
    '-v',
    `${process.cwd()}:/work`,
    '-v',
    'kurio-visual-node-modules:/work/node_modules',
    '-v',
    'kurio-visual-yarn-cache:/root/.yarn/berry',
    '-w',
    '/work',
    image,
    'bash',
    '-c',
    command,
  ],
  { stdio: 'inherit' },
)

process.exit(result.status ?? 1)
