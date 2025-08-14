"use client";
import React, { useMemo, useState } from 'react';
import apiRequest from '@/utils/api';

type GrantItem = {
  user_id: number;
  reward_type: string; // e.g., TOKEN, GEM, ITEM
  amount: number;
  source_description?: string;
};

type GrantBulkResponse = {
  success: boolean;
  results: Array<{
    user_id: number;
    status: 'ok' | 'error';
    message?: string;
  }>;
};

export default function AdminPointsPage() {
  const [userIdsText, setUserIdsText] = useState('');
  const [amount, setAmount] = useState(100);
  const [rewardType, setRewardType] = useState('TOKEN');
  const [description, setDescription] = useState('admin:manual-grant');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null as string | null);
  const [result, setResult] = useState(null as GrantBulkResponse | null);

  const parsedUserIds = useMemo(() => {
    return userIdsText
      .split(/\s|,|\n|\r|\t|;/g)
      .map((s: string) => s.trim())
      .filter((v: string) => Boolean(v))
      .map((s: string) => Number(s))
      .filter((n: number) => Number.isFinite(n) && n > 0);
  }, [userIdsText]);

  const canSubmit = parsedUserIds.length > 0 && amount > 0 && !isSubmitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setIsSubmitting(true);
    setSubmitError(null);
    setResult(null);
    try {
  const items: GrantItem[] = parsedUserIds.map((uid: number) => ({
        user_id: uid,
        reward_type: rewardType,
        amount,
        source_description: description || undefined,
      }));
      const res: GrantBulkResponse = await apiRequest('/api/admin/rewards/grant-bulk', {
        method: 'POST',
        body: JSON.stringify({ items }),
      });
      setResult(res);
    } catch (err: any) {
      setSubmitError(err?.message || '요청 처리 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-2">Admin 포인트 지급</h1>
      <p className="text-sm opacity-80 mb-6">여러 사용자에게 토큰/포인트를 일괄 지급합니다. (엔드포인트: POST /api/admin/rewards/grant-bulk)</p>

      <form onSubmit={handleSubmit} className="space-y-4 glass-metal rounded-lg p-4 border border-white/10">
        <div>
          <label className="block text-sm mb-1">대상 사용자 ID 목록</label>
          <textarea
            className="w-full h-28 rounded bg-background border px-3 py-2"
            placeholder="예: 1, 2, 3 또는 줄바꿈으로 구분"
            value={userIdsText}
            onChange={(e: any) => setUserIdsText(e.target.value)}
          />
          <div className="text-xs opacity-70 mt-1">파싱된 사용자 수: {parsedUserIds.length.toLocaleString()}명</div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm mb-1">지급 금액</label>
            <input
              type="number"
              min={1}
              className="w-full rounded bg-background border px-3 py-2"
              value={amount}
              onChange={(e: any) => setAmount(Math.max(1, parseInt(e.target.value || '1', 10)))}
            />
          </div>

          <div>
            <label className="block text-sm mb-1">리워드 타입</label>
            <select
              className="w-full rounded bg-background border px-3 py-2"
              value={rewardType}
              onChange={(e: any) => setRewardType(e.target.value)}
            >
              <option value="TOKEN">TOKEN (기본 포인트)</option>
              <option value="GEM">GEM (프리미엄)</option>
              <option value="COIN">COIN (레거시/내부용)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm mb-1">출처 설명(source)</label>
            <input
              type="text"
              className="w-full rounded bg-background border px-3 py-2"
              value={description}
              onChange={(e: any) => setDescription(e.target.value)}
              placeholder="예: admin:manual-grant"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={!canSubmit}
            className={`px-4 py-2 rounded font-semibold ${canSubmit ? 'bg-primary text-white hover:opacity-90' : 'bg-muted text-foreground/50 cursor-not-allowed'}`}
            aria-label="포인트 일괄 지급 실행"
          >
            {isSubmitting ? '지급 중…' : '일괄 지급'}
          </button>
          <span className="text-xs opacity-70">안전장치: 서버에서 권한/금액/사용자 검증 및 감사 로그 기록</span>
        </div>
      </form>

      {submitError && (
        <div className="mt-4 p-3 rounded border border-red-500/40 bg-red-500/10 text-red-300">
          오류: {submitError}
        </div>
      )}

      {result && (
        <div className="mt-6">
          <h2 className="text-lg font-bold mb-2">결과</h2>
          <div className="text-sm opacity-80 mb-2">전체 성공 여부: {result.success ? '성공' : '부분 실패'}</div>
          <div className="rounded border border-white/10 divide-y divide-white/5">
            {result.results.map((r: { user_id: number; status: 'ok'|'error'; message?: string }, idx: number) => (
              <div key={idx} className="flex items-center justify-between px-3 py-2">
                <div className="text-sm">user_id: <span className="font-mono">{r.user_id}</span></div>
                <div className={`text-xs px-2 py-1 rounded ${r.status === 'ok' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'}`}>
                  {r.status}
                </div>
                {r.message && <div className="text-xs opacity-70 ml-3">{r.message}</div>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
