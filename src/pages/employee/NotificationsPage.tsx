import { useEffect, useRef, useState } from "react";
import { useAppSelector, useAppDispatch } from "@/hooks/useRedux";
import { markAllAsRead, markAsRead } from "@/store/slices/notificationSlice";
import { formatRelativeTime } from "@/utils/date";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { SkeletonCard } from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import { NOTIFICATION_TYPE_LABELS } from "@/constants";
import { Bell } from "lucide-react";

const PAGE_SIZE = 20;

export default function NotificationsPage() {
  const { items, unreadCount, isLoading } = useAppSelector((s) => s.notifications);
  const dispatch = useAppDispatch();
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const visibleItems = items.slice(0, visibleCount);
  const hasMore = visibleCount < items.length;

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore) return;
    let timeoutId: number | undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setIsLoadingMore(true);
          timeoutId = window.setTimeout(() => {
            setVisibleCount((prev) => Math.min(items.length, prev + PAGE_SIZE));
            setIsLoadingMore(false);
          }, 300);
        }
      },
      { rootMargin: "150px" },
    );

    observer.observe(el);
    return () => {
      observer.disconnect();
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
    };
  }, [hasMore, items.length]);

  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-app">Notifications</h1>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => dispatch(markAllAsRead())}
          >
            Mark all read
          </Button>
        )}
      </div>

      {isLoading && items.length === 0 ? (
        <div className="space-y-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Bell className="h-8 w-8 text-app-muted" />}
          title="No notifications"
          description="You're all caught up! Notifications will appear here."
        />
      ) : (
        <>
          <div className="space-y-2">
            {visibleItems.map((notif) => (
              <button
                key={notif.id}
                onClick={() => {
                  if (!notif.isRead) dispatch(markAsRead(notif.id));
                }}
                className="w-full text-left block focus:outline-none"
              >
                <Card
                  padding="md"
                  className={`transition-colors ${!notif.isRead ? "border-l-2 border-l-primary" : ""} cursor-pointer hover:bg-surface-200 dark:hover:bg-surface-muted`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className={`text-sm font-medium ${!notif.isRead ? "text-app" : "text-app-muted"}`}>
                          {notif.title}
                        </p>
                        {notif.type && NOTIFICATION_TYPE_LABELS[notif.type] && (
                          <span className="text-[10px] uppercase tracking-wide text-primary font-medium">
                            {NOTIFICATION_TYPE_LABELS[notif.type]}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-app-muted mt-1">{notif.message}</p>
                      <p className="text-[11px] text-app-muted mt-2">
                        {formatRelativeTime(notif.createdAt)}
                      </p>
                    </div>
                    {!notif.isRead && (
                      <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-2" />
                    )}
                  </div>
                </Card>
              </button>
            ))}
          </div>

          {hasMore && (
            <div ref={sentinelRef} className="pt-2">
              {isLoadingMore && <SkeletonCard />}
            </div>
          )}
        </>
      )}
    </div>
  );
}