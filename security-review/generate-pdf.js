// Generates Pulse360-Security-Review.pdf from report.html using Playwright.
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const reportPath = path.resolve(__dirname, 'report.html');
  const outPath = path.resolve(__dirname, 'Pulse360-Security-Review.pdf');
  const url = 'file:///' + reportPath.replace(/\\/g, '/');

  console.log('Reading:', reportPath);
  console.log('Writing:', outPath);

  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle' });

  await page.pdf({
    path: outPath,
    format: 'A4',
    printBackground: true,
    displayHeaderFooter: true,
    headerTemplate: '<div style="font-size:8px;color:#9ca3af;width:100%;text-align:right;padding-right:16mm;">Pulse 360° — Security Review</div>',
    footerTemplate: '<div style="font-size:8px;color:#9ca3af;width:100%;text-align:center;">Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>',
    margin: { top: '20mm', bottom: '20mm', left: '16mm', right: '16mm' },
  });

  await browser.close();
  const stats = fs.statSync(outPath);
  console.log(`PDF generated: ${(stats.size / 1024).toFixed(1)} KB`);
})();
