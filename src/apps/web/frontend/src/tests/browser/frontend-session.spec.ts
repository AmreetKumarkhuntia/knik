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
    for (const operation of ['getItem', 'setItem', 'removeItem', 'clear'] as const) {
      const original = Storage.prototype[operation]
      Object.defineProperty(Storage.prototype, operation, {
        configurable: true,
        value: function (this: Storage, ...args: string[]) {
          const stack = new Error().stack ?? ''
          // react-markdown's debug dependency probes its own logging flags on import.
          const debugProbe =
            /createDebug.*\.(load|save)/.test(stack) &&
            ((operation === 'getItem' && (args[0] === 'debug' || args[0] === 'DEBUG')) ||
              (operation === 'removeItem' && args[0] === 'debug'))
          if (!debugProbe) void report(`browser storage: ${operation}`)
          return Reflect.apply(original, this, args)
        },
      })
    }
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
  expect(
    record?.unexpected ?? [],
    'No application transport, browser storage, or media capture'
  ).toEqual([])
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

test('all routes render seeded data or missing-record states without application requests', async ({
  page,
}) => {
  const routes = [
    ['/', 'How can I help you today?'],
    ['/workflows', '5 of 5 shown'],
    [
      '/workflows/create',
      'Run is unavailable until a matching demo scenario is supplied. Editing and JSON export are available.',
    ],
    ['/workflows/executions', 'Showing 6 of 6 executions'],
    ['/executions/9210', 'Execution #9210'],
    ['/executions/99999', 'Execution not found'],
    ['/executions/not-a-number', 'Execution not found'],
    ['/workflows/missing/edit', 'Workflow not found'],
    ['/schedules', 'Every day at 09:00'],
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
  await page.getByRole('button', { name: 'Save workflow', exact: true }).click()
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
  await expect(page.getByText('Every morning', { exact: true })).toHaveCount(0)
  await page.getByRole('button', { name: 'New schedule', exact: true }).click()
  await expect(page.getByLabel('Schedule', { exact: true })).toHaveValue('')
  await page
    .getByLabel('Target Workflow', { exact: true })
    .selectOption({ label: 'Session workflow' })
  await page.getByLabel('Schedule', { exact: true }).fill('Every morning')
  await page.getByRole('button', { name: 'Save schedule', exact: true }).click()
  await expect(page.getByText('Every morning', { exact: true })).toBeVisible()
  await page.getByRole('switch', { name: 'Enable schedule for Session workflow' }).press('Space')
  await expect(
    page.getByRole('switch', { name: 'Enable schedule for Session workflow' })
  ).not.toBeChecked()
  await page.getByRole('button', { name: 'Delete schedule for Session workflow' }).click()
  await page.getByRole('button', { name: 'Cancel', exact: true }).click()
  await expect(page.getByText('Every morning', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Delete schedule for Session workflow' }).click()
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Delete schedule', exact: true })
    .click()
  await expect(page.getByText('Every morning', { exact: true })).toHaveCount(0)
  await page.locator('aside').getByRole('link', { name: 'Workflows', exact: true }).click()
  await expect(page.getByRole('link', { name: 'Session workflow', exact: true })).toBeVisible()
  await page.reload({ waitUntil: 'domcontentloaded' })
  await expect(page.getByRole('link', { name: 'Session workflow', exact: true })).toHaveCount(0)
  await expect(page.getByText('5 of 5 shown', { exact: true })).toBeVisible()
})

test('chat replays supplied scenarios and preserves committed messages across routes', async ({
  page,
}) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  await page.getByRole('button', { name: /Refactor my Python script/ }).click()
  await expect(page.getByRole('textbox', { name: 'Message', exact: true })).toHaveValue(
    'Refactor my Python script'
  )
  await page.getByRole('button', { name: 'Send message', exact: true }).click()
  const response =
    'Here is a demo refactoring checklist: extract pure functions, name each transformation, and test the result with a small input.'
  await expect(page.getByRole('main').getByText(response, { exact: true })).toBeVisible()
  await expect(page.getByRole('textbox', { name: 'Message', exact: true })).toHaveValue('')
  await page.getByRole('textbox', { name: 'Message', exact: true }).fill('Keep this local')
  await expect(page.getByRole('button', { name: 'Send message', exact: true })).toBeEnabled()
  await expect(page.getByRole('button', { name: 'Voice input', exact: true })).toBeDisabled()
  await page.getByRole('textbox', { name: 'Message', exact: true }).press('Enter')
  await expect(page.getByRole('textbox', { name: 'Message', exact: true })).toHaveValue('')
  await expect(page.getByRole('main').getByText('Keep this local', { exact: true })).toHaveCount(1)
  await expect(
    page.getByRole('main').getByRole('button', { name: 'Copy message', exact: true })
  ).toHaveCount(1)
  await page.locator('aside').getByRole('link', { name: 'Workflows', exact: true }).click()
  await page.getByRole('link', { name: 'Chat', exact: true }).click()
  await expect(page.getByRole('main').getByText(response, { exact: true })).toBeVisible()
  await expect(page.getByRole('textbox', { name: 'Message', exact: true })).toHaveValue('')
  await page.reload({ waitUntil: 'domcontentloaded' })
  await expect(page.getByRole('main').getByText(response, { exact: true })).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'How can I help you today?' })).toBeVisible()
})

test('Enter sends once and Shift+Enter composes a multiline message before sending', async ({
  page,
}) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  const message = page.getByRole('textbox', { name: 'Message', exact: true })
  const conversation = page.getByRole('main')
  await message.fill('hello')
  await expect(page.getByRole('button', { name: 'Send message', exact: true })).toBeEnabled()
  await message.press('Enter')
  await expect(message).toHaveValue('')
  await expect(conversation.getByText('hello', { exact: true })).toHaveCount(1)
  await expect(conversation.getByRole('button', { name: 'Copy message', exact: true })).toHaveCount(
    0
  )
  await message.press('Enter')
  await expect(message).toHaveValue('')
  await expect(conversation.getByText('hello', { exact: true })).toHaveCount(1)
  await expect(conversation.getByRole('button', { name: 'Copy message', exact: true })).toHaveCount(
    0
  )

  await message.fill('First line')
  await message.press('Shift+Enter')
  await expect(message).toHaveValue('First line\n')
  await message.pressSequentially('Second line')
  await expect(message).toHaveValue('First line\nSecond line')
  await expect(page.getByRole('button', { name: 'Send message', exact: true })).toBeEnabled()
  await message.press('Enter')
  await expect(message).toHaveValue('')
  await expect(conversation.getByText('First line Second line', { exact: true })).toHaveCount(1)
  await expect(
    page.getByText('No supplied demo reply matches this message and model.', { exact: true })
  ).toHaveCount(0)
  await expect(conversation.getByRole('button', { name: 'Copy message', exact: true })).toHaveCount(
    0
  )
})

test('edited suggestions send through Enter and button without requiring an authored reply', async ({
  page,
}) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  const message = page.getByRole('textbox', { name: 'Message', exact: true })
  const conversation = page.getByRole('main')
  const edited = 'Refactor my Python scriptvasca'
  await page.getByRole('button', { name: /Refactor my Python script/ }).click()
  await message.press('End')
  await message.pressSequentially('vasca')
  await expect(message).toHaveValue(edited)
  await expect(page.getByRole('button', { name: 'Send message', exact: true })).toBeEnabled()
  await expect(page.getByRole('status')).toHaveCount(0)
  await expect(
    page.getByText('No supplied demo reply matches this message and model.', { exact: true })
  ).toHaveCount(0)
  await message.press('Enter')
  await expect(message).toHaveValue('')
  await expect(conversation.getByText(edited, { exact: true })).toHaveCount(1)
  await expect(page.getByRole('status')).toHaveCount(0)
  await expect(page.getByRole('alert')).toHaveCount(0)
  await expect(conversation.getByRole('button', { name: 'Copy message', exact: true })).toHaveCount(
    0
  )
  await message.fill(edited)
  await page.getByRole('button', { name: 'Send message', exact: true }).click()
  await expect(message).toHaveValue('')
  await expect(conversation.getByText(edited, { exact: true })).toHaveCount(2)
  await expect(conversation.getByRole('button', { name: 'Copy message', exact: true })).toHaveCount(
    0
  )
  await page.locator('aside').getByRole('link', { name: 'Workflows', exact: true }).click()
  await page.getByRole('link', { name: 'Chat', exact: true }).click()
  await expect(conversation.getByText(edited, { exact: true })).toHaveCount(2)
  await expect(message).toHaveValue('')
  await page.reload({ waitUntil: 'domcontentloaded' })
  await expect(conversation.getByText(edited, { exact: true })).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'How can I help you today?' })).toBeVisible()
})

test('profile and appearance are session-only across navigation and reload', async ({ page }) => {
  await page.goto('/settings', { waitUntil: 'domcontentloaded' })
  await page.getByLabel('Display name', { exact: true }).fill('Session Person')
  await page.getByLabel('Username', { exact: true }).fill('session-person')
  await page.getByRole('button', { name: 'Save profile', exact: true }).click()
  await page.getByRole('tab', { name: 'Appearance', exact: true }).click()
  await page.getByRole('radio', { name: 'Light', exact: true }).press('Space')
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
  await page.locator('aside').getByRole('link', { name: 'Workflows', exact: true }).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
  await page.locator('aside a[href="/settings"]').click()
  await expect(page.getByLabel('Display name', { exact: true })).toHaveValue('Session Person')
  await page.getByRole('tab', { name: 'Appearance', exact: true }).click()
  await expect(page.getByRole('radio', { name: 'Light', exact: true })).toBeChecked()
  await expect(page.getByRole('switch', { name: 'Compact density', exact: true })).toHaveCount(0)
  await page.reload({ waitUntil: 'domcontentloaded' })
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await expect(page.getByLabel('Display name', { exact: true })).toHaveValue('Amreet Kumar')
  await expect(page.getByLabel('Username', { exact: true })).toHaveValue('amreet')
  await page.getByRole('tab', { name: 'Appearance', exact: true }).click()
  await expect(page.getByRole('radio', { name: 'Dark', exact: true })).toBeChecked()
  await expect(page.getByRole('radio', { name: 'Round', exact: true })).toHaveCount(0)
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
  await expect(page.getByRole('dialog', { name: 'Node properties' })).toBeVisible()
  await page.getByLabel('Function Name', { exact: true }).fill('session_function')
  await page.getByRole('button', { name: 'Close node properties' }).click()
  await expect(page.getByRole('dialog', { name: 'Node properties' })).toHaveCount(0)
  await expect(
    page.locator('.react-flow__node').filter({ hasText: 'session_function' })
  ).toBeVisible()
  await expect(page.getByRole('button', { name: 'Add Node', exact: true })).toBeVisible()
  await noHorizontalOverflow(page)
})

test('settings catalogs are seeded while actions without secrets or audio stay unavailable', async ({
  page,
}) => {
  await page.goto('/settings', { waitUntil: 'domcontentloaded' })
  const assertLocalPane = async () => {
    await expect(page.getByRole('button', { name: /Retry/ })).toHaveCount(0)
    await expect(page.getByText(/Loading (models|providers|tools|voices|API keys)/i)).toHaveCount(0)
    await noHorizontalOverflow(page)
  }
  await expect(page.getByLabel('Default model', { exact: true })).toHaveValue('gemini-1.5-flash')
  await page.getByLabel('Default model', { exact: true }).selectOption('gpt-4o')
  await assertLocalPane()
  await page.getByRole('tab', { name: 'Appearance', exact: true }).click()
  await expect(page.getByRole('radio', { name: 'Dark', exact: true })).toBeChecked()
  await assertLocalPane()
  await page.getByRole('tab', { name: 'Providers', exact: true }).click()
  await expect(page.getByRole('radio', { name: /Google AI/ })).toBeVisible()
  await page.getByRole('radio', { name: /OpenAI/ }).press('Space')
  await page.getByRole('checkbox', { name: /shell/ }).press('Space')
  await assertLocalPane()
  await page.getByRole('tab', { name: 'Voice', exact: true }).click()
  await expect(page.getByRole('radio', { name: /Heart/ })).toBeChecked()
  await expect(page.getByRole('button', { name: 'Preview voice', exact: true })).toBeDisabled()
  await expect(
    page.getByText('Select a voice with a preview recording to listen.', { exact: true })
  ).toBeVisible()
  await assertLocalPane()
  await page.getByRole('tab', { name: 'API keys', exact: true }).click()
  await expect(page.getByText('Demo · Production', { exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Create key', exact: true })).toBeDisabled()
  await assertLocalPane()
  await page.getByRole('tab', { name: 'Providers', exact: true }).click()
  await expect(page.getByRole('radio', { name: /OpenAI/ })).toBeChecked()
  await expect(page.getByRole('checkbox', { name: /shell/ })).not.toBeChecked()
  await page.getByRole('link', { name: 'Chat', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Chat model' })).toContainText('GPT-4o')
})

test('composer has one focus border and settings use flat sections', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  const message = page.getByRole('textbox', { name: 'Message', exact: true })
  const unfocusedBorder = await message
    .locator('..')
    .evaluate(element => getComputedStyle(element).borderColor)
  await message.fill('Keep one clear focus indicator')
  await expect(message).toBeFocused()
  await expect(message).toHaveCSS('box-shadow', 'none')
  await expect(message.locator('..')).toHaveCSS('box-shadow', 'none')
  await expect(message.locator('..')).not.toHaveCSS('border-color', unfocusedBorder)
  await page.screenshot({ path: 'test-results/review-composer-focus.png', animations: 'disabled' })
  await page.locator('aside a[href="/settings"]').click()
  await page.getByRole('tab', { name: 'API keys', exact: true }).click()
  await expect(page.getByText('Demo · Production', { exact: true })).toBeVisible()
  const card = page.getByRole('region', { name: 'API keys', exact: true })
  await expect(card).toHaveCSS('box-shadow', 'none')
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
  await expect(page.getByRole('button', { name: 'Save workflow', exact: true })).toBeVisible()
  await noHorizontalOverflow(page)
  await page.screenshot({ path: 'test-results/review-narrow-builder.png', animations: 'disabled' })
})

test('workflow drafts cancel on navigation, saved records update shared views, and filters reset', async ({
  page,
}) => {
  await page.goto('/workflows', { waitUntil: 'domcontentloaded' })
  await page.getByRole('textbox', { name: 'Search workflows' }).fill('Daily')
  await expect(page.getByText('1 of 5 shown', { exact: true })).toBeVisible()
  await page.getByRole('link', { name: 'Daily digest', exact: true }).first().click()
  await page.getByRole('textbox', { name: 'Workflow name' }).fill('Discarded title')
  await page.locator('aside').getByRole('link', { name: 'Workflows', exact: true }).click()
  await expect(page.getByRole('textbox', { name: 'Search workflows' })).toHaveValue('')
  await expect(page.getByRole('link', { name: 'Discarded title', exact: true })).toHaveCount(0)
  await page.getByRole('link', { name: 'Daily digest', exact: true }).first().click()
  await expect(page.getByRole('textbox', { name: 'Workflow name' })).toHaveValue('Daily digest')
  await page.getByRole('textbox', { name: 'Workflow name' }).fill('Saved digest')
  await page.getByRole('button', { name: 'Save workflow', exact: true }).click()
  await expect(page.getByRole('link', { name: 'Saved digest', exact: true }).first()).toBeVisible()
  await page.getByRole('link', { name: 'Schedules', exact: true }).click()
  await expect(page.getByRole('switch', { name: 'Enable schedule for Saved digest' })).toBeVisible()
  await page.getByRole('button', { name: 'New schedule', exact: true }).click()
  await expect(page.getByRole('option', { name: 'Saved digest', exact: true })).toHaveCount(1)
  await page.getByRole('button', { name: 'Cancel', exact: true }).click()
})

test('running replays the supplied execution and changed definitions cannot reuse its result', async ({
  page,
}) => {
  await page.goto('/workflows', { waitUntil: 'domcontentloaded' })
  await page.getByRole('button', { name: 'Run Daily digest', exact: true }).click()
  await expect(page).toHaveURL('/executions/9210')
  await expect(
    page.getByText('Authored demo result for Daily digest.', { exact: false })
  ).toBeVisible()
  await page.locator('aside').getByRole('link', { name: 'Workflows', exact: true }).click()
  await page.getByRole('link', { name: 'Daily digest', exact: true }).first().click()
  const functionNode = page.locator('.react-flow__node').filter({ hasText: 'demo.prepare_digest' })
  await functionNode.click()
  await page.getByLabel('Function Name', { exact: true }).fill('changed_function')
  await expect(page.getByRole('button', { name: 'Run', exact: true })).toBeDisabled()
  await page.getByRole('button', { name: 'Save workflow', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Run Daily digest', exact: true })).toBeDisabled()
})

test('tools drawer shares selections with settings and preserves the composer draft', async ({
  page,
}) => {
  await page.goto('/')
  const message = page.getByRole('textbox', { name: 'Message', exact: true })
  await message.fill('A draft that stays while choosing tools')
  await page.getByRole('button', { name: 'Tools', exact: true }).click()
  const drawer = page.getByRole('dialog', { name: 'Chat tools', exact: true })
  await expect(drawer).toBeVisible()
  const shell = drawer.getByRole('checkbox', { name: /shell/ })
  await expect(shell).toBeChecked()
  await shell.uncheck()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('button', { name: 'Tools', exact: true })).toBeFocused()
  await expect(message).toHaveValue('A draft that stays while choosing tools')
  await page.setViewportSize({ width: 390, height: 844 })
  await expect(message).toHaveValue('A draft that stays while choosing tools')
  await page.getByRole('button', { name: 'Open navigation', exact: true }).click()
  await page
    .getByRole('dialog', { name: 'Navigation', exact: true })
    .locator('a[href="/settings"]')
    .click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await page.getByRole('tab', { name: 'Providers', exact: true }).click()
  await expect(page.getByRole('checkbox', { name: /shell/ })).not.toBeChecked()
  const tabs = page.getByRole('tablist')
  await expect(tabs).toHaveAttribute('aria-orientation', 'horizontal')
  await page.getByRole('tab', { name: 'Providers', exact: true }).press('ArrowRight')
  await expect(page.getByRole('tab', { name: 'Voice', exact: true })).toHaveAttribute(
    'aria-selected',
    'true'
  )
})

for (const width of [1440, 1024, 768, 390]) {
  test(`visual workspace matrix at ${width}px in both themes`, async ({ page }) => {
    test.setTimeout(120_000)
    await page.setViewportSize({ width, height: width < 768 ? 844 : 1000 })
    const views = [
      ['chat', '/'],
      ['workflows', '/workflows'],
      ['builder', '/workflows/wf-1/edit'],
      ['execution', '/executions/9210'],
      ['schedules', '/schedules'],
      ['settings', '/settings'],
    ] as const
    for (const [name, path] of views) {
      await page.goto(path, { waitUntil: 'domcontentloaded' })
      if (name === 'chat') {
        await page
          .getByRole('textbox', { name: 'Message', exact: true })
          .fill('Refactor my Python script')
        await page.getByRole('textbox', { name: 'Message', exact: true }).press('Enter')
        await expect(
          page.getByRole('main').getByText(/Here is a demo refactoring checklist/)
        ).toBeVisible()
      }
      if (name === 'settings')
        await page.getByRole('tab', { name: 'Providers', exact: true }).click()
      if (name === 'builder') {
        await page.locator('.react-flow__node').first().click()
        await expect(page.getByText('Node properties', { exact: true })).toBeVisible()
      }
      for (const mode of ['dark', 'light'] as const) {
        if (mode === 'light') {
          if (name === 'builder' && width < 1024) await page.keyboard.press('Escape')
          await page.getByRole('button', { name: 'Light mode', exact: true }).click()
          if (name === 'builder' && width < 1024)
            await page.locator('.react-flow__node').first().click()
        }
        await expect(page.locator('html')).toHaveAttribute('data-theme', mode)
        await noHorizontalOverflow(page)
        await page.screenshot({
          path: `test-results/workspace-${name}-${width}-${mode}.png`,
          animations: 'disabled',
        })
      }
    }
  })
}

for (const width of [1440, 390]) {
  test(`model menu stays above the composer and inside the viewport at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 844 })
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    const model = page.getByRole('button', { name: 'Chat model', exact: true })
    await model.click()
    const list = page.getByRole('listbox')
    await expect(list).toBeVisible()
    const triggerBounds = await model.boundingBox()
    const menuBounds = await list.boundingBox()
    expect(triggerBounds).not.toBeNull()
    expect(menuBounds).not.toBeNull()
    expect(menuBounds!.y).toBeGreaterThanOrEqual(0)
    expect(menuBounds!.y + menuBounds!.height).toBeLessThanOrEqual(triggerBounds!.y)
    expect(menuBounds!.x + menuBounds!.width).toBeLessThanOrEqual(width)
    await page.getByRole('option', { name: /GPT-4o/ }).click()
    await expect(model).toContainText('GPT-4o')
    await expect(model).toBeFocused()
  })
}

test('settings scroll within the route and execution panels preserve a usable canvas', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 700 })
  await page.goto('/settings', { waitUntil: 'domcontentloaded' })
  const clear = page.getByRole('button', { name: 'Delete conversations', exact: true })
  await clear.scrollIntoViewIfNeeded()
  await expect(clear).toBeInViewport()
  await page.goto('/executions/9210', { waitUntil: 'domcontentloaded' })
  await expect(page.getByRole('tab', { name: 'Outputs', exact: true })).toHaveAttribute(
    'aria-selected',
    'true'
  )
  const canvas = await page.locator('.react-flow').boundingBox()
  expect(canvas!.height).toBeGreaterThanOrEqual(192)
  await page.getByRole('tab', { name: 'Outputs', exact: true }).press('ArrowRight')
  await expect(page.getByRole('tab', { name: 'Timeline', exact: true })).toHaveAttribute(
    'aria-selected',
    'true'
  )
  await page.getByRole('button', { name: 'Collapse execution details', exact: true }).click()
  await expect(page.getByRole('tabpanel')).toHaveCount(0)
  await expect(
    page.getByRole('button', { name: 'Expand execution details', exact: true })
  ).toBeFocused()
  await page.getByRole('button', { name: 'Expand execution details', exact: true }).click()
  await expect(page.getByRole('tabpanel')).toBeVisible()
})

for (const width of [1440, 390]) {
  test(`empty tables, long names and overflowing code stay contained at ${width}px`, async ({
    page,
  }) => {
    test.setTimeout(60_000)
    await page.setViewportSize({ width, height: 844 })
    const longName = 'An exceptionally long workspace account name '.repeat(5).trim()
    const codeLine = `const sample = "${'readable_demo_value_'.repeat(30)}";`
    const openNavigation = async () => {
      if (width < 768) {
        await page.getByRole('button', { name: 'Open navigation', exact: true }).click()
        return page.getByRole('dialog', { name: 'Navigation', exact: true })
      }
      return page.getByRole('complementary', { name: 'Workspace sidebar', exact: true })
    }

    for (const mode of ['dark', 'light'] as const) {
      await page.goto('/workflows', { waitUntil: 'domcontentloaded' })
      if (mode === 'light')
        await page.getByRole('button', { name: 'Light mode', exact: true }).click()
      await expect(page.locator('html')).toHaveAttribute('data-theme', mode)
      await page.getByRole('textbox', { name: 'Search workflows' }).fill('no-matching-workflow')
      const empty = page.getByText('No matching workflows', { exact: true })
      await expect(empty).toBeInViewport()
      await expect(page.getByRole('link', { name: 'New workflow', exact: true })).toBeInViewport()
      const emptyBounds = await empty.boundingBox()
      expect(emptyBounds!.x).toBeGreaterThanOrEqual(0)
      expect(emptyBounds!.x + emptyBounds!.width).toBeLessThanOrEqual(width)
      await noHorizontalOverflow(page)
      await page.screenshot({
        path: `test-results/workspace-edge-empty-${width}-${mode}.png`,
        animations: 'disabled',
      })

      await (await openNavigation()).locator('a[href="/settings"]').click()
      await page.getByLabel('Display name', { exact: true }).fill(longName)
      await page.getByRole('button', { name: 'Save profile', exact: true }).click()
      const navigation = await openNavigation()
      const account = navigation.locator('a[href="/settings"]')
      const name = account.locator('span.truncate')
      await expect(name).toHaveText(longName)
      await expect(name).toHaveCSS('text-overflow', 'ellipsis')
      const accountBounds = await account.boundingBox()
      const navigationBounds = await navigation.boundingBox()
      expect(accountBounds!.x).toBeGreaterThanOrEqual(navigationBounds!.x)
      expect(accountBounds!.x + accountBounds!.width).toBeLessThanOrEqual(
        navigationBounds!.x + navigationBounds!.width
      )
      expect(await name.evaluate(element => element.scrollWidth > element.clientWidth)).toBe(true)
      await noHorizontalOverflow(page)
      await page.screenshot({
        path: `test-results/workspace-edge-name-${width}-${mode}.png`,
        animations: 'disabled',
      })

      await navigation.getByRole('link', { name: 'Chat', exact: true }).click()
      const composer = page.getByRole('textbox', { name: 'Message', exact: true })
      await composer.fill(`\`\`\`javascript\n${codeLine}\n\`\`\``)
      await composer.press('Enter')
      await expect(composer).toHaveValue('')
      const code = page.getByRole('main').locator('pre').first()
      await expect(code).toContainText(codeLine)
      const scrollContainer = code.locator('..')
      await expect(scrollContainer).toHaveCSS('overflow-x', 'auto')
      expect(
        await scrollContainer.evaluate(element => element.scrollWidth > element.clientWidth)
      ).toBe(true)
      const codeBounds = await scrollContainer.boundingBox()
      const mainBounds = await page.getByRole('main').boundingBox()
      expect(codeBounds!.x).toBeGreaterThanOrEqual(mainBounds!.x)
      expect(codeBounds!.x + codeBounds!.width).toBeLessThanOrEqual(
        mainBounds!.x + mainBounds!.width
      )
      await expect(scrollContainer).toBeInViewport()
      await expect(composer).toBeInViewport()
      await expect(page.getByRole('button', { name: 'Send message', exact: true })).toBeInViewport()
      await noHorizontalOverflow(page)
      await page.screenshot({
        path: `test-results/workspace-edge-code-${width}-${mode}.png`,
        animations: 'disabled',
      })
    }
    await page.reload({ waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('main').locator('pre')).toHaveCount(0)
  })
}
