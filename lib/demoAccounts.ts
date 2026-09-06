/** Демо-участники комнаты P30WORK. Пароли только для входа с кнопок. */
export const DEMO_ACCOUNTS = [
  { userId: "u-anna", name: "Анна", login: "anna", password: "P30anna7", aliases: [] as string[] },
  { userId: "u-maxim", name: "Максим", login: "maksim", password: "P30maksim7", aliases: ["maxim", "maks"] },
  { userId: "u-irina", name: "Ирина", login: "irina", password: "P30irina7", aliases: [] as string[] },
  { userId: "u-dmitry", name: "Дмитрий", login: "dmitry", password: "P30dmitry7", aliases: ["dmitriy", "dimitry"] },
] as const;

export type DemoAccount = (typeof DEMO_ACCOUNTS)[number];

export function findDemoAccount(login: string): DemoAccount | undefined {
  const value = login.trim().toLowerCase();
  return DEMO_ACCOUNTS.find(
    (account) => account.login === value || (account.aliases as readonly string[]).includes(value),
  );
}
