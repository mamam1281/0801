'use client';

import React from 'react';

interface SlotMachineHeader1Props {
  jackpot: number;
  className?: string;
}

export const SlotMachineHeader1: React.FC<SlotMachineHeader1Props> = ({
  jackpot,
  className = '',
}) => {
  // 잭팟 컨테이너 제거됨 - 사용자 요청에 따라 빈 컴포넌트로 처리
  return null;
};

export default SlotMachineHeader1;
