import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'

const outputPath = path.resolve('public', 'models-export.local.json')

try {
  const raw = execSync('openclaw models list --all --json', {
    encoding: 'utf8',
    shell: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  }).replace(/^\uFEFF/, '')

  const parsed = JSON.parse(raw)
  const models = Array.isArray(parsed?.models) ? parsed.models : (Array.isArray(parsed) ? parsed : [])

  fs.mkdirSync(path.dirname(outputPath), { recursive: true })
  fs.writeFileSync(outputPath, `${JSON.stringify(parsed, null, 2)}\n`, 'utf8')

  console.log(`Exported ${models.length} models to ${outputPath}`)
} catch (error) {
  console.error('Failed to export OpenClaw models:', error.message)
  process.exit(1)
}