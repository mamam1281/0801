// 통합 이벤트 타입 정의
// 관리자(content) 이벤트와 퍼블릭(events) 라우터 반환 객체를 단일 UI 레이어에서 다루기 위한 표준화된 형태
// NOTE: 아직 /app/events/page.tsx 리팩터 전에 어댑터/타입을 도입하는 단계 (Todo #1)

export interface RawPublicEvent {
  id: number | string
  title?: string // public events
  name?: string // admin/content events
  description?: string | null
  start_date?: string | null
  start_at?: string | null
  end_date?: string | null
  end_at?: string | null
  status?: string
  reward_type?: string | null
  reward_amount?: number | null
  participation_count?: number
  user_participation?: {
    id: number | string
    user_id?: number | string
    event_id?: number | string
    progress?: number | null
    status?: string | null
    claimed?: boolean | null
    reward_granted?: boolean | null
    reward_amount?: number | null
  } | null
  rewards?: Record<string, unknown> | null // 기존 mission API
  reward_scheme?: Record<string, unknown> | null // admin/content variant
  [key: string]: any // eslint-disable-line @typescript-eslint/no-explicit-any
}

export interface EventUnifiedParticipation {
  id?: string | number
  progress: number
  status: string
  claimed: boolean
  rewardGranted: boolean
  rewardAmount: number | null
}

export interface EventUnified {
  id: string | number
  title: string
  description: string | null
  startsAt: string | null
  endsAt: string | null
  status: string
  rewardType: string | null
  rewardAmount: number | null
  participationCount: number
  participation: EventUnifiedParticipation | null
  raw: RawPublicEvent // 디버깅/추후 확장 대비 원본 보관
}

export interface EventListResult {
  events: EventUnified[]
  raw: RawPublicEvent[]
}
