export const roles = ["client", "writer", "admin", "account_manager", "editor"] as const;

export type Role = (typeof roles)[number];

export function isRole(value: string | null | undefined): value is Role {
  return roles.includes(value as Role);
}

/** URL segment for a role workspace (account_manager → account-manager). */
export function rolePath(role: Role) {
  if (role === "account_manager") return "/account-manager";
  return `/${role}`;
}

export function roleLabel(role: Role) {
  if (role === "account_manager") return "Account Manager";
  if (role === "editor") return "Editor";
  return role.charAt(0).toUpperCase() + role.slice(1);
}

export type Metric = {
  label: string;
  value: string;
  hint: string;
};

export type FormField = {
  label: string;
  placeholder: string;
  kind: "text" | "email" | "url" | "date" | "textarea";
  large?: boolean;
};
