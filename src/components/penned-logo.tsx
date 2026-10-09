import Image from "next/image";

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
    <span className={`inline-flex items-center gap-3 ${compact ? "gap-2.5" : ""}`}>
      <span className="brand-mark">
        <Image
          alt="Penned"
          className="h-full w-full"
          height={40}
          priority
          src="/brand/penned-mark.svg"
          width={40}
        />
      </span>
      {showWordmark ? <span className={`brand-wordmark ${textClass}`}>Penned.</span> : null}
    </span>
  );
}
