import * as pdfjsLib from "pdfjs-dist";

// Ensure the worker is configured (same as before)
if (typeof window !== "undefined") {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
}

export const convertPdfToImages = async (url: string): Promise<string[]> => {
  const pdf = await pdfjsLib.getDocument(url).promise;
  const imageUrls: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 1.5 });
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    if (context) {
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      await page.render({ canvasContext: context, viewport, canvas }).promise;
      imageUrls.push(canvas.toDataURL("image/jpeg", 0.8));
    }
  }
  return imageUrls;
};