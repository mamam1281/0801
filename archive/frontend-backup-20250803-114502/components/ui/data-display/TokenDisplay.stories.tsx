import React from "react";
import { TokenDisplay } from "./TokenDisplay";
import { Star, Coins, Gem, Zap } from "lucide-react";

export default {
  title: "ui/data-display/TokenDisplay",
  component: TokenDisplay,
  parameters: {
    layout: 'centered',
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'dark', value: '#0a0a0a' },
        { name: 'project', value: 'var(--color-primary-dark-navy)' },
      ],
    },
  },
};

// 기본 스타일
export const Default = () => (
  <TokenDisplay 
    amount={1234567} 
    icon={<Coins className="w-full h-full" />}
  />
);

// 프리미엄 변형 (골드)
export const Premium = () => (
  <TokenDisplay 
    amount={987654} 
    variant="premium"
    unit="GEM"
    icon={<Gem className="w-full h-full" />}
  />
);

// 위험 상태 (빨강)
export const Critical = () => (
  <TokenDisplay 
    amount={50000} 
    variant="critical"
    unit="HP"
    icon={<Zap className="w-full h-full" />}
  />
);

// 사이즈 변형
export const Small = () => (
  <div className="flex gap-4 items-center">
    <TokenDisplay 
      amount={1000} 
      size="sm"
      icon={<Star className="w-full h-full" />}
    />
    <TokenDisplay 
      amount={5000} 
      size="sm"
      variant="premium"
      unit="GEM"
      icon={<Gem className="w-full h-full" />}
    />
  </div>
);

export const Large = () => (
  <TokenDisplay 
    amount={9876543} 
    size="lg"
    variant="premium"
    unit="COINS"
    icon={<Coins className="w-full h-full" />}
  />
);

// 대용량 숫자
export const BigNumbers = () => (
  <div className="flex flex-col gap-4">
    <TokenDisplay amount={1234567890} unit="CC" />
    <TokenDisplay amount={987654321} variant="premium" unit="GEM" />
    <TokenDisplay amount={555444333} variant="critical" unit="XP" />
  </div>
);

// 모든 변형 한번에
export const AllVariants = () => (
  <div className="flex flex-wrap gap-6 items-center">
    <TokenDisplay 
      amount={123456} 
      icon={<Coins className="w-full h-full" />}
    />
    <TokenDisplay 
      amount={789012} 
      variant="premium"
      unit="GEM"
      icon={<Gem className="w-full h-full" />}
    />
    <TokenDisplay 
      amount={345678} 
      variant="critical"
      unit="HP"
      icon={<Zap className="w-full h-full" />}
    />
  </div>
);
