import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

function githubPagesBase(): string {
  const explicitBase = process.env.VITE_BASE_PATH
  if (explicitBase) {
    return explicitBase.endsWith('/') ? explicitBase : `${explicitBase}/`
  }

  if (process.env.GITHUB_ACTIONS === 'true') {
    const repositoryName = process.env.GITHUB_REPOSITORY?.split('/')[1]
    if (repositoryName && !repositoryName.endsWith('.github.io')) {
      return `/${repositoryName}/`
    }
  }

  return '/'
}

export default defineConfig({
  base: githubPagesBase(),
  plugins: [react()],
  build: {
    target: 'es2022',
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
