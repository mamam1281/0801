// 전역 스토어 셀렉터 훅: 컴포넌트는 로컬 user state 대신 이 훅만 사용
// 주의: 로컬 user 객체를 임의 변형하지 말 것. 항상 전역 스토어 업데이트/withReconcile 사용.
"use client";

import { useMemo } from "react";
import { useGlobalProfile } from "@/store/globalStore";

export function useUserProfile() {
	// null 가능성 유지: 비로그인/미하이드레이트 상태 처리
	return useGlobalProfile();
}

export function useUserGold() {
	const p = useGlobalProfile();
	return p?.goldBalance ?? 0;
}

export function useUserLevel() {
	const p = useGlobalProfile();
	// level 또는 experience_points 기반 레벨 계산
	return (p as any)?.level ?? Math.floor(((p as any)?.experience_points ?? 0) / 500) + 1;
}

export function useIsAdmin() {
	const p = useGlobalProfile() as any;
	return !!p?.isAdmin || !!p?.is_admin;
}

export function useUserSummary() {
	const p = useGlobalProfile() as any;
	return useMemo(
		() => ({
			nickname: p?.nickname ?? "",
			gold: p?.goldBalance ?? 0,
			level: p?.level ?? Math.floor(((p?.experience_points ?? 0) / 500) + 1),
			dailyStreak: p?.daily_streak ?? p?.dailyStreak ?? 0,
			experiencePoints: p?.experience_points ?? p?.xp ?? 0,
			totalGamesPlayed: p?.total_games_played ?? 0,
			totalGamesWon: p?.total_games_won ?? 0,
			totalGamesLost: p?.total_games_lost ?? 0,
			winRate: p?.win_rate ?? 0,
			currentWinStreak: p?.current_win_streak ?? 0,
			isAdmin: !!(p?.isAdmin || p?.is_admin),
		}),
		[
			p?.nickname, 
			p?.goldBalance, 
			p?.level, 
			p?.daily_streak, 
			p?.dailyStreak,
			p?.experience_points,
			p?.xp,
			p?.total_games_played,
			p?.total_games_won,
			p?.total_games_lost,
			p?.win_rate,
			p?.current_win_streak,
			p?.isAdmin, 
			p?.is_admin
		]
	);
}

// 범용 메모이즈 셀렉터: 복수 컴포넌트에서 동일 파생값 재사용 시 사용
export function useProfileSelector<T>(selector: (p:any)=>T, deps?: any[]) {
	const p = useGlobalProfile() as any;
	const v = selector(p);
	return useMemo(()=>v, deps && deps.length ? deps : [v]);
}
