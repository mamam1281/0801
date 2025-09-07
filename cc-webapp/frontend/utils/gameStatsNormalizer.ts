// 백엔드 게임 통계 API 응답을 프론트엔드 전역 스토어 형식으로 변환
export function normalizeGameStatsResponse(apiResponse: any) {
  if (!apiResponse?.success || !apiResponse?.stats) {
    return {};
  }

  const stats = apiResponse.stats;
  const breakdown = stats.game_breakdown || {};

  // 프론트엔드에서 기대하는 형식으로 변환
  return {
    // 전체 통계
    total_games: stats.total_bets || 0,
    total_wins: stats.total_wins || 0,
    total_losses: stats.total_losses || 0,
    total_profit: stats.total_profit || 0,
    
    // 슬롯 게임
    slot_spins: breakdown.slot?.spins || 0,
    slot_wins: breakdown.slot?.wins || 0,
    slot_losses: breakdown.slot?.losses || 0,
    
    // 크래시 게임
    crash_games: breakdown.crash?.bets || 0,
    crash_wins: breakdown.crash?.wins || 0,
    crash_losses: breakdown.crash?.losses || 0,
    
    // 가챠
    gacha_pulls: breakdown.gacha?.spins || 0,
    gacha_rare_wins: breakdown.gacha?.rare_wins || 0,
    
    // RPS
    rps_games: breakdown.rps?.plays || 0,
    rps_wins: breakdown.rps?.wins || 0,
    rps_losses: breakdown.rps?.losses || 0,
    rps_ties: breakdown.rps?.ties || 0,
    
    // 메타데이터
    last_updated: stats.updated_at,
    user_id: stats.user_id
  };
}
