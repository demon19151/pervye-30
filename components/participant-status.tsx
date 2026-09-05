import { Badge, StatusDot } from "@/components/ui/badge";
import { statusLabel } from "@/lib/services/statsService";
import type { ParticipantStats, ParticipantStatus } from "@/lib/types";

const tones: Record<ParticipantStatus, "success" | "caution" | "warning"> = {
  active: "success",
  missed: "caution",
  needs_support: "warning",
};

/** Жёлтый и оранжевый — только про внимание куратора, не про оценку человека. */
export function StatusBadge({ stats }: { stats: ParticipantStats }) {
  const tone = tones[stats.status];

  return (
    <Badge tone={tone}>
      <StatusDot tone={tone} />
      {statusLabel(stats)}
    </Badge>
  );
}
