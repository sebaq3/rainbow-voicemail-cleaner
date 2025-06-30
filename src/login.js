const puppeteer = require('puppeteer');

async function login() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto('https://web.openrainbow.com/rb/2.149.26/index.html#/login', {
      waitUntil: 'networkidle2'
    });

    await page.type('#username', process.env.RAINBOW_USER);
    await page.type('#password', process.env.RAINBOW_PASS);
    await page.click('button[type="submit"]');

    await page.waitForNavigation({ waitUntil: 'networkidle2' });

    console.log("✅ Login exitoso.");
    return { browser, page };
  } catch (error) {
    console.error("❌ Error en login:", error);
    await browser.close();
    return { browser, page: null };
  }
}

module.exports = login;