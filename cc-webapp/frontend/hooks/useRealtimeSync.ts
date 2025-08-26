import { useEffect, useRef } from 'react'
import { useGlobalStore, reconcileBalance, applyReward, mergeGameStats } from '../store/globalStore'
import { api as unifiedApi } from '../lib/unifiedApi'

type WSMessage = { type: string; payload?: any; event_id?: string }

function buildWsUrl() {
    // prefer NEXT_PUBLIC_API_ORIGIN or backend:8000 on server
    const origin = (typeof window !== 'undefined') ? window.location.origin : 'http://backend:8000'
    // ws protocol
    const wsProto = origin.startsWith('https') ? 'wss' : 'ws'
    return `${wsProto}://${new URL(origin).host}/ws` // server should route /ws
}

export default function useRealtimeSync() {
    const ctx = useGlobalStore()
    const { state, dispatch } = ctx
    const wsRef = useRef(null)
    const backoffRef = useRef(0)
    const lastEventRef = useRef({} as Record<string, number>)

    useEffect(() => {
        let mounted = true

        const connect = () => {
            if (!mounted) return
            const url = buildWsUrl()
            try {
                const ws = new WebSocket(url)
                wsRef.current = ws

                ws.onopen = () => {
                    backoffRef.current = 0
                    console.info('[Realtime] connected')
                }

                ws.onmessage = (ev) => {
                    try {
                        const msg: WSMessage = JSON.parse(ev.data)
                        handleMessage(msg)
                    } catch (e) {
                        console.warn('[Realtime] invalid message', e)
                    }
                }

                ws.onclose = (ev) => {
                    console.warn('[Realtime] closed', ev.code, ev.reason)
                    retryConnect()
                }

                ws.onerror = (e) => {
                    console.error('[Realtime] error', e)
                    ws.close()
                }
            } catch (e) {
                console.error('[Realtime] connect failed', e)
                retryConnect()
            }
        }

        const retryConnect = () => {
            const backoff = Math.min(30000, 500 * Math.pow(2, backoffRef.current))
            backoffRef.current += 1
            setTimeout(() => { if (mounted) connect() }, backoff)
        }

        const handleMessage = (msg: WSMessage) => {
            const { type, payload, event_id } = msg
            // dedupe: use event_id or type+timestamp
            const key = event_id || `${type}:${JSON.stringify(payload).slice(0, 100)}`
            const last = lastEventRef.current[key] || 0
            const now = Date.now()
            if (now - last < 1500) return // dedupe 1.5s
            lastEventRef.current[key] = now

            switch (type) {
                case 'profile_update':
                    // payload: full profile
                    if (payload?.id && state.user?.id === payload.id) {
                        dispatch({ type: 'SET_USER', user: payload })
                        // also reconcile balance if included
                        if (payload.balance) dispatch({ type: 'SET_BALANCES', balances: payload.balance })
                    }
                    window.dispatchEvent(new CustomEvent('app:notification', { detail: { type: 'profile_update', message: '프로필이 업데이트되었습니다', payload } }))
                    break
                case 'purchase_update':
                    // payload: { user_id, status, receipt, new_balance }
                    if (payload?.user_id && state.user?.id === payload.user_id) {
                        if (payload.new_balance) dispatch({ type: 'SET_BALANCES', balances: payload.new_balance })
                    }
                    window.dispatchEvent(new CustomEvent('app:notification', { detail: { type: 'purchase_update', message: '구매 상태가 변경되었습니다', payload } }))
                    break
                case 'reward_granted':
                    // payload: { user_id, reward }
                    if (payload?.user_id && state.user?.id === payload.user_id) {
                        const r = payload.reward || {}
                        dispatch({ type: 'APPLY_REWARD', reward: r })
                    }
                    window.dispatchEvent(new CustomEvent('app:notification', { detail: { type: 'reward_granted', message: '보상이 지급되었습니다', payload } }))
                    break
                case 'game_update':
                    if (payload?.stats) (mergeGameStats as any)(dispatch, payload.stats)
                    break
                default:
                    // generic event
                    break
            }
        }

        connect()

        return () => { mounted = false; try { wsRef.current?.close() } catch { } }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [state.user?.id]) // reconnect when user id changes (token rotation)
}
