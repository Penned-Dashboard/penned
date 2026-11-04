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
  const markSize = compact ? 36 : 44;
  const wordmarkHeight = compact ? 22 : 28;
  const wordmarkWidth = Math.round(wordmarkHeight * (786 / 204));
  const wordmarkSrc =
    tone === "light" ? "/brand/penned-wordmark-light.png" : "/brand/penned-wordmark.png";

  return (
    <span className={`inline-flex items-center ${compact ? "gap-2.5" : "gap-3"}`}>
      <Image
        alt=""
        aria-hidden="true"
        className="shrink-0"
        height={markSize}
        priority
        src="/brand/penned-mark.png"
        width={markSize}
      />
      {showWordmark ? (
        <Image
          alt="Penned."
          className="h-auto w-auto"
          height={wordmarkHeight}
          priority
          src={wordmarkSrc}
          style={{ height: wordmarkHeight, width: "auto" }}
          width={wordmarkWidth}
        />
      ) : (
        <span className="sr-only">Penned</span>
      )}
    </span>
  );
}
