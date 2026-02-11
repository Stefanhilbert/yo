import rawData from '../data/extensions.generated.json'
import type { ExtensionsData } from '../types/extensions.ts'

export const extensionsData = rawData as ExtensionsData

export function getExtensionBySlug(slug: string) {
  return extensionsData.extensions.find((e) => e.slug === slug)
}

