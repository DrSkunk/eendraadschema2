import { test, expect, Page, Locator } from '@playwright/test';

async function openExample(page: Page) {
  await page.goto('/');
  await expect(page.locator('#importfile')).toBeAttached();
  await page.getByRole('button', { name: 'Open voorbeeld', exact: true }).first().click();
  await expect(page.locator('#EDS > svg')).toBeVisible();
  await page.getByTitle('Pas aan scherm aan', { exact: true }).click();
}

async function transform(drawing: Locator) {
  return drawing.evaluate(element => {
    const matrix = new DOMMatrix(getComputedStyle(element).transform);
    return { x: matrix.e, y: matrix.f, zoom: matrix.a };
  });
}

async function checkMouseControls(page: Page, drawing: Locator, viewport: Locator) {
  const bounds = (await viewport.boundingBox())!;
  const x = bounds.x + bounds.width * 0.45;
  const y = bounds.y + bounds.height * 0.45;
  const before = await transform(drawing);
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + 60, y + 40, { steps: 8 });
  await page.mouse.up();
  await expect.poll(async () => (await transform(drawing)).x).toBeCloseTo(before.x + 60, 0);
  await expect.poll(async () => (await transform(drawing)).y).toBeCloseTo(before.y + 40, 0);
  await page.mouse.wheel(0, -100);
  await expect.poll(async () => (await transform(drawing)).zoom).toBeGreaterThan(before.zoom);
}

test('mouse drag and wheel zoom work in normal and fullscreen views', async ({ page }) => {
  await openExample(page);
  await checkMouseControls(page, page.locator('#EDS'), page.locator('.simple-svg-container'));
  await page.getByTitle('Volledig scherm', { exact: true }).click();
  await checkMouseControls(page, page.locator('#EDS-fullscreen'), page.locator('.svg-fullscreen-container'));
  await page.keyboard.press('Escape');
  await expect(page.locator('#EDS-fullscreen')).toHaveCount(0);
});

test('registers WebMCP tools for reading and editing the schema', async ({ page }) => {
  await page.addInitScript(() => {
    const registeredTools = new Map<string, any>();
    (window as any).__webmcpTools = registeredTools;
    Object.defineProperty(document, 'modelContext', {
      configurable: true,
      value: {
        registerTool(tool: any) {
          registeredTools.set(tool.name, tool);
        },
      },
    });
  });
  await openExample(page);

  await expect.poll(() => page.evaluate(() =>
    Array.from((window as any).__webmcpTools.keys()).sort()
  )).toEqual([
    'schema.add_element',
    'schema.delete_element',
    'schema.get',
    'schema.get_element',
    'schema.update_element',
  ]);

  const contact = page.locator('.simple-hierarchy-item').filter({ hasText: 'Contactdoos' }).first();
  const id = Number(await contact.getAttribute('data-id'));
  const result = await page.evaluate(async ({ id }) => {
    const tool = (window as any).__webmcpTools.get('schema.update_element');
    return tool.execute({ id, properties: { adres: 'WebMCP room' } });
  }, { id });
  expect(result.success).toBe(true);
  await expect(page.locator('#EDS')).toContainText('WebMCP room');

  const confirmationError = await page.evaluate(async ({ id }) => {
    const tool = (window as any).__webmcpTools.get('schema.delete_element');
    try {
      await tool.execute({ id, confirm: false });
      return null;
    } catch (error) {
      return (error as Error).message;
    }
  }, { id });
  expect(confirmationError).toContain('confirm=true');
});

test('selection survives property edits, undo/redo, zoom and fullscreen', async ({ page }) => {
  await openExample(page);
  const row = page.locator('.simple-hierarchy-item').filter({ hasText: 'Contactdoos' }).first();
  const id = await row.getAttribute('data-id');
  await row.locator('.simple-item-content').click({ force: true });
  await expect(page.locator(`#EDS [data-diagram-hit-area][data-element-id="${id}"]`))
    .toHaveAttribute('data-selected', '');
  const secondRow = page.locator('.simple-hierarchy-item').filter({ hasText: 'Lichtpunt' }).first();
  const secondId = await secondRow.getAttribute('data-id');
  await secondRow.locator('.simple-item-content').click({ force: true });
  await expect(page.locator(`#EDS [data-diagram-hit-area][data-element-id="${secondId}"]`))
    .toHaveAttribute('data-selected', '');
  await expect(page.locator(`#EDS [data-diagram-hit-area][data-element-id="${id}"]`))
    .not.toHaveAttribute('data-selected', '');
  await row.locator('.simple-item-content').click({ force: true });
  const address = page.locator('.simple-properties-form input[id$="_adres"]');
  const oldAddress = await address.inputValue();
  await address.fill('Regression room');
  await address.press('Tab');
  await expect(page.locator('#EDS')).toContainText('Regression room');
  await page.evaluate(() => {
    (globalThis as any).undostruct.undo();
    (globalThis as any).HLRedrawTree?.();
  });
  await expect(address).toHaveValue(oldAddress);
  await page.evaluate(() => {
    (globalThis as any).undostruct.redo();
    (globalThis as any).HLRedrawTree?.();
  });
  await expect(address).toHaveValue('Regression room');
  await page.getByTitle('Volledig scherm', { exact: true }).click();
  await page.locator('.svg-fullscreen-controls').getByTitle('Pas aan scherm aan', { exact: true }).click();
  const symbol = page.locator(`#EDS-fullscreen [data-element-id="${id}"]`).first();
  await symbol.click({ force: true });
  await expect(page.locator('.simple-properties-form input[id$="_adres"]')).toHaveValue('Regression room');
  await page.keyboard.press('Escape');
  await page.getByTitle('Pas aan scherm aan', { exact: true }).click();
  await page.locator(`#EDS [data-element-id="${id}"]`).first().click({ force: true });
  await expect(address).toHaveValue('Regression room');
});

test('situatieschema owns one panel and removes keyboard handlers when leaving', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await openExample(page);
  for (let visit = 0; visit < 3; visit++) {
    await page.locator('#minitabs a').filter({ hasText: 'Situatieschema' }).click();
    await expect(page.locator('#paper')).toBeVisible();
    await expect(page.locator('#layer-manager')).toHaveCount(1);
    if (visit === 0) {
      await expect(page.locator('#popupOverlay')).toHaveCount(1);
      await page.locator('#popupOverlay').getByRole('button', { name: 'OK', exact: true }).click();
    }
    await expect(page.locator('#popupOverlay')).toHaveCount(0);
    await page.locator('#minitabs a').filter({ hasText: 'Eéndraadschema' }).click();
    await expect(page.locator('#layer-manager')).toHaveCount(0);
    await page.keyboard.press('ArrowRight');
  }
  expect(errors).toEqual([]);
});

test('autosaved edits can be recovered after reload', async ({ page }) => {
  await openExample(page);
  await page.locator('.simple-hierarchy-item').filter({ hasText: 'Contactdoos' }).first()
    .locator('.simple-item-content').click({ force: true });
  const address = page.locator('.simple-properties-form input[id$="_adres"]');
  await address.fill('Recovery room');
  await address.press('Tab');
  await expect(page.locator('#EDS')).toContainText('Recovery room');
  // Wait for the actual autosave, not an arbitrary sleep or a mocked save.
  await expect(page.getByText('Automatisch opgeslagen', { exact: false })).toBeVisible({ timeout: 15000 });
  await page.reload();
  await page.getByRole('button', { name: 'Ja, herstellen', exact: true }).click();
  await expect(page.locator('#EDS')).toContainText('Recovery room');
});
