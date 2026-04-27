const { chromium } = require('playwright');
const { exec } = require('child_process');

(async () => {
  const server = exec('npm run dev');
  await new Promise(r => setTimeout(r, 2000));

  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

  await page.goto('http://localhost:5173');
  await new Promise(r => setTimeout(r, 2000));
  
  await browser.close();
  server.kill();
  process.exit(0);
})();
