export function PennedLogo({
  tone = "dark",
  showWordmark = true,
  compact = false,
}: {
  tone?: "dark" | "light";
  showWordmark?: boolean;
  compact?: boolean;
}) {
  const textClass = tone === "light" ? "text-white" : "text-[var(--penned-navy)]";

  return (
    <span className={`inline-flex items-center ${compact ? "gap-2.5" : "gap-3"}`}>
      <span className="brand-mark" aria-hidden="true">
        <svg viewBox="0 0 64 64" className="h-full w-full" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="32" cy="32" r="32" fill="#17253F" />
          <path
            d="M22.5 15h13.2c9.1 0 14.8 5.1 14.8 13.2 0 8.2-5.7 13.3-14.8 13.3H29.2V49H22.5V15Zm6.8 20.2h5.8c4.9 0 7.9-2.5 7.9-6.9 0-4.4-3-6.9-7.9-6.9h-5.8v13.8Z"
            fill="#DDF479"
          />
          <circle cx="42.2" cy="28.4" r="1.7" fill="#17253F" />
          <circle cx="46.8" cy="28.4" r="1.7" fill="#17253F" />
        </svg>
      </span>
      {showWordmark ? (
        <span className={`brand-wordmark ${textClass}`}>Penned.</span>
      ) : (
        <span className="sr-only">Penned</span>
      )}
    </span>
  );
}
