import { switchWorkspaceRoleAction } from "@/app/(auth)/actions";
import { getCurrentAppUser } from "@/lib/auth";
import { roles, type Role } from "@/lib/types";

export async function RoleSwitcherPanel({ currentRole }: { currentRole: Role }) {
  const currentUser = await getCurrentAppUser();
  const canSwitchRoles = canUseRoleSwitcher(currentUser?.email, currentRole);

  if (!canSwitchRoles) {
    return null;
  }

  return (
    <div className="mt-8 rounded-[1.25rem] border border-white/10 bg-white/5 p-3">
      <p className="px-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--penned-sky)]">
        Test as role
      </p>
      <form action={switchWorkspaceRoleAction} className="mt-3 space-y-2">
        <select
          className="w-full rounded-xl border border-white/10 bg-[var(--penned-navy)] px-3 py-2 text-sm text-white"
          defaultValue={currentRole}
          name="role"
        >
          {roles.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <button className="button-accent w-full !py-2 text-sm" type="submit">
          Switch role
        </button>
      </form>
      <p className="mt-2 px-1 text-[11px] leading-4 text-slate-300">
        Editor / manager portals are not separate yet — use writer + admin for team testing.
      </p>
    </div>
  );
}

function canUseRoleSwitcher(email: string | undefined, role: Role) {
  if (role === "admin") {
    return true;
  }

  const adminEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  return Boolean(email && adminEmails.includes(email.toLowerCase()));
}
