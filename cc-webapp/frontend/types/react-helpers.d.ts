// Helpers to simplify typing for forwardRef and common DOM ComponentProps in React 19
import type { ComponentPropsWithoutRef, ElementRef, ForwardRefExoticComponent, RefAttributes } from 'react';

declare global {
  type PropsOf<T extends keyof JSX.IntrinsicElements> = ComponentPropsWithoutRef<T>;
  type RefOf<T extends React.ElementType> = ElementRef<T>;
  type WithRef<P, R> = ForwardRefExoticComponent<P & RefAttributes<R>>;
}

export {};
