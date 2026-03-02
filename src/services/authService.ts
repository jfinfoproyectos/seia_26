import { authClient } from "@/lib/auth-client";

type Role = "admin" | "teacher" | "student";

export function getRoleFromUser(user: unknown): Role | null {
  const u = user as { role?: string; roles?: string[] } | null | undefined;
  if (!u) return null;
  const r = Array.isArray(u?.roles) ? u?.roles[0] : u?.role;
  if (r === "admin" || r === "teacher" || r === "student") return r as Role;
  return "student";
}

export function getRedirectForSession(session: unknown): string | null {
  const s = session as { user?: unknown } | null | undefined;
  if (!s?.user) return null;
  const role = getRoleFromUser(s.user);
  if (role === "admin") return "/dashboard/admin";
  if (role === "teacher") return "/dashboard/teacher";
  return "/dashboard/student";
}

export async function signInEmail(payload: { email: string; password: string }): Promise<void> {
  await authClient.signIn.email(payload);
}

export async function signInSocial(provider: "google"): Promise<void> {
  await authClient.signIn.social({ provider, callbackURL: "/signin" });
}

export async function signUpEmail(payload: {
  email: string;
  password: string;
  name?: string;
  confirmPassword?: string;
}): Promise<void> {
  if (payload.confirmPassword !== undefined && payload.password !== payload.confirmPassword) {
    throw new Error("Las contraseñas no coinciden");
  }
  if (payload.password.length < 8) {
    throw new Error("La contraseña debe tener al menos 8 caracteres");
  }
  await authClient.signUp.email({ email: payload.email, password: payload.password, name: "" });
}

export async function signOut(): Promise<void> {
  await authClient.signOut();
}

export function getPostLogoutRedirect(): string {
  return "/signin";
}
