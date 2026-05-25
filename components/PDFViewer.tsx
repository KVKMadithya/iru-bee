"use client";

import React, { useEffect, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";

// Initialize worker from CDN
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

interface PDFViewerProps {
  url: string;
  currentPage: number;
  onTotalPages: (total: number) => void;
}

export default function PDFViewer({ url, currentPage, onTotalPages }: PDFViewerProps) {
  const [pageImage, setPageImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const renderPage = async () => {
      setLoading(true);
      try {
        const pdf = await pdfjsLib.getDocument(url).promise;
        if (currentPage === 0) onTotalPages(pdf.numPages);
        
        const page = await pdf.getPage(currentPage + 1);
        const viewport = page.getViewport({ scale: 1.5 });
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        if (context) {
          await page.render({ canvasContext: context, viewport, canvas }).promise;
          setPageImage(canvas.toDataURL("image/jpeg", 0.85));
        }
      } catch (err) {
        console.error("PDF Render Error:", err);
      } finally {
        setLoading(false);
      }
    };
    renderPage();
  }, [url, currentPage]);

  if (loading) return <div className="text-amber-400 font-serif text-xs p-10">Loading page...</div>;
  return pageImage ? <img src={pageImage} alt="Page" className="w-full h-full object-contain" /> : null;
}