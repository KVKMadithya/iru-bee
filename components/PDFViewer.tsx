"use client";
import React, { useEffect, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";

// Ensure worker is set in a way that doesn't conflict with SSR
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
}

interface PDFViewerProps {
  url: string;
  currentPage: number;
  onTotalPages: (total: number) => void;
}

export default function PDFViewer({ url, currentPage, onTotalPages }: PDFViewerProps) {
  const [pageImage, setPageImage] = useState<string | null>(null);

  useEffect(() => {
    const renderPage = async () => {
      try {
        const loadingTask = pdfjsLib.getDocument(url);
        const pdf = await loadingTask.promise;
        if (currentPage === 0) onTotalPages(pdf.numPages);
        const page = await pdf.getPage(currentPage + 1);
        const viewport = page.getViewport({ scale: 1.5 });
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        if (context) {
          canvas.height = viewport.height;
          canvas.width = viewport.width;
          await page.render({ canvasContext: context, viewport, canvas }).promise;
          setPageImage(canvas.toDataURL("image/jpeg", 0.85));
        }
      } catch (err) { console.error(err); }
    };
    renderPage();
  }, [url, currentPage, onTotalPages]);

  return pageImage ? <img src={pageImage} alt="Page" className="w-full h-full object-contain" /> : <div className="text-amber-400">Loading...</div>;
}