"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const photos = ["/loginpic.jpg", "/loginpic1.jpg", "/loginpic2.jpg"];

export function AdminAuthPhotoSlideshow() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const interval = window.setInterval(() => {
      setActiveIndex((index) => (index + 1) % photos.length);
    }, 5000);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <div className="absolute inset-0" aria-hidden="true">
      {photos.map((photo, index) => (
        <Image
          key={photo}
          src={photo}
          alt=""
          fill
          priority={index === 0}
          sizes="(min-width: 1280px) 55vw, (min-width: 768px) 50vw, 100vw"
          className={`object-cover object-center transition-opacity duration-1000 motion-reduce:transition-none ${
            activeIndex === index ? "opacity-100" : "opacity-0"
          }`}
        />
      ))}
    </div>
  );
}
