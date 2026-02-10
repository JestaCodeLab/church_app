import React, { useState, useMemo } from 'react';
import { X, ChevronLeft, ChevronRight, ExternalLink, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Announcement } from '../../types/announcement';

interface FeatureAnnouncementModalProps {
  announcement: Announcement;
  onDismiss: () => void;
}

const FeatureAnnouncementModal: React.FC<FeatureAnnouncementModalProps> = ({
  announcement,
  onDismiss,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  const sortedSlides = useMemo(
    () => [...announcement.slides].sort((a, b) => a.order - b.order),
    [announcement.slides]
  );

  const currentSlide = sortedSlides[currentIndex];
  const isFirstSlide = currentIndex === 0;
  const isLastSlide = currentIndex === sortedSlides.length - 1;

  const goToSlide = (index: number) => {
    setDirection(index > currentIndex ? 1 : -1);
    setCurrentIndex(index);
  };

  const nextSlide = () => {
    if (!isLastSlide) {
      setDirection(1);
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const prevSlide = () => {
    if (!isFirstSlide) {
      setDirection(-1);
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 200 : -200,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -200 : 200,
      opacity: 0,
    }),
  };

  return (
    <div className="fixed inset-0 z-50">
      {/* Gradient backdrop */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-100/80 via-white/70 to-purple-100/80 dark:from-indigo-950/80 dark:via-gray-900/80 dark:to-purple-950/80 backdrop-blur-[2px]" />

      {/* Centered layout */}
      <div className="relative flex items-center justify-center min-h-screen px-4 py-8">
        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-3xl shadow-2xl shadow-indigo-200/40 dark:shadow-black/40 overflow-hidden"
        >
          {/* Close button */}
          <button
            onClick={onDismiss}
            className="absolute top-4 right-4 z-10 p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Slide content */}
          <div className="relative overflow-hidden">
            <AnimatePresence custom={direction} mode="wait">
              <motion.div
                key={currentIndex}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25, ease: 'easeInOut' }}
              >
                {/* Image */}
                {currentSlide.image ? (
                  <div className="w-full h-48 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30">
                    <img
                      src={currentSlide.image}
                      alt={currentSlide.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-full h-32 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 flex items-center justify-center">
                    <Sparkles className="w-10 h-10 text-indigo-300 dark:text-indigo-500" />
                  </div>
                )}

                {/* Text content */}
                <div className="px-8 pt-6 pb-4">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 mb-3">
                    <Sparkles className="w-3 h-3 mr-1" />
                    New Feature
                  </span>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 leading-snug">
                    {currentSlide.title}
                  </h2>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                    {currentSlide.description}
                  </p>

                  {/* CTA Button */}
                  {currentSlide.ctaButton?.label && currentSlide.ctaButton?.url && (
                    <a
                      href={currentSlide.ctaButton.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      {currentSlide.ctaButton.label}
                      <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
                    </a>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation footer */}
          <div className="flex items-center justify-between px-8 pb-6 pt-2">
            {/* Previous */}
            <button
              onClick={prevSlide}
              disabled={isFirstSlide}
              className="p-2 -ml-2 text-gray-300 hover:text-gray-500 dark:text-gray-600 dark:hover:text-gray-400 disabled:opacity-0 disabled:cursor-default transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {/* Dots */}
            <div className="flex items-center space-x-1.5">
              {sortedSlides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`rounded-full transition-all duration-300 ${
                    index === currentIndex
                      ? 'w-6 h-2 bg-indigo-500'
                      : 'w-2 h-2 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500'
                  }`}
                />
              ))}
            </div>

            {/* Next / Got it */}
            {isLastSlide ? (
              <button
                onClick={onDismiss}
                className="px-5 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
              >
                Got it
              </button>
            ) : (
              <button
                onClick={nextSlide}
                className="px-5 py-2 text-indigo-600 dark:text-indigo-400 text-sm font-semibold hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-colors"
              >
                Next
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default FeatureAnnouncementModal;
