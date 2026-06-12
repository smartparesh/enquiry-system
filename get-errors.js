const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('BROWSER ERROR:', msg.text());
    }
  });
  
  page.on('pageerror', err => {
    console.log('PAGE ERROR:', err.toString());
  });

  try {
    // Go to login page first if there's a redirect, or straight to reports
    await page.goto('http://localhost:5173/reports', { waitUntil: 'networkidle2' });
    
    // Wait a little bit for any async React errors
    await new Promise(r => setTimeout(r, 2000));
  } catch (err) {
    console.log('Nav error:', err.message);
  } finally {
    await browser.close();
  }
})();
