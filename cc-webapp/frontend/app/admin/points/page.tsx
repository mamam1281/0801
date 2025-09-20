"use client";

import { useWithReconcile } from "@/lib/sync";
import { api as unifiedApi } from "@/lib/unifiedApi";
import { useCallback, useEffect, useState } from "react";
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

	const [userInput, setUserInput] = useState("");
	const [amount, setAmount] = useState("");
	const [memo, setMemo] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [result, setResult] = useState({ status: "idle" } as ResultState);
	const withReconcile = useWithReconcile();

	// 입력 유효성 검사 개선: 숫자 ID 또는 site_id 모두 허용
	const parsedInput = (userInput || '').toString().trim();
	const parsedAmt = (amount || '').toString().trim();
	
	// ID 검증: 숫자(user_id) 또는 3자 이상 영숫자+언더스코어(site_id)
	const isNumericId = /^\d+$/.test(parsedInput);
	const isSiteId = /^[a-zA-Z0-9_-]{3,50}$/.test(parsedInput);
	const idOk = isNumericId || isSiteId;
	
	const amtOk = /^\d*(?:\.\d+)?$/.test(parsedAmt) && Number(parsedAmt) > 0;
	
	const handleSubmit = useCallback(async () => {
		// 입력 유효성 검사를 함수 내부에서 다시 수행
		const parsedInputLocal = (userInput || '').toString().trim();
		const parsedAmtLocal = (amount || '').toString().trim();
		
		const isNumericIdLocal = /^\d+$/.test(parsedInputLocal);
		const isSiteIdLocal = /^[a-zA-Z0-9_-]{3,50}$/.test(parsedInputLocal);
		const idOkLocal = isNumericIdLocal || isSiteIdLocal;
		
		const amtOkLocal = /^\d*(?:\.\d+)?$/.test(parsedAmtLocal) && Number(parsedAmtLocal) > 0;
		const canSubmitLocal = idOkLocal && amtOkLocal && !isSubmitting;
		
		if (!canSubmitLocal) {
			return;
		}
		
		setIsSubmitting(true);
		setResult({ status: "idle" });
		
		try {
			const inputValue = userInput.trim();
			const amt = Number(amount);
			const note = memo?.trim() || "admin:gold-grant";
			
			let targetUserId = inputValue;
			
			// site_id인 경우 숫자 user_id로 변환
			if (!isNumericIdLocal) {
				try {
					// 관리자 사용자 목록에서 site_id로 검색
					const userListResponse: any = await unifiedApi.get(`admin/users?skip=0&limit=100`);
					
					// 다양한 응답 구조를 시도
					let users = [];
					if (Array.isArray(userListResponse)) {
						users = userListResponse;
					} else if (userListResponse?.users) {
						users = userListResponse.users;
					} else if (userListResponse?.items) {
						users = userListResponse.items;
					} else if (userListResponse?.data) {
						users = userListResponse.data;
					} else {
						users = [];
					}
					
					const targetUser = users.find((u: any) => u.site_id === inputValue);
					
					if (!targetUser) {
						// 사용자 목록에서 site_id들을 확인
						const siteIds = users.map((u: any) => u.site_id).filter(Boolean);
						
						setResult({ 
							status: "error", 
							message: `❌ 사용자 "${inputValue}"를 찾을 수 없습니다. 사용 가능한 site_id: ${siteIds.join(', ')}` 
						});
						return;
					}
					
					targetUserId = targetUser.id.toString();
				} catch (searchError: any) {
					console.error('[Admin Points] User search failed:', searchError);
					setResult({ 
						status: "error", 
						message: `❌ 사용자 검색 중 오류: ${searchError?.message || 'Unknown error'}` 
					});
					return;
				}
			}

			// 골드 지급 실행
			const res: any = await withReconcile(async (idemKey: string) =>
				unifiedApi.post(
					`admin/users/${targetUserId}/gold/grant`,
					{ amount: amt, reason: note, idempotency_key: idemKey },
					{ headers: { "X-Idempotency-Key": idemKey } }
				)
			);

			const rc = res?.receipt_code ? ` (영수증: ${res.receipt_code})` : "";
			setResult({ 
				status: "success", 
				message: `✅ 골드 ${amt}G 지급 완료! 새 잔액: ${res?.new_gold_balance?.toLocaleString() || 'Unknown'}G${rc}` 
			});
			
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
	}, [userInput, amount, memo, withReconcile, isSubmitting]);

	return (
		<div className="min-h-[calc(100vh-4rem)] w-full px-4 py-6 md:px-8 lg:px-12">
			<div className="mx-auto w-full max-w-3xl">
				{/* 비관리자 가드 배너 (인증 체크 전에도 플레이스홀더를 렌더링하여 테스트 안정화) */}
				{(!authChecked || !me?.is_admin) && (
					<div
						data-testid="admin-guard-banner"
						className="mb-4 rounded-md border border-red-700/50 bg-red-900/20 p-3 text-sm text-red-300"
					>
						{!authChecked ? '권한 확인 중… (관리자 전용 페이지)' : '관리자 전용 페이지입니다. 접근 권한이 없습니다.'}
					</div>
				)}
				<h1 className="mb-2 bg-gradient-to-r from-pink-500 to-cyan-400 bg-clip-text text-2xl font-bold text-transparent md:text-3xl">
					관리자: 포인트/토큰 지급
				</h1>
				<p className="mb-6 text-sm text-muted-foreground">
					특정 사용자에게 사이버 토큰을 지급합니다. 숫자 ID 또는 site_id로 사용자를 찾을 수 있습니다.
				</p>

				<Card className="border border-white/10 bg-black/30 p-5 shadow-xl backdrop-blur">
					<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
						<div className="flex flex-col gap-2">
							<Label htmlFor="user_input">사용자 ID 또는 site_id</Label>
							<Input
								data-testid="admin-points-user-input"
								id="user_input"
								type="text"
								placeholder="예) 123 또는 admin, user001"
								value={userInput}
								onChange={(e: any) => setUserInput((e.target as HTMLInputElement).value)}
								onInput={(e: any) => setUserInput((e.target as HTMLInputElement).value)}
							/>
							<div className="text-xs text-gray-400">
								숫자 ID (예: 123) 또는 site_id (예: admin, user001)
							</div>
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
						<Button
							type="button"
							data-testid="admin-points-submit"
							onClick={(e: any) => {
								e.preventDefault();
								e.stopPropagation();
								handleSubmit();
							}}
							disabled={isSubmitting}
							className="bg-gradient-to-r from-fuchsia-600 to-cyan-500 text-white hover:opacity-90 relative z-10 pointer-events-auto"
							style={{ 
								minHeight: '44px', 
								minWidth: '120px'
							}}
						>
							{isSubmitting ? "지급 중..." : "포인트 지급"}
						</Button>

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
					<br />• 지원: 숫자 ID (예: 123) 또는 site_id (예: admin, user001, testuser)
				</div>
			</div>
		</div>
	);
}

