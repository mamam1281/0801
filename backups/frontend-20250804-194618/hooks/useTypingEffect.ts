'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';

export interface TypingEffectOptions {
  text: string | string[];
  speed?: number;
  deleteSpeed?: number;
  delayBetweenTexts?: number;
  loop?: boolean;
  startDelay?: number;
  cursor?: boolean;
  cursorChar?: string;
}

export interface TypingEffectReturn {
  displayText: string;
  isTyping: boolean;
  isDeleting: boolean;
  currentIndex: number;
  restart: () => void;
  pause: () => void;
  resume: () => void;
}

/**
 * 성능 최적화된 공용 타이핑 효과 훅
 * Digital Motion Typing & Placeholder Typing 지원
 */
export const useTypingEffect = ({
  text,
  speed = 100,
  deleteSpeed = 50,
  delayBetweenTexts = 1000,
  loop = true,
  startDelay = 0,
  cursor = true,
  cursorChar = '|'
}: TypingEffectOptions): TypingEffectReturn => {
  const [displayText, setDisplayText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showCursor, setShowCursor] = useState(true);

  // 텍스트 배열로 정규화 (성능 최적화를 위해 useMemo 사용)
  const textArray = useMemo(() => 
    Array.isArray(text) ? text : [text], 
    [text]
  );

  const currentText = useMemo(() => 
    textArray[currentIndex] || '', 
    [textArray, currentIndex]
  );

  // 커서 깜빡임 효과 (독립적인 타이머)
  useEffect(() => {
    if (!cursor) return;

    const cursorInterval = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 530); // 530ms 주기로 깜빡임

    return () => clearInterval(cursorInterval);
  }, [cursor]);

  // 메인 타이핑 로직
  useEffect(() => {
    if (isPaused || textArray.length === 0) return;

    const timeout = setTimeout(() => {
      if (!isDeleting && displayText.length < currentText.length) {
        // 타이핑 중
        setDisplayText(currentText.slice(0, displayText.length + 1));
        setIsTyping(true);
      } else if (!isDeleting && displayText.length === currentText.length) {
        // 타이핑 완료, 잠시 대기 후 삭제 시작
        if (loop && textArray.length > 1) {
          setTimeout(() => setIsDeleting(true), delayBetweenTexts);
        } else {
          setIsTyping(false);
        }
      } else if (isDeleting && displayText.length > 0) {
        // 삭제 중
        setDisplayText(currentText.slice(0, displayText.length - 1));
      } else if (isDeleting && displayText.length === 0) {
        // 삭제 완료, 다음 텍스트로
        setIsDeleting(false);
        setCurrentIndex((prev) => (prev + 1) % textArray.length);
      }
    }, startDelay || (isDeleting ? deleteSpeed : speed));

    return () => clearTimeout(timeout);
  }, [
    displayText, 
    currentText, 
    isDeleting, 
    isPaused, 
    textArray.length, 
    loop, 
    speed, 
    deleteSpeed, 
    delayBetweenTexts, 
    startDelay, 
    currentIndex
  ]);

  // 제어 함수들
  const restart = useCallback(() => {
    setDisplayText('');
    setCurrentIndex(0);
    setIsDeleting(false);
    setIsTyping(false);
    setIsPaused(false);
  }, []);

  const pause = useCallback(() => {
    setIsPaused(true);
    setIsTyping(false);
  }, []);

  const resume = useCallback(() => {
    setIsPaused(false);
  }, []);

  // 최종 디스플레이 텍스트 (커서 포함)
  const finalDisplayText = cursor 
    ? `${displayText}${showCursor ? cursorChar : ' '}` 
    : displayText;

  return {
    displayText: finalDisplayText,
    isTyping,
    isDeleting,
    currentIndex,
    restart,
    pause,
    resume
  };
};

/**
 * 단순한 플레이스홀더 타이핑 효과 (최적화된 버전)
 */
export const usePlaceholderTyping = (
  placeholders: string[], 
  options?: Partial<TypingEffectOptions>
) => {
  return useTypingEffect({
    text: placeholders,
    speed: 120,
    deleteSpeed: 80,
    delayBetweenTexts: 2000,
    loop: true,
    cursor: true,
    cursorChar: '_',
    ...options
  });
};

/**
 * 디지털 모션 타이핑 효과 (최적화된 버전)
 */
export const useDigitalMotionTyping = (
  text: string,
  options?: Partial<TypingEffectOptions>
) => {
  return useTypingEffect({
    text,
    speed: 80,
    deleteSpeed: 40,
    loop: false,
    cursor: true,
    cursorChar: '|',
    startDelay: 200,
    ...options
  });
};
