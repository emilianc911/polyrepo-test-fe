const KEY = "polyrepo.token";

export const tokenStore = {
  get(): string | null {
    try {
      return localStorage.getItem(KEY);
    } catch {
      return null;
    }
  },
  set(token: string): void {
    try {
      localStorage.setItem(KEY, token);
    } catch {
      // ignore
    }
  },
  clear(): void {
    try {
      localStorage.removeItem(KEY);
    } catch {
      // ignore
    }
  },
};
