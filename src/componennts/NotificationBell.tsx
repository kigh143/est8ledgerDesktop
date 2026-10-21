import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Bell } from "lucide-react";
import notificationService from "../services/notificationService";
import type { AppNotification } from "../types";

/** Toolbar bell with the property's unread notification count. */
export default function NotificationBell({ propertyId }: { propertyId?: number | string }) {
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!propertyId) return;
    let cancelled = false;
    notificationService
      .getPropertyNotifications(propertyId.toString())
      .then((res) => {
        const list: AppNotification[] = Array.isArray(res) ? res : res?.data ?? [];
        if (!cancelled) setUnread(list.filter((n) => !n.isRead).length);
      })
      .catch(() => {
        // The badge is a hint; the notifications page surfaces real errors.
      });
    return () => {
      cancelled = true;
    };
  }, [propertyId]);

  return (
    <Link
      to="/dashboard/notifications"
      aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
      className="relative flex h-9 w-9 items-center justify-center rounded-full text-slate-700 hover:bg-black/5"
    >
      <Bell size={19} strokeWidth={1.75} />
      {unread > 0 && (
        <span className="absolute right-0.5 top-0.5 flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-[#ff3b30] px-1 text-[10px] font-semibold text-white ring-2 ring-slate-50 tabular-nums">
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </Link>
  );
}
