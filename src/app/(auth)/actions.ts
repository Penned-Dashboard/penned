"use server";

import { redirect } from "next/navigation";
import {
  createWorkspaceUser,
  signInWorkspaceUserWithPassword,
  signOutWorkspaceUser,
} from "@/lib/auth";
import { isRole } from "@/lib/types";

export async function signUpAction(formData: FormData) {
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const fullName = `${firstName} ${lastName}`.trim();
  const email = String(formData.get("email") ?? "").trim();
  const roleValue = String(formData.get("role") ?? "").trim();
  const companyName = String(formData.get("companyName") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!firstName || !lastName || !email || password.length < 8 || !isRole(roleValue)) {
    redirect("/sign-up?error=invalid");
  }

  let user;

  try {
    user = await createWorkspaceUser({
      fullName,
      email,
      role: roleValue,
      companyName,
      password,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    redirect(
      message.includes("password sign-in")
        ? "/sign-up?error=setup"
        : "/sign-up?error=exists",
    );
  }

  redirect(`/${user.role}`);
}

export async function signInAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    redirect("/sign-in?error=missing-credentials");
  }

  let user;

  try {
    user = await signInWorkspaceUserWithPassword(email, password);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    redirect(
      message.includes("password sign-in")
        ? "/sign-in?error=setup"
        : "/sign-in?error=invalid",
    );
  }

  redirect(`/${user.role}`);
}

export async function signOutAction() {
  await signOutWorkspaceUser();
  redirect("/");
}
