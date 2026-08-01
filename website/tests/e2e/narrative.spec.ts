import { expect, test, type Page } from '@playwright/test'

async function disableWebGL(page: Page) {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext
    HTMLCanvasElement.prototype.getContext = function getContext(type: string, ...args: unknown[]) {
      if (['webgl', 'webgl2', 'experimental-webgl'].includes(type)) return null
      return original.call(this, type, ...args as [])
    } as typeof HTMLCanvasElement.prototype.getContext
  })
}

async function waitForMotionLab(page: Page) {
  await page.waitForFunction(() => Boolean((window as Window & { __motionLab?: { ready?: boolean } }).__motionLab?.ready))
}

test('loads the approved intro from a Pages subpath without horizontal overflow', async ({ page }) => {
  await disableWebGL(page)
  await page.goto('./')

  await expect(page).toHaveTitle(/Found in Translation/)
  await expect(page.getByRole('heading', { level: 1, name: 'FOUND IN TRANSLATION' })).toBeVisible()
  await expect(page.getByText('A curated artistic research project — not a complete cultural archive.')).toBeVisible()
  await expect(page.getByText('SCROLL TO CONTINUE')).toBeVisible()
  await expect(page.getByText('Maria Naqvi · Daria Cotocu ·', { exact: false })).toHaveCount(1)
  await expect(page.getByText('SCROLL TO ENTER THE INSTALLATION')).toHaveCount(1)
  await expect(page.locator('.home-intro-stage')).toHaveCount(1)
  await expect(page.locator('.home-intro-stage > .home-intro-panel')).toHaveCount(2)
  await expect(page.locator('.home-intro-stage')).toHaveCSS('height', `${await page.evaluate(() => innerHeight)}px`)
  await expect(page.locator('.home-intro')).toHaveCSS('height', `${await page.evaluate(() => innerHeight * 3)}px`)
  await expect(page.locator('.home-intro-team-names')).toBeHidden()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})

test('supports keyboard scrolling and dismisses the first cue', async ({ page }) => {
  await disableWebGL(page)
  await page.goto('./')

  await page.keyboard.press('PageDown')
  await page.keyboard.press('PageDown')
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(0)
  await expect(page.locator('.home-intro-title-group')).toBeHidden()
  await expect(page.locator('.home-intro-team-names')).toBeVisible()
})

test('keeps title and team mutually exclusive through the pinned reveal', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'The exact pinned playhead sampling runs once on desktop; mobile layout is covered separately.')
  await disableWebGL(page)
  await page.goto('./')

  const states = await page.evaluate(async () => {
    document.documentElement.style.setProperty('scroll-behavior', 'auto', 'important')
    const intro = document.querySelector<HTMLElement>('.home-intro')!
    const stage = document.querySelector<HTMLElement>('.home-intro-stage')!
    const title = document.querySelector<HTMLElement>('.home-intro-title-group')!
    const team = document.querySelector<HTMLElement>('.home-intro-team-names')!
    const blackout = document.querySelector<HTMLElement>('.home-intro-blackout')!
    const isPainted = (element: HTMLElement) => {
      const style = getComputedStyle(element)
      return style.visibility !== 'hidden' && Number(style.opacity) > 0.01
    }

    const samples = []
    for (const progress of [0.1, 0.32, 0.39, 0.4, 0.52, 0.65, 0.72, 0.88, 1, 0.52, 0]) {
      scrollTo(0, intro.offsetHeight * progress)
      await new Promise((resolve) => setTimeout(resolve, 120))
      samples.push({
        progress,
        title: isPainted(title),
        team: isPainted(team),
        blackout: Number(getComputedStyle(blackout).opacity),
        stageTop: Math.round(stage.getBoundingClientRect().top),
        path: location.pathname,
      })
    }
    return samples
  })

  expect(states.every((state) => !(state.title && state.team))).toBe(true)
  expect(states.every((state) => state.path === states[0].path)).toBe(true)
  expect(states[0]).toMatchObject({ title: true, team: false, blackout: 1, stageTop: 0 })
  expect(states[4]).toMatchObject({ title: false, team: true, blackout: 1, stageTop: 0 })
  expect(states[6].blackout).toBeLessThan(0.95)
  expect(states[7].blackout).toBeLessThan(states[6].blackout)
  expect(states[8]).toMatchObject({ title: false, team: false, blackout: 0, stageTop: 0 })
  expect(states.at(-1)).toMatchObject({ title: true, team: false, blackout: 1, stageTop: 0 })
})

test('automatically reveals the accessible fallback when WebGL is unavailable', async ({ page }) => {
  await disableWebGL(page)
  await page.goto('./')
  await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight))

  await expect(page.locator('.home-workflow-fallback')).toBeVisible()
  await expect(page.locator('.home-workflow-fallback')).toContainText('3D unavailable')
  await expect(page.locator('.home-workflow-fallback')).toContainText('Blue star. Pink rose. One printed story.')
  await expect(page.locator('canvas')).toHaveCount(0)
})

test('loads one persistent canvas and the nine runtime GLBs', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'The full GLB load runs once on desktop.')
  test.setTimeout(60_000)

  const loadedModels = new Set<string>()
  page.on('response', (response) => {
    const match = response.url().match(/\/models\/web\/([^/?]+\.glb)/)
    if (match && response.ok()) loadedModels.add(match[1])
  })

  await page.goto('./')
  await waitForMotionLab(page)
  await expect(page.locator('.motion-lab__canvas canvas')).toHaveCount(1)
  await page.locator('.motion-lab__canvas canvas').evaluate((canvas) => { canvas.dataset.persistenceProbe = 'mounted-before-intro' })
  await expect(page.locator('.home-workflow-layer')).toHaveAttribute('aria-hidden', 'true')
  await expect(page.locator('.home-intro-blackout')).toHaveCSS('opacity', '1')
  await expect.poll(() => loadedModels.size).toBe(9)
  await expect(page.locator('[data-testid="motion-lab-scrubber"]')).toHaveCount(0)
  await expect(page.locator('.motion-lab__model-error')).toHaveCount(0)

  const initialPath = new URL(page.url()).pathname
  const handoff = await page.evaluate(async () => {
    document.documentElement.style.setProperty('scroll-behavior', 'auto', 'important')
    const introHeight = document.querySelector<HTMLElement>('.home-intro')!.offsetHeight
    const workflow = document.querySelector<HTMLElement>('.home-workflow-layer')!
    const api = (window as Window & { __motionLab?: { labels: Record<string, number>; getDiagnostics: () => { duration: number }; getProgress: () => number } }).__motionLab!
    const wait = () => new Promise((resolve) => setTimeout(resolve, 180))

    scrollTo(0, introHeight * 0.72)
    await wait()
    const revealStart = { idle: workflow.dataset.idleActive, progress: api.getProgress() }
    scrollTo(0, introHeight)
    await wait()
    const archiveHoldProgress = api.labels['archive-hold'] / api.getDiagnostics().duration
    const atHandoff = api.getProgress()
    scrollTo(0, introHeight * 1.01)
    await wait()
    return { revealStart, archiveHoldProgress, atHandoff, afterHandoff: api.getProgress() }
  })
  expect(handoff.revealStart).toEqual({ idle: 'true', progress: 0 })
  expect(handoff.atHandoff).toBeCloseTo(handoff.archiveHoldProgress, 4)
  expect(handoff.afterHandoff).toBeGreaterThan(handoff.archiveHoldProgress)
  expect(new URL(page.url()).pathname).toBe(initialPath)

  await page.evaluate(() => scrollTo(0, 0))
  await page.waitForTimeout(180)
  await expect(page.locator('.motion-lab__canvas canvas')).toHaveAttribute('data-persistence-probe', 'mounted-before-intro')
  await expect.poll(() => page.evaluate(() => (window as Window & { __motionLab?: { getProgress: () => number } }).__motionLab?.getProgress() ?? -1)).toBeLessThan(0.01)
})

test('keeps responsive chapter compositions inside the viewport', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'small-mobile', 'The live compact choreography runs once at the mobile breakpoint.')
  test.setTimeout(90_000)
  await page.goto('./')
  await waitForMotionLab(page)

  await page.evaluate(() => (window as Window & { __motionLab: { setProgress: (value: number) => void } }).__motionLab.setProgress(0.46))
  await page.waitForTimeout(1400)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  expect(await page.locator('.motion-lab__stage-shell').evaluate((element) => element.getBoundingClientRect().y)).toBe(0)
  await expect(page.locator('.motion-lab__model-error')).toHaveCount(0)

  await page.evaluate(() => (window as Window & { __motionLab: { setProgress: (value: number) => void } }).__motionLab.setProgress(0.96))
  await page.waitForTimeout(1400)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)

  const dimensions = await page.locator('canvas').evaluate((canvas) => ({
    cssWidth: canvas.clientWidth,
    cssHeight: canvas.clientHeight,
    width: canvas.width,
    height: canvas.height,
  }))
  expect(dimensions.width).toBe(dimensions.cssWidth)
  expect(dimensions.height).toBe(dimensions.cssHeight)
})

test('honours reduced motion with a stable final tableau', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'Reduced-motion WebGL validation runs once on desktop.')
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('./')
  await waitForMotionLab(page)

  await expect.poll(() => page.evaluate(() => (window as Window & { __motionLab?: { getProgress: () => number } }).__motionLab?.getProgress() ?? 0)).toBe(1)
  await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight))
  await expect(page.locator('.home-workflow-layer')).toHaveAttribute('aria-hidden', 'false')
  await expect(page.locator('[data-motion-chapter="final"]')).toBeVisible()
  await expect(page.locator('.motion-lab__canvas canvas')).toHaveCount(1)
})
