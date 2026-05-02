const puppeteer = require('puppeteer');
const { spawn } = require('child_process');

async function run() {
  const server = spawn('npm', ['run', 'dev'], { detached: true });
  await new Promise(r => setTimeout(r, 5000));

  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
  const result = await page.evaluate(() => typeof process);
  console.log('TYPEOF PROCESS:', result);
  if (result !== 'undefined') {
      const processKeys = await page.evaluate(() => Object.keys(process));
      console.log('PROCESS KEYS:', processKeys);
  }
  
  await browser.close();
  process.kill(-server.pid);
}
run();
