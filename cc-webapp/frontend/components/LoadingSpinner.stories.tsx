import React from "react";
import { LoadingSpinner } from "./LoadingSpinner";

export default {
  title: "Components/LoadingSpinner (New)",
  component: LoadingSpinner,
  parameters: {
    layout: "centered",
    backgrounds: {
      default: "dark",
      values: [
        { name: "dark", value: "#1a1a1a" },
        { name: "light", value: "#ffffff" },
      ],
    },
  },
};

// Ring Spinner (기본)
export const Ring = () => <LoadingSpinner variant="ring" />;
export const RingLarge = () => <LoadingSpinner variant="ring" size="lg" />;
export const RingWithText = () => <LoadingSpinner variant="ring" text="로딩 중..." />;

// Dots Spinner
export const Dots = () => <LoadingSpinner variant="dots" />;
export const DotsLarge = () => <LoadingSpinner variant="dots" size="lg" />;
export const DotsWithText = () => <LoadingSpinner variant="dots" text="처리 중..." />;

// Pulse Spinner
export const Pulse = () => <LoadingSpinner variant="pulse" />;
export const PulseLarge = () => <LoadingSpinner variant="pulse" size="lg" />;
export const PulseWithText = () => <LoadingSpinner variant="pulse" text="대기 중..." />;

// Wave Spinner
export const Wave = () => <LoadingSpinner variant="wave" />;
export const WaveLarge = () => <LoadingSpinner variant="wave" size="lg" />;
export const WaveWithText = () => <LoadingSpinner variant="wave" text="업로드 중..." />;

// All Sizes
export const AllSizes = () => (
  <div className="flex gap-6 items-center">
    <LoadingSpinner variant="ring" size="sm" text="Small" />
    <LoadingSpinner variant="ring" size="md" text="Medium" />
    <LoadingSpinner variant="ring" size="lg" text="Large" />
    <LoadingSpinner variant="ring" size="xl" text="XLarge" />
  </div>
);
