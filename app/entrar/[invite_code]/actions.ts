"use server";

import { joinClassByInviteCode, type JoinClassResult } from "@/lib/classes/join";

/**
 * Joins the class behind an invite code via the shared server-side helper.
 * Kept as this route's Server Action so the existing direct invite link flow
 * does not change its client contract.
 */
export async function joinClass(inviteCode: string): Promise<JoinClassResult> {
  return joinClassByInviteCode(inviteCode);
}
