import Link from "next/link";
import { DashboardShell, SectionCard } from "@/components/dashboard-shell";
import { EmptyState } from "@/components/writer-ui";
import { requireRole } from "@/lib/auth";
import { getWriterRankingBoard, type RankingPeriod, type RankingTab } from "@/lib/orders";

const TABS: { key: RankingTab; label: string; blurb: string }[] = [
  { key: "earners", label: "Top earners", blurb: "Writers ranked by approved-work earnings." },
  { key: "quality", label: "Highest quality", blurb: "Writers ranked by client rating, then ranking score." },
  { key: "reliable", label: "Most reliable", blurb: "Writers ranked by on-time delivery rate." },
  { key: "rising", label: "Fastest rising", blurb: "Writers gaining ranking score the quickest." },
];

const PERIODS: { key: RankingPeriod; label: string }[] = [
  { key: "weekly", label: "Weekly" },
  { key: "monthly", label: "Monthly" },
  { key: "all", label: "All-time" },
];

export default async function WriterRankingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; period?: string }>;
}) {
  const user = await requireRole("writer");
  const params = await searchParams;
  const tab = TABS.find((item) => item.key === params.tab) ?? TABS[0];
  const period = PERIODS.find((item) => item.key === params.period)?.key ?? "all";
  const board = await getWriterRankingBoard(tab.key, period, user.profileId);
  const periodLabel = PERIODS.find((item) => item.key === period)?.label ?? "All-time";

  return (
    <DashboardShell
      role="writer"
      title="Rankings"
      description="See how you compare with other Penned writers."
      ctaLabel="Find a job"
      ctaHref="/writer/marketplace"
      currentPath="/writer/rankings"
      userName={user.fullName}
      searchAction="/writer/rankings"
      tabs={TABS.map((item) => ({
        label: item.label,
        href: `/writer/rankings?tab=${item.key}&period=${period}`,
        active: item.key === tab.key,
      }))}
    >
      <SectionCard title={`${tab.label} · ${periodLabel}`} description={tab.blurb}>
        <div className="mb-5 flex flex-wrap gap-2">
          {PERIODS.map((item) => (
            <Link
              key={item.key}
              className={item.key === period ? "button-primary !px-4 !py-2 !text-sm" : "button-secondary !px-4 !py-2 !text-sm"}
              href={`/writer/rankings?tab=${tab.key}&period=${item.key}`}
            >
              {item.label}
            </Link>
          ))}
        </div>

        {board.periodNote ? (
          <p className="mb-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            {board.periodNote}
          </p>
        ) : null}

        {board.entries.length ? (
          <div className="space-y-3">
            {board.entries.map((entry) => (
              <div
                key={entry.writerId}
                className={`dashboard-list-row ${entry.isYou ? "!border-blue-200 !bg-blue-50" : ""}`}
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[linear-gradient(135deg,#2563eb_0%,#2bb6a8_100%)] text-sm font-semibold text-white">
                    {entry.rank}
                  </span>
                  <div>
                    <p className="font-semibold text-slate-950">
                      {entry.name}
                      {entry.isYou ? <span className="ml-2 text-xs font-semibold text-blue-700">You</span> : null}
                    </p>
                    <p className="text-sm text-slate-500">{entry.secondary}</p>
                  </div>
                </div>
                <p className="text-right text-lg font-semibold text-slate-900">{entry.primary}</p>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No leaderboard data yet"
            body="Rankings appear after writers have approved jobs in the selected period."
          />
        )}
      </SectionCard>
    </DashboardShell>
  );
}
