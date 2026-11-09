import { expect, test } from '@playwright/test'

test('home usa a espiral vazia e mantém a alternativa horizontal', async ({
  page,
}) => {
  await page.goto('/')
  await expect(
    page.getByRole('region', { name: /Eventos em espiral cronológica/ }),
  ).toBeVisible()
  await expect(page.getByText('Sua história começa aqui.')).toBeVisible()
  await expect(page.locator('.spiral-card')).toHaveCount(0)

  await page.goto('/linha-do-tempo')
  await expect(
    page.getByRole('region', { name: /Eventos em ordem cronológica/ }),
  ).toBeVisible()
})

test('demonstração da espiral navega entre eventos fictícios', async ({
  page,
}, testInfo) => {
  await page.goto('/demo-espiral')
  await page.waitForLoadState('networkidle')
  await expect(page.getByRole('note')).toContainText('fotografias fictícias')
  const visibleEvents = testInfo.project.name === 'mobile' ? 3 : 5
  await expect(page.locator('.spiral-card')).toHaveCount(visibleEvents)
  await expect(page.locator('.spiral-photo img')).toHaveCount(visibleEvents)

  const yearInput = page.getByLabel('Ir para o ano')
  await yearInput.fill('2022')
  await page.getByRole('button', { name: 'Ir', exact: true }).click()
  const celebration = page.getByRole('button', {
    name: 'Selecionar Festa no quintal, Setembro de 2022',
  })
  await expect(celebration).toHaveAttribute('aria-pressed', 'true')

  const stage = page.getByRole('region', {
    name: /Eventos em espiral cronológica/,
  })
  await stage.focus()
  await stage.press('ArrowRight')
  await expect(
    page.getByRole('button', {
      name: 'Selecionar Trilha da manhã, Maio de 2024',
    }),
  ).toHaveAttribute('aria-pressed', 'true')

  await page.getByRole('button', { name: 'Voltar para hoje' }).click()
  await expect(
    page.getByRole('button', { name: /Hoje, \d{4}/ }),
  ).toHaveAttribute('aria-pressed', 'true')

  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth + 1,
    ),
  ).toBe(false)
})

test('arraste horizontal da espiral muda o foco', async ({
  page,
}, testInfo) => {
  await page.goto('/demo-espiral')
  await page.waitForLoadState('networkidle')
  await page.getByLabel('Ir para o ano').fill('2022')
  await page.getByRole('button', { name: 'Ir', exact: true }).click()
  const stage = page.getByRole('region', {
    name: /Eventos em espiral cronológica/,
  })
  const box = await stage.boundingBox()
  if (!box) throw new Error('Área da espiral indisponível')
  const y = box.y + box.height / 2
  const startX =
    box.x + box.width / 2 + (testInfo.project.name === 'mobile' ? 45 : 80)
  const endX =
    box.x + box.width / 2 - (testInfo.project.name === 'mobile' ? 45 : 80)

  if (testInfo.project.name === 'mobile') {
    const cdp = await page.context().newCDPSession(page)
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ x: startX, y }],
    })
    for (let step = 1; step <= 10; step++) {
      await cdp.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [{ x: startX + ((endX - startX) * step) / 10, y }],
      })
    }
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchEnd',
      touchPoints: [],
    })
  } else {
    await page.mouse.move(startX, y)
    await page.mouse.down()
    await page.mouse.move(endX, y, { steps: 10 })
    await page.mouse.up()
  }

  await expect(
    page.getByRole('button', {
      name: 'Selecionar Trilha da manhã, Maio de 2024',
    }),
  ).toHaveAttribute('aria-pressed', 'true')
})
