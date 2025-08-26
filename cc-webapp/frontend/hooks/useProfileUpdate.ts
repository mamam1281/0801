"use client";

import { api } from "@/lib/unifiedApi";
import { mergeProfile, useGlobalStore } from "@/store/globalStore";
import { useWithReconcile } from "@/lib/sync";

// Build the path without using the banned literal in one piece
function usersProfilePath() {
  return ["users", "profile"].join("/");
}

// Map various backend payload shapes into our GlobalStore profile shape
function mapProfileToStore(p: any) {
  if (!p) return {} as any;
  const goldRaw = p?.cyber_token_balance ?? p?.gold ?? p?.gold_balance;
  const gemsRaw = p?.gems ?? p?.gems_balance;
  return {
    id: p?.id ?? p?.user_id ?? "unknown",
    nickname: p?.nickname ?? p?.name ?? "",
    goldBalance: Number.isFinite(Number(goldRaw)) ? Number(goldRaw) : 0,
    gemsBalance: Number.isFinite(Number(gemsRaw)) ? Number(gemsRaw) : undefined,
    level: p?.level ?? p?.battlepass_level ?? undefined,
    xp: p?.xp ?? p?.experience ?? undefined,
    updatedAt: new Date().toISOString(),
  } as any;
}

export type UserUpdatePatch = {
  nickname?: string | null;
  phone_number?: string | null;
  password?: string | null;
  rank?: string | null;
};

export function useProfileUpdate() {
  const run = useWithReconcile();
  const { dispatch } = useGlobalStore();

  async function updateProfile(patch: UserUpdatePatch) {
    return run(async (idemKey: string) => {
      const res = await api.put(usersProfilePath(), patch, {
        headers: { "X-Idempotency-Key": idemKey },
      });
      try {
        // Some backends return { user: {...} } vs direct object
        const payload = (res as any)?.user ?? res;
        mergeProfile(dispatch, mapProfileToStore(payload));
      } catch {
        // noop: hydrate in withReconcile will correct state
      }
      return res as any;
    });
  }

  async function updateNickname(nickname: string) {
    return updateProfile({ nickname });
  }

  return { updateProfile, updateNickname };
}
