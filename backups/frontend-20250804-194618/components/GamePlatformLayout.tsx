import React from 'react';
import Button from './Button';
import GameCard, { GameCardProps } from './GameCard';
import QuickStartItem, { QuickStartItemProps } from './QuickStartItem';

// GamePlatformLayout에서 사용할 게임 카드 데이터 타입
export interface GameCardData extends GameCardProps {}

// GamePlatformLayout에서 사용할 퀵스타트 아이템 데이터 타입  
export interface QuickStartItemData extends QuickStartItemProps {}

export interface GamePlatformLayoutProps {
  welcomeMessage: string; // 예: "안녕하세요, 게이머님! 👋"
  subMessage: string; // 예: "오늘도 즐거운 게임을 즐겨보세요"
  popularGames: GameCardData[];
  quickStartItems: QuickStartItemData[];
}

const GamePlatformLayout: React.FC<GamePlatformLayoutProps> = ({
  welcomeMessage,
  subMessage,
  popularGames,
  quickStartItems,
}) => {
  return (
    <div className="game-platform-layout safe-py safe-px">
      {/* Header Section */}
      <header className="layout-header mb-[--layout-gap]">
        <h1 className="layout-title heading-h1">{welcomeMessage}</h1>
        <p className="layout-subtitle text-body text-[--color-text-secondary]">{subMessage}</p>
      </header>

      {/* Popular Games Section */}
      <section className="mb-[--layout-gap]">
        <div className="flex justify-between items-center mb-4 main-section-header">
          <h2 className="heading-h2 main-section-title">🔥 Popular Games</h2>          <Button 
            variant="text" 
            size="md" 
            className="main-section-more-button"
          >
            View More
          </Button>
        </div>
        <div className="content-grid">
          {popularGames.map((game) => (
            <GameCard key={game.id} {...game} />
          ))}
        </div>
      </section>

      {/* Quick Start Section */}
      <section>
        <h2 className="heading-h2 mb-4">🚀 Quick Start</h2>
        <div className="content-grid">
          {quickStartItems.map((item) => (
            <QuickStartItem key={item.id} {...item} />
          ))}
        </div>
      </section>
    </div>
  );
};

export default GamePlatformLayout;
