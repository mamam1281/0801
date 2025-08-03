import React from "react";

interface CJChatBubbleProps {
  avatarUrl?: string;
  nickname: string;
  message: string;
  className?: string;
}

// 사용자 채팅 말풍선, 네온/글래스 효과, 아바타/닉네임/메시지
export const CJChatBubble: React.FC<CJChatBubbleProps> = ({ avatarUrl, nickname, message, className }) => {
  return (
    <div className={`flex items-end gap-2 w-full max-w-[90%] self-end ${className || ""}`.trim()}>
      {avatarUrl && (
        <img
          src={avatarUrl}
          alt="avatar"
          className="w-8 h-8 rounded-full border-2 border-[var(--color-primary-purple)] shadow"
        />
      )}
      <div
        className="relative px-4 py-2 rounded-2xl bg-[var(--color-glass-ice)] text-[var(--color-text-primary)] shadow-glass glassmorphism"
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

export default CJChatBubble;
