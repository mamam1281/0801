'use client';
import React, { createContext, useCallback, useMemo, useRef, useState } from 'react';
import styles from '../components/feedback/FeedbackToast.module.css';

interface EnqueueInput {
  code: string;
  severity?: 'info' | 'success' | 'warn' | 'error';
  message?: string;
  animation?: string | null;
  meta?: Record<string, any>;
  streak?: number | null;
}

export interface InternalToast extends EnqueueInput {
  id: string;
  createdAt: number;
}
interface FeedbackContextShape {
  enqueue: (f: EnqueueInput) => void;
}
// 타입 빌드 환경(레거시 설정) 제네릭 제한 회피: any 캐스팅 후 훅 내부에서 좁혀 사용
export const FeedbackContext = createContext(null as any as FeedbackContextShape | null);

interface ProviderProps {
  children?: React.ReactNode;
  max?: number;
  ttlMs?: number;
}

export function FeedbackProvider({ children, max = 4, ttlMs = 4000 }: ProviderProps) {
  const [items, setItems] = useState([] as InternalToast[]);
  const timersRef = useRef({} as Record<string, any>);

  const remove = useCallback((id: string) => {
    setItems((prev: InternalToast[]) => prev.filter((i: InternalToast) => i.id !== id));
    if (timersRef.current[id]) {
      clearTimeout(timersRef.current[id]);
      delete timersRef.current[id];
    }
  }, []);

  const enqueue = useCallback(
    (f: EnqueueInput) => {
      if (typeof window === 'undefined') return; // SSR 안전
      setItems((prev: InternalToast[]) =>
        [
          ...prev,
          {
            id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
            createdAt: Date.now(),
            ...f,
          },
        ].slice(-max)
      );
    },
    [max]
  );

  React.useEffect(() => {
    if (items.length === 0) return;
    items.forEach((item: InternalToast) => {
      if (!timersRef.current[item.id])
        timersRef.current[item.id] = setTimeout(() => remove(item.id), ttlMs);
    });
  }, [items, ttlMs, remove]);

  React.useEffect(() => {
    if (items.length === 0 || typeof window === 'undefined') return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setItems([]);
        Object.values(timersRef.current).forEach((t: any) => clearTimeout(t));
        timersRef.current = {};
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [items]);

  const value = useMemo(() => ({ enqueue }), [enqueue]);

  return (
    <FeedbackContext.Provider value={value}>
      {children}
      <div aria-live="polite" className="sr-only" data-feedback-live-region />
      {items.length > 0 && (
        <div className={styles.container} role="status" aria-label="게임 피드백 알림 영역">
          {items.map((i: InternalToast) => (
            <div
              key={i.id}
              className={styles.toast + ' ' + (styles[i.severity || 'info'] || '')}
              onClick={() => remove(i.id)}
              role="alert"
            >
              <div className={styles.code}>{i.code}</div>
              {i.message && <div className={styles.msg}>{i.message}</div>}
            </div>
          ))}
        </div>
      )}
    </FeedbackContext.Provider>
  );
}

export default FeedbackProvider;
