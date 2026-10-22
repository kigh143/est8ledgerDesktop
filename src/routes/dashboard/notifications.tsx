import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import {
  Bell,
  Banknote,
  ClipboardCheck,
  FileSignature,
  CheckCircle2,
  Wrench,
  CalendarClock,
  CheckCheck,
  Loader2,
} from "lucide-react";
import { toast } from "react-toastify";
import { useAppStore } from "../../store";
import notificationService from "../../services/notificationService";
import { EmptyState, PageHeader, Segmented } from "../../componennts/dashboard/ui";
import type { AppNotification } from "../../types";

export const Route = createFileRoute("/dashboard/notifications")({
  loader: async () => {
    const { activeProperty } = useAppStore.getState();
    if (!activeProperty) return { notifications: [] as AppNotification[] };
    const res = await notificationService.getPropertyNotifications(activeProperty.id.toString());
    const notifications: AppNotification[] = Array.isArray(res) ? res : res?.data ?? [];
    return { notifications };
  },
  component: NotificationsPage,
});

const typeMeta: Record<string, { icon: typeof Bell; tint: string }> = {
  deposit_reminder: { icon: Banknote, tint: "bg-[#ff9500]/[0.12] text-[#c93400]" },
  deposit_paid: { icon: CheckCircle2, tint: "bg-[#34c759]/[0.12] text-[#248a3d]" },
  inspection_pending: { icon: ClipboardCheck, tint: "bg-[#3f0ee3]/[0.08] text-[#3f0ee3]" },
  agreement_signed: { icon: FileSignature, tint: "bg-[#34c759]/[0.12] text-[#248a3d]" },
  maintenance_request: { icon: Wrench, tint: "bg-[#ff3b30]/[0.10] text-[#d70015]" },
  lease_expiring: { icon: CalendarClock, tint: "bg-[#ff9500]/[0.12] text-[#c93400]" },
};

const relativeTime = (value?: string | null) => {
  if (!value) return "";
  const diff = Date.now() - new Date(value).getTime();
  const minutes = Math.round(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

type Filter = "all" | "unread";

function NotificationsPage() {
  const { notifications } = Route.useLoaderData();
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("all");
  // Read state is applied locally first so the list responds instantly.
  const [readIds, setReadIds] = useState<Set<AppNotification["id"]>>(new Set());
  const [markingAll, setMarkingAll] = useState(false);

  const isRead = (n: AppNotification) => n.isRead || readIds.has(n.id);
  const unread = notifications.filter((n) => !isRead(n));
  const visible = (filter === "unread" ? unread : notifications)
    .slice()
    .sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime());

  const markRead = async (n: AppNotification) => {
    if (isRead(n)) return;
    setReadIds((prev) => new Set(prev).add(n.id));
    try {
      await notificationService.markAsReadNotification(n.id.toString());
    } catch {
      setReadIds((prev) => {
        const next = new Set(prev);
        next.delete(n.id);
        return next;
      });
    }
  };

  const markAllRead = async () => {
    setMarkingAll(true);
    try {
      await Promise.all(unread.map((n) => notificationService.markAsReadNotification(n.id.toString())));
      toast.success("All notifications marked as read");
      await router.invalidate();
    } catch {
      toast.error("Some notifications couldn't be marked as read. Try again.");
    } finally {
      setMarkingAll(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader
        title="Notifications"
        subtitle={unread.length > 0 ? `${unread.length} unread` : "You're all caught up"}
        actions={
          unread.length > 0 && (
            <button onClick={markAllRead} disabled={markingAll} className="btn btn-secondary">
              {markingAll ? <Loader2 size={15} className="animate-spin" /> : <CheckCheck size={16} />}
              Mark all as read
            </button>
          )
        }
      />

      <Segmented<Filter>
        ariaLabel="Filter notifications"
        value={filter}
        onChange={setFilter}
        options={[
          { value: "all", label: "All", count: notifications.length },
          { value: "unread", label: "Unread", count: unread.length },
        ]}
      />

      <div className="card overflow-hidden">
        {visible.length === 0 ? (
          <EmptyState
            icon={Bell}
            title={filter === "unread" ? "No unread notifications" : "No notifications yet"}
            message="Payments, signed agreements, inspections and repair requests for this property show up here."
          />
        ) : (
          <ul className="divide-y divide-black/[0.06]">
            {visible.map((n) => {
              const meta = typeMeta[n.type ?? ""] ?? { icon: Bell, tint: "bg-slate-100 text-slate-500" };
              const Icon = meta.icon;
              const read = isRead(n);
              return (
                <li key={n.id}>
                  <button
                    onClick={() => markRead(n)}
                    className={`flex w-full items-start gap-3.5 px-5 py-4 text-left transition-colors hover:bg-slate-50 ${
                      read ? "" : "bg-[#3f0ee3]/[0.025]"
                    }`}
                  >
                    <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${meta.tint}`}>
                      <Icon size={17} />
                    </span>
                    <span className="min-w-0 flex-1">
                      {n.title && (
                        <span className={`block text-[15px] ${read ? "font-medium text-slate-700" : "font-semibold text-slate-900"}`}>
                          {n.title}
                        </span>
                      )}
                      <span className={`block text-sm leading-relaxed ${read ? "text-slate-500" : "text-slate-700"}`}>
                        {n.message}
                      </span>
                      <span className="mt-1 block text-xs text-slate-400">{relativeTime(n.createdAt)}</span>
                    </span>
                    {!read && <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-[#007aff]" aria-label="Unread" />}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
