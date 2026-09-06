export function sanitizeName(value: string): string {
  return value.replace(/[^A-Za-zА-Яа-яЁё]/g, "");
}

export function sanitizeLogin(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 24);
}

export function validateName(name: string): string | null {
  if (name.trim().length < 2) return "Введите имя — минимум 2 буквы.";
  if (!/^[A-Za-zА-Яа-яЁё]{2,40}$/.test(name)) return "Имя может содержать только буквы.";
  return null;
}

export function validateLogin(login: string): string | null {
  if (!/^[a-z0-9_]{3,24}$/.test(login)) {
    return "Логин: 3–24 символа, латиница, цифры или _.";
  }
  return null;
}

export function validatePassword(password: string): string | null {
  if (password.length < 6 || password.length > 72) {
    return "Пароль: минимум 6 символов.";
  }
  return null;
}

export function validatePasswordConfirm(password: string, confirm: string): string | null {
  if (password !== confirm) return "Пароли не совпадают.";
  return null;
}

function errorText(cause: unknown): string {
  if (typeof cause === "string") return cause;
  if (cause instanceof Error) return cause.message;

  if (cause && typeof cause === "object") {
    const item = cause as { message?: unknown; details?: unknown; hint?: unknown };
    return [item.message, item.details, item.hint]
      .filter((part): part is string => typeof part === "string" && part.length > 0)
      .join(" ");
  }

  return "";
}

export function accountErrorMessage(cause: unknown): string {
  const raw = errorText(cause);

  if (raw.includes("LOGIN_TAKEN")) return "Такой логин уже занят.";
  if (raw.includes("LOGIN_INVALID")) return "Логин: 3–24 символа, латиница, цифры или _.";
  if (raw.includes("PASSWORD_INVALID")) return "Пароль: минимум 6 символов.";
  if (raw.includes("NAME_INVALID")) return "Имя может содержать только буквы.";
  if (raw.includes("GROUP_NOT_FOUND")) return "Код группы не найден.";
  if (raw.includes("ACCOUNT_EXISTS")) return "У этого пользователя уже есть аккаунт.";
  if (raw.includes("USER_NOT_FOUND")) return "Пользователь не найден.";
  if (raw.includes("ROLE_INVALID")) return "Некорректная роль.";
  if (!raw || raw === "[object Object]") return "Не удалось создать аккаунт. Проверьте код группы и логин.";

  return raw;
}
