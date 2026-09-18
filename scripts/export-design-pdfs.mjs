import puppeteer from 'puppeteer';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

async function generatePDF() {
  console.log('--- ARTISMI PDF GENERATOR ---');
  
  // 1. Wait for Next.js server to be ready (assuming 'npm run dev' is running)
  // We use port 3333 to avoid conflicts with other projects like Creative OS.
  const url = 'http://localhost:3333/design-system';
  
  console.log(`Connecting to ${url}...`);
  
  let browser;
  try {
    browser = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security']
    });
    const page = await browser.newPage();
    
    // Set viewport to the requested desktop frame size (1440x900)
    await page.setViewport({ width: 1440, height: 900 });

    // Go to the design system page
    console.log('Navigating...');
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 90000 });

    console.log('Rendering all sections (this may take a moment)...');
    
    // Wait for images to load (optional extra wait if needed)
    await new Promise(r => setTimeout(r, 5000));

    const pdfPath = './design-docs/ARTISMI_FULL_CATALOG_EDITABLE.pdf';
    
    console.log(`Generating PDF: ${pdfPath}`);
    
    await page.pdf({
      path: pdfPath,
      format: 'A4',
      printBackground: true,
      displayHeaderFooter: false,
      margin: { top: '0px', right: '0px', bottom: '0px', left: '0px' },
      preferCSSPageSize: true
    });

    console.log('--- SUCCESS: PDF GENERATED ---');
    console.log(`Location: ${pdfPath}`);

  } catch (error) {
    console.error('--- ERROR GENERATING PDF ---');
    console.error(error);
  } finally {
    if (browser) await browser.close();
  }
}

generatePDF();
