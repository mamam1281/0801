'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';

/**
 * Placeholder Typing Hook  
 * 성능 최적화된 플레이스홀더 타이핑 효과 공용 훅
 * SOLID SRP: 플레이스홀더 타이핑 효과만 담당
 */

export interface PlaceholderTypingOptions {
  speed?: number; // 타이핑 속도 (ms)
  deleteSpeed?: number; // 삭제 속도 (ms)
  pauseDuration?: number; // 완료 후 일시정지 시간 (ms)
  loop?: boolean; // 반복 여부
  cursor?: boolean; // 커서 표시 여부
  startEmpty?: boolean; // 빈 상태로 시작
}

export const usePlaceholderTyping = (
  placeholders: string[],
  enabled: boolean = true,
  options: PlaceholderTypingOptions = {}
) => {
  const {
    speed = 150,
    deleteSpeed = 100,
    pauseDuration = 2000,
    loop = true,
    cursor = true,
    startEmpty = true
  } = options;

  const [currentText, setCurrentText] = useState(startEmpty ? '' : placeholders[0] || '');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showCursor, setShowCursor] = useState(cursor);

  // 성능 최적화: 메모이제이션된 설정
  const config = useMemo(() => ({
    speed,
    deleteSpeed,
    pauseDuration,
    loop,
    cursor
  }), [speed, deleteSpeed, pauseDuration, loop, cursor]);

  // 메인 타이핑 로직
  useEffect(() => {
    if (!enabled || placeholders.length === 0) {
      setCurrentText('');
      return;
    }

    let timeoutId: NodeJS.Timeout;
    const currentPlaceholder = placeholders[currentIndex];

    const type = () => {
      if (isDeleting) {
        // 삭제 중
        if (currentText.length > 0) {
          setCurrentText(currentText.slice(0, -1));
          timeoutId = setTimeout(type, config.deleteSpeed);
        } else {
          // 삭제 완료, 다음 플레이스홀더로
          setIsDeleting(false);
          setCurrentIndex((prev) => (prev + 1) % placeholders.length);
          timeoutId = setTimeout(type, config.speed);
        }
      } else {
        // 타이핑 중
        if (currentText.length < currentPlaceholder.length) {
          setCurrentText(currentPlaceholder.slice(0, currentText.length + 1));
          timeoutId = setTimeout(type, config.speed);
        } else {
          // 타이핑 완료
          if (config.loop && placeholders.length > 1) {
            // 일시정지 후 삭제 시작
            timeoutId = setTimeout(() => {
              setIsDeleting(true);
              type();
            }, config.pauseDuration);
          }
        }
      }
    };

    timeoutId = setTimeout(type, config.speed);

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [currentText, currentIndex, isDeleting, placeholders, enabled, config]);

  // 커서 깜빡임 효과
  useEffect(() => {
    if (!cursor) return;

    const cursorInterval = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 530);

    return () => clearInterval(cursorInterval);
  }, [cursor]);

  // 리셋 함수
  const reset = useCallback(() => {
    setCurrentText(startEmpty ? '' : placeholders[0] || '');
    setCurrentIndex(0);
    setIsDeleting(false);
    setShowCursor(cursor);
  }, [placeholders, startEmpty, cursor]);

  return {
    placeholder: currentText + (showCursor ? '|' : ''),
    rawPlaceholder: currentText,
    isTyping: enabled && (currentText.length < (placeholders[currentIndex]?.length || 0)),
    isDeleting,
    currentIndex,
    reset
  };
};
