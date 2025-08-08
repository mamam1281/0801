"use client";

import { useState } from 'react';
import { gameApi } from '../../../../utils/apiClient';
import RockPaperScissorsGame from '../../../../components/games/RockPaperScissorsGame';

export default function RPSSmokePage() {
  const [choice, setChoice] = useState<'rock' | 'paper' | 'scissors'>('rock');
  const [bet, setBet] = useState<number>(10);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const play = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await gameApi.rps.play(choice, bet);
      // Expecting keys per backend schema: success, player_choice, computer_choice, result, win_amount, message, balance
      if (!('player_choice' in data) || !('computer_choice' in data) || !('result' in data)) {
        throw new Error('응답 형식이 예상과 다릅니다.');
      }
      setResult(data);
    } catch (e: any) {
      setError(e.message || '요청 실패');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6">
      <h1 className="text-2xl font-bold">RPS Smoke Test</h1>
      <div className="flex gap-2 items-center">
        <select
          className="border rounded px-2 py-1"
          value={choice}
          onChange={(e) => setChoice(e.target.value as any)}
        >
          <option value="rock">rock</option>
          <option value="paper">paper</option>
          <option value="scissors">scissors</option>
        </select>
        <input
          className="border rounded px-2 py-1 w-24"
          type="number"
          min={1}
          value={bet}
          onChange={(e) => setBet(parseInt(e.target.value || '0', 10))}
        />
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
          onClick={play}
          disabled={loading}
        >
          {loading ? '플레이 중...' : '플레이'}
        </button>
      </div>

      {error && (
        <p className="text-red-600">에러: {error}</p>
      )}

      {result && (
        <div className="mt-4 w-full max-w-md border rounded p-4">
          <h2 className="font-semibold mb-2">결과</h2>
          <pre className="text-sm whitespace-pre-wrap">{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}

      <div className="mt-8 w-full max-w-2xl">
        <RockPaperScissorsGame onPlay={async (c) => {
          setChoice(c as any);
          await play();
        }} />
      </div>
    </div>
  );
}
