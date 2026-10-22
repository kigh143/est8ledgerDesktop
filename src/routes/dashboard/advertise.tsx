import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useRef, useState, type DragEvent, type FormEvent } from "react";
import { isAxiosError } from "axios";
import { Eye, ImagePlus, Loader2, MapPin, Megaphone, Pause, Play, X } from "lucide-react";
import { toast } from "react-toastify";

import agreementService from "../../services/agreementService";
import propertyListingService from "../../services/propertyApi";
import { useAppStore } from "../../store";
import { uploadImages } from "../../utils/presignedUpload";
import { getNetworkError } from "../../utils";
import { Badge, ConfirmDialog, DetailRow, PageHeader } from "../../componennts/dashboard/ui";
import type { PropertyListing } from "../../types";

export const Route = createFileRoute("/dashboard/advertise")({
  component: AdvertisePage,
  // The property in the store is a list snapshot, so read the listing fresh.
  loader: async () => {
    const { activeProperty } = useAppStore.getState();
    if (!activeProperty) return { listing: null };
    try {
      const response = await agreementService.getPropertyAgreement(activeProperty.id.toString());
      const agreement = response?.data ?? response;
      const listings: PropertyListing[] = agreement?.PropertyListing ?? [];
      return { listing: listings[0] ?? null };
    } catch {
      return { listing: (activeProperty.PropertyListing?.[0] as PropertyListing | undefined) ?? null };
    }
  },
});

const MAX_PHOTOS = 3;
const MIN_DESCRIPTION = 50;
const MAX_FILE_BYTES = 15 * 1024 * 1024;

type Photo = { id: string; file: File; preview: string };
type Errors = Partial<Record<"monthlyRent" | "description" | "photos", string>>;

const errorMessage = (error: unknown) =>
  isAxiosError(error) ? getNetworkError(error) : error instanceof Error ? error.message : "Something went wrong";

/** Images arrive as an array, or as a JSON string from older listings. */
const listingImages = (listing: PropertyListing): string[] => {
  const raw: unknown = listing.images;
  if (Array.isArray(raw)) return raw.filter((v): v is string => typeof v === "string");
  if (typeof raw === "string") {
    try {
      const parsed: unknown = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string") : [];
    } catch {
      return [];
    }
  }
  return [];
};

function AdvertisePage() {
  const { listing } = Route.useLoaderData();
  const activeProperty = useAppStore((s) => s.activeProperty);
  const currency = activeProperty?.currency || "UGX";
  const money = (n: number) => `${currency} ${new Intl.NumberFormat("en-US").format(Math.round(n))}`;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Advertise"
        subtitle={
          listing
            ? "Your listing is how prospective tenants find this property."
            : "List a vacancy so prospective tenants can find this property."
        }
      />
      {listing ? <ListingView listing={listing} money={money} /> : <CreateListing currency={currency} money={money} />}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Existing listing                                                    */
/* ------------------------------------------------------------------ */

function ListingView({ listing, money }: { listing: PropertyListing; money: (n: number) => string }) {
  const router = useRouter();
  const activeProperty = useAppStore((s) => s.activeProperty);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const images = listingImages(listing);
  const active = listing.listingStatus === "ACTIVE";
  const views = listing.views || 0;

  const toggle = async () => {
    setBusy(true);
    try {
      await propertyListingService.toggleListingStatus(String(listing.id), active ? "INACTIVE" : "ACTIVE");
      toast.success(active ? "Listing paused" : "Listing is live again");
      setConfirming(false);
      await router.invalidate();
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
      <article className="min-w-0 space-y-6">
        <Gallery images={images} />
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="text-[24px] font-semibold tracking-[-0.02em] text-slate-900">
              {activeProperty?.propertyName}
            </h2>
            {active ? <Badge tone="emerald">Live</Badge> : <Badge tone="slate">Paused</Badge>}
          </div>
          {activeProperty?.propertyAddress && (
            <p className="mt-1 flex items-center gap-1.5 text-[15px] text-slate-500">
              <MapPin size={15} strokeWidth={1.75} />
              {[activeProperty.propertyAddress, activeProperty.district].filter(Boolean).join(", ")}
            </p>
          )}
        </div>
        <div className="border-t border-black/[0.06] pt-6">
          <h3 className="text-[17px] font-semibold text-slate-900">About this place</h3>
          <p className="mt-2 whitespace-pre-line text-[15px] leading-relaxed text-slate-600">{listing.description}</p>
        </div>
      </article>

      <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
        <div className="card p-6">
          <p className="text-[26px] font-semibold text-slate-900 tabular-nums">
            {money(Number(listing.monthlyRent) || 0)}
            <span className="ml-1 text-[15px] font-normal text-slate-500">/ month</span>
          </p>
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-slate-50 px-3.5 py-3 text-sm text-slate-600">
            <Eye size={16} strokeWidth={1.75} className="text-slate-400" />
            <span>
              <span className="font-semibold text-slate-900 tabular-nums">{views}</span>{" "}
              {views === 1 ? "person has" : "people have"} viewed this listing
            </span>
          </div>
          <div className="mt-2 divide-y divide-black/[0.06]">
            <DetailRow label="Status">{active ? "Visible to tenants" : "Hidden from tenants"}</DetailRow>
            <DetailRow label="Listed">{new Date(listing.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</DetailRow>
            {listing.expiresAt && (
              <DetailRow label="Expires">
                {new Date(listing.expiresAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </DetailRow>
            )}
          </div>
          <button
            onClick={() => setConfirming(true)}
            className={`btn mt-5 w-full ${active ? "btn-secondary" : "btn-primary"}`}
          >
            {active ? <Pause size={16} /> : <Play size={16} />}
            {active ? "Pause listing" : "Make listing live"}
          </button>
          <p className="mt-2 text-center text-xs text-slate-500">
            {active ? "Pause it once the unit is let." : "Tenants will see it again straight away."}
          </p>
        </div>
      </aside>

      <ConfirmDialog
        open={confirming}
        title={active ? "Pause this listing?" : "Make this listing live?"}
        message={
          active
            ? "Prospective tenants won't see it until you make it live again."
            : "Prospective tenants will be able to find and view it."
        }
        confirmLabel={active ? "Pause" : "Make live"}
        destructive={active}
        busy={busy}
        onConfirm={toggle}
        onClose={() => setConfirming(false)}
      />
    </div>
  );
}

function Gallery({ images }: { images: string[] }) {
  if (images.length === 0) {
    return (
      <div className="flex aspect-[16/9] items-center justify-center rounded-[20px] bg-slate-100 text-slate-400">
        <ImagePlus size={32} strokeWidth={1.5} />
      </div>
    );
  }
  const [lead, ...rest] = images;
  return (
    <div className={`grid aspect-[16/9] gap-2 overflow-hidden rounded-[20px] ${rest.length ? "grid-cols-3 grid-rows-2" : ""}`}>
      <img src={lead} alt="Listing photo 1" className={`h-full w-full object-cover ${rest.length ? "col-span-2 row-span-2" : ""}`} />
      {rest.map((src, i) => (
        <img
          key={src}
          src={src}
          alt={`Listing photo ${i + 2}`}
          className={`h-full min-h-0 w-full object-cover ${rest.length === 1 ? "row-span-2" : ""}`}
        />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* New listing                                                         */
/* ------------------------------------------------------------------ */

function CreateListing({ currency, money }: { currency: string; money: (n: number) => string }) {
  const router = useRouter();
  const activeProperty = useAppStore((s) => s.activeProperty);
  const setActiveProperty = useAppStore((s) => s.setActiveProperty);
  const fileInput = useRef<HTMLInputElement>(null);
  const [monthlyRent, setMonthlyRent] = useState("");
  const [description, setDescription] = useState("");
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [errors, setErrors] = useState<Errors>({});
  const [dragging, setDragging] = useState(false);
  const [stage, setStage] = useState<"idle" | "uploading" | "saving">("idle");

  // Object URLs are revoked when photos are removed and when the page unmounts.
  const photosRef = useRef(photos);
  useEffect(() => {
    photosRef.current = photos;
  }, [photos]);
  useEffect(() => () => photosRef.current.forEach((p) => URL.revokeObjectURL(p.preview)), []);

  const rentValue = Number(monthlyRent.replace(/[^0-9.]/g, "")) || 0;
  const descriptionLength = description.trim().length;
  const busy = stage !== "idle";

  const addFiles = (list: FileList | File[]) => {
    const room = MAX_PHOTOS - photos.length;
    if (room <= 0) {
      toast.info(`You can add up to ${MAX_PHOTOS} photos`);
      return;
    }
    const accepted: Photo[] = [];
    for (const file of Array.from(list)) {
      if (accepted.length >= room) break;
      if (!file.type.startsWith("image/")) {
        toast.error(`${file.name} isn't an image`);
        continue;
      }
      if (file.size > MAX_FILE_BYTES) {
        toast.error(`${file.name} is over 15 MB`);
        continue;
      }
      accepted.push({ id: crypto.randomUUID(), file, preview: URL.createObjectURL(file) });
    }
    if (accepted.length) {
      setPhotos((prev) => [...prev, ...accepted]);
      setErrors((prev) => ({ ...prev, photos: undefined }));
    }
  };

  const removePhoto = (id: string) => {
    setPhotos((prev) => {
      const target = prev.find((p) => p.id === id);
      if (target) URL.revokeObjectURL(target.preview);
      return prev.filter((p) => p.id !== id);
    });
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (!busy) addFiles(e.dataTransfer.files);
  };

  const validate = () => {
    const next: Errors = {};
    if (!monthlyRent.trim()) next.monthlyRent = "Enter the monthly rent";
    else if (rentValue <= 0) next.monthlyRent = "Enter a valid amount";
    if (!descriptionLength) next.description = "Describe the property";
    else if (descriptionLength < MIN_DESCRIPTION) next.description = `Write at least ${MIN_DESCRIPTION} characters`;
    if (photos.length === 0) next.photos = "Add at least one photo";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!activeProperty || !validate()) return;

    let step: "uploading" | "saving" = "uploading";
    try {
      setStage("uploading");
      const images = await uploadImages(
        photos.map((p) => p.file),
        "PROPERTY_LISTING_PHOTO",
        activeProperty.id
      );
      step = "saving";
      setStage("saving");
      const listing = await propertyListingService.createListing({
        propertyAgreementId: String(activeProperty.id),
        monthlyRent: String(rentValue),
        currency,
        description: description.trim(),
        images,
      });
      setActiveProperty({ ...activeProperty, PropertyListing: listing ? [listing] : [] });
      toast.success("Your listing is live");
      await router.invalidate();
    } catch (error) {
      toast.error(
        step === "uploading"
          ? `Photos couldn't be uploaded. ${errorMessage(error)}`
          : errorMessage(error)
      );
    } finally {
      setStage("idle");
    }
  };

  return (
    <form onSubmit={submit} noValidate className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="card min-w-0 space-y-8 p-6 sm:p-8">
        {/* Photos */}
        <section>
          <div className="flex items-baseline justify-between">
            <h2 className="text-[17px] font-semibold text-slate-900">Photos</h2>
            <span className="text-[13px] text-slate-500 tabular-nums">
              {photos.length} of {MAX_PHOTOS}
            </span>
          </div>
          <p className="mt-0.5 text-sm text-slate-500">Bright, wide shots of the main rooms work best. The first photo is the cover.</p>

          <div className="mt-4 grid grid-cols-3 gap-3">
            {photos.map((photo, index) => (
              <div key={photo.id} className="group relative aspect-[4/3] overflow-hidden rounded-xl bg-slate-100">
                <img src={photo.preview} alt={`Photo ${index + 1}`} className="h-full w-full object-cover" />
                {index === 0 && (
                  <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-semibold text-slate-900 shadow-sm">
                    Cover
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => removePhoto(photo.id)}
                  disabled={busy}
                  aria-label={`Remove photo ${index + 1}`}
                  className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-sm hover:bg-black/75"
                >
                  <X size={14} strokeWidth={2.5} />
                </button>
              </div>
            ))}
            {photos.length < MAX_PHOTOS && (
              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                disabled={busy}
                className={`flex aspect-[4/3] flex-col items-center justify-center gap-1.5 rounded-xl border-[1.5px] border-dashed text-center transition-colors ${
                  photos.length === 0 ? "col-span-3 aspect-auto py-12" : ""
                } ${
                  dragging
                    ? "border-[#3f0ee3] bg-[#3f0ee3]/[0.05] text-[#3f0ee3]"
                    : errors.photos
                    ? "border-[#ff3b30]/60 text-slate-500 hover:bg-slate-50"
                    : "border-slate-300 text-slate-500 hover:border-slate-400 hover:bg-slate-50"
                }`}
              >
                <ImagePlus size={photos.length === 0 ? 28 : 20} strokeWidth={1.5} />
                <span className="text-sm font-medium text-slate-700">
                  {photos.length === 0 ? "Drag photos here or click to choose" : "Add photo"}
                </span>
                {photos.length === 0 && <span className="text-xs">Up to {MAX_PHOTOS} photos · JPG, PNG or WebP</span>}
              </button>
            )}
          </div>
          <input
            ref={fileInput}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            hidden
            onChange={(e) => {
              if (e.target.files) addFiles(e.target.files);
              e.target.value = "";
            }}
          />
          {errors.photos && <p className="mt-2 text-xs text-[#d70015]">{errors.photos}</p>}
        </section>

        {/* Rent */}
        <section>
          <label htmlFor="rent" className="label">
            Monthly rent
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[15px] font-medium text-slate-500">
              {currency}
            </span>
            <input
              id="rent"
              inputMode="decimal"
              value={monthlyRent}
              onChange={(e) => {
                setMonthlyRent(e.target.value);
                setErrors((prev) => ({ ...prev, monthlyRent: undefined }));
              }}
              placeholder="0"
              aria-invalid={!!errors.monthlyRent}
              disabled={busy}
              className="field pl-14 tabular-nums"
            />
          </div>
          {errors.monthlyRent && <p className="mt-1.5 text-xs text-[#d70015]">{errors.monthlyRent}</p>}
        </section>

        {/* Description */}
        <section>
          <label htmlFor="description" className="label">
            Description
          </label>
          <textarea
            id="description"
            rows={6}
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              setErrors((prev) => ({ ...prev, description: undefined }));
            }}
            placeholder="Bedrooms, amenities, parking, what's nearby — what would you want to know before viewing?"
            aria-invalid={!!errors.description}
            disabled={busy}
            className="field resize-none leading-relaxed"
          />
          <div className="mt-1.5 flex justify-between gap-4 text-xs">
            <span className="text-[#d70015]">{errors.description}</span>
            <span className={`tabular-nums ${descriptionLength >= MIN_DESCRIPTION ? "text-[#248a3d]" : "text-slate-500"}`}>
              {descriptionLength < MIN_DESCRIPTION ? `${descriptionLength} / ${MIN_DESCRIPTION} minimum` : `${descriptionLength} characters`}
            </span>
          </div>
        </section>
      </div>

      {/* Live preview */}
      <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
        <p className="eyebrow px-1">Preview</p>
        <div className="card overflow-hidden">
          <div className="aspect-[4/3] bg-slate-100">
            {photos[0] ? (
              <img src={photos[0].preview} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-slate-300">
                <Megaphone size={36} strokeWidth={1.25} />
              </div>
            )}
          </div>
          <div className="p-5">
            <p className="truncate text-[15px] font-semibold text-slate-900">{activeProperty?.propertyName}</p>
            <p className="truncate text-sm text-slate-500">
              {[activeProperty?.propertyAddress, activeProperty?.district].filter(Boolean).join(", ")}
            </p>
            <p className="mt-2 text-[15px] text-slate-900">
              <span className="font-semibold tabular-nums">{rentValue > 0 ? money(rentValue) : `${currency} —`}</span>
              <span className="text-slate-500"> / month</span>
            </p>
            <p className={`mt-3 line-clamp-3 text-sm leading-relaxed ${description.trim() ? "text-slate-600" : "text-slate-400"}`}>
              {description.trim() || "Your description appears here."}
            </p>
          </div>
        </div>
        <button type="submit" disabled={busy} className="btn btn-primary btn-lg w-full">
          {busy && <Loader2 size={17} className="animate-spin" />}
          {stage === "uploading" ? "Uploading photos…" : stage === "saving" ? "Publishing…" : "Publish listing"}
        </button>
        <p className="px-1 text-center text-xs leading-relaxed text-slate-500">
          You can pause the listing at any time once the unit is let.
        </p>
      </aside>
    </form>
  );
}
