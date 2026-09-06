"use client";

import { Field, Input } from "@/components/ui/field";
import { sanitizeLogin } from "@/lib/services/accountService";

export function AccountFields({
  login,
  password,
  passwordConfirm,
  onLoginChange,
  onPasswordChange,
  onPasswordConfirmChange,
}: {
  login: string;
  password: string;
  passwordConfirm: string;
  onLoginChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onPasswordConfirmChange: (value: string) => void;
}) {
  return (
    <>
      <Field label="Логин" htmlFor="account-login" hint="Латиница, цифры или _. По нему вы войдёте позже.">
        <Input
          id="account-login"
          value={login}
          onChange={(event) => onLoginChange(sanitizeLogin(event.target.value))}
          placeholder="olga_k"
          autoComplete="username"
          maxLength={24}
          required
        />
      </Field>

      <Field label="Пароль" htmlFor="account-password" hint="Минимум 6 символов.">
        <Input
          id="account-password"
          type="password"
          value={password}
          onChange={(event) => onPasswordChange(event.target.value)}
          placeholder="••••••••"
          autoComplete="new-password"
          maxLength={72}
          required
        />
      </Field>

      <Field label="Повторите пароль" htmlFor="account-password-confirm">
        <Input
          id="account-password-confirm"
          type="password"
          value={passwordConfirm}
          onChange={(event) => onPasswordConfirmChange(event.target.value)}
          placeholder="••••••••"
          autoComplete="new-password"
          maxLength={72}
          required
        />
      </Field>
    </>
  );
}
