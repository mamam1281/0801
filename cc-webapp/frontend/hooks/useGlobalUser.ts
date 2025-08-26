import { useCallback, useMemo } from 'react'
import { useGlobalStore } from '../store/globalStore'

// shallow compare helper
function shallowEqual(a: any, b: any) {
    if (a === b) return true
    if (!a || !b) return false
    const ka = Object.keys(a), kb = Object.keys(b)
    if (ka.length !== kb.length) return false
    for (let k of ka) if (a[k] !== b[k]) return false
    return true
}

export function useGlobalSelector<T>(selector: (s: any) => T): T {
    const { state } = useGlobalStore()
    // compute selected value
    const selected = selector(state)
    // memoize shallowly to avoid rerenders when equal
    return useMemo(() => selected, // eslint-disable-next-line react-hooks/exhaustive-deps
        // serialize keys for dependency
        [JSON.stringify(selected)])
}

export function useUserGold() {
    return useGlobalSelector(s => ({ gold: s.balances.gold, gems: s.balances.gems }))
}

export function useUserProfile() {
    return useGlobalSelector(s => s.user)
}

export function useUserId() {
    const p = useGlobalSelector(s => s.user?.id)
    return p
}

export default useGlobalSelector
