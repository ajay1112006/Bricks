import html2canvas from "html2canvas";
import jsPDF from "jspdf";

/**
 * Captures an HTML element and triggers a direct PDF download file (.pdf)
 */
export async function downloadElementAsPDF(element: HTMLElement, filename: string) {
  try {
    // High-resolution canvas capture
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
      windowWidth: 1200,
    });

    const imgData = canvas.toDataURL("image/png");

    // Initialize A4 PDF
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pdfWidth = pdf.internal.pageSize.getWidth(); // 210mm
    const pdfHeight = pdf.internal.pageSize.getHeight(); // 297mm

    const margin = 10;
    const printWidth = pdfWidth - margin * 2;
    const printHeight = (canvas.height * printWidth) / canvas.width;

    if (printHeight > pdfHeight - margin * 2) {
      const scaledWidth = ((pdfHeight - margin * 2) * canvas.width) / canvas.height;
      const xOffset = (pdfWidth - scaledWidth) / 2;
      pdf.addImage(imgData, "PNG", xOffset, margin, scaledWidth, pdfHeight - margin * 2);
    } else {
      pdf.addImage(imgData, "PNG", margin, margin, printWidth, printHeight);
    }

    const cleanFilename = filename.toLowerCase().endsWith(".pdf")
      ? filename
      : `${filename}.pdf`;

    pdf.save(cleanFilename);
  } catch (error) {
    console.error("Error generating PDF download:", error);
    alert("Could not generate PDF download. Please try again.");
  }
}
