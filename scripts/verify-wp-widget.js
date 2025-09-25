const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  page.on('pageerror', e => console.log('pageerror:', e.message));
  page.on('console', m => console.log('console:', m.type(), m.text()));

  await page.goto('http://localhost:3006/widget-test-wp/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  const hasContainer = await page.$('.heiwa-react-widget-container');
  const hasButton = await page.$('.heiwa-react-widget-container button');
  const btnText = hasButton ? await hasButton.textContent() : null;

  const info = await page.evaluate(() => ({
    hasReact: typeof window.React,
    hasReactDOM: typeof window.ReactDOM,
    hasWidget: typeof window.HeiwaWidget,
    hasMount: typeof (window.HeiwaWidget && window.HeiwaWidget.mount),
  }));

  console.log('hasContainer:', !!hasContainer);
  console.log('hasButton:', !!hasButton);
  console.log('buttonText:', btnText);
  console.log('globals:', info);

  if (hasButton) {
    await hasButton.click();
    await page.waitForTimeout(800);
    const modalVisible = await page.$('text=Book Your Surf Adventure');
    const stepHeader = await page.$('text=Choose Your Adventure');
    console.log('modalVisible:', !!modalVisible, 'stepHeader:', !!stepHeader);
  } else if (hasContainer) {
    const bbox = await hasContainer.boundingBox();
    console.log('container bbox:', bbox);
  }

  await browser.close();
})().catch(e => { console.error('verify error:', e); process.exit(1); });

