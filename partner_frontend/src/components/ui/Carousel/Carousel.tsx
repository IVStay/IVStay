"use client";
import React, { useState } from 'react';
import Image from 'next/image';
import styles from './Carousel.module.css';

interface CarouselProps {
  images: string[];
  alt?: string;
}

export const Carousel: React.FC<CarouselProps> = ({ images, alt = "Property image" }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const goToNext = (e: React.MouseEvent) => {
    e.preventDefault();
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const goToPrev = (e: React.MouseEvent) => {
    e.preventDefault();
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  if (!images || images.length === 0) {
    return <div className={styles.carouselContainer} />;
  }

  return (
    <div className={styles.carouselContainer}>
      {images.map((src, index) => (
        <div
          key={src}
          className={`${styles.imageWrapper} ${index === currentIndex ? styles.active : ''}`}
        >
          <Image
            src={src}
            alt={`${alt} ${index + 1}`}
            fill
            className={styles.image}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            priority={index === 0}
          />
        </div>
      ))}

      {images.length > 1 && (
        <>
          <div className={styles.controls}>
            <button className={styles.navButton} onClick={goToPrev} aria-label="Previous image">
              &lt;
            </button>
            <button className={styles.navButton} onClick={goToNext} aria-label="Next image">
              &gt;
            </button>
          </div>
          
          <div className={styles.indicators}>
            {images.map((_, index) => (
              <div
                key={index}
                className={`${styles.dot} ${index === currentIndex ? styles.active : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  setCurrentIndex(index);
                }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};
