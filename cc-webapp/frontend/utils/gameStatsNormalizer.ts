// 백엔드 게임 통계 API 응답을 프론트엔드 전역 스토어 형식으로 변환
export function normalizeGameStatsResponse(apiResponse: any) {
  if (!apiResponse?.success || !apiResponse?.stats) {
    return {};
  }

  const stats = apiResponse.stats;
  const breakdown = stats.game_breakdown || {};

  // 프론트엔드에서 기대하는 형식으로 변환 (별칭 key도 함께 저장)
  const normalized: Record<string, any> = {
    // 전체 통계
    total_games: stats.total_bets || 0,
    total_wins: stats.total_wins || 0,
    total_losses: stats.total_losses || 0,
    total_profit: stats.total_profit || 0,
    last_updated: stats.updated_at,
    user_id: stats.user_id
  };

  // 슬롯
  const slotSpins = breakdown.slot?.spins || 0;
  normalized.slot_spins = slotSpins;
  normalized.slot = { spins: slotSpins, wins: breakdown.slot?.wins || 0, losses: breakdown.slot?.losses || 0 };

  // 크래시
  const crashGames = breakdown.crash?.bets || 0;
  normalized.crash_games = crashGames;
  normalized.crash = { games: crashGames, wins: breakdown.crash?.wins || 0, losses: breakdown.crash?.losses || 0 };

  // 가챠
  const gachaPulls = breakdown.gacha?.spins || 0;
  normalized.gacha_pulls = gachaPulls;
  normalized.gacha = { pulls: gachaPulls, rare_wins: breakdown.gacha?.rare_wins || 0 };

  // RPS
  const rpsGames = breakdown.rps?.plays || 0;
  normalized.rps_games = rpsGames;
  normalized.rps = { games: rpsGames, wins: breakdown.rps?.wins || 0, losses: breakdown.rps?.losses || 0, ties: breakdown.rps?.ties || 0 };

  return normalized;
}
