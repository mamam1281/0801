'use client'; // Game layouts might have interactive elements or need client hooks

import React from 'react';
import AppHeader from '../components/AppHeader'; // Assuming path from layouts directory
// If GameLayout needs Redux state directly (e.g. for AppHeader props not passed down),
// it would need to be part of a structure that has Provider above it.
// For now, AppHeader pulls its own Redux state.

export interface GameLayoutProps {
  children: React.ReactNode;
}

const GameLayout: React.FC<GameLayoutProps> = ({ children }) => {
  // Dummy handlers for AppHeader, as they might not be relevant or different in Game context
  const handleProfileClick = () => {
    console.log('Profile clicked from GameLayout');
  };

  const handleNotificationsClick = () => {
    console.log('Notifications clicked from GameLayout');
  };

  const handleSettingsClick = () => {
    console.log('Settings clicked from GameLayout');
  };

  return (
    <div className="miniapp-container game-specific-layout flex flex-col min-h-screen bg-background">
      <div className="miniapp-header">
        <AppHeader
          appName="Game Mode" // Or pass specific game name
          onProfileClick={handleProfileClick}
          onNotificationsClick={handleNotificationsClick}
          onSettingsClick={handleSettingsClick}
          showTokenBalanceOnMobile={true} // Typically still want to see balance
          hasNotifications={false} // Example
        />
      </div>
      <main className="flex-grow w-full flex flex-col items-center justify-center miniapp-content py-2 md:py-4">
        {/*
          Layout for the game itself.
          Using flex to center content, but games might need more specific structures.
          p-2 md:p-4 provides some minimal padding around the game area.
        */}
        {children}
      </main>
      {/* No Sidebar, No BottomNavigationBar for immersive experience */}
    </div>
  );
};

export default GameLayout;
