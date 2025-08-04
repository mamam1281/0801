'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';

/**
 * Digital Motion Typing Hook
 * 성능 최적화된 디지털 타이핑 효과 공용 훅
 * SOLID SRP: 디지털 타이핑 효과만 담당
 */

export interface DigitalTypingOptions {
  speed?: number; // 타이핑 속도 (ms)
  delay?: number; // 시작 지연 시간 (ms)
  loop?: boolean; // 반복 여부
  cursor?: boolean; // 커서 표시 여부
  onComplete?: () => void; // 완료 콜백
}

export const useDigitalTyping = (
  text: string, 
  enabled: boolean = true,
  options: DigitalTypingOptions = {}
) => {
  const {
    speed = 100,
    delay = 0,
    loop = false,
    cursor = true,
    onComplete
  } = options;

  const [displayText, setDisplayText] = useState('');
  const [showCursor, setShowCursor] = useState(cursor);
  const [isComplete, setIsComplete] = useState(false);

  // 성능 최적화: 메모이제이션된 설정
  const config = useMemo(() => ({
    speed,
    delay,
    loop,
    cursor
  }), [speed, delay, loop, cursor]);

  // 타이핑 리셋 함수
  const resetTyping = useCallback(() => {
    setDisplayText('');
    setIsComplete(false);
    setShowCursor(cursor);
  }, [cursor]);

  // 메인 타이핑 로직
  useEffect(() => {
    if (!enabled || !text) {
      setDisplayText('');
      return;
    }

    let timeoutId: NodeJS.Timeout;
    let currentIndex = 0;

    const typeCharacter = () => {
      if (currentIndex < text.length) {
        setDisplayText(text.slice(0, currentIndex + 1));
        currentIndex++;
        timeoutId = setTimeout(typeCharacter, config.speed);
      } else {
        setIsComplete(true);
        onComplete?.();
        
        if (config.loop) {
          timeoutId = setTimeout(resetTyping, 1000);
        }
      }
    };

    // 시작 지연 후 타이핑 시작
    timeoutId = setTimeout(typeCharacter, config.delay);

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [text, enabled, config, onComplete, resetTyping]);

  // 커서 깜빡임 효과
  useEffect(() => {
    if (!cursor) return;

    const cursorInterval = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 530); // 자연스러운 깜빡임 주기

    return () => clearInterval(cursorInterval);
  }, [cursor]);

  return {
    displayText: displayText + (showCursor ? '|' : ''),
    rawText: displayText,
    isComplete,
    isTyping: enabled && !isComplete,
    reset: resetTyping
  };
};
