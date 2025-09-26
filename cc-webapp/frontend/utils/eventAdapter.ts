// NOTE: 경로 alias(@)가 frontend 루트에 매핑되지 않는 환경을 대비해 상대 경로 사용
import { EventUnified, EventUnifiedParticipation, RawPublicEvent } from '../types/events'

// 단일 이벤트 raw -> 통합 구조 매핑
export function adaptEvent(raw: RawPublicEvent): EventUnified {
  const title = raw.title ?? raw.name ?? '(제목 없음)'
  const startsAt = raw.start_date ?? raw.start_at ?? null
  const endsAt = raw.end_date ?? raw.end_at ?? null
  const status = raw.status ?? inferStatus(startsAt, endsAt)
  const participation = adaptParticipation(raw.user_participation)

  return {
    id: raw.id,
    title,
    description: raw.description ?? null,
    startsAt,
    endsAt,
    status,
    rewardType: raw.reward_type ?? null,
    rewardAmount: numberOrNull(raw.reward_amount),
    participationCount: numberOrNull(raw.participation_count) ?? 0,
    participation,
    raw,
  }
}

export function adaptEvents(list: RawPublicEvent[] | null | undefined): EventUnified[] {
  if (!Array.isArray(list)) return []
  return list.map(adaptEvent)
}

// ===== Formatting / Presentation Helpers =====
export function formatEventPeriod(ev: EventUnified): string {
  const toKst = (iso?: string | null) => {
    if (!iso) return '-'
    try { return new Date(iso).toLocaleString('ko-KR') } catch { return iso }
  }
  return `${toKst(ev.startsAt)} ~ ${toKst(ev.endsAt)}`
}

export function summarizeRewards(ev: EventUnified): string {
  // 우선순위: rewardAmount/rewardType -> raw.rewards -> raw.reward_scheme
  if (ev.rewardAmount != null) {
    return `${ev.rewardAmount}${ev.rewardType ? ' ' + ev.rewardType : ''}`
  }
  const raw: any = ev.raw
  const candidate = raw?.rewards || raw?.reward_scheme
  if (candidate && typeof candidate === 'object') {
    const entries = Object.entries(candidate as Record<string, unknown>)
    if (entries.length) return entries.map(([k, v]) => `${k}: ${String(v)}`).join(', ')
  }
  return '보상 정보 없음'
}

export function isJoinDisabled(ev: EventUnified): boolean {
  // 종료된 이벤트는 신규 참여 불가, pending(시작 전)은 참여 비활성
  if (ev.status === 'ended' || ev.status === 'pending') return true
  return false
}

export function showStatusBadge(ev: EventUnified): { label: string; className: string } | null {
  switch (ev.status) {
    case 'pending':
      return { label: '예정', className: 'bg-amber-900/40 text-amber-300 border border-amber-700' }
    case 'ended':
      return { label: '종료', className: 'bg-zinc-800/60 text-zinc-300 border border-zinc-700' }
    default:
      return null
  }
}

function adaptParticipation(p: RawPublicEvent['user_participation']): EventUnifiedParticipation | null {
  if (!p) return null
  return {
    id: p.id,
    progress: numberOrNull(p.progress) ?? 0,
    status: p.status ?? (p.claimed ? 'claimed' : 'joined'),
    claimed: !!p.claimed,
    rewardGranted: !!(p.reward_granted ?? p.reward_amount),
    rewardAmount: numberOrNull(p.reward_amount),
  }
}

function numberOrNull(v: unknown): number | null {
  if (v === null || v === undefined) return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

function inferStatus(start: string | null, end: string | null): string {
  const now = Date.now()
  const s = start ? Date.parse(start) : null
  const e = end ? Date.parse(end) : null
  if (s && now < s) return 'pending'
  if (e && now > e) return 'ended'
  return 'active'
}
