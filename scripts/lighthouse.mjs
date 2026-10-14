import { spawn, spawnSync } from 'node:child_process'
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { chromium } from '@playwright/test'
import * as chromeLauncher from 'chrome-launcher'
import lighthouse from 'lighthouse'
import desktopConfig from 'lighthouse/core/config/desktop-config.js'
import config from '../lighthouse.config.mjs'

const skipBuild = process.argv.includes('--skip-build')
const baseUrl = `http://localhost:${config.port}`
const runsDir = join(config.outputDir, 'runs')

function median(values) {
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[Math.floor(sorted.length / 2)]
}

async function waitForServer(url, timeoutMs = 60_000) {
  const startedAt = Date.now()
  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url)
      if (response.ok) return
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 500))
    }
  }
  throw new Error(`Servidor de preview não respondeu em ${url}`)
}

async function audit(url, formFactor) {
  const chrome = await chromeLauncher.launch({
    chromePath: chromium.executablePath(),
    chromeFlags: ['--headless=new', '--no-first-run', '--disable-extensions'],
  })
  try {
    const result = await lighthouse(
      url,
      { port: chrome.port, output: ['html', 'json'], logLevel: 'error', onlyCategories: config.categories },
      formFactor === 'desktop' ? desktopConfig : undefined,
    )
    if (!result) throw new Error(`Lighthouse não retornou resultado para ${url}`)
    return result
  } finally {
    await chrome.kill()
  }
}

function metricsOf(lhr) {
  return {
    performance: Math.round((lhr.categories.performance?.score ?? 0) * 100),
    accessibility: Math.round((lhr.categories.accessibility?.score ?? 0) * 100),
    bestPractices: Math.round((lhr.categories['best-practices']?.score ?? 0) * 100),
    seo: Math.round((lhr.categories.seo?.score ?? 0) * 100),
    lcp: Math.round(lhr.audits['largest-contentful-paint'].numericValue),
    cls: Number(lhr.audits['cumulative-layout-shift'].numericValue.toFixed(3)),
    tbt: Math.round(lhr.audits['total-blocking-time'].numericValue),
  }
}

if (!skipBuild) {
  const build = spawnSync('yarn', ['vite', 'build'], { stdio: 'inherit', shell: true })
  if (build.status !== 0) process.exit(build.status ?? 1)
}

rmSync(config.outputDir, { recursive: true, force: true })
mkdirSync(runsDir, { recursive: true })

const server = spawn('yarn', ['vite', 'preview', '--port', String(config.port), '--strictPort'], {
  stdio: 'ignore',
  shell: true,
})

const summary = []
let budgetFailures = 0

try {
  await waitForServer(baseUrl)

  for (const page of config.pages) {
    for (const formFactor of config.formFactors) {
      const runs = []
      for (let index = 1; index <= config.runs; index++) {
        const result = await audit(`${baseUrl}${page.path}`, formFactor)
        const [html, json] = result.report
        const baseName = `${page.name}-${formFactor}-run${index}`
        writeFileSync(join(runsDir, `${baseName}.report.html`), html)
        writeFileSync(join(runsDir, `${baseName}.report.json`), json)
        runs.push({ html, json, metrics: metricsOf(result.lhr) })
        console.log(`${baseName}: LCP ${runs.at(-1).metrics.lcp}ms · CLS ${runs.at(-1).metrics.cls} · TBT ${runs.at(-1).metrics.tbt}ms`)
      }

      const medians = {
        performance: median(runs.map((run) => run.metrics.performance)),
        accessibility: median(runs.map((run) => run.metrics.accessibility)),
        bestPractices: median(runs.map((run) => run.metrics.bestPractices)),
        seo: median(runs.map((run) => run.metrics.seo)),
        lcp: median(runs.map((run) => run.metrics.lcp)),
        cls: median(runs.map((run) => run.metrics.cls)),
        tbt: median(runs.map((run) => run.metrics.tbt)),
      }
      const representative = [...runs].sort((a, b) => a.metrics.performance - b.metrics.performance)[Math.floor(runs.length / 2)]
      writeFileSync(join(config.outputDir, `${page.name}-${formFactor}.report.html`), representative.html)
      writeFileSync(join(config.outputDir, `${page.name}-${formFactor}.report.json`), representative.json)

      const budget = config.budgets[formFactor]
      const withinBudget = medians.lcp <= budget.lcp && medians.cls <= budget.cls && medians.tbt <= budget.tbt
      if (!withinBudget) budgetFailures++
      summary.push({ page: page.name, path: page.path, formFactor, runs: runs.map((run) => run.metrics), median: medians, budget, withinBudget })
    }
  }
} finally {
  if (process.platform === 'win32') spawnSync('taskkill', ['/pid', String(server.pid), '/t', '/f'], { stdio: 'ignore' })
  else server.kill()
}

const generatedAt = new Date().toISOString()
writeFileSync(join(config.outputDir, 'summary.json'), `${JSON.stringify({ generatedAt, runsPerPage: config.runs, results: summary }, null, 2)}\n`)

const rows = summary.map(
  ({ page, formFactor, median: m, withinBudget }) =>
    `| ${page} | ${formFactor} | ${m.performance} | ${m.lcp} ms | ${m.cls} | ${m.tbt} ms | ${m.accessibility} | ${m.bestPractices} | ${m.seo} | ${withinBudget ? 'ok' : 'acima'} |`,
)
const markdown = [
  `# Lighthouse — mediana de ${config.runs} execuções`,
  '',
  `Gerado em ${generatedAt}.`,
  '',
  '| Página | Perfil | Performance | LCP | CLS | TBT | Acessibilidade | Boas práticas | SEO | Orçamento |',
  '| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |',
  ...rows,
  '',
]
writeFileSync(join(config.outputDir, 'summary.md'), markdown.join('\n'))
console.log(`\n${markdown.join('\n')}`)

process.exit(budgetFailures > 0 ? 1 : 0)
