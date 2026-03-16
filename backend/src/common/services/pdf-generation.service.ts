import puppeteer, { PDFOptions } from 'puppeteer';
import { injectable } from 'tsyringe';

@injectable()
export class PdfGenerationService {
  constructor() {}

  /**
   * Generates a PDF from HTML content using Puppeteer.
   * @param htmlContent The HTML string to convert to PDF.
   * @param options Optional Puppeteer PDF options.
   * @returns A Promise that resolves with the PDF buffer.
   */
  public async generatePdfFromHtml(
    htmlContent: string,
    options?: PDFOptions,
  ): Promise<Buffer> {
    let browser;
    try {
      // Launch Puppeteer. Consider launch options for production environments.
      // e.g., { args: ['--no-sandbox', '--disable-setuid-sandbox'] } for Linux
      browser = await puppeteer.launch();
      const page = await browser.newPage();

      // Set content to the page
      await page.setContent(htmlContent, {
        waitUntil: 'networkidle0', // Wait for all network connections to be idle
      });

      // Default PDF options (can be overridden by the options parameter)
      const pdfOptions: PDFOptions = {
        format: 'A4', // Default to A4, can be overridden
        printBackground: true, // Ensure backgrounds are printed
        ...options, // Merge with any provided options
      };

      const pdfBuffer = await page.pdf(pdfOptions);
      return Buffer.from(pdfBuffer) as Buffer;
    } catch (error) {
      console.error('Error generating PDF:', error);
      // Consider more specific error handling or re-throwing a custom error
      throw new Error('Failed to generate PDF');
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }
}
