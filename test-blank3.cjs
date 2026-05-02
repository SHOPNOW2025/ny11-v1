const puppeteer = require('puppeteer');
const { spawn } = require('child_process');

async function run() {
  const server = spawn('npm', ['run', 'dev'], { detached: true });
  await new Promise(r => setTimeout(r, 5000)); // wait for server

  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
  
  const content = await page.evaluate(() => document.body.innerHTML);
  console.log('BODY CONTENT:', content);
  
  await browser.close();
  process.kill(-server.pid);
}
run();
