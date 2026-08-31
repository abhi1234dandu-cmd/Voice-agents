import { DashboardShell } from "@/components/DashboardShell";

const sections = new Set([
  "overview",
  "agents",
  "phone-numbers",
  "calls",
  "live-calls",
  "knowledge-bases",
  "analytics",
  "integrations",
  "api-webhooks",
  "billing",
  "team",
  "settings",
]);

export default async function DashboardSectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  return (
    <DashboardShell
      activeSection={sections.has(section) ? section : "overview"}
    />
  );
}
