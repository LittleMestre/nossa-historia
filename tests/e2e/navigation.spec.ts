import { expect, test } from '@playwright/test'

test('navegação, tema e layout cabem na tela', async ({ page }, testInfo) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toContainText(
    'Uma vida inteira',
  )
  await expect(page.getByRole('button', { name: /Hoje, \d{4}/ })).toBeVisible()
  await expect(page.locator('html')).toHaveAttribute('data-theme', /light|dark/)
  if (process.env.CAPTURE_TIMELINE) {
    await page.screenshot({
      path: testInfo.outputPath('timeline.png'),
      fullPage: true,
    })
  }
  await page.getByLabel('Ir para o ano').fill('1999')
  await page.getByRole('button', { name: 'Ir', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Ano de 1999' })).toBeVisible()
  await page.getByRole('button', { name: 'Voltar para hoje' }).click()
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 1,
    ),
  ).toBe(false)

  const originalTheme = await page.locator('html').getAttribute('data-theme')
  await page.getByRole('button', { name: /Ativar tema/ }).click()
  await expect(page.locator('html')).toHaveAttribute(
    'data-theme',
    originalTheme === 'dark' ? 'light' : 'dark',
  )

  await page
    .getByRole('navigation')
    .getByRole('link', { name: 'Galeria' })
    .click()
  await expect(page).toHaveURL(/\/galeria$/)
  await expect(
    page.getByRole('heading', {
      name: 'A galeria ainda espera suas histórias',
    }),
  ).toBeVisible()

  for (const [path, heading] of [
    ['/linha-do-tempo', 'Uma vida inteira'],
    ['/eventos', 'Eventos'],
    ['/participantes', 'Pessoas'],
  ]) {
    await page.goto(path)
    await expect(
      page.getByRole('heading', { name: heading, level: 1 }),
    ).toBeVisible()
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth + 1,
      ),
    ).toBe(false)
  }

  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth + 1,
  )
  expect(hasHorizontalOverflow).toBe(false)
})
