import { cookies } from "next/headers";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { redirect } from "next/navigation";
import { isRole, type Role } from "@/lib/types";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type AppUser = {
  authId: string;
  profileId: string;
  email: string;
  fullName: string;
  role: Role;
  source: "workspace" | "clerk";
};

const SESSION_COOKIE = "penned-session";
const PASSWORD_SETUP_MESSAGE =
  "Password sign-in is not ready yet. Run the latest Supabase upgrade SQL.";

export function hasClerkEnv() {
  return Boolean(
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY,
  );
}

export async function getCurrentAppUser(): Promise<AppUser | null> {
  if (hasClerkEnv()) {
    const { currentUser } = await import("@clerk/nextjs/server");
    const user = await currentUser();

    if (!user) {
      return null;
    }

    const primaryEmail =
      user.emailAddresses.find(
        (emailAddress) => emailAddress.id === user.primaryEmailAddressId,
      )?.emailAddress ??
      user.emailAddresses[0]?.emailAddress ??
      `${user.id}@users.penned.local`;
    const fullName =
      [user.firstName, user.lastName].filter(Boolean).join(" ").trim() ||
      user.username ||
      "Penned User";
    const metadataRole = user.publicMetadata.role;
    const roleValue = typeof metadataRole === "string" ? metadataRole : null;
    const role: Role = isRole(roleValue) ? roleValue : "client";
    const profileId = await syncExternalProfile({
      externalAuthId: user.id,
      email: primaryEmail,
      fullName,
      role,
    });

    return {
      authId: user.id,
      profileId,
      email: primaryEmail,
      fullName,
      role,
      source: "clerk",
    };
  }

  const session = await readWorkspaceSession();

  if (!session) {
    return null;
  }

  return session;
}

export async function requireAppUser() {
  const user = await getCurrentAppUser();

  if (user) {
    return user;
  }

  redirect("/sign-in");
}

export async function requireRole(role: Role) {
  const user = await requireAppUser();

  if (user.role !== role) {
    redirect(`/${user.role}`);
  }

  return user;
}

export async function createWorkspaceUser({
  email,
  fullName,
  role,
  companyName,
  password,
}: {
  email: string;
  fullName: string;
  role: Role;
  companyName?: string;
  password: string;
}) {
  const supabase = createServerSupabaseClient();
  const normalizedEmail = email.toLowerCase();
  const resolvedRole = resolveRole(normalizedEmail, role);

  if (!supabase) {
    throw new Error("Supabase must be configured before creating workspace users.");
  }

  const { data: existing, error: existingError } = await supabase
    .from("profiles")
    .select("id, role, email, full_name, password_hash")
    .eq("email", normalizedEmail)
    .maybeSingle();

  ensurePasswordSupport(existing, existingError?.message ?? null);

  if (existing) {
    if (existing.password_hash) {
      throw new Error("An account already exists for that email.");
    }

    const { data: updated, error: updateError } = await supabase
      .from("profiles")
      .update({
        full_name: fullName,
        role: resolvedRole,
        company_name: companyName || null,
        password_hash: hashPassword(password),
      })
      .eq("id", existing.id)
      .select("id, role, email, full_name")
      .single();

    if (updateError || !updated) {
      throw new Error(updateError?.message ?? "Could not finish account setup.");
    }

    await setWorkspaceSession({
      authId: updated.id,
      profileId: updated.id,
      email: updated.email,
      fullName: updated.full_name,
      role: updated.role,
      source: "workspace",
    });
    return updated;
  }

  const { data, error } = await supabase
    .from("profiles")
    .insert({
      email: normalizedEmail,
      full_name: fullName,
      role: resolvedRole,
      company_name: companyName || null,
      password_hash: hashPassword(password),
    })
    .select("id, role, email, full_name")
    .single();

  if (error || !data) {
    ensurePasswordSupport(null, error?.message ?? null);
    throw new Error(error?.message ?? "Could not create user.");
  }

  await setWorkspaceSession({
    authId: data.id,
    profileId: data.id,
    email: data.email,
    fullName: data.full_name,
    role: data.role,
    source: "workspace",
  });

  return data;
}

export async function signInWorkspaceUser(email: string) {
  const supabase = createServerSupabaseClient();

  if (!supabase) {
    throw new Error("Supabase must be configured before sign-in.");
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id, role, email, full_name, password_hash")
    .eq("email", email.toLowerCase())
    .maybeSingle();

  ensurePasswordSupport(data, error?.message ?? null);

  if (error || !data || !data.password_hash) {
    throw new Error("No workspace account was found for that email.");
  }

  return data;
}

export async function signInWorkspaceUserWithPassword(email: string, password: string) {
  const data = await signInWorkspaceUser(email);

  if (!verifyPassword(password, data.password_hash)) {
    throw new Error("Incorrect email or password.");
  }

  let activeRole = data.role;
  const resolvedRole = resolveRole(data.email, data.role);

  if (resolvedRole !== data.role) {
    const supabase = createServerSupabaseClient();

    if (!supabase) {
      throw new Error("Supabase must be configured before sign-in.");
    }

    const { data: updated, error } = await supabase
      .from("profiles")
      .update({ role: resolvedRole })
      .eq("id", data.id)
      .select("role")
      .single();

    if (error || !updated) {
      throw new Error(error?.message ?? "Could not update admin access.");
    }

    activeRole = updated.role;
  }

  await setWorkspaceSession({
    authId: data.id,
    profileId: data.id,
    email: data.email,
    fullName: data.full_name,
    role: activeRole,
    source: "workspace",
  });

  return {
    ...data,
    role: activeRole,
  };
}

export async function signOutWorkspaceUser() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

async function syncExternalProfile({
  externalAuthId,
  email,
  fullName,
  role,
}: {
  externalAuthId: string;
  email: string;
  fullName: string;
  role: Role;
}) {
  const supabase = createServerSupabaseClient();

  if (!supabase) {
    throw new Error("Supabase must be configured before external auth is used.");
  }

  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("external_auth_id", externalAuthId)
    .maybeSingle();

  if (existing?.id) {
    await supabase
      .from("profiles")
      .update({
        email,
        full_name: fullName,
        role,
      })
      .eq("id", existing.id);

    return existing.id;
  }

  const { data, error } = await supabase
    .from("profiles")
    .insert({
      external_auth_id: externalAuthId,
      email,
      full_name: fullName,
      role,
    })
    .select("id")
    .single();

  if (error || !data?.id) {
    throw new Error(error?.message ?? "Could not sync external profile.");
  }

  return data.id;
}

async function setWorkspaceSession(user: AppUser) {
  const cookieStore = await cookies();
  cookieStore.set(
    SESSION_COOKIE,
    JSON.stringify({
      authId: user.authId,
      profileId: user.profileId,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      source: user.source,
    }),
    {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
      secure: process.env.NODE_ENV === "production",
    },
  );
}

async function readWorkspaceSession(): Promise<AppUser | null> {
  const raw = (await cookies()).get(SESSION_COOKIE)?.value;

  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<AppUser>;

    if (
      typeof parsed.profileId === "string" &&
      typeof parsed.email === "string" &&
      typeof parsed.fullName === "string" &&
      isRole(parsed.role)
    ) {
      return {
        authId: parsed.authId ?? parsed.profileId,
        profileId: parsed.profileId,
        email: parsed.email,
        fullName: parsed.fullName,
        role: parsed.role,
        source: "workspace",
      };
    }

    return null;
  } catch {
    return null;
  }
}

function resolveRole(email: string, requestedRole: Role): Role {
  const adminEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  if (adminEmails.includes(email)) {
    return "admin";
  }

  return requestedRole;
}

function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, storedHash: string) {
  const [salt, originalHash] = storedHash.split(":");

  if (!salt || !originalHash) {
    return false;
  }

  const derived = scryptSync(password, salt, 64);
  const original = Buffer.from(originalHash, "hex");

  if (derived.length !== original.length) {
    return false;
  }

  return timingSafeEqual(derived, original);
}

function ensurePasswordSupport(
  data: { password_hash?: string | null } | null,
  errorMessage: string | null,
) {
  if (
    errorMessage?.includes("password_hash") ||
    (data && !Object.prototype.hasOwnProperty.call(data, "password_hash"))
  ) {
    throw new Error(PASSWORD_SETUP_MESSAGE);
  }
}
