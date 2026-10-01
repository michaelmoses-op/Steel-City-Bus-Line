import { notFound } from "next/navigation";
import { RouteDetailView } from "@/components/route-detail-view";
import { api } from "@/lib/api";

type Props = { params: Promise<{ routeId: string }> };

export default async function RouteDetailPage({ params }: Props) {
  const { routeId } = await params;

  let route;
  try {
    route = await api.getRoute(routeId);
  } catch {
    notFound();
  }

  return <RouteDetailView route={route} />;
}
