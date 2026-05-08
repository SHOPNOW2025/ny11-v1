import puppeteer from 'puppeteer';
import { exec } from 'child_process';

const server = exec('npx vite preview --port 4003');

setTimeout(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  page.on('requestfailed', request => {
    console.log('FAILED:', request.url(), request.failure().errorText);
  });
  page.on('response', response => {
    if (!response.ok()) {
      console.log('ERR RESPONSE:', response.url(), response.status());
    }
  });
  
  await page.goto('http://localhost:4003');
  await new Promise(r => setTimeout(r, 2000));
  
  await browser.close();
  server.kill();
  process.exit(0);
}, 3000);
