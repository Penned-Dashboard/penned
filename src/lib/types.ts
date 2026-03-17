export const roles = ["client", "writer", "admin"] as const;

export type Role = (typeof roles)[number];

export function isRole(value: string | null): value is Role {
  return roles.includes(value as Role);
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
