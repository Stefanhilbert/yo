import fs from 'node:fs/promises'
import path from 'node:path'

const appRoot = process.cwd()
const repoRoot = path.resolve(appRoot, '..', '..')

const outFile = path.join(appRoot, 'src', 'data', 'extensions.generated.json')
const publicDir = path.join(appRoot, 'public')

const EXTENSIONS = [
  {
    slug: 'yofarmer',
    dir: path.join(repoRoot, 'Travian Extension', 'Travian Farmer'),
    installFolder: 'Travian Extension/Travian Farmer',
  },
  {
    slug: 'oasis-scanner',
    dir: path.join(repoRoot, 'Travian Extension', 'Travian Oasis Scanner'),
    installFolder: 'Travian Extension/Travian Oasis Scanner',
  },
  {
    slug: 'tracker',
    dir: path.join(repoRoot, 'Travian Extension', 'Travian Tracker'),
    installFolder: 'Travian Extension/Travian Tracker',
  },
  {
    slug: 'interval-timer',
    dir: path.join(repoRoot, 'Travian Extension', 'Interval Timer'),
    installFolder: 'Travian Extension/Interval Timer',
  },
]

function parseChangelog(markdown) {
  const src = String(markdown).replace(/\r\n/g, '\n')
  const lines = src.split('\n')
  const headings = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (line.startsWith('## ')) headings.push(i)
  }

  const releases = []
  for (let h = 0; h < headings.length; h++) {
    const start = headings[h]
    const end = h + 1 < headings.length ? headings[h + 1] : lines.length
    const header = lines[start]
    const m = /^##\s*\[([^\]]+)\]\s*-\s*(.+)$/.exec(header)
    if (!m) continue
    const version = m[1].trim()
    const date = m[2].trim()
    const bodyLines = lines.slice(start + 1, end)
    const changes = bodyLines
      .map((l) => l.trim())
      .filter((l) => l.startsWith('- ') || l.startsWith('* '))
      .map((l) => l.slice(2).trim())
      .filter(Boolean)
    releases.push({ version, date, changes })
  }

  return releases
}

async function ensureDir(p) {
  await fs.mkdir(p, { recursive: true })
}

async function copyIfExists(from, to) {
  try {
    await ensureDir(path.dirname(to))
    await fs.copyFile(from, to)
    return true
  } catch {
    return false
  }
}

async function main() {
  const extensions = []

  for (const ext of EXTENSIONS) {
    const manifestPath = path.join(ext.dir, 'manifest.json')
    const manifestRaw = await fs.readFile(manifestPath, 'utf8')
    const manifest = JSON.parse(manifestRaw)

    const name = manifest.name ?? ext.slug
    const version = manifest.version ?? '0.0.0'
    const description = manifest.description

    // Icons
    const icon48Rel = manifest.action?.default_icon?.['48'] ?? 'icons/48.png'
    const icon128Rel = manifest.action?.default_icon?.['128'] ?? 'icons/128.png'
    const icon48Src = path.join(ext.dir, icon48Rel)
    const icon128Src = path.join(ext.dir, icon128Rel)
    const iconOutDir = path.join(publicDir, 'extensions', ext.slug)
    const icon48Out = path.join(iconOutDir, '48.png')
    const icon128Out = path.join(iconOutDir, '128.png')
    const has48 = await copyIfExists(icon48Src, icon48Out)
    const has128 = await copyIfExists(icon128Src, icon128Out)

    // Changelog
    let releases = []
    try {
      const changelogRaw = await fs.readFile(path.join(ext.dir, 'CHANGELOG.md'), 'utf8')
      releases = parseChangelog(changelogRaw)
    } catch {
      // ignore
    }
    const normalizeVersion = (v) => String(v).replace(/\.0+$/g, '')
    const target = normalizeVersion(version)
    const latestRelease =
      releases.find((r) => normalizeVersion(r.version) === target) ??
      releases.find((r) => r.version === version) ??
      releases[0]

    extensions.push({
      slug: ext.slug,
      name,
      version,
      description,
      installFolder: ext.installFolder,
      icon48: has48 ? `/extensions/${ext.slug}/48.png` : undefined,
      icon128: has128 ? `/extensions/${ext.slug}/128.png` : undefined,
      latestRelease,
      releases,
    })
  }

  const payload = {
    generatedAt: new Date().toISOString(),
    extensions,
  }

  await ensureDir(path.dirname(outFile))
  await fs.writeFile(outFile, JSON.stringify(payload, null, 2) + '\n', 'utf8')
  // eslint-disable-next-line no-console
  console.log(`Wrote ${outFile}`)
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err)
  process.exitCode = 1
})

