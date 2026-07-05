import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowRight, ChevronsRight } from 'lucide-react';
import { cn, formatCurrency } from 'src/lib/utils';
import { useTranslation } from '../../../hooks/useTranslation';

interface CheckoutButtonProps {
  total: number;
  onConfirm: () => boolean;
  disabled: boolean;
}

export const CheckoutButton: React.FC<CheckoutButtonProps> = ({
  total,
  onConfirm,
  disabled,
}) => {
  const { t } = useTranslation();
  const [isSliding, setIsSliding] = useState(false);
  const [slidePosition, setSlidePosition] = useState(0);
  const [isSuccess, setIsSuccess] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);
  const startX = useRef(0);
  const maxSlide = useRef(0);

  useEffect(() => {
    if (containerRef.current && handleRef.current) {
      maxSlide.current = containerRef.current.clientWidth - handleRef.current.clientWidth - 8; // subtract padding
    }
  }, [disabled]);

  const handleStart = (clientX: number) => {
    if (disabled || isSuccess) return;
    setIsSliding(true);
    startX.current = clientX - slidePosition;
  };

  const triggerSuccess = useCallback(() => {
    setIsSliding(false);
    setSlidePosition(maxSlide.current);
    setIsSuccess(true);

    // Play success, confirm order after short delay
    setTimeout(() => {
      const ok = onConfirm();
      if (ok) {
        // Reset after successful place
        setTimeout(() => {
          setIsSuccess(false);
          setSlidePosition(0);
        }, 600);
      } else {
        // Reset if failed
        setIsSuccess(false);
        setSlidePosition(0);
      }
    }, 400);
  }, [onConfirm]);

  const handleMove = useCallback((clientX: number) => {
    if (!isSliding || disabled || isSuccess) return;

    let deltaX = clientX - startX.current;
    if (deltaX < 0) deltaX = 0;
    if (deltaX > maxSlide.current) deltaX = maxSlide.current;

    setSlidePosition(deltaX);

    // If slid to the end, trigger confirmation
    if (deltaX >= maxSlide.current * 0.95) {
      triggerSuccess();
    }
  }, [isSliding, disabled, isSuccess, triggerSuccess]);

  const handleEnd = useCallback(() => {
    if (!isSliding) return;
    setIsSliding(false);

    // If released before 95%, snap back
    if (slidePosition < maxSlide.current * 0.95) {
      setSlidePosition(0);
    }
  }, [isSliding, slidePosition]);

  // Setup event listeners for mouse/touch on document to support drag out of boundaries
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => handleMove(e.clientX);
    const onMouseUp = () => handleEnd();

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        handleMove(e.touches[0].clientX);
      }
    };
    const onTouchEnd = () => handleEnd();

    if (isSliding) {
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
      document.addEventListener('touchmove', onTouchMove);
      document.addEventListener('touchend', onTouchEnd);
    }

    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', onTouchEnd);
    };
  }, [isSliding, slidePosition, handleMove, handleEnd]);

  // Click handler as fallback
  const handleTrackClick = () => {
    if (disabled || isSuccess || isSliding) return;
    // Animate slide automatically on click
    setIsSliding(true);

    let current = 0;
    const interval = setInterval(() => {
      current += maxSlide.current / 10;
      if (current >= maxSlide.current) {
        clearInterval(interval);
        setSlidePosition(maxSlide.current);
        triggerSuccess();
      } else {
        setSlidePosition(current);
      }
    }, 20);
  };

  return (
    <div
      ref={containerRef}
      onClick={handleTrackClick}
      className={cn(
        "relative w-full h-[50px] p-1 rounded-xl flex items-center justify-between select-none cursor-pointer overflow-hidden transition-all duration-300",
        disabled
          ? "bg-gray-100 border border-gray-200 cursor-not-allowed"
          : isSuccess
            ? "bg-emerald-600 border border-transparent shadow-[0_4px_12px_rgba(16,185,129,0.3)]"
            : "bg-[#0A422D] border border-transparent hover:brightness-105 shadow-[0_4px_16px_rgba(10,66,45,0.2)]"
      )}
    >
      {/* Background slide progress color overlay */}
      {!disabled && !isSuccess && (
        <div
          className="absolute left-0 top-0 bottom-0 bg-emerald-800/30 transition-all pointer-events-none rounded-2xl"
          style={{ width: `${slidePosition + 24}px` }}
        />
      )}

      {/* Sliding Handle */}
      <div
        ref={handleRef}
        onMouseDown={(e) => {
          e.stopPropagation();
          handleStart(e.clientX);
        }}
        onTouchStart={(e) => {
          e.stopPropagation();
          if (e.touches.length > 0) {
            handleStart(e.touches[0].clientX);
          }
        }}
        style={{
          transform: `translateX(${slidePosition}px)`,
          transition: isSliding ? 'none' : 'transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
        }}
        className={cn(
          "absolute left-1 z-10 flex items-center justify-center size-[42px] rounded-lg cursor-grab active:cursor-grabbing shadow-md transition-colors",
          disabled
            ? "bg-gray-200 text-gray-400"
            : isSuccess
              ? "bg-white text-emerald-600"
              : "bg-white text-[#0A422D] hover:bg-gray-50"
        )}
      >
        <ArrowRight className={cn("size-5 transition-transform", isSuccess && "scale-110 rotate-360")} />
      </div>

      {/* Center Action Text */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <span
          className={cn(
            "text-sm font-bold tracking-wide transition-opacity",
            disabled ? "text-gray-400" : "text-white"
          )}
          style={{
            opacity: isSuccess ? 1 : maxSlide.current > 0 ? Math.max(0.2, 1 - (slidePosition / maxSlide.current) * 1.5) : 1
          }}
        >
          {isSuccess ? t('pos.successPlacing') : `${t('pos.placeOrderBtn')} ${formatCurrency(total)}`}
        </span>
      </div>

      {/* Right chevron hints */}
      <div
        className={cn(
          "ml-auto mr-4 flex items-center text-white/30 transition-opacity pointer-events-none",
          isSuccess && "opacity-0"
        )}
        style={{
          opacity: disabled ? 0 : maxSlide.current > 0 ? Math.max(0, 1 - (slidePosition / maxSlide.current) * 2) : 1
        }}
      >
        <ChevronsRight className="size-5 animate-pulse" />
      </div>
    </div>
  );
};
