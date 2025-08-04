import React from "react";
import { Bot } from "lucide-react";

interface CJAIChatBubbleProps {
  nickname?: string;
  message: string;
  className?: string;
}

// AI 채팅 말풍선, 아이콘/닉네임/메시지, glassmorphism, 애니메이션
export const CJAIChatBubble: React.FC<CJAIChatBubbleProps> = ({ nickname = "CJ AI", message, className }) => {
  return (
    <div className={`flex items-end gap-2 w-full max-w-[90%] self-start ${className || ""}`.trim()}>
      <div className="w-8 h-8 flex items-center justify-center rounded-full bg-gradient-neon shadow">
        <Bot className="w-5 h-5 text-white drop-shadow" />
      </div>
      <div
        className="relative px-4 py-2 rounded-2xl bg-[var(--color-glass-ice)] text-[var(--color-text-primary)] shadow-glass glassmorphism animate-fadeIn"
        style={{
          backdropFilter: "blur(12px)",
          boxShadow: "0 2px 12px 0 var(--color-shadow-glass)",
        }}
      >
        <span className="block text-xs font-bold text-[var(--color-primary-purple)] mb-1">{nickname}</span>
        <span className="block text-sm leading-snug break-words">{message}</span>
      </div>
    </div>
  );
};

export default CJAIChatBubble;
