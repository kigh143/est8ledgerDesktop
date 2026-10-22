import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  Check,
  ChevronLeft,
  ChevronRight,
  Circle,
  ImageOff,
  Loader2,
  Plus,
  Trash2,
  Wrench,
  X,
} from "lucide-react";
import { toast } from "react-toastify";
import { inspectionService } from "../../../services/inspectionService";
import repairBreakdownService, { type RepairBreakdown } from "../../../services/repairBreakdownService";
import { Badge, ConfirmDialog, EmptyState, type Tone } from "../../../componennts/dashboard/ui";
import { getNetworkError } from "../../../utils";
import { useAppStore } from "../../../store";
import type { InspectionCondition, InspectionItem, InspectionSection } from "../../../types";

type BreakdownItemDraft = { name: string; price: string; description: string };

interface InspectionDetails extends InspectionItem {
  repairBreakdown?: RepairBreakdown | null;
}

export const Route = createFileRoute("/dashboard/inspections/$inspectionId")({
  component: InspectionDetailPage,
  loader: async ({ params }) => {
    try {
      const response = await inspectionService.getInspection(params.inspectionId);
      return { inspection: (response?.data ?? response) as InspectionDetails };
    } catch {
      return { inspection: null };
    }
  },
});

const conditionMeta: Record<InspectionCondition, { label: string; tone: Tone }> = {
  GOOD: { label: "Good", tone: "emerald" },
  FAIR: { label: "Fair", tone: "amber" },
  DAMAGED: { label: "Damaged", tone: "red" },
};

const formatDate = (value?: string | null, withTime = false) =>
  value
    ? new Date(value).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        ...(withTime ? { hour: "numeric", minute: "2-digit" } : {}),
      })
    : "";

function InspectionDetailPage() {
  const router = useRouter();
  const { inspection: loaded } = Route.useLoaderData();
  const currency = useAppStore((s) => s.activeProperty?.currency) || "UGX";
  const [inspection, setInspection] = useState(loaded);
  const [viewer, setViewer] = useState<{ photos: string[]; index: number; title: string } | null>(null);
  const [confirmApprove, setConfirmApprove] = useState(false);
  const [approving, setApproving] = useState(false);

  if (!inspection) {
    return (
      <div className="space-y-6">
        <BackLink />
        <div className="card">
          <EmptyState
            icon={AlertCircle}
            title="Inspection not found"
            message="It may have been removed, or there was a problem loading it."
            action={
              <button onClick={() => router.invalidate()} className="btn btn-secondary">
                Try again
              </button>
            }
          />
        </div>
      </div>
    );
  }

  const typeLabel = inspection.type === "MOVE_OUT" ? "Move-out" : "Move-in";
  const tenant = inspection.tenancy?.tenant;
  const tenantName = `${tenant?.firstName ?? ""} ${tenant?.lastName ?? ""}`.trim() || "the tenant";
  const sections = (inspection.inspectionSections ?? []).filter((s) => (s.photos?.length ?? 0) > 0);
  const totalPhotos = sections.reduce((sum, s) => sum + (s.photos?.length ?? 0), 0);
  const damaged = sections.filter((s) => s.condition_status === "DAMAGED").length;
  const fullyApproved = !!inspection.tenantApprovedAt && !!inspection.managerApprovedAt;

  const handleApprove = async () => {
    setApproving(true);
    try {
      await inspectionService.approveInspectionByManagement(inspection.id.toString());
      setInspection({ ...inspection, managerApprovedAt: new Date().toISOString() });
      setConfirmApprove(false);
      toast.success("Inspection approved");
    } catch (error) {
      toast.error(getNetworkError(error));
    } finally {
      setApproving(false);
    }
  };

  return (
    <div className="space-y-8">
      <BackLink />

      {/* Title */}
      <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between animate-fade-up">
        <div className="min-w-0">
          <p className="eyebrow">{typeLabel} inspection</p>
          <h1 className="mt-1.5 truncate text-[30px] font-bold leading-tight tracking-[-0.028em] text-slate-900 capitalize">
            {tenantName}
          </h1>
          <p className="mt-1 text-[15px] text-slate-500">
            {inspection.tenancy?.unitName ? `Unit ${inspection.tenancy.unitName} · ` : ""}
            Recorded {formatDate(inspection.createdAt, true)}
          </p>
        </div>
        {!inspection.managerApprovedAt && (
          <button onClick={() => setConfirmApprove(true)} className="btn btn-primary btn-lg">
            <Check size={18} strokeWidth={2.25} />
            Approve inspection
          </button>
        )}
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* Rooms */}
        <div className="min-w-0 space-y-4">
          <div className="flex items-baseline justify-between gap-3 px-1">
            <h2 className="text-[19px] font-semibold text-slate-900">Rooms</h2>
            {sections.length > 0 && (
              <p className="text-[13px] text-slate-500 tabular-nums">
                {sections.length} {sections.length === 1 ? "area" : "areas"} · {totalPhotos}{" "}
                {totalPhotos === 1 ? "photo" : "photos"}
                {damaged > 0 && <span className="text-[#d70015]"> · {damaged} damaged</span>}
              </p>
            )}
          </div>

          {sections.length === 0 ? (
            <div className="card">
              <EmptyState
                icon={ImageOff}
                title="No photos recorded"
                message="Rooms appear here once photos are captured in the mobile app."
              />
            </div>
          ) : (
            sections.map((section, index) => (
              <SectionCard
                key={section.id}
                section={section}
                fallbackTitle={`Area ${index + 1}`}
                onOpen={(photoIndex) =>
                  setViewer({
                    photos: section.photos ?? [],
                    index: photoIndex,
                    title: section.title || `Area ${index + 1}`,
                  })
                }
              />
            ))
          )}
        </div>

        {/* Sign-off + repairs */}
        <aside className="space-y-6 lg:sticky lg:top-20 lg:self-start">
          <section className="card p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-[15px] font-semibold text-slate-900">Sign-off</h2>
              {fullyApproved ? <Badge tone="emerald">Complete</Badge> : <Badge tone="amber">In progress</Badge>}
            </div>
            <ol className="mt-4 space-y-4">
              <SignOffStep
                label="You"
                doneAt={inspection.managerApprovedAt}
                pending="Review the photos, then approve"
              />
              <SignOffStep
                label={tenant?.firstName ? tenant.firstName : "Tenant"}
                doneAt={inspection.tenantApprovedAt}
                pending="Approves from the mobile app"
              />
            </ol>
          </section>

          {inspection.type === "MOVE_OUT" && (
            <RepairBreakdownCard inspection={inspection} currency={currency} />
          )}
        </aside>
      </div>

      <ConfirmDialog
        open={confirmApprove}
        title="Approve inspection?"
        message={`This confirms you've reviewed the condition and photos recorded for this ${typeLabel.toLowerCase()} inspection.`}
        confirmLabel="Approve"
        busy={approving}
        onConfirm={handleApprove}
        onClose={() => setConfirmApprove(false)}
      />

      {viewer && <PhotoViewer {...viewer} onClose={() => setViewer(null)} />}
    </div>
  );
}

function BackLink() {
  return (
    <Link
      to="/dashboard/inspections"
      className="-ml-1.5 inline-flex items-center gap-0.5 rounded-lg px-1.5 py-1 text-[15px] font-medium text-[#3f0ee3] hover:bg-[#3f0ee3]/[0.06]"
    >
      <ChevronLeft size={18} strokeWidth={2.25} />
      Inspections
    </Link>
  );
}

function SectionCard({
  section,
  fallbackTitle,
  onOpen,
}: {
  section: InspectionSection;
  fallbackTitle: string;
  onOpen: (index: number) => void;
}) {
  const photos = section.photos ?? [];
  const condition = section.condition_status ? conditionMeta[section.condition_status] : null;
  const [lead, ...rest] = photos;

  return (
    <section className="card overflow-hidden">
      {/* Photo mosaic: the first shot leads, up to two more stack beside it. */}
      <div className={`grid aspect-[2/1] gap-1 ${rest.length > 0 ? "grid-cols-3 grid-rows-2" : ""}`}>
        <PhotoTile
          src={lead}
          alt={`${section.title || fallbackTitle}, photo 1`}
          onClick={() => onOpen(0)}
          className={rest.length > 0 ? "col-span-2 row-span-2" : ""}
        />
        {rest.slice(0, 2).map((src, i) => (
          <PhotoTile
            key={src + i}
            src={src}
            alt={`${section.title || fallbackTitle}, photo ${i + 2}`}
            onClick={() => onOpen(i + 1)}
            className={rest.length === 1 ? "row-span-2" : ""}
            more={i === 1 && rest.length > 2 ? rest.length - 2 : 0}
          />
        ))}
      </div>
      <div className="p-5">
        <div className="flex items-center justify-between gap-3">
          <h3 className="truncate text-[17px] font-semibold text-slate-900">{section.title || fallbackTitle}</h3>
          {condition && <Badge tone={condition.tone}>{condition.label}</Badge>}
        </div>
        <p className={`mt-1.5 text-sm leading-relaxed ${section.comments ? "text-slate-600" : "text-slate-400"}`}>
          {section.comments || "No notes for this area."}
        </p>
      </div>
    </section>
  );
}

function PhotoTile({
  src,
  alt,
  onClick,
  className,
  more = 0,
}: {
  src: string;
  alt: string;
  onClick: () => void;
  className: string;
  more?: number;
}) {
  return (
    <button onClick={onClick} className={`group relative min-h-0 overflow-hidden bg-slate-100 ${className}`}>
      <img
        src={src}
        alt={alt}
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-[1.03]"
      />
      {more > 0 && (
        <span className="absolute inset-0 flex items-center justify-center bg-black/45 text-[17px] font-semibold text-white">
          +{more}
        </span>
      )}
    </button>
  );
}

function SignOffStep({ label, doneAt, pending }: { label: string; doneAt?: string | null; pending: string }) {
  return (
    <li className="flex gap-3">
      {doneAt ? (
        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#34c759] text-white">
          <Check size={12} strokeWidth={3} />
        </span>
      ) : (
        <Circle size={20} strokeWidth={1.75} className="mt-0.5 shrink-0 text-slate-300" />
      )}
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-900 capitalize">{label}</p>
        <p className="text-[13px] text-slate-500">{doneAt ? `Approved ${formatDate(doneAt)}` : pending}</p>
      </div>
    </li>
  );
}

function RepairBreakdownCard({ inspection, currency }: { inspection: InspectionDetails; currency: string }) {
  const [breakdown, setBreakdown] = useState<RepairBreakdown | null>(inspection.repairBreakdown ?? null);
  const [items, setItems] = useState<BreakdownItemDraft[]>([{ name: "", price: "", description: "" }]);
  const [saving, setSaving] = useState(false);
  const fmt = (n: number) => `${currency} ${new Intl.NumberFormat("en-US").format(Math.round(n))}`;

  const total = items.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0);
  const update = (index: number, field: keyof BreakdownItemDraft, value: string) =>
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));

  const handleCreate = async () => {
    const valid = items.filter((item) => item.name.trim() && parseFloat(item.price) > 0);
    if (valid.length === 0) {
      toast.error("Add at least one repair with a name and cost");
      return;
    }
    setSaving(true);
    try {
      const created = await repairBreakdownService.createBreakdown({
        moveOutInspectionId: inspection.id,
        tenancyId: inspection.tenancyId,
        amount: valid.reduce((sum, item) => sum + parseFloat(item.price), 0),
        items: valid.map((item) => ({
          name: item.name.trim(),
          price: parseFloat(item.price),
          description: item.description.trim(),
        })),
      });
      setBreakdown(created);
      toast.success(`Repair costs sent to the tenant`);
    } catch (error) {
      toast.error(getNetworkError(error));
    } finally {
      setSaving(false);
    }
  };

  if (breakdown) {
    const tone: Tone = breakdown.status === "APPROVED" ? "emerald" : breakdown.status === "DISPUTED" ? "red" : "amber";
    const label =
      breakdown.status === "APPROVED" ? "Accepted" : breakdown.status === "DISPUTED" ? "Disputed" : "Awaiting tenant";
    return (
      <section className="card p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-[15px] font-semibold text-slate-900">Repair costs</h2>
          <Badge tone={tone}>{label}</Badge>
        </div>
        <ul className="mt-3 divide-y divide-black/[0.06]">
          {breakdown.items.map((item, i) => (
            <li key={i} className="flex items-start justify-between gap-4 py-2.5">
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-900">{item.name}</p>
                {item.description && <p className="text-xs text-slate-500">{item.description}</p>}
              </div>
              <p className="text-sm text-slate-900 tabular-nums whitespace-nowrap">{fmt(item.price)}</p>
            </li>
          ))}
        </ul>
        <div className="mt-2 flex items-center justify-between border-t border-black/[0.06] pt-3">
          <span className="text-sm text-slate-500">Total</span>
          <span className="text-[17px] font-semibold text-slate-900 tabular-nums">{fmt(breakdown.amount)}</span>
        </div>
      </section>
    );
  }

  return (
    <section className="card p-5">
      <div className="flex items-center gap-2">
        <Wrench size={16} className="text-slate-500" />
        <h2 className="text-[15px] font-semibold text-slate-900">Repair costs</h2>
      </div>
      <p className="mt-1 text-[13px] leading-relaxed text-slate-500">
        List anything that needs fixing. The tenant reviews the costs before they're taken from the deposit.
      </p>
      <div className="mt-4 space-y-3">
        {items.map((item, i) => (
          <div key={i} className="space-y-2 rounded-xl bg-slate-50 p-3">
            <div className="flex gap-2">
              <input
                value={item.name}
                onChange={(e) => update(i, "name", e.target.value)}
                placeholder="e.g. Broken window"
                aria-label="Repair"
                className="field py-2 text-sm"
              />
              <button
                type="button"
                onClick={() => setItems((prev) => prev.filter((_, idx) => idx !== i))}
                disabled={items.length === 1}
                aria-label="Remove repair"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-white hover:text-[#d70015] disabled:opacity-30"
              >
                <Trash2 size={16} />
              </button>
            </div>
            <input
              type="number"
              min="0"
              inputMode="decimal"
              value={item.price}
              onChange={(e) => update(i, "price", e.target.value)}
              placeholder={`Cost (${currency})`}
              aria-label="Cost"
              className="field py-2 text-sm tabular-nums"
            />
            <input
              value={item.description}
              onChange={(e) => update(i, "description", e.target.value)}
              placeholder="Note (optional)"
              aria-label="Note"
              className="field py-2 text-sm"
            />
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => setItems((prev) => [...prev, { name: "", price: "", description: "" }])}
        className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-[#3f0ee3] hover:underline"
      >
        <Plus size={15} /> Add repair
      </button>
      <div className="mt-4 flex items-center justify-between border-t border-black/[0.06] pt-4">
        <span className="text-sm text-slate-500">Total</span>
        <span className="text-[17px] font-semibold text-slate-900 tabular-nums">{fmt(total)}</span>
      </div>
      <button onClick={handleCreate} disabled={saving} className="btn btn-primary mt-4 w-full">
        {saving && <Loader2 size={15} className="animate-spin" />}
        Send to tenant
      </button>
    </section>
  );
}

function PhotoViewer({
  photos,
  index: startIndex,
  title,
  onClose,
}: {
  photos: string[];
  index: number;
  title: string;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(startIndex);
  const step = useCallback(
    (delta: number) => setIndex((i) => (i + delta + photos.length) % photos.length),
    [photos.length]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, step]);

  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-black/95 animate-fade-up" role="dialog" aria-modal="true" aria-label={title}>
      <div className="flex h-14 shrink-0 items-center justify-between px-4 text-white">
        <p className="text-sm font-medium">
          {title} <span className="text-white/50 tabular-nums">· {index + 1} of {photos.length}</span>
        </p>
        <button
          onClick={onClose}
          aria-label="Close"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 hover:bg-white/20"
        >
          <X size={18} />
        </button>
      </div>
      <div className="relative flex min-h-0 flex-1 items-center justify-center px-4 sm:px-16">
        <img src={photos[index]} alt={`${title}, photo ${index + 1}`} className="max-h-full max-w-full rounded-lg object-contain" />
        {photos.length > 1 && (
          <>
            <button
              onClick={() => step(-1)}
              aria-label="Previous photo"
              className="absolute left-3 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
            >
              <ChevronLeft size={22} />
            </button>
            <button
              onClick={() => step(1)}
              aria-label="Next photo"
              className="absolute right-3 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
            >
              <ChevronRight size={22} />
            </button>
          </>
        )}
      </div>
      {photos.length > 1 && (
        <div className="flex shrink-0 justify-center gap-2 overflow-x-auto px-4 py-4">
          {photos.map((src, i) => (
            <button
              key={src + i}
              onClick={() => setIndex(i)}
              aria-label={`Photo ${i + 1}`}
              className={`h-14 w-14 shrink-0 overflow-hidden rounded-lg ring-2 transition-opacity ${
                i === index ? "ring-white opacity-100" : "ring-transparent opacity-50 hover:opacity-80"
              }`}
            >
              <img src={src} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
