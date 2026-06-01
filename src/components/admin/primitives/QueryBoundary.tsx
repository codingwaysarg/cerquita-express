import { Skeleton } from "@/components/ui/skeleton";
import { InlineRetry } from "./InlineRetry";
import { EmptyState } from "./EmptyState";
import type { ReactNode } from "react";

interface Props<T> {
  query: { data?: T; isLoading: boolean; isError: boolean; refetch: () => void };
  isEmpty?: (data: T) => boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  skeleton?: ReactNode;
  children: (data: T) => ReactNode;
}

export function QueryBoundary<T>({ query, isEmpty, emptyTitle = "Aún no hay datos", emptyDescription, skeleton, children }: Props<T>) {
  if (query.isLoading) return <>{skeleton || <div className="space-y-2"><Skeleton className="h-8 w-full" /><Skeleton className="h-8 w-full" /><Skeleton className="h-8 w-full" /></div>}</>;
  if (query.isError || !query.data) return <InlineRetry onRetry={query.refetch} />;
  if (isEmpty && isEmpty(query.data)) return <EmptyState variant="no-data" title={emptyTitle} description={emptyDescription} />;
  return <>{children(query.data)}</>;
}
