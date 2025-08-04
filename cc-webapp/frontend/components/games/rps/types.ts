export type Choice = 'rock' | 'paper' | 'scissors';
export type GameResult = 'win' | 'lose' | 'draw' | null;

export interface GameScore {
  player: number;
  ai: number;
  draws: number;
}

export interface GameState {
  playerChoice: Choice | null;
  aiChoice: Choice | null;
  result: GameResult;
  isPlaying: boolean;
  score: GameScore;
  showResultScreen: boolean;
  cjaiMessage: string;
  playerWinStreak: number;
  playerLossStreak: number;
}
