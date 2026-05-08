import puppeteer from 'puppeteer';
import { exec } from 'child_process';

const server = exec('npx vite preview --port 4001');

setTimeout(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  
  await page.goto('http://localhost:4001');
  
  await new Promise(r => setTimeout(r, 2000));
  
  const body = await page.evaluate(() => document.body.innerHTML);
  console.log('BODY:', body);
  
  await browser.close();
  server.kill();
  process.exit(0);
}, 3000);
