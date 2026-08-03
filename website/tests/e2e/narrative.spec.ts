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
  await expect(page.locator('.home-intro-team-names')).toContainText('Maria Naqvi')
  await expect(page.locator('.home-intro-team-names')).toContainText('Daria Cotocu')
  await expect(page.locator('.home-intro-team-names')).toContainText('Muhammad Ayan Achakzai')
  await expect(page.locator('.home-intro-team-names')).toContainText('Harshada Pathare')
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
  expect(states[8]).toMatchObject({ title: false, team: false, stageTop: 0 })
  expect(states[8].blackout).toBeLessThan(0.2)
  expect(states.at(-1)).toMatchObject({ title: true, team: false, blackout: 1, stageTop: 0 })
})

test('automatically reveals the accessible fallback when WebGL is unavailable', async ({ page }) => {
  await disableWebGL(page)
  await page.goto('./')
  const installationStart = await page.locator('.home-intro').evaluate((intro) => intro.offsetHeight)
  await page.evaluate((y) => scrollTo(0, y), installationStart)
  await page.waitForTimeout(240)

  await expect(page.locator('.home-workflow-fallback')).toBeVisible()
  await expect(page.locator('.home-workflow-fallback')).toContainText('3D unavailable')
  await expect(page.locator('.home-workflow-fallback')).toContainText('Blue star. Pink rose. One printed story.')
  await expect(page.locator('canvas')).toHaveCount(0)
})

test('loads one persistent canvas and the nine runtime GLBs', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'The full GLB load runs once on desktop.')
  // Loading and exercising all nine compressed GLBs can exceed two minutes on
  // the shared GitHub Pages runner even though the scene is already interactive.
  test.setTimeout(300_000)

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
  const introHeight = await page.evaluate(() => {
    document.documentElement.style.setProperty('scroll-behavior', 'auto', 'important')
    return document.querySelector<HTMLElement>('.home-intro')!.offsetHeight
  })
  await page.evaluate((y) => scrollTo(0, y), introHeight * 0.72)
  await page.waitForTimeout(240)
  const revealStart = await page.evaluate(() => ({
    idle: document.querySelector<HTMLElement>('.home-workflow-layer')!.dataset.idleActive,
    progress: (window as Window & { __motionLab: { getProgress: () => number } }).__motionLab.getProgress(),
  }))
  await page.evaluate((y) => scrollTo(0, y), introHeight)
  await page.waitForTimeout(240)
  const atHandoff = await page.evaluate(() => {
    const api = (window as Window & { __motionLab: { labels: Record<string, number>; getDiagnostics: () => { duration: number }; getProgress: () => number } }).__motionLab
    return {
      archiveHoldProgress: api.labels['archive-hold'] / api.getDiagnostics().duration,
      progress: api.getProgress(),
    }
  })
  await page.evaluate((y) => scrollTo(0, y), introHeight * 1.01)
  await page.waitForTimeout(240)
  const afterHandoff = await page.evaluate(() => (window as Window & { __motionLab: { getProgress: () => number } }).__motionLab.getProgress())
  expect(revealStart).toEqual({ idle: 'true', progress: 0 })
  expect(atHandoff.progress).toBeCloseTo(atHandoff.archiveHoldProgress, 4)
  expect(afterHandoff).toBeGreaterThan(atHandoff.archiveHoldProgress)
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

  const geometry = await page.evaluate(() => {
    document.documentElement.style.setProperty('scroll-behavior', 'auto', 'important')
    const root = document.querySelector<HTMLElement>('#workflow')!
    const api = (window as Window & { __motionLab: { labels: Record<string, number>; getDiagnostics: () => { duration: number } } }).__motionLab
    return {
      start: root.getBoundingClientRect().top + scrollY,
      range: root.offsetHeight - innerHeight,
      opening: api.labels['archive-hold'] / api.getDiagnostics().duration,
    }
  })
  const scrollToProgress = (progress: number) => geometry.start + geometry.range * ((progress - geometry.opening) / (1 - geometry.opening))

  await page.evaluate((y) => scrollTo(0, y), scrollToProgress(0.46))
  await page.waitForTimeout(900)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  expect(await page.locator('.motion-lab__stage-shell').evaluate((element) => element.getBoundingClientRect().y)).toBe(0)
  await expect(page.locator('.motion-lab__model-error')).toHaveCount(0)

  await page.evaluate((y) => scrollTo(0, y), scrollToProgress(0.96))
  await page.waitForTimeout(900)
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

test('renders only the five supplied authentic receipt stories in the approved order', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'small-mobile', 'The expandable mobile receipt archive runs once.')
  await disableWebGL(page)
  await page.goto('./')
  await expect(page.locator('.generated-receipt')).toHaveCount(5)

  const receiptIds = await page.locator('.generated-receipt').evaluateAll((receipts) =>
    receipts.map((receipt) => receipt.getAttribute('data-receipt-id')),
  )
  expect(receiptIds).toEqual([
    '20260730_152434',
    '20260730_152832',
    '20260730_152934',
    '20260730_152301',
    '20260730_152624',
  ])

  const labels = await page.locator('.generated-receipt h3').allTextContents()
  expect(labels).toEqual([
    'pink rose + blue star',
    'blue star',
    'purple owl',
    'yellow crown',
    'green snake + blue star',
  ])

  await page.locator('.generated-receipts').scrollIntoViewIfNeeded()
  const featured = page.locator('.generated-receipt--featured')
  await expect(featured).toContainText('Love + Mysticism')
  await expect(featured).toContainText('Europe 50% - South Asia 25% - Latin America 25%')
  await featured.locator('summary').click()
  await expect(featured.locator('details')).toHaveAttribute('open', '')
  await expect(featured.locator('.generated-receipt__story')).toContainText('Once upon a time, in a land where magic ran wild as wind through the hills')
  await expect(featured.locator('.generated-receipt__preview')).toBeHidden()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})

test('honours reduced motion with a stable final tableau', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'Reduced-motion WebGL validation runs once on desktop.')
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('./')
  await waitForMotionLab(page)

  await expect.poll(() => page.evaluate(() => (window as Window & { __motionLab?: { getProgress: () => number } }).__motionLab?.getProgress() ?? 0)).toBe(1)
  const workflowEnd = await page.evaluate(() => {
    const workflow = document.querySelector<HTMLElement>('#workflow')!
    return workflow.getBoundingClientRect().top + scrollY + workflow.offsetHeight - innerHeight
  })
  await page.evaluate((y) => scrollTo(0, y), workflowEnd - 2)
  await page.waitForTimeout(300)
  await expect(page.locator('.home-workflow-layer')).toHaveAttribute('aria-hidden', 'false')
  await expect(page.locator('[data-motion-chapter="final"]')).toBeVisible()
  await expect(page.locator('.motion-lab__canvas canvas')).toHaveCount(1)
})
