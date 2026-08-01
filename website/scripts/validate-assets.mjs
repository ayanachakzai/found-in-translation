import { readFile, readdir, stat } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const websiteRoot = dirname(dirname(fileURLToPath(import.meta.url)))
const manifestPath = join(websiteRoot, 'src', 'lib', 'assets.ts')
const modelDirectory = join(websiteRoot, 'public', 'models')

const manifestSource = await readFile(manifestPath, 'utf8')
const manifestFiles = [...manifestSource.matchAll(/file:\s*'([^']+\.glb)'/g)].map(
  (match) => match[1],
)
const declaredSizes = new Map(
  [...manifestSource.matchAll(/file:\s*'([^']+\.glb)'[\s\S]*?byteSize:\s*([\d_]+)/g)].map(
    (match) => [match[1], Number(match[2].replaceAll('_', ''))],
  ),
)
const sourceFiles = [...manifestSource.matchAll(/sourceFile:\s*'([^']+\.glb)'/g)].map(
  (match) => match[1],
)
const declaredSourceSizes = new Map(
  [...manifestSource.matchAll(/sourceFile:\s*'([^']+\.glb)'[\s\S]*?sourceByteSize:\s*([\d_]+)/g)].map(
    (match) => [match[1], Number(match[2].replaceAll('_', ''))],
  ),
)
const diskFiles = (await readdir(modelDirectory, { recursive: true }))
  .filter((file) => file.endsWith('.glb'))
  .sort()

const failures = []
let embeddedImages = 0
let materialTextureReferences = 0

function textureReferences(value, key = '') {
  if (!value || typeof value !== 'object') return []
  return Object.entries(value).flatMap(([childKey, childValue]) => {
    if (
      childValue &&
      typeof childValue === 'object' &&
      'index' in childValue &&
      (childKey.endsWith('Texture') || ['normalTexture', 'occlusionTexture', 'emissiveTexture'].includes(childKey))
    ) {
      return [{ key: key ? `${key}.${childKey}` : childKey, index: childValue.index }]
    }
    return textureReferences(childValue, key ? `${key}.${childKey}` : childKey)
  })
}

if (manifestFiles.length !== new Set(manifestFiles).size) {
  failures.push('The TypeScript asset manifest contains duplicate GLB filenames.')
}

for (const filename of manifestFiles) {
  if (filename.startsWith('/')) {
    failures.push(`${filename} is root-absolute and will fail on a Pages subpath.`)
  }
  if (!diskFiles.includes(filename)) {
    failures.push(`${filename} is listed in the manifest but missing from public/models.`)
  }
}

for (const filename of diskFiles) {
  if (!manifestFiles.includes(filename) && !sourceFiles.includes(filename)) {
    failures.push(`${filename} exists in public/models but is absent from the manifest.`)
  }

  const path = join(modelDirectory, filename)
  const bytes = await readFile(path)
  const fileStat = await stat(path)
  const magic = bytes.toString('ascii', 0, 4)
  const version = bytes.readUInt32LE(4)
  const declaredLength = bytes.readUInt32LE(8)

  if (magic !== 'glTF' || version !== 2 || declaredLength !== fileStat.size) {
    failures.push(`${filename} does not have a valid glTF 2 binary header and length.`)
    continue
  }

  const declaredSize = declaredSizes.get(filename) ?? declaredSourceSizes.get(filename)
  if (declaredSize !== fileStat.size) {
    failures.push(
      `${filename} is ${fileStat.size} bytes but the central registry declares ${declaredSize}.`,
    )
  }

  let offset = 12
  let json
  while (offset < bytes.length) {
    const chunkLength = bytes.readUInt32LE(offset)
    const chunkType = bytes.readUInt32LE(offset + 4)
    const chunkStart = offset + 8
    const chunkEnd = chunkStart + chunkLength
    if (chunkEnd > bytes.length) {
      failures.push(`${filename} contains a chunk outside the declared file length.`)
      break
    }
    if (chunkType === 0x4e4f534a) {
      json = JSON.parse(bytes.toString('utf8', chunkStart, chunkEnd).trimEnd())
    }
    offset = chunkEnd
  }

  if (!json) {
    failures.push(`${filename} has no readable glTF JSON chunk.`)
    continue
  }

  const bufferViews = json.bufferViews ?? []
  const images = json.images ?? []
  const textures = json.textures ?? []
  embeddedImages += images.length

  images.forEach((image, index) => {
    if (image.uri) {
      failures.push(`${filename} image ${index} is external (${image.uri}); website GLBs must be self-contained.`)
    }
    if (!Number.isInteger(image.bufferView) || !bufferViews[image.bufferView]) {
      failures.push(`${filename} image ${index} has a missing bufferView.`)
    }
  })

  textures.forEach((texture, index) => {
    const source = texture.source ?? texture.extensions?.EXT_texture_webp?.source
    if (!Number.isInteger(source) || !images[source]) {
      failures.push(`${filename} texture ${index} references a missing image source.`)
    }
  })

  ;(json.materials ?? []).forEach((material, materialIndex) => {
    textureReferences(material).forEach((reference) => {
      materialTextureReferences += 1
      if (!Number.isInteger(reference.index) || !textures[reference.index]) {
        failures.push(
          `${filename} material ${materialIndex} ${reference.key} references missing texture ${reference.index}.`,
        )
      }
    })
  })
}

if (failures.length > 0) {
  console.error(failures.join('\n'))
  process.exitCode = 1
} else {
  console.log(
    `Validated ${diskFiles.length} source and web GLBs against the central TypeScript registry: ${diskFiles.length} valid glTF 2 headers, ${embeddedImages} embedded images and ${materialTextureReferences} material texture references.`,
  )
}
