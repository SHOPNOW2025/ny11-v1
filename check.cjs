const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));

  await page.goto('http://localhost:4173', { waitUntil: 'domcontentloaded' });
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  const content = await page.content();
  console.log('CONTENT:', content.substring(0, 1000));
  
  const bodyHTML = await page.evaluate(() => document.body.innerHTML);
  console.log('BODY:', bodyHTML);

  await browser.close();
})();
