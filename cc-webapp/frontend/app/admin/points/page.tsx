"use client";

import React, { useCallback, useState } from "react";
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
	const [userId, setUserId] = useState("");
	const [amount, setAmount] = useState("");
	const [memo, setMemo] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [result, setResult] = useState({ status: "idle" } as ResultState);
	const withReconcile = useWithReconcile();

	// Compute validity inline to avoid any potential memoization edge cases in CI/Playwright
	// 즉시 계산 방식으로 전환하여 하이드레이션/렌더 타이밍에 따른 메모이제이션 엣지 케이스 회피
	const idOk = /^\d+$/.test(userId.trim());
	const amtNum = Number(amount.trim());
	const amtOk = !Number.isNaN(amtNum) && amtNum > 0;
	const canSubmit = idOk && amtOk && !isSubmitting;

		const handleSubmit = useCallback(async () => {
		if (!canSubmit) return;
		setIsSubmitting(true);
		setResult({ status: "idle" });
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
				setResult({ status: "success", message: `골드 ${amt} 지급 완료${rc}` });
			// 성공 후 폼 유지(감사 로그 용). 필요 시 초기화하려면 아래 주석 해제
			// setUserId(""); setAmount(""); setMemo("");
		} catch (err: any) {
			const msg = err?.message || "지급 중 오류가 발생했습니다.";
			setResult({ status: "error", message: msg });
		} finally {
			setIsSubmitting(false);
		}
		}, [canSubmit, userId, amount, memo, withReconcile]);

	return (
		<div className="min-h-[calc(100vh-4rem)] w-full px-4 py-6 md:px-8 lg:px-12">
			<div className="mx-auto w-full max-w-3xl">
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
							onClick={handleSubmit}
							disabled={!canSubmit}
							className="bg-gradient-to-r from-fuchsia-600 to-cyan-500 text-white hover:opacity-90"
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
								</div>
			</div>
		</div>
	);
}

