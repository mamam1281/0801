import React from "react";
import { CJAIChatBubble } from "./CJAIChatBubble";

export default {
  title: "ui/game/CJAIChatBubble",
  component: CJAIChatBubble,
};

export const Default = () => (
  <CJAIChatBubble
    nickname="CJ AI"
    message="안녕하세요! 저는 CJ AI입니다. 궁금한 점을 물어보세요."
  />
);

export const CustomNickname = () => (
  <CJAIChatBubble
    nickname="AI 도우미"
    message="별명도 바꿀 수 있습니다."
  />
);

export const LongMessage = () => (
  <CJAIChatBubble
    message={"이것은 매우 긴 AI 메시지입니다. 여러 줄로 자동 줄바꿈이 잘 되는지 확인합니다.\n두 번째 줄입니다."}
  />
);
