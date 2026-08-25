const ACCOUNT_MANAGER = {
  name: "Sarah K.",
  firstName: "Sarah",
  email: "hello@fipublishing.com",
};

const priorityMessage =
  "I'd like to find out if I qualify for Priority Account terms.";

export function AccountManagerCard({
  variant = "card",
}: {
  variant?: "card" | "inline" | "quiet";
}) {
  const messageHref = `mailto:${ACCOUNT_MANAGER.email}?subject=Content%20budget%20help`;
  const priorityHref = `mailto:${ACCOUNT_MANAGER.email}?subject=Priority%20Account%20status&body=${encodeURIComponent(priorityMessage)}`;

  if (variant === "inline") {
    return (
      <p className="text-sm leading-6 text-slate-600">
        Your account manager: {ACCOUNT_MANAGER.name} —{" "}
        <a className="font-semibold text-blue-700" href={messageHref}>
          Message {ACCOUNT_MANAGER.firstName} →
        </a>
      </p>
    );
  }

  if (variant === "quiet") {
    return (
      <div className="rounded-[1.25rem] border border-dashed border-slate-200 bg-slate-50 p-5">
        <p className="text-sm leading-6 text-slate-600">
          Not sure which option is right? Your account manager can help — honest advice, no
          pitch.
        </p>
        <a className="mt-3 inline-flex text-sm font-semibold text-blue-700" href={messageHref}>
          Message them →
        </a>
      </div>
    );
  }

  return (
    <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-5">
      <div className="flex items-start gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-cyan-400 text-sm font-semibold text-white">
          SK
        </span>
        <div className="min-w-0">
          <p className="text-sm text-slate-500">Your account manager</p>
          <h3 className="mt-1 text-2xl font-semibold text-slate-950">{ACCOUNT_MANAGER.name}</h3>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Not sure which option is right? Your account manager can help — honest advice, no
            pitch.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <a className="button-secondary" href={messageHref}>
              Message {ACCOUNT_MANAGER.firstName}
            </a>
            <a className="text-sm font-semibold text-blue-700" href={priorityHref}>
              Ask about Priority Account status →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
