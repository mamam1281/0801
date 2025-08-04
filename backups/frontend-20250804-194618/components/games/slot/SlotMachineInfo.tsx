'use client';

import React from 'react';
import GameFooter from './GameFooter';

interface SlotMachineInfoProps {
  className?: string;
}

export const SlotMachineInfo: React.FC<SlotMachineInfoProps> = ({
  className = '',
}) => {
  return (
    <div className={`w-full ${className}`}>
      <GameFooter />
    </div>
  );
};

export default SlotMachineInfo;
