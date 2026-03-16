"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import Image from "next/image";

interface ImageDissolveProps {
  src: string;
  alt: string;
  className?: string;
  dissolveHeight?: number; // How much of the bottom dissolves (0-100)
  dissolveIntensity?: number; // How intense the displacement is (0-1)
  blurAmount?: number; // Blur intensity at the edge
  stretchFactor?: number; // How much to stretch the bottom edge
  colorBleed?: boolean; // Whether to sample and bleed colors
  scrollMultiplier?: number; // Scroll-based animation intensity
  variant?: "warm" | "cool" | "earth" | "moody" | "neutral";
  children?: React.ReactNode;
  objectPosition?: string;
}

// Simplex noise implementation for organic displacement
class SimplexNoise {
  private p: number[];
  private perm: number[];
  private grad3: number[][];

  constructor(seed = Math.random()) {
    this.p = [];
    this.perm = [];
    this.grad3 = [
      [1, 1, 0], [-1, 1, 0], [1, -1, 0], [-1, -1, 0],
      [1, 0, 1], [-1, 0, 1], [1, 0, -1], [-1, 0, -1],
      [0, 1, 1], [0, -1, 1], [0, 1, -1], [0, -1, -1]
    ];

    for (let i = 0; i < 256; i++) {
      this.p[i] = Math.floor(seed * 256);
      seed = (seed * 16807) % 2147483647;
    }

    for (let i = 0; i < 512; i++) {
      this.perm[i] = this.p[i & 255];
    }
  }

  private dot(g: number[], x: number, y: number): number {
    return g[0] * x + g[1] * y;
  }

  noise2D(xin: number, yin: number): number {
    const F2 = 0.5 * (Math.sqrt(3) - 1);
    const G2 = (3 - Math.sqrt(3)) / 6;

    let n0 = 0, n1 = 0, n2 = 0;
    const s = (xin + yin) * F2;
    const i = Math.floor(xin + s);
    const j = Math.floor(yin + s);
    const t = (i + j) * G2;
    const X0 = i - t;
    const Y0 = j - t;
    const x0 = xin - X0;
    const y0 = yin - Y0;

    let i1: number, j1: number;
    if (x0 > y0) { i1 = 1; j1 = 0; }
    else { i1 = 0; j1 = 1; }

    const x1 = x0 - i1 + G2;
    const y1 = y0 - j1 + G2;
    const x2 = x0 - 1 + 2 * G2;
    const y2 = y0 - 1 + 2 * G2;

    const ii = i & 255;
    const jj = j & 255;
    const gi0 = this.perm[ii + this.perm[jj]] % 12;
    const gi1 = this.perm[ii + i1 + this.perm[jj + j1]] % 12;
    const gi2 = this.perm[ii + 1 + this.perm[jj + 1]] % 12;

    let t0 = 0.5 - x0 * x0 - y0 * y0;
    if (t0 >= 0) {
      t0 *= t0;
      n0 = t0 * t0 * this.dot(this.grad3[gi0], x0, y0);
    }

    let t1 = 0.5 - x1 * x1 - y1 * y1;
    if (t1 >= 0) {
      t1 *= t1;
      n1 = t1 * t1 * this.dot(this.grad3[gi1], x1, y1);
    }

    let t2 = 0.5 - x2 * x2 - y2 * y2;
    if (t2 >= 0) {
      t2 *= t2;
      n2 = t2 * t2 * this.dot(this.grad3[gi2], x2, y2);
    }

    return 70 * (n0 + n1 + n2);
  }
}

export function ImageDissolve({
  src,
  alt,
  className = "",
  dissolveHeight = 45,
  dissolveIntensity = 0.8,
  blurAmount = 40,
  stretchFactor = 1.5,
  colorBleed = true,
  scrollMultiplier = 0.15,
  variant = "neutral",
  children,
}: ImageDissolveProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const animationRef = useRef<number>(0);
  const noiseRef = useRef<SimplexNoise>(new SimplexNoise());
  const [isLoaded, setIsLoaded] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [sampledColors, setSampledColors] = useState<string[]>([]);

  // Get variant-specific tint
  const getVariantTint = useCallback(() => {
    switch (variant) {
      case "warm":
        return { r: 255, g: 240, b: 220, a: 0.15 };
      case "cool":
        return { r: 220, g: 235, b: 255, a: 0.15 };
      case "earth":
        return { r: 230, g: 245, b: 220, a: 0.12 };
      case "moody":
        return { r: 200, g: 210, b: 230, a: 0.2 };
      default:
        return { r: 245, g: 245, b: 245, a: 0.1 };
    }
  }, [variant]);

  // Sample colors from the bottom edge of the image
  const sampleEdgeColors = useCallback((img: HTMLImageElement, canvas: HTMLCanvasElement) => {
    const tempCanvas = document.createElement("canvas");
    const tempCtx = tempCanvas.getContext("2d");
    if (!tempCtx) return [];

    const sampleWidth = 10;
    const sampleHeight = 50;
    tempCanvas.width = img.naturalWidth;
    tempCanvas.height = img.naturalHeight;
    tempCtx.drawImage(img, 0, 0);

    const colors: string[] = [];
    const numSamples = 12;
    const bottomY = img.naturalHeight - sampleHeight;

    for (let i = 0; i < numSamples; i++) {
      const x = Math.floor((i / numSamples) * img.naturalWidth);
      const imageData = tempCtx.getImageData(x, bottomY, sampleWidth, sampleHeight);
      
      let rSum = 0, gSum = 0, bSum = 0;
      const pixels = imageData.data.length / 4;
      
      for (let j = 0; j < pixels; j++) {
        rSum += imageData.data[j * 4];
        gSum += imageData.data[j * 4 + 1];
        bSum += imageData.data[j * 4 + 2];
      }
      
      const r = Math.round(rSum / pixels);
      const g = Math.round(gSum / pixels);
      const b = Math.round(bSum / pixels);
      
      colors.push(`rgb(${r}, ${g}, ${b})`);
    }

    return colors;
  }, []);

  // Scroll-based animation
  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const elementCenter = rect.top + rect.height / 2;
      const distanceFromCenter = elementCenter - windowHeight / 2;
      const normalizedDistance = distanceFromCenter / windowHeight;
      
      // Create smooth scroll progress (0 = element at center, 1 = far from center)
      const progress = Math.min(1, Math.max(0, 0.5 + normalizedDistance * scrollMultiplier));
      setScrollProgress(progress);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    
    return () => window.removeEventListener("scroll", handleScroll);
  }, [scrollMultiplier]);

  // Draw the dissolved image effect
  const drawDissolve = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img || !isLoaded) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { width, height } = canvas;
    const noise = noiseRef.current;
    const time = performance.now() * 0.0003;
    const tint = getVariantTint();

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw base image
    ctx.drawImage(img, 0, 0, width, height);

    // Get image data for manipulation
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    // Calculate dissolve region
    const dissolveStart = height * (1 - dissolveHeight / 100);
    const dissolveEnd = height;
    const dissolveRange = dissolveEnd - dissolveStart;

    // Process pixels in dissolve region
    for (let y = Math.floor(dissolveStart); y < height; y++) {
      const progress = (y - dissolveStart) / dissolveRange;
      const easeProgress = progress * progress * (3 - 2 * progress); // Smooth step

      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        
        // Noise-based displacement
        const noiseVal = noise.noise2D(x * 0.01 + time, y * 0.01 + time);
        const displacement = noiseVal * dissolveIntensity * easeProgress * 60;
        
        // Vertical stretch effect
        const stretchY = Math.floor(y - displacement * stretchFactor);
        const sourceY = Math.max(0, Math.min(height - 1, stretchY));
        const sourceIdx = (sourceY * width + x) * 4;

        // Get source pixel with displacement
        let r = data[sourceIdx];
        let g = data[sourceIdx + 1];
        let b = data[sourceIdx + 2];
        let a = data[sourceIdx + 3];

        // Apply progressive alpha fade with noise variation
        const alphaProgress = easeProgress + noiseVal * 0.2;
        const alphaFade = Math.max(0, 1 - alphaProgress * 1.3);
        a = Math.floor(a * alphaFade);

        // Color bleeding - blend with sampled edge colors
        if (colorBleed && sampledColors.length > 0 && progress > 0.3) {
          const colorIdx = Math.floor((x / width) * sampledColors.length);
          const colorMatch = sampledColors[colorIdx]?.match(/\d+/g);
          if (colorMatch) {
            const [sr, sg, sb] = colorMatch.map(Number);
            const blendFactor = (progress - 0.3) * 1.5;
            r = Math.round(r * (1 - blendFactor) + sr * blendFactor);
            g = Math.round(g * (1 - blendFactor) + sg * blendFactor);
            b = Math.round(b * (1 - blendFactor) + sb * blendFactor);
          }
        }

        // Apply variant tint
        r = Math.round(r * (1 - tint.a) + tint.r * tint.a);
        g = Math.round(g * (1 - tint.a) + tint.g * tint.a);
        b = Math.round(b * (1 - tint.a) + tint.b * tint.a);

        // Write back
        data[idx] = r;
        data[idx + 1] = g;
        data[idx + 2] = b;
        data[idx + 3] = a;
      }
    }

    ctx.putImageData(imageData, 0, 0);

    // Apply blur to bottom edge using gradient mask technique
    const blurGradient = ctx.createLinearGradient(0, dissolveStart, 0, height);
    blurGradient.addColorStop(0, "rgba(0,0,0,0)");
    blurGradient.addColorStop(0.4, "rgba(0,0,0,0.3)");
    blurGradient.addColorStop(1, "rgba(0,0,0,0.9)");

    // Create soft particle/noise overlay for organic dissolve
    ctx.save();
    ctx.globalCompositeOperation = "destination-out";
    
    for (let i = 0; i < 200; i++) {
      const px = Math.random() * width;
      const py = dissolveStart + Math.random() * dissolveRange;
      const pProgress = (py - dissolveStart) / dissolveRange;
      const noiseOffset = noise.noise2D(px * 0.02 + time * 2, py * 0.02) * 0.5 + 0.5;
      const particleAlpha = pProgress * noiseOffset * 0.15;
      const particleSize = 2 + Math.random() * 6 + pProgress * 8;
      
      ctx.beginPath();
      ctx.arc(px, py, particleSize, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0,0,0,${particleAlpha})`;
      ctx.fill();
    }
    
    ctx.restore();

    // Request next frame for continuous animation
    animationRef.current = requestAnimationFrame(drawDissolve);
  }, [isLoaded, dissolveHeight, dissolveIntensity, stretchFactor, colorBleed, sampledColors, getVariantTint]);

  // Handle image load
  const handleImageLoad = useCallback(() => {
    const img = imageRef.current;
    const canvas = canvasRef.current;
    if (!img || !canvas) return;

    // Set canvas dimensions to match image
    const container = containerRef.current;
    if (container) {
      canvas.width = container.offsetWidth;
      canvas.height = container.offsetHeight;
    }

    // Sample colors from image edge
    if (colorBleed) {
      const colors = sampleEdgeColors(img, canvas);
      setSampledColors(colors);
    }

    setIsLoaded(true);
  }, [colorBleed, sampleEdgeColors]);

  // Resize handler
  useEffect(() => {
    const handleResize = () => {
      const container = containerRef.current;
      const canvas = canvasRef.current;
      if (!container || !canvas) return;

      canvas.width = container.offsetWidth;
      canvas.height = container.offsetHeight;
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Start/stop animation
  useEffect(() => {
    if (isLoaded) {
      animationRef.current = requestAnimationFrame(drawDissolve);
    }
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isLoaded, drawDissolve]);

  // Generate dynamic gradient overlay based on sampled colors
  const gradientOverlay = sampledColors.length > 0
    ? `linear-gradient(to bottom, transparent 50%, ${sampledColors[Math.floor(sampledColors.length / 2)]}80 85%, ${sampledColors[Math.floor(sampledColors.length / 2)]} 100%)`
    : undefined;

  return (
    <div 
      ref={containerRef} 
      className={`relative overflow-hidden ${className}`}
      style={{ transform: `translateY(${scrollProgress * 15}px)` }}
    >
      {/* Hidden image for loading */}
      <img
        ref={imageRef}
        src={src}
        alt={alt}
        onLoad={handleImageLoad}
        className="absolute inset-0 w-full h-full object-cover opacity-0 pointer-events-none"
        crossOrigin="anonymous"
      />
      
      {/* Canvas for dissolve effect */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ 
          filter: `blur(${scrollProgress * 2}px)`,
          opacity: isLoaded ? 1 : 0,
          transition: "opacity 0.5s ease-out",
        }}
      />
      
      {/* Fallback/loading state with Next Image */}
      {!isLoaded && (
        <Image
          src={src}
          alt={alt}
          fill
          className="object-cover object-center"
          priority
          quality={90}
        />
      )}

      {/* Dynamic color bleed gradient overlay */}
      {colorBleed && sampledColors.length > 0 && (
        <div 
          className="absolute bottom-0 left-0 right-0 pointer-events-none"
          style={{
            height: `${dissolveHeight + 15}%`,
            background: gradientOverlay,
            mixBlendMode: "normal",
            opacity: 0.85,
          }}
        />
      )}

      {/* Organic blur overlay at bottom */}
      <div 
        className="absolute bottom-0 left-0 right-0 pointer-events-none"
        style={{
          height: `${dissolveHeight}%`,
          backdropFilter: `blur(${blurAmount}px)`,
          WebkitBackdropFilter: `blur(${blurAmount}px)`,
          maskImage: "linear-gradient(to bottom, transparent 0%, black 60%, black 100%)",
          WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 60%, black 100%)",
        }}
      />

      {/* Children (content overlay) */}
      {children && (
        <div className="relative z-10">
          {children}
        </div>
      )}
    </div>
  );
}

// Simpler CSS-only version for performance-sensitive contexts
export function ImageDissolveLite({
  src,
  alt,
  className = "",
  dissolveHeight = 45,
  variant = "neutral",
  children,
  objectPosition,
}: Omit<ImageDissolveProps, "dissolveIntensity" | "blurAmount" | "stretchFactor" | "colorBleed" | "scrollMultiplier">) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Get variant class
  const getVariantClass = () => {
    switch (variant) {
      case "warm": return "dissolve-warm";
      case "cool": return "dissolve-cool";
      case "earth": return "dissolve-earth";
      case "moody": return "dissolve-moody";
      default: return "dissolve-neutral";
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const progress = Math.max(0, Math.min(1, 1 - (rect.bottom / (windowHeight + rect.height))));
      setScrollProgress(progress);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Check if className contains absolute positioning
  const isAbsolute = className.includes('absolute');
  
  return (
    <div 
      ref={containerRef}
      className={`${isAbsolute ? '' : 'relative'} overflow-hidden ${getVariantClass()} ${className}`}
    >
      <Image
        src={src}
        alt={alt}
        fill
        className={`object-cover image-dissolve-base ${!objectPosition ? "object-center" : ""}`}
        style={objectPosition ? { objectPosition } : undefined}
        priority
        quality={90}
      />

      {/* Dissolve overlays - only at bottom edge */}
      <div className="image-dissolve-layer-1" style={{ height: `${Math.min(dissolveHeight, 35)}%` }} />
      <div className="image-dissolve-layer-2" style={{ height: `${Math.min(dissolveHeight - 10, 25)}%` }} />
      <div className="image-dissolve-layer-3" style={{ height: `${Math.min(dissolveHeight - 15, 20)}%` }} />
      
      {/* Noise texture overlay */}
      <div className="image-dissolve-noise" style={{ height: `${Math.min(dissolveHeight - 5, 30)}%` }} />

      {children && (
        <div className="relative z-10">
          {children}
        </div>
      )}
    </div>
  );
}

