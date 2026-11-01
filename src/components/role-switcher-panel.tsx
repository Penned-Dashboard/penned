import { switchWorkspaceRoleAction } from "@/app/(auth)/actions";
import { getCurrentAppUser } from "@/lib/auth";
import { roles, type Role } from "@/lib/types";

export async function RoleSwitcherPanel({ currentRole }: { currentRole: Role }) {
  const currentUser = await getCurrentAppUser();
  const canSwitchRoles = Boolean(
    currentUser?.canSwitchRoles ||
      currentUser?.role === "admin" ||
      (currentUser?.email &&
        (process.env.ADMIN_EMAILS ?? "")
          .split(",")
          .map((value) => value.trim().toLowerCase())
          .includes(currentUser.email.toLowerCase())),
  );

  if (!canSwitchRoles || !currentUser) {
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
        This only changes what you see for testing. Pick admin again any time to come back.
      </p>
    </div>
  );
}
