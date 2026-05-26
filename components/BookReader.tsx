"use client";

import React, { useEffect, useState, useRef } from "react";
import HTMLFlipBook from "react-pageflip";
import { convertPdfToImages } from "@/lib/pdfToImages";

interface BookReaderProps {
  url: string;
}

export default function BookReader({ url }: BookReaderProps) {
  const [pages, setPages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const flipBookRef = useRef<any>(null);

  useEffect(() => {
    let isMounted = true;
    
    convertPdfToImages(url)
      .then((imgs) => {
        if (isMounted) {
          setPages(imgs);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("Flipbook rendering error:", err);
        if (isMounted) {
          setError("Failed to process manuscript text vectors into flipping sheets.");
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [url]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-10 space-y-4">
        <div className="h-6 w-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
        <p className="font-serif text-xs text-amber-500/60 italic animate-pulse">Assembling 3D Folio Pages...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-6 text-red-400 font-sans text-xs bg-red-950/20 border border-red-900/30 rounded-xl">
        {error}
      </div>
    );
  }

  return (
    <div className="w-full h-[75vh] md:h-[80vh] flex items-center justify-center relative overflow-hidden px-2 py-4">
      
      {/* Invisible Left Tapping Zone (Previous Page) */}
      <div 
        onClick={() => flipBookRef.current?.pageFlip()?.flipPrev()}
        className="absolute left-0 top-0 bottom-0 w-[30%] z-30 cursor-w-resize touch-none"
        title="Previous Page"
      />
      
      {/* Invisible Right Tapping Zone (Next Page - FIXED ANCHORING) */}
      <div 
        onClick={() => flipBookRef.current?.pageFlip()?.flipNext()}
        className="absolute right-0 top-0 bottom-0 w-[30%] z-30 cursor-e-resize touch-none"
        title="Next Page"
      />

      {/* The Core Interactive 3D Simulation Container */}
      <div className="relative z-20 flex items-center justify-center w-full max-w-2xl h-full overflow-hidden">
        <HTMLFlipBook 
          width={500} 
          height={707} 
          size="stretch"
          minWidth={280}
          maxWidth={550}
          minHeight={396}
          maxHeight={778}
          showCover={true}
          drawShadow={true}
          mobileScrollSupport={true}
          ref={flipBookRef}
          className="shadow-[0_20px_50px_rgba(0,0,0,0.6)] rounded-lg overflow-hidden bg-[#faf8f5]"
          style={{ margin: "0 auto" }}
        >
          {pages.map((img, i) => (
            <div key={`book-page-${i}`} className="relative w-full h-full bg-[#faf8f5] select-none shadow-[inner_0_0_20px_rgba(0,0,0,0.05)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={img} 
                alt={`Manuscript page view ${i + 1}`} 
                className="w-full h-full object-contain pointer-events-none"
              />
            </div>
          ))}
        </HTMLFlipBook>
      </div>
    </div>
  );
}