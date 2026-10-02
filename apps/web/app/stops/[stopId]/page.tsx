import { notFound } from "next/navigation";
import { StopDetailView } from "@/components/stop-detail-view";
import { getApi } from "@/lib/api";

type Props = { params: Promise<{ stopId: string }> };

export default async function StopDetailPage({ params }: Props) {
  const { stopId } = await params;

  let stop;
  try {
    stop = await getApi().getStop(stopId);
  } catch {
    notFound();
  }

  return <StopDetailView stop={stop} />;
}
