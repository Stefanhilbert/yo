export type Tribe = 'roman' | 'gaul' | 'teuton' | 'hun' | 'egyptian'

export type ExtensionRelease = {
  version: string
  date?: string
  changes: string[]
}

export type ExtensionInfo = {
  slug: string
  name: string
  version: string
  description?: string
  icon48?: string
  icon128?: string
  installFolder?: string
  latestRelease?: ExtensionRelease
  releases?: ExtensionRelease[]
}

export type ExtensionsData = {
  generatedAt: string
  extensions: ExtensionInfo[]
}

