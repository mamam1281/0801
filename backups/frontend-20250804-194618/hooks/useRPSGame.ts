'use client';

import { useState, useCallback } from 'react';
import { Choice, GameResult, GameScore, GameState } from '../components/games/rps/types';
import ApiClient from '../lib/api-client';

export const useRPSGame = (isPopup = false) => {
  const [gameState, setGameState] = useState<GameState>({
    playerChoice: null,
    aiChoice: null,
    result: null,
    isPlaying: false,
    score: { player: 0, ai: 0, draws: 0 },
    showResultScreen: false,
    cjaiMessage: isPopup ? "게임을 시작해 보세요! 🚀" : "가위, 바위, 보 중 하나를 선택하세요!",
    playerWinStreak: 0,
    playerLossStreak: 0,
    balance: 100000, // Add balance to state
  });

  const [isAIThinking, setIsAIThinking] = useState(false);

  const handlePlayerChoice = useCallback(async (choice: Choice) => {
    if (isAIThinking) return;

    setIsAIThinking(true);
    setGameState(prev => ({
      ...prev,
      playerChoice: choice,
      cjaiMessage: "🤖 AI가 결과를 결정 중..."
    }));

    const betAmount = 5000; // Default bet amount

    try {
      const response = await ApiClient.playRPS(choice, betAmount);

      const newScore = { ...gameState.score };
      if (response.result === 'win') newScore.player++;
      else if (response.result === 'lose') newScore.ai++;
      else newScore.draws++;

      setGameState(prev => ({
        ...prev,
        aiChoice: response.computer_choice,
        result: response.result,
        score: newScore,
        balance: response.balance,
        showResultScreen: true,
        cjaiMessage: `결과: ${response.result}! ${response.tokens_change} 토큰 변경.`,
        playerWinStreak: response.result === 'win' ? prev.playerWinStreak + 1 : 0,
        playerLossStreak: response.result === 'lose' ? prev.playerLossStreak + 1 : 0,
      }));

    } catch (error: any) {
      console.error("RPS game failed:", error);
      setGameState(prev => ({
        ...prev,
        cjaiMessage: `오류: ${error.message || '게임에 실패했습니다.'}`
      }));
    } finally {
      setIsAIThinking(false);
    }
  }, [gameState.score, gameState.playerWinStreak, gameState.playerLossStreak]);

  const handlePlayAgain = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      playerChoice: null,
      aiChoice: null,
      result: null,
      isPlaying: false,
      showResultScreen: false,
      cjaiMessage: "다시 한번! 🎯",
    }));
  }, []);

  const handleResetScore = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      playerChoice: null,
      aiChoice: null,
      result: null,
      isPlaying: false,
      score: { player: 0, ai: 0, draws: 0 },
      showResultScreen: false,
      cjaiMessage: "새로운 시작! 🚀",
      playerWinStreak: 0,
      playerLossStreak: 0,
    }));
  }, []);

  return {
    gameState,
    handlePlayerChoice,
    handlePlayAgain,
    handleResetScore,
    isAIThinking,
  };
};
