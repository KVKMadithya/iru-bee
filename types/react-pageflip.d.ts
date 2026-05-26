declare module 'react-pageflip' {
  import * as React from 'react';

  interface FlipBookProps {
    width: number;
    height: number;
    size?: 'fixed' | 'stretch';
    minWidth?: number;
    maxWidth?: number;
    minHeight?: number;
    maxHeight?: number;
    drawShadow?: boolean;
    flippingTime?: number;
    useMouseEvents?: boolean;
    startPage?: number;
    showCover?: boolean;
    mobileScrollSupport?: boolean;
    clickEventForward?: boolean;
    usePortrait?: boolean;
    startZIndex?: number;
    maxShadowOpacity?: number;
    showPageCorners?: boolean;
    disableFlipByClick?: boolean;
    className?: string;
    style?: React.CSSProperties;
    children?: React.ReactNode;
    onFlip?: (e: { data: number }) => void;
    onChangeOrientation?: (e: { data: string }) => void;
    onChangeState?: (e: { data: string }) => void;
  }

  // Updated to support forwardRef bindings cleanly
  const HTMLFlipBook: React.ForwardRefExoticComponent<
    FlipBookProps & React.RefAttributes<any>
  >;
  
  export default HTMLFlipBook;
}