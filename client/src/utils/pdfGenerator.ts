import { jsPDF } from "jspdf";

interface KidsBookPage {
  pageNumber: number;
  text: string;
  imageUrl?: string;
}

interface KidsBookData {
  title: string;
  author?: string;
  coverImageUrl?: string;
  pages: KidsBookPage[];
}

/**
 * Generate a PDF for a kids book
 */
export async function generateKidsBookPDF(bookData: KidsBookData): Promise<Blob> {
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;

  // Helper to load image as base64
  const loadImageAsBase64 = async (url: string): Promise<string> => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error("Failed to load image:", error);
      return "";
    }
  };

  // Cover Page
  pdf.setFontSize(32);
  pdf.setFont("helvetica", "bold");
  
  // Title
  const titleLines = pdf.splitTextToSize(bookData.title, contentWidth);
  let yPosition = pageHeight / 3;
  titleLines.forEach((line: string) => {
    const textWidth = pdf.getTextWidth(line);
    pdf.text(line, (pageWidth - textWidth) / 2, yPosition);
    yPosition += 12;
  });

  // Author
  if (bookData.author) {
    pdf.setFontSize(16);
    pdf.setFont("helvetica", "normal");
    yPosition += 10;
    const authorText = `by ${bookData.author}`;
    const authorWidth = pdf.getTextWidth(authorText);
    pdf.text(authorText, (pageWidth - authorWidth) / 2, yPosition);
  }

  // Cover Image
  if (bookData.coverImageUrl) {
    try {
      const coverImage = await loadImageAsBase64(bookData.coverImageUrl);
      if (coverImage) {
        const imgWidth = contentWidth * 0.6;
        const imgHeight = imgWidth; // Square aspect ratio
        const imgX = (pageWidth - imgWidth) / 2;
        const imgY = yPosition + 20;
        pdf.addImage(coverImage, "PNG", imgX, imgY, imgWidth, imgHeight);
      }
    } catch (error) {
      console.error("Failed to add cover image:", error);
    }
  }

  // Content Pages
  for (const page of bookData.pages) {
    pdf.addPage();

    // Page Number
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    pdf.text(`Page ${page.pageNumber}`, pageWidth - margin - 15, margin);

    let currentY = margin + 10;

    // Page Image
    if (page.imageUrl) {
      try {
        const pageImage = await loadImageAsBase64(page.imageUrl);
        if (pageImage) {
          const imgWidth = contentWidth;
          const imgHeight = imgWidth * 0.75; // 4:3 aspect ratio
          pdf.addImage(pageImage, "PNG", margin, currentY, imgWidth, imgHeight);
          currentY += imgHeight + 10;
        }
      } catch (error) {
        console.error(`Failed to add image for page ${page.pageNumber}:`, error);
      }
    }

    // Page Text
    pdf.setFontSize(14);
    pdf.setFont("helvetica", "normal");
    const textLines = pdf.splitTextToSize(page.text, contentWidth);
    
    textLines.forEach((line: string) => {
      if (currentY + 7 > pageHeight - margin) {
        pdf.addPage();
        currentY = margin;
      }
      pdf.text(line, margin, currentY);
      currentY += 7;
    });
  }

  // Return as Blob
  return pdf.output("blob");
}

/**
 * Download PDF
 */
export function downloadPDF(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

/**
 * Generate and download kids book PDF
 */
export async function generateAndDownloadKidsBookPDF(
  bookData: KidsBookData,
  filename?: string
) {
  const pdf = await generateKidsBookPDF(bookData);
  const defaultFilename = `${bookData.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.pdf`;
  downloadPDF(pdf, filename || defaultFilename);
}
