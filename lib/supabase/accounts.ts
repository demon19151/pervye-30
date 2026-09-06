import { createId } from "../storage";
import { accountErrorMessage } from "../services/accountService";
import type { AppState, UserRole } from "../types";
import { getSupabase } from "./client";
import { fetchState } from "./persist";

export type AccountProfile = {
  userId: string;
  groupId: string;
  role: UserRole;
  name: string;
};

type AccountRow = {
  user_id: string;
  group_id: string;
  role: UserRole;
  name: string;
};

function mapProfile(row: AccountRow): AccountProfile {
  return {
    userId: row.user_id,
    groupId: row.group_id,
    role: row.role,
    name: row.name,
  };
}

function throwAccountError(error: { message?: string; details?: string; hint?: string } | null): never | void {
  if (error) throw new Error(accountErrorMessage(error));
}

export async function registerAccount(input: {
  name: string;
  login: string;
  password: string;
  inviteCode: string;
  role: UserRole;
}): Promise<AccountProfile> {
  const db = getSupabase();
  const { data, error } = await db.rpc("register_account", {
    p_user_id: createId("u"),
    p_name: input.name,
    p_role: input.role,
    p_login: input.login,
    p_password: input.password,
    p_invite_code: input.inviteCode,
  });

  throwAccountError(error);

  const row = (data as AccountRow[] | null)?.[0];
  if (!row) throw new Error("Не удалось создать аккаунт.");
  return mapProfile(row);
}

export async function attachAccount(input: {
  userId: string;
  login: string;
  password: string;
}): Promise<void> {
  const db = getSupabase();
  const { error } = await db.rpc("attach_account", {
    p_user_id: input.userId,
    p_login: input.login,
    p_password: input.password,
  });
  throwAccountError(error);
}

export async function signInAccount(input: {
  login: string;
  password: string;
}): Promise<AccountProfile> {
  const db = getSupabase();
  const { data, error } = await db.rpc("sign_in_account", {
    p_login: input.login,
    p_password: input.password,
  });

  throwAccountError(error);

  const row = (data as AccountRow[] | null)?.[0];
  if (!row) throw new Error("Неверный логин или пароль.");
  return mapProfile(row);
}

export async function loadAccountState(profile: AccountProfile): Promise<AppState> {
  const room = await fetchState(profile.groupId);
  return {
    ...room,
    session: { userId: profile.userId, role: profile.role },
  };
}
