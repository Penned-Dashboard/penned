import { notificationLook, type NotificationIconName, type NotificationTone } from "@/lib/notification-display";

const TONES: Record<NotificationTone, string> = {
  calm: "bg-[#e6f0f6] text-[var(--penned-navy)]",
  good: "bg-[#eef8c4] text-[var(--penned-navy)]",
  urgent: "bg-[#fdebd3] text-[#8a4b08]",
};

const stroke = {
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

function Shape({ name }: { name: NotificationIconName }) {
  switch (name) {
    case "draft":
      return (
        <>
          <path d="M7 3.5h7l4 4V20.5H7z" {...stroke} />
          <path d="M14 3.5v4h4M10 12.5h5M10 16h5" {...stroke} />
        </>
      );
    case "clock":
      return (
        <>
          <circle cx="12" cy="12" r="8.5" {...stroke} />
          <path d="M12 7.5V12l3 2" {...stroke} />
        </>
      );
    case "alert":
      return (
        <>
          <path d="M12 4.5 3.5 19.5h17L12 4.5Z" {...stroke} />
          <path d="M12 10.5v4M12 17v.2" {...stroke} />
        </>
      );
    case "comment":
      return <path d="M5 5.5h14v10H10.5l-4 3.5v-3.5H5z" {...stroke} />;
    case "money":
      return (
        <>
          <circle cx="12" cy="12" r="8.5" {...stroke} />
          <path d="M12 7v10M14.6 9.6c-.5-.9-1.4-1.4-2.6-1.4-1.5 0-2.5.8-2.5 1.9 0 2.6 5.2 1.2 5.2 3.9 0 1.1-1.1 1.9-2.7 1.9-1.3 0-2.3-.6-2.8-1.6" {...stroke} />
        </>
      );
    case "order":
      return (
        <>
          <path d="M9 4.5h6v3H9z" {...stroke} />
          <path d="M9 6H6.5v14.5h11V6H15M9.5 12.5h5M9.5 16h5" {...stroke} />
        </>
      );
    case "person":
      return (
        <>
          <circle cx="12" cy="8.5" r="3.5" {...stroke} />
          <path d="M5 20c.8-3.5 3.5-5.5 7-5.5s6.2 2 7 5.5" {...stroke} />
        </>
      );
    case "check":
      return (
        <>
          <circle cx="12" cy="12" r="8.5" {...stroke} />
          <path d="m8.5 12.2 2.5 2.5 4.8-5.2" {...stroke} />
        </>
      );
    case "pen":
      return (
        <>
          <path d="m4.5 19.5 1-4L16 5l3 3L8.5 18.5l-4 1Z" {...stroke} />
          <path d="m14 7 3 3" {...stroke} />
        </>
      );
    case "cancel":
      return (
        <>
          <circle cx="12" cy="12" r="8.5" {...stroke} />
          <path d="m9 9 6 6M15 9l-6 6" {...stroke} />
        </>
      );
    default:
      return (
        <>
          <path d="M6 9a6 6 0 1 1 12 0c0 4.5 1.5 6 2 6.5H4c.5-.5 2-2 2-6.5Z" {...stroke} />
          <path d="M10 19a2 2 0 0 0 4 0" {...stroke} />
        </>
      );
  }
}

/** The small round icon beside a notification: shape by kind, colour by urgency. */
export function NotificationIcon({ kind }: { kind: string }) {
  const look = notificationLook(kind);
  return (
    <span
      aria-hidden="true"
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${TONES[look.tone]}`}
    >
      <svg fill="none" height="18" viewBox="0 0 24 24" width="18">
        <Shape name={look.icon} />
      </svg>
    </span>
  );
}
