import { expect, test, type Page } from '@playwright/test'

const observations = new Map<Page, { unexpected: string[]; errors: string[] }>()

test.beforeEach(async ({ page }) => {
  const record = {
    unexpected: [] as string[],
    errors: [] as string[],
  }
  observations.set(page, record)
  page.on('pageerror', error => record.errors.push(error.message))
  await page.exposeFunction('__recordFrontendAccess', (name: string) =>
    record.unexpected.push(name)
  )
  await page.route('**/*', async route => {
    const request = route.request()
    if (['fetch', 'xhr', 'eventsource'].includes(request.resourceType())) {
      record.unexpected.push(`${request.resourceType()}: ${request.url()}`)
      await route.abort('blockedbyclient')
      return
    }
    await route.continue()
  })
  await page.addInitScript(() => {
    const report = (name: string) =>
      (Reflect.get(window, '__recordFrontendAccess') as (message: string) => Promise<void>)(name)
    const NativeSocket = window.WebSocket
    window.WebSocket = class extends NativeSocket {
      constructor(...args: ConstructorParameters<typeof WebSocket>) {
        const protocol = args[1]
        const vite =
          protocol === 'vite-hmr' || (Array.isArray(protocol) && protocol.includes('vite-hmr'))
        if (!vite) {
          void report(`WebSocket: ${String(args[0])}`)
          throw new Error('Application WebSocket connections are unavailable in this frontend.')
        }
        super(...args)
      }
    }
    window.EventSource = new Proxy(window.EventSource, {
      construct(_target, args) {
        void report(`EventSource: ${String(args[0])}`)
        throw new Error('Application EventSource connections are unavailable in this frontend.')
      },
    })
    const noCapture = async () => {
      await report('media capture')
      throw new Error('Media capture is unavailable in this frontend.')
    }
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia: noCapture, getDisplayMedia: noCapture },
    })
  })
})

test.afterEach(async ({ page }) => {
  await page.evaluate(() => Promise.resolve())
  const record = observations.get(page)
  expect(record?.unexpected ?? [], 'No application data transport or media capture').toEqual([])
  expect(record?.errors ?? [], 'No uncaught page errors').toEqual([])
  observations.delete(page)
})

async function noHorizontalOverflow(page: Page) {
  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    html: document.documentElement.scrollWidth,
    body: document.body.scrollWidth,
  }))
  expect(dimensions.html).toBeLessThanOrEqual(dimensions.viewport + 1)
  expect(dimensions.body).toBeLessThanOrEqual(dimensions.viewport + 1)
}

test('all routes render empty-source or missing-record states without application requests', async ({
  page,
}) => {
  const routes = [
    ['/', 'Chat replies are unavailable until a demo scenario is supplied.'],
    ['/workflows', 'No workflows yet'],
    [
      '/workflows/create',
      'Run is unavailable until a demo scenario is supplied. Editing and JSON export are available.',
    ],
    ['/workflows/executions', 'No execution history yet'],
    ['/executions/99999', 'Execution not found'],
    ['/executions/not-a-number', 'Execution not found'],
    ['/workflows/missing/edit', 'Workflow not found'],
    ['/schedules', 'No schedules yet'],
    ['/settings', 'How you appear across Knik AI'],
  ]
  for (const [path, text] of routes) {
    await page.goto(path, { waitUntil: 'domcontentloaded' })
    await expect(page.getByText(text, { exact: true })).toBeVisible()
    await noHorizontalOverflow(page)
  }
})

test('workflow and schedule changes persist across navigation and reset on reload', async ({
  page,
}) => {
  await page.goto('/workflows/create', { waitUntil: 'domcontentloaded' })
  await page.getByRole('textbox', { name: 'Workflow name' }).fill('Session workflow')
  await expect(page.getByRole('button', { name: 'Run', exact: true })).toBeDisabled()
  await page.getByRole('button', { name: 'Save Workflow', exact: true }).click()
  await expect(page).toHaveURL('/workflows')
  await expect(page.getByRole('link', { name: 'Session workflow', exact: true })).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Run Session workflow', exact: true })
  ).toBeDisabled()
  await page.getByRole('link', { name: 'Schedules', exact: true }).click()
  await page.getByRole('button', { name: 'New schedule', exact: true }).click()
  await page
    .getByLabel('Target Workflow', { exact: true })
    .selectOption({ label: 'Session workflow' })
  await page.getByLabel('Schedule', { exact: true }).fill('Every morning')
  await page.getByRole('button', { name: 'Cancel', exact: true }).click()
  await expect(page.getByText('No schedules yet', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'New schedule', exact: true }).click()
  await expect(page.getByLabel('Schedule', { exact: true })).toHaveValue('')
  await page
    .getByLabel('Target Workflow', { exact: true })
    .selectOption({ label: 'Session workflow' })
  await page.getByLabel('Schedule', { exact: true }).fill('Every morning')
  await page.getByRole('button', { name: 'Save schedule', exact: true }).click()
  await expect(page.getByText('Every morning', { exact: true })).toBeVisible()
  await page.getByRole('switch', { name: 'Enable schedule for Session workflow' }).press('Space')
  await expect(page.getByText('Paused', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Delete schedule for Session workflow' }).click()
  await page.getByRole('button', { name: 'Cancel', exact: true }).click()
  await expect(page.getByText('Every morning', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Delete schedule for Session workflow' }).click()
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Delete schedule', exact: true })
    .click()
  await expect(page.getByText('No schedules yet', { exact: true })).toBeVisible()
  await page.getByRole('link', { name: 'Workflows', exact: true }).click()
  await expect(page.getByRole('link', { name: 'Session workflow', exact: true })).toBeVisible()
  await page.reload({ waitUntil: 'domcontentloaded' })
  await expect(page.getByText('No workflows yet', { exact: true })).toBeVisible()
})

test('chat remains a local draft when no reply or voice assets were supplied', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  await page.getByRole('textbox', { name: 'Message', exact: true }).fill('Keep this local')
  await expect(page.getByRole('button', { name: 'Send message', exact: true })).toBeDisabled()
  await expect(page.getByRole('button', { name: 'Voice input', exact: true })).toBeDisabled()
  await page.getByRole('textbox', { name: 'Message', exact: true }).press('Enter')
  await expect(page.getByRole('textbox', { name: 'Message', exact: true })).toHaveValue(
    'Keep this local\n'
  )
  await expect(
    page.getByText('Demo conversations and replies have not been supplied.', { exact: false })
  ).toBeVisible()
})

test('profile and appearance are session-only across navigation and reload', async ({ page }) => {
  await page.goto('/settings', { waitUntil: 'domcontentloaded' })
  await page.getByLabel('Display name', { exact: true }).fill('Session Person')
  await page.getByLabel('Username', { exact: true }).fill('session-person')
  await page.getByRole('button', { name: 'Save profile', exact: true }).click()
  await page.getByRole('tab', { name: 'Appearance', exact: true }).click()
  await page.getByRole('radio', { name: 'Light', exact: true }).press('Space')
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
  await page.getByRole('switch', { name: 'Compact density', exact: true }).press('Space')
  await page.getByRole('radio', { name: 'Round', exact: true }).press('Space')
  await page.getByRole('link', { name: 'Workflows', exact: true }).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
  await page.locator('aside a[href="/settings"]').click()
  await expect(page.getByLabel('Display name', { exact: true })).toHaveValue('Session Person')
  await page.getByRole('tab', { name: 'Appearance', exact: true }).click()
  await expect(page.getByRole('switch', { name: 'Compact density', exact: true })).toBeChecked()
  await expect(page.getByRole('radio', { name: 'Round', exact: true })).toBeChecked()
  await page.reload({ waitUntil: 'domcontentloaded' })
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await expect(page.getByLabel('Display name', { exact: true })).toHaveValue('')
  await expect(page.getByLabel('Username', { exact: true })).toHaveValue('')
  await page.getByRole('tab', { name: 'Appearance', exact: true }).click()
  await expect(page.getByRole('switch', { name: 'Compact density', exact: true })).not.toBeChecked()
  await expect(page.getByRole('radio', { name: 'Default', exact: true })).toBeChecked()
})

test('narrow routes remain usable in dark and light modes without horizontal body overflow', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  for (const path of [
    '/',
    '/workflows',
    '/workflows/create',
    '/workflows/executions',
    '/schedules',
    '/settings',
  ]) {
    await page.goto(path, { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('button', { name: 'Light mode', exact: true })).toBeVisible()
    await noHorizontalOverflow(page)
    await page.getByRole('button', { name: 'Light mode', exact: true }).click()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
    await noHorizontalOverflow(page)
    await expect(page.getByRole('button', { name: 'Dark mode', exact: true })).toBeVisible()
  }
})

test('narrow builder supports node addition, property editing, and dismissal', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/workflows/create', { waitUntil: 'domcontentloaded' })
  await expect(page.locator('.react-flow__minimap')).toHaveCount(0)
  await expect(async () => {
    const canvas = await page.locator('.react-flow').boundingBox()
    const nodes = await page.locator('.react-flow__node').all()
    if (!canvas || nodes.length !== 2) throw new Error('Initial workflow graph is not ready')
    for (const node of nodes) {
      const bounds = await node.boundingBox()
      if (!bounds) throw new Error('Workflow node has no bounds')
      expect(bounds.x).toBeGreaterThanOrEqual(canvas.x)
      expect(bounds.x + bounds.width).toBeLessThanOrEqual(canvas.x + canvas.width)
    }
  }).toPass({ timeout: 5_000 })
  await page.getByRole('button', { name: 'Add Node', exact: true }).click()
  await page
    .getByRole('dialog')
    .getByRole('button', { name: /Function/ })
    .click()
  const node = page.locator('.react-flow__node').filter({ hasText: 'new_function' })
  await expect(node).toBeVisible()
  await node.click()
  await expect(page.getByRole('dialog', { name: 'Node Properties' })).toBeVisible()
  await page.getByLabel('Function Name', { exact: true }).fill('session_function')
  await page.getByRole('button', { name: 'Close node properties' }).click()
  await expect(page.getByRole('dialog', { name: 'Node Properties' })).toHaveCount(0)
  await expect(
    page.locator('.react-flow__node').filter({ hasText: 'session_function' })
  ).toBeVisible()
  await expect(page.getByRole('button', { name: 'Add Node', exact: true })).toBeVisible()
  await noHorizontalOverflow(page)
})

test('all settings panes use session-only empty states without loading or connection controls', async ({
  page,
}) => {
  await page.goto('/settings', { waitUntil: 'domcontentloaded' })
  const assertLocalPane = async () => {
    await expect(page.getByRole('button', { name: /Retry/ })).toHaveCount(0)
    await expect(page.getByRole('alert')).toHaveCount(0)
    await expect(page.getByText(/Loading (models|providers|tools|voices|API keys)/i)).toHaveCount(0)
    await noHorizontalOverflow(page)
  }
  await expect(page.getByLabel('Default model', { exact: true })).toBeDisabled()
  await expect(page.getByRole('option', { name: 'No models available', exact: true })).toHaveCount(
    1
  )
  await assertLocalPane()
  await page.getByRole('tab', { name: 'Appearance', exact: true }).click()
  await expect(page.getByRole('radio', { name: 'Dark', exact: true })).toBeChecked()
  await assertLocalPane()
  await page.getByRole('tab', { name: 'Providers', exact: true }).click()
  await expect(page.getByText('No providers available.', { exact: true })).toBeVisible()
  await expect(page.getByText('No tool groups available.', { exact: true })).toBeVisible()
  await assertLocalPane()
  await page.getByRole('tab', { name: 'Voice', exact: true }).click()
  await expect(page.getByText('No voices available.', { exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Preview voice', exact: true })).toBeDisabled()
  await assertLocalPane()
  await page.getByRole('tab', { name: 'API keys', exact: true }).click()
  await expect(page.getByText('No API keys available.', { exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Create key', exact: true })).toBeDisabled()
  await assertLocalPane()
})

test('composer and static settings cards avoid duplicate focus and hover highlights', async ({
  page,
}) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  const message = page.getByRole('textbox', { name: 'Message', exact: true })
  await message.fill('Keep one clear focus indicator')
  await expect(message).toBeFocused()
  await expect(message).toHaveCSS('box-shadow', 'none')
  await expect(message.locator('..')).not.toHaveCSS('box-shadow', 'none')
  await page.screenshot({ path: 'test-results/review-composer-focus.png', animations: 'disabled' })
  await page.locator('aside a[href="/settings"]').click()
  await page.getByRole('tab', { name: 'API keys', exact: true }).click()
  await expect(page.getByText('No API keys available.', { exact: true })).toBeVisible()
  const card = page
    .locator('.knik-card')
    .filter({ has: page.getByRole('heading', { name: 'API keys', exact: true }) })
  const border = await card.evaluate(element => getComputedStyle(element).borderColor)
  await card.hover()
  await card.evaluate(element =>
    Promise.all(element.getAnimations().map(animation => animation.finished))
  )
  await expect(card).toHaveCSS('border-color', border)
  await page.screenshot({ path: 'test-results/review-api-keys-hover.png', animations: 'disabled' })
})

test('capture representative frontend views for visual review', async ({ page }) => {
  test.setTimeout(60_000)
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  await expect(page.getByRole('heading', { name: 'How can I help you today?' })).toHaveCSS(
    'opacity',
    '1'
  )
  await page.evaluate(() => document.fonts.ready)
  await page.screenshot({
    path: 'test-results/review-desktop-dark-chat.png',
    animations: 'disabled',
  })
  await page.locator('aside a[href="/settings"]').click()
  await page.getByRole('tab', { name: 'Appearance', exact: true }).click()
  await page.getByRole('radio', { name: 'Light', exact: true }).press('Space')
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
  await page.screenshot({
    path: 'test-results/review-desktop-light-settings.png',
    animations: 'disabled',
  })
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/workflows/create', { waitUntil: 'domcontentloaded' })
  await expect(page.getByRole('button', { name: 'Save Workflow', exact: true })).toBeVisible()
  await noHorizontalOverflow(page)
  await page.screenshot({ path: 'test-results/review-narrow-builder.png', animations: 'disabled' })
})
