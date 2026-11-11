"use server";

import { redirect } from "next/navigation";
import {
  createWorkspaceUser,
  getCurrentAppUser,
  signInWorkspaceUserWithPassword,
  signOutWorkspaceUser,
  switchWorkspaceRole,
} from "@/lib/auth";
import { CLIENT_TERMS_VERSION } from "@/lib/client-terms";
import { isRole } from "@/lib/types";

export async function signUpAction(formData: FormData) {
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const fullName = `${firstName} ${lastName}`.trim();
  const email = String(formData.get("email") ?? "").trim();
  const roleValue = String(formData.get("role") ?? "").trim();
  const companyName = String(formData.get("companyName") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const acceptedTerms = String(formData.get("acceptTerms") ?? "") === "on";
  const isUkCompany = String(formData.get("isUkCompany") ?? "") === "on";
  const billingCountry = isUkCompany ? "United Kingdom" : String(formData.get("billingCountry") ?? "").trim();
  const contentNeeds = String(formData.get("onboardingContentNeeds") ?? "")
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean);
  const industries = String(formData.get("onboardingIndustries") ?? "")
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean);
  const contentSource = String(formData.get("onboardingContentSource") ?? "").trim();
  const typeformStatus = String(formData.get("onboardingTypeform") ?? "").trim();

  // Public registration is client-only; writers are invited and sign in.
  if (!firstName || !lastName || !email || password.length < 8 || roleValue !== "client" || !acceptedTerms) {
    redirect("/sign-up?error=invalid");
  }

  let user;

  try {
    user = await createWorkspaceUser({
      fullName,
      email,
      role: "client",
      companyName,
      password,
      termsAcceptedAt: new Date().toISOString(),
      termsVersion: CLIENT_TERMS_VERSION,
      isUkCompany,
      billingCountry: billingCountry || null,
      onboardingAnswers: {
        agencyName: companyName || null,
        contentNeeds,
        industries,
        contentSource: contentSource || null,
        typeformStatus: typeformStatus || null,
        completedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    console.error("signUpAction failed", error);
    redirect(
      message.includes("already exists")
        ? "/sign-up?error=exists"
        : message.includes("password sign-in") || message.includes("terms / VAT columns")
          ? "/sign-up?error=setup"
          : message.includes("Supabase must be configured")
            ? "/sign-up?error=env"
            : "/sign-up?error=failed",
    );
  }

  redirect(`/sign-up/welcome?name=${encodeURIComponent(firstName)}`);
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
    console.error("signInAction failed", error);
    redirect(
      message.includes("password sign-in")
        ? "/sign-in?error=setup"
        : message.includes("Supabase must be configured")
          ? "/sign-in?error=env"
          : "/sign-in?error=invalid",
    );
  }

  redirect(`/${user.role}`);
}

export async function signOutAction() {
  await signOutWorkspaceUser();
  redirect("/");
}

export async function switchWorkspaceRoleAction(formData: FormData) {
  const roleValue = String(formData.get("role") ?? "").trim();
  const user = await getCurrentAppUser();

  if (!user || !isRole(roleValue)) {
    redirect("/sign-in");
  }

  try {
    await switchWorkspaceRole(roleValue);
  } catch (error) {
    console.error("switchWorkspaceRoleAction failed", error);
    redirect(`/${user.role}?roleSwitch=denied`);
  }

  redirect(`/${roleValue}`);
}
