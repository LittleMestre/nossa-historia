import { expect, test } from '@playwright/test'

test('demonstração exibe cinco cartões fictícios e navega pelo tempo', async ({
  page,
}, testInfo) => {
  await page.goto('/demo-linha-do-tempo')
  await expect(page.getByRole('note')).toContainText('Demonstração visual')
  await expect(page.locator('.cinema-event')).toHaveCount(5)
  await expect(page.locator('.cinema-event-above')).toHaveCount(3)
  await expect(page.locator('.cinema-event-below')).toHaveCount(2)
  await expect(page.locator('.cinema-photo img')).toHaveCount(5)
  await expect
    .poll(() =>
      page
        .locator('.cinema-viewport')
        .evaluate((element) => element.scrollLeft),
    )
    .toBeGreaterThan(0)
  await expect(
    page.getByRole('button', { name: /Hoje, \d{4}/ }),
  ).toHaveAttribute('aria-pressed', 'true')

  const yearInput = page.getByLabel('Ir para o ano')
  await yearInput.fill('2022')
  await page.getByRole('button', { name: 'Ir', exact: true }).click()
  const celebration = page.getByRole('button', {
    name: 'Selecionar Festa no quintal, Setembro de 2022',
  })
  await expect(celebration).toHaveAttribute('aria-pressed', 'true')
  await expect
    .poll(() =>
      celebration
        .locator('img')
        .evaluate((image: HTMLImageElement) => image.naturalWidth),
    )
    .toBeGreaterThan(0)
  await expect(celebration.locator('..')).toHaveClass(/is-focused/)
  await expect
    .poll(() =>
      page.locator('.cinema-viewport').evaluate((viewport) => {
        const slot = viewport.querySelector<HTMLElement>(
          '[data-timeline-key="demo-2022-garden-celebration"]',
        )
        if (!slot) return Number.POSITIVE_INFINITY
        const viewportCenter =
          viewport.getBoundingClientRect().left + viewport.clientWidth / 2
        const slotCenter =
          slot.getBoundingClientRect().left + slot.clientWidth / 2
        return Math.abs(viewportCenter - slotCenter)
      }),
    )
    .toBeLessThan(5)
  if (process.env.CAPTURE_TIMELINE) {
    await page.screenshot({
      path: testInfo.outputPath('timeline-demo.png'),
      fullPage: true,
    })
  }

  const viewport = page.getByRole('region', {
    name: /Eventos em ordem cronológica/,
  })
  await viewport.focus()
  await viewport.press('ArrowRight')
  await expect(
    page.getByRole('button', {
      name: 'Selecionar Trilha da manhã, Maio de 2024',
    }),
  ).toHaveAttribute('aria-pressed', 'true')

  await page.getByRole('button', { name: 'Evento ou período anterior' }).click()
  await expect(celebration).toHaveAttribute('aria-pressed', 'true')

  await page.getByRole('button', { name: 'Voltar para hoje' }).click()
  await expect(
    page.getByRole('button', { name: /Hoje, \d{4}/ }),
  ).toHaveAttribute('aria-pressed', 'true')

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth + 1,
  )
  expect(overflow).toBe(false)
})

test('rolagem e movimento reduzido mantêm o foco acessível', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/demo-linha-do-tempo')
  const viewport = page.getByRole('region', {
    name: /Eventos em ordem cronológica/,
  })
  await expect
    .poll(() => viewport.evaluate((element) => element.scrollLeft))
    .toBeGreaterThan(0)
  await viewport.evaluate((element) => {
    element.scrollLeft = 0
  })
  await expect(
    page.getByRole('button', {
      name: 'Selecionar Almoço no jardim, Julho de 2018',
    }),
  ).toHaveAttribute('aria-pressed', 'true')
  const duration = await page
    .locator('.cinema-event')
    .first()
    .evaluate((element) =>
      Number.parseFloat(getComputedStyle(element).transitionDuration),
    )
  expect(duration).toBeLessThan(0.001)
})

test('clique e gesto horizontal mudam o cartão central', async ({
  page,
}, testInfo) => {
  await page.goto('/demo-linha-do-tempo')
  const viewport = page.getByRole('region', {
    name: /Eventos em ordem cronológica/,
  })
  await expect
    .poll(() => viewport.evaluate((element) => element.scrollLeft))
    .toBeGreaterThan(0)

  const trail = page.getByRole('button', {
    name: 'Selecionar Trilha da manhã, Maio de 2024',
  })
  await trail.click()
  await expect(trail).toHaveAttribute('aria-pressed', 'true')
  await expect
    .poll(() => viewport.evaluate((element) => element.scrollLeft))
    .toBeLessThan(1300)
  const beforeGesture = await viewport.evaluate((element) => element.scrollLeft)

  const box = await viewport.boundingBox()
  if (!box) throw new Error('Área da linha do tempo indisponível')
  const y = box.y + box.height / 2
  const startX = box.x + box.width * 0.72
  const endX = box.x + box.width * 0.28

  if (testInfo.project.name === 'mobile') {
    const cdp = await page.context().newCDPSession(page)
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ x: startX, y }],
    })
    for (let step = 1; step <= 8; step++) {
      await cdp.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [{ x: startX + ((endX - startX) * step) / 8, y }],
      })
    }
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchEnd',
      touchPoints: [],
    })
  } else {
    await page.mouse.move(startX, y)
    await page.mouse.down()
    await page.mouse.move(endX, y, { steps: 12 })
    await page.mouse.up()
  }

  await expect
    .poll(() => viewport.evaluate((element) => element.scrollLeft))
    .toBeGreaterThan(beforeGesture + 100)
  await expect(page.locator('.cinema-event.is-focused')).toHaveCount(1)
})
