import { expect, test } from '@playwright/test'

for (const width of [1440, 1024, 768, 390]) {
  test(`execution nodes fit without overlap at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: width < 768 ? 844 : 1000 })
    await page.goto('/executions/9210', { waitUntil: 'domcontentloaded' })
    await expect(page.locator('.react-flow__node')).toHaveCount(4)
    await expect
      .poll(async () =>
        page.locator('.react-flow').evaluate(canvas => {
          const bounds = canvas.getBoundingClientRect()
          const nodes = Array.from(canvas.querySelectorAll('.react-flow__node')).map(node => ({
            id: node.getAttribute('data-id'),
            bounds: node.getBoundingClientRect(),
          }))
          const problems: string[] = []
          const vertical =
            canvas.closest('[data-flow-direction]')?.getAttribute('data-flow-direction') ===
            'vertical'
          const first = nodes[0].bounds
          const last = nodes[nodes.length - 1].bounds
          if (vertical ? last.top <= first.bottom : last.left <= first.right)
            problems.push('Nodes do not follow the available canvas direction')
          if (nodes.some(node => node.bounds.width < 120))
            problems.push('Nodes are too small to read')
          if (vertical) {
            for (const path of canvas.querySelectorAll<SVGGraphicsElement>(
              '.react-flow__edge-path'
            )) {
              if (path.getBBox().width > 2)
                problems.push(`Linear flow connection is not aligned: ${path.getAttribute('d')}`)
            }
          }
          for (const [index, node] of nodes.entries()) {
            const a = node.bounds
            if (
              a.left < bounds.left ||
              a.right > bounds.right ||
              a.top < bounds.top ||
              a.bottom > bounds.bottom
            )
              problems.push(`${node.id} outside canvas`)
            for (const other of nodes.slice(index + 1)) {
              const b = other.bounds
              if (a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top)
                problems.push(`${node.id} overlaps ${other.id}`)
            }
          }
          return problems
        })
      )
      .toEqual([])
    await page.screenshot({
      path: `test-results/refined-execution-${width}-dark.png`,
      animations: 'disabled',
    })
    await page.getByRole('button', { name: 'Light mode', exact: true }).click()
    await page.screenshot({
      path: `test-results/refined-execution-${width}-light.png`,
      animations: 'disabled',
    })
  })
}

test('builder back button and name share a compact toolbar row', async ({ page }) => {
  await page.goto('/workflows/wf-1/edit', { waitUntil: 'domcontentloaded' })
  const back = await page.getByRole('button', { name: 'Back to workflows' }).boundingBox()
  const name = await page.getByRole('textbox', { name: 'Workflow name' }).boundingBox()
  expect(back).not.toBeNull()
  expect(name).not.toBeNull()
  expect(Math.abs(back!.y - name!.y)).toBeLessThan(5)
})

test('builder controls stay separate from the minimap and preserve node positions', async ({
  page,
}) => {
  await page.goto('/workflows/wf-1/edit', { waitUntil: 'domcontentloaded' })
  await expect(page.locator('.react-flow__node')).toHaveCount(4)
  const positions = () =>
    page
      .locator('.react-flow__node')
      .evaluateAll(nodes => nodes.map(node => (node as HTMLElement).style.transform))
  const initialPositions = await positions()
  const controls = page.getByRole('group', { name: 'Graph view controls' })
  const minimap = page.locator('.react-flow__minimap')
  const controlsBounds = await controls.boundingBox()
  const minimapBounds = await minimap.boundingBox()
  expect(controlsBounds!.x + controlsBounds!.width).toBeLessThan(minimapBounds!.x)
  const zoom = page.getByLabel('Zoom level', { exact: true })
  const before = await zoom.textContent()
  await page.getByRole('button', { name: 'Zoom In', exact: true }).click()
  await expect(zoom).not.toHaveText(before!)
  await page.getByRole('button', { name: 'Fit View', exact: true }).click()
  expect(await positions()).toEqual(initialPositions)
  await page.locator('.react-flow__node').first().click()
  await expect(page.getByRole('complementary', { name: 'Node properties' })).toBeVisible()
  await page.getByRole('button', { name: 'Fit View', exact: true }).click()
  expect(await positions()).toEqual(initialPositions)
  for (const mode of ['dark', 'light']) {
    if (mode === 'light')
      await page.getByRole('button', { name: 'Light mode', exact: true }).click()
    await page.screenshot({
      path: `test-results/refined-builder-1440-${mode}.png`,
      animations: 'disabled',
    })
  }
})

test('execution connections rotate on resize and manual zoom stays in place', async ({ page }) => {
  await page.goto('/executions/9210', { waitUntil: 'domcontentloaded' })
  await expect(page.locator('[data-flow-direction]')).toHaveAttribute(
    'data-flow-direction',
    'horizontal'
  )
  await page.setViewportSize({ width: 390, height: 844 })
  await expect(page.locator('[data-flow-direction]')).toHaveAttribute(
    'data-flow-direction',
    'vertical'
  )
  await expect
    .poll(() =>
      page
        .locator('.react-flow__edge-path')
        .evaluateAll(paths => paths.every(path => (path as SVGGraphicsElement).getBBox().width < 2))
    )
    .toBe(true)
  const zoom = page.getByLabel('Zoom level', { exact: true })
  await page.getByRole('button', { name: 'Zoom In', exact: true }).scrollIntoViewIfNeeded()
  const previousZoom = await zoom.textContent()
  await page.getByRole('button', { name: 'Zoom In', exact: true }).click()
  await expect(zoom).not.toHaveText(previousZoom!)
  const manualZoom = await zoom.textContent()
  await page.getByRole('button', { name: 'Light mode', exact: true }).click()
  await expect(zoom).toHaveText(manualZoom!)
  await page.setViewportSize({ width: 1440, height: 1000 })
  await expect(page.locator('[data-flow-direction]')).toHaveAttribute(
    'data-flow-direction',
    'horizontal'
  )
  await expect
    .poll(() =>
      page
        .locator('.react-flow__edge-path')
        .evaluateAll(paths =>
          paths.every(path => (path as SVGGraphicsElement).getBBox().height < 2)
        )
    )
    .toBe(true)
})
