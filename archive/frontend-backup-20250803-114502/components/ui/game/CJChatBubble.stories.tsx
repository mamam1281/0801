import React from "react";
import { CJChatBubble } from "./CJChatBubble";

export default {
  title: "ui/game/CJChatBubble",
  component: CJChatBubble,
};

export const Default = () => (
  <CJChatBubble
    avatarUrl="https://randomuser.me/api/portraits/men/32.jpg"
    nickname="홍길동"
    message="안녕하세요! 챗버블 디자인 테스트입니다."
  />
);

export const LongMessage = () => (
  <CJChatBubble
    avatarUrl="https://randomuser.me/api/portraits/women/44.jpg"
    nickname="김영희"
    message={"이것은 매우 긴 메시지입니다. 여러 줄로 자동 줄바꿈이 잘 되는지 확인합니다.\n두 번째 줄입니다."}
  />
);

export const NoAvatar = () => (
  <CJChatBubble
    nickname="익명"
    message="아바타 없이도 잘 보입니다."
  />
);
