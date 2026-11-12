"use client";

import React, { useState, useEffect } from "react";
import Image, { ImageProps } from "next/image";

interface ProductImageProps extends Omit<ImageProps, "src" | "onError"> {
  src?: string | null;
  fallbackSrc?: string;
}

export function ProductImage({
  src,
  fallbackSrc = "/logo.jpg",
  alt,
  className = "",
  ...rest
}: ProductImageProps) {
  const resolvedSrc = src && src.trim() !== "" ? src : fallbackSrc;
  const [imgSrc, setImgSrc] = useState<string>(resolvedSrc);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const nextSrc = src && src.trim() !== "" ? src : fallbackSrc;
    setImgSrc(nextSrc);
    setIsLoading(true);
  }, [src, fallbackSrc]);

  return (
    <>
      {isLoading && (
        <div
          aria-hidden="true"
          className="absolute inset-0 shimmer-gold z-10 pointer-events-none"
        />
      )}
      <Image
        {...rest}
        src={imgSrc}
        alt={alt}
        className={`${className} ${isLoading ? "opacity-0" : "opacity-100"} transition-opacity duration-300`}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          if (imgSrc !== fallbackSrc) {
            setImgSrc(fallbackSrc);
          }
          setIsLoading(false);
        }}
      />
    </>
  );
}
