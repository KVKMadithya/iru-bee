"use client";

import React, { useEffect, useState, useRef } from "react";
import * as pdfjsLib from "pdfjs-dist";

// 🚀 THE FIX: Use a secure, HTTPS unpkg link to reliably fetch the worker module
if (typeof window !== "undefined") {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
}

interface PDFViewerProps {
  url: string;
  currentPage: number;
  onTotalPages: (total: number) => void;
}

export default function PDFViewer({ url, currentPage, onTotalPages }: PDFViewerProps) {
  const [pageImage, setPageImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const renderPage = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // 1. Fetch the PDF document
        const loadingTask = pdfjsLib.getDocument(url);
        const pdf = await loadingTask.promise;

        if (!isMounted) return;

        // Set total pages only on initial load
        if (currentPage === 0) {
          onTotalPages(pdf.numPages);
        }

        // 2. Fetch the specific page
        const page = await pdf.getPage(currentPage + 1);
        
        // Scale it for better resolution
        const viewport = page.getViewport({ scale: 1.5 });
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");

        if (context) {
          canvas.height = viewport.height;
          canvas.width = viewport.width;

          // 3. Render the page to the canvas
          await page.render({ canvasContext: context, viewport, canvas }).promise;

          if (isMounted) {
            // Convert canvas to image for smooth rendering
            setPageImage(canvas.toDataURL("image/jpeg", 0.85));
          }
        }
      } catch (err: any) {
        console.error("PDF Render Error:", err);
        if (isMounted) {
          setError(err.message || "Failed to load manuscript page.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    if (url) {
      renderPage();
    }

    return () => {
      isMounted = false; // Cleanup to prevent memory leaks
    };
  }, [url, currentPage, onTotalPages]);

  // Loading UI
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-10 space-y-4">
        <div className="h-6 w-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
        <p className="font-serif text-xs text-black/40 italic">Decrypting Page Vectors...</p>
      </div>
    );
  }

  // Error UI
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-10 bg-red-50 text-red-500 text-center">
        <h3 className="font-bold mb-2">PDF Rendering Error</h3>
        <p className="text-xs">{error}</p>
      </div>
    );
  }

  // Success UI
  return pageImage ? (
    <img src={pageImage} alt={`Page ${currentPage + 1}`} className="w-full h-full object-contain" />
  ) : null;
}