import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";

pdfjsLib.GlobalWorkerOptions.workerSrc = "https://unpkg.com/pdfjs-dist@5.4.296/build/pdf.worker.min.mjs";

/**
 * Extracts a specific rectangular region of a PDF page as a base64 image.
 * This is used to capture questions that are embedded as images rather than text.
 */
export async function extractQuestionImage(file: File, targetQuestionId: string): Promise<string | null> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const numPages = pdf.numPages;

    for (let i = 1; i <= numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const items = textContent.items as any[];
      
      let targetItem = null;
      // Search for the target Question ID in the text items
      for (const item of items) {
        if (item.str.includes(targetQuestionId)) {
          targetItem = item;
          break;
        }
      }

      if (!targetItem) {
        continue; // Not on this page
      }

      // We found the page!
      // In PDF coordinates, Y=0 is the bottom of the page.
      // So text "above" has a LARGER Y coordinate.
      const targetY = targetItem.transform[5];
      
      let upperBoundaryY = Infinity;
      
      // Look for the closest text item ABOVE the target that represents a boundary
      // like the previous question's "Chosen Option : X" or "Status : Answered" 
      // or "Section :" or "Question ID :"
      for (const item of items) {
        const itemY = item.transform[5];
        if (itemY > targetY + 20) { // +20 to avoid matching same line
          if (
            item.str.includes("Question ID :") || 
            item.str.includes("Section :") || 
            item.str.match(/^Chosen Option/) ||
            item.str.match(/^Status\s*:/)
          ) {
            if (itemY < upperBoundaryY) {
              upperBoundaryY = itemY;
            }
          }
        }
      }

      // We define the viewport (scaling up for better image quality)
      const scale = 2.0;
      const viewport = page.getViewport({ scale });
      
      // Convert PDF Y coordinates to Canvas Y coordinates (Y=0 is top)
      const topPdfY = upperBoundaryY === Infinity ? viewport.viewBox[3] : upperBoundaryY;
      
      // We want to crop from the upper boundary down to the target Question ID.
      // Actually, let's include the options which are slightly below the Question ID text sometimes.
      // A safe lower bound is 80 PDF points below the target Question ID text.
      const bottomPdfY = targetY - 80;

      const [, topCanvasY] = viewport.convertToViewportPoint(0, topPdfY);
      const [, bottomCanvasY] = viewport.convertToViewportPoint(0, bottomPdfY);

      // Add a small margin
      const cropTop = Math.max(0, topCanvasY - 20);
      const cropBottom = Math.min(viewport.height, bottomCanvasY);
      const cropHeight = cropBottom - cropTop;

      if (cropHeight <= 0) return null;

      // Render the full page to an offscreen canvas
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;
      
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      
      await page.render({ canvasContext: ctx, viewport } as any).promise;

      // Create a secondary canvas for the cropped region
      const cropCanvas = document.createElement("canvas");
      const cropCtx = cropCanvas.getContext("2d");
      if (!cropCtx) return null;

      cropCanvas.width = canvas.width;
      cropCanvas.height = cropHeight;

      // Draw the cropped region
      cropCtx.drawImage(
        canvas,
        0, cropTop, canvas.width, cropHeight, // source rect
        0, 0, canvas.width, cropHeight // dest rect
      );

      return cropCanvas.toDataURL("image/png");
    }

    return null;
  } catch (err) {
    console.error("Error extracting question image:", err);
    return null;
  }
}
