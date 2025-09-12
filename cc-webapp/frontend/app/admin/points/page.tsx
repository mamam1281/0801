"use client";

import React, { useCallback, useEffect, useState } from "react";
					console.log(`[Admin Points] Found user: ${uid} → ID ${targetUserId}`);
				} catch (searchError: any) {
					console.error('[Admin Points] User search failed:', searchError);
					setResult({ 
						status: "error", 
						message: `❌ 사용자 검색 중 오류: ${searchError?.message || 'Unknown error'}` 
					});
					return;
				}
			}t";
import { api as unifiedApi } from "@/lib/unifiedApi";
import { useWithReconcile } from "@/lib/sync";
import { Input } from "../../../components/ui/input";
// 라벨 컴포넌트는 프로젝트에서 'Label.tsx' 대소문자로 사용 중
import { Label } from "../../../components/ui/Label";
import { Button } from "../../../components/ui/button";
import { Card } from "../../../components/ui/card";

type ResultState =
	| { status: "idle" }
	| { status: "success"; message: string }
	| { status: "error"; message: string };

export default function AdminPointsPage() {
	const [me, setMe] = useState(null as any);
	const [authChecked, setAuthChecked] = useState(false);

	useEffect(() => {
		let cancelled = false;
		(async () => {
			try {
				// 서버 권위 프로필 조회
				const prof = await unifiedApi.get<any>('auth/me');
				if (!cancelled) setMe(prof || {});
			} catch {
				if (!cancelled) setMe(null);
			} finally {
				if (!cancelled) setAuthChecked(true);
			}
		})();
		return () => { cancelled = true; };
	}, []);

	const [userId, setUserId] = useState("");
	const [amount, setAmount] = useState("");
	const [memo, setMemo] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [result, setResult] = useState({ status: "idle" } as ResultState);
	const withReconcile = useWithReconcile();

	// Compute validity inline to avoid any potential memoization edge cases in CI/Playwright
	// 즉시 계산 방식으로 전환하여 하이드레이션/렌더 타이밍에 따른 메모이제이션 엣지 케이스 회피
	// 입력 유효성(테스트 시나리오 준수):
	// - user_id: 숫자 또는 site_id (문자열) 허용
	// - amount: 양수(소수 허용)
	const parsedId = (userId || '').toString().trim();
	const parsedAmt = (amount || '').toString().trim();
	const idOk = /^\d+$/.test(parsedId) || /^[a-zA-Z0-9_-]{3,}$/.test(parsedId); // 숫자 또는 유효한 site_id
	const amtOk = /^\d*(?:\.\d+)?$/.test(parsedAmt) && Number(parsedAmt) > 0;
	const canSubmit = idOk && amtOk && !isSubmitting;

	// 실시간 디버깅 정보
	console.log('[Admin Points] Form state:', {
		userId, amount, memo,
		parsedId, parsedAmt,
		idOk, amtOk, isSubmitting,
		canSubmit
	});

		const handleSubmit = useCallback(async () => {
		console.log('[Admin Points] Button clicked!', { canSubmit, userId, amount, memo });
		
		if (!canSubmit) {
			console.warn('[Admin Points] Cannot submit:', { idOk, amtOk, isSubmitting, parsedId, parsedAmt });
			return;
		}
		
		setIsSubmitting(true);
		setResult({ status: "idle" });
		console.log('[Admin Points] Starting gold grant...');
		
		try {
			const uid = userId.trim();
			const amt = Number(amount);
				const note = memo?.trim() || "admin:gold-grant";
				const res: any = await withReconcile(async (idemKey: string) =>
					unifiedApi.post(
						`admin/users/${uid}/gold/grant`,
						{ amount: amt, reason: note, idempotency_key: idemKey },
						{ headers: { "X-Idempotency-Key": idemKey } }
					)
				);

				const rc = res?.receipt_code ? ` (영수증: ${res.receipt_code})` : "";
				console.log('[Admin Points] Gold grant success:', res);
				setResult({ 
					status: "success", 
					message: `✅ 골드 ${amt}G 지급 완료! 새 잔액: ${res?.new_gold_balance?.toLocaleString() || 'Unknown'}G${rc}` 
				});
			// 성공 후 폼 유지(감사 로그 용). 필요 시 초기화하려면 아래 주석 해제
			// setUserId(""); setAmount(""); setMemo("");
		} catch (err: any) {
			console.error('[Admin Points] Gold grant failed:', err);
			const msg = err?.message || "지급 중 오류가 발생했습니다.";
			
			// 구체적인 에러 메시지 제공
			let detailedMsg = msg;
			if (msg.includes('401') || msg.includes('Unauthorized')) {
				detailedMsg = "❌ 관리자 권한이 없거나 로그인이 필요합니다.";
			} else if (msg.includes('404') || msg.includes('not found')) {
				detailedMsg = "❌ 사용자를 찾을 수 없습니다. ID를 확인해주세요.";
			} else if (msg.includes('400') || msg.includes('Bad Request')) {
				detailedMsg = "❌ 입력값이 올바르지 않습니다. (양수만 가능)";
			} else if (msg.includes('429') || msg.includes('rate')) {
				detailedMsg = "❌ 너무 많은 요청입니다. 잠시 후 다시 시도해주세요.";
			}
			
			setResult({ status: "error", message: detailedMsg });
		} finally {
			setIsSubmitting(false);
		}
		}, [canSubmit, userId, amount, memo, withReconcile]);

	return (
		<div className="min-h-[calc(100vh-4rem)] w-full px-4 py-6 md:px-8 lg:px-12">
			<div className="mx-auto w-full max-w-3xl">
				{/* 비관리자 가드 배너 */}
		{authChecked && !me?.is_admin && (
					<div
						data-testid="admin-guard-banner"
						className="mb-4 rounded-md border border-red-700/50 bg-red-900/20 p-3 text-sm text-red-300"
					>
			관리자 전용 페이지입니다. 접근 권한이 없습니다.
					</div>
				)}
				<h1 className="mb-2 bg-gradient-to-r from-pink-500 to-cyan-400 bg-clip-text text-2xl font-bold text-transparent md:text-3xl">
					관리자: 포인트/토큰 지급
				</h1>
				<p className="mb-6 text-sm text-muted-foreground">
					특정 사용자에게 사이버 토큰을 지급합니다. 관리자 권한이 필요합니다.
				</p>

				<Card className="border border-white/10 bg-black/30 p-5 shadow-xl backdrop-blur">
					<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
						<div className="flex flex-col gap-2">
							<Label htmlFor="user_id">사용자 ID</Label>
							<Input
								data-testid="admin-points-user-id"
								id="user_id"
								type="text"
								inputMode="numeric"
								placeholder="예) 123"
								value={userId}
								onChange={(e: any) => setUserId((e.target as HTMLInputElement).value)}
								onInput={(e: any) => setUserId((e.target as HTMLInputElement).value)}
							/>
						</div>
						<div className="flex flex-col gap-2">
							<Label htmlFor="amount">지급 수량</Label>
							<Input
								data-testid="admin-points-amount"
								id="amount"
								type="text"
								inputMode="decimal"
								placeholder="예) 100"
								value={amount}
								onChange={(e: any) => setAmount((e.target as HTMLInputElement).value)}
								onInput={(e: any) => setAmount((e.target as HTMLInputElement).value)}
							/>
						</div>
						<div className="md:col-span-2 flex flex-col gap-2">
							<Label htmlFor="memo">메모(선택)</Label>
							<Input
								data-testid="admin-points-memo"
								id="memo"
								type="text"
								placeholder="감사/출처 등 간단 메모"
								value={memo}
								onChange={(e: any) => setMemo((e.target as HTMLInputElement).value)}
								onInput={(e: any) => setMemo((e.target as HTMLInputElement).value)}
							/>
						</div>
					</div>

					<div className="mt-5 flex items-center gap-3">
						{/* 테스트 버튼 추가 */}
						<button
							type="button"
							onClick={() => {
								console.log('[Test] 일반 HTML 버튼 클릭됨!');
								alert('일반 버튼 클릭 성공!');
							}}
							className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
						>
							테스트 버튼
						</button>

						<Button
							type="button"
							data-testid="admin-points-submit"
							onClick={(e: any) => {
								e.preventDefault();
								e.stopPropagation();
								console.log('[Admin Points] Button click event triggered!', e);
								console.log('[Admin Points] Event target:', e.target);
								console.log('[Admin Points] Can submit check:', canSubmit);
								if (canSubmit) {
									console.log('[Admin Points] Calling handleSubmit...');
									handleSubmit();
								} else {
									console.warn('[Admin Points] Cannot submit - button disabled');
								}
							}}
							disabled={!canSubmit}
							className="bg-gradient-to-r from-fuchsia-600 to-cyan-500 text-white hover:opacity-90 relative z-10 pointer-events-auto"
							style={{ 
								minHeight: '44px', 
								minWidth: '120px',
								cursor: canSubmit ? 'pointer' : 'not-allowed'
							}}
						>
							{isSubmitting ? "지급 중..." : "포인트 지급"}
						</Button>

						{/* 디버깅 정보 표시 */}
						<div className="text-xs text-gray-400 space-y-1">
							<div>Debug: canSubmit={canSubmit.toString()}</div>
							<div>- User ID Valid: {idOk.toString()} (value: "{parsedId}")</div>
							<div>- Amount Valid: {amtOk.toString()} (value: "{parsedAmt}", number: {Number(parsedAmt)})</div>
							<div>- Not Submitting: {(!isSubmitting).toString()}</div>
							{!canSubmit && (
								<div className="text-red-400 font-bold">
									버튼 비활성화 이유: 
									{!idOk && " [User ID 숫자 아님]"}
									{!amtOk && " [Amount 양수 아님]"}
									{isSubmitting && " [현재 제출 중]"}
								</div>
							)}
						</div>

						{result.status === "success" && (
							<span className="text-sm text-emerald-400">{result.message}</span>
						)}
						{result.status === "error" && (
							<span className="text-sm text-red-400">{result.message}</span>
						)}
					</div>
				</Card>

								<div className="mt-6 text-xs text-muted-foreground">
									{/* eslint-disable-next-line react/no-unescaped-entities */}
									• 백엔드: POST /api/admin/users/{"{user_id}"}/gold/grant (관리자 전용, 멱등키 지원)
									<br />• 필수: amount(number) / 선택: reason(string), idempotency_key(string)
								</div>
			</div>
		</div>
	);
}

