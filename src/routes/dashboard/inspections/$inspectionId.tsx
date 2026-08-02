import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, X, ChevronLeft, ChevronRight, Image as ImageIcon, ShieldCheck, Loader2 } from "lucide-react";
import { inspectionService } from "../../../services/inspectionService";
import type { InspectionItem } from "../../../types";
import { toast } from "react-toastify";

interface InspectionDetails extends InspectionItem {
  images?: Array<{
    id: number;
    url: string;
    fileName: string;
    uploadedAt: string;
  }>;
  sections?: Array<{
    id: number;
    name: string;
    description: string;
    images: Array<{
      id: number;
      url: string;
      fileName: string;
    }>;
  }>;
}

export const Route = createFileRoute("/dashboard/inspections/$inspectionId")({
  component: InspectionDetailPage,
  loader: async ({ params }) => {
    try {
      const inspection = await inspectionService.getInspection(params.inspectionId);
      return { inspection: (inspection.data || inspection) as InspectionDetails };
    } catch {
      return { inspection: null };
    }
  },
});

function InspectionDetailPage() {
  const navigate = useNavigate();
  const { inspection: loadedInspection } = Route.useLoaderData();
  const [inspection, setInspection] = useState(loadedInspection);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
  const [allImages, setAllImages] = useState<Array<{ id: number; url: string; fileName: string }>>([]);
  const [approving, setApproving] = useState(false);

  const handleManagerApprove = async () => {
    if (!inspection) return;
    setApproving(true);
    try {
      await inspectionService.approveInspectionByManagement(inspection.id.toString());
      setInspection({ ...inspection, managerApprovedAt: new Date().toISOString() });
      toast.success("Inspection approved");
    } catch (error) {
      console.error(error);
      toast.error("Failed to approve inspection");
    } finally {
      setApproving(false);
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-emerald-100 text-emerald-800";
      case "PENDING":
        return "bg-amber-100 text-amber-800";
      case "APPROVED":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "MOVE_IN":
        return "bg-purple-100 text-purple-800";
      case "MOVE_OUT":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };

  const openImageViewer = (images: Array<{ id: number; url: string; fileName: string }>, startIndex = 0) => {
    setAllImages(images);
    setSelectedImageIndex(startIndex);
    setIsImageViewerOpen(true);
  };

  const nextImage = () => {
    setSelectedImageIndex((prev) => (prev + 1) % allImages.length);
  };

  const prevImage = () => {
    setSelectedImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  };

  if (!inspection) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <p className="text-slate-600">Inspection not found</p>
        <button
          onClick={() => navigate({ to: "/dashboard/inspections" })}
          className="mt-4 px-4 py-2 bg-[#3f0ee3] text-white rounded-lg font-medium hover:bg-[#3f0ee3]/90"
        >
          Back to Inspections
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate({ to: "/dashboard/inspections" })}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} className="text-slate-600" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Inspection Details</h1>
          <p className="text-sm text-slate-500 mt-1">
            {inspection.type === "MOVE_IN" ? "Move-In" : "Move-Out"} Inspection
          </p>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <p className="text-sm text-slate-600">Type</p>
          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mt-2 ${getTypeColor(inspection.type)}`}>
            {inspection.type === "MOVE_IN" ? "Move-In" : "Move-Out"}
          </span>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <p className="text-sm text-slate-600">Status</p>
          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mt-2 ${getStatusColor(inspection.status)}`}>
            {inspection.status || "PENDING"}
          </span>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <p className="text-sm text-slate-600">Unit</p>
          <p className="font-semibold text-slate-900 mt-2">{inspection.tenancy?.unitName || "N/A"}</p>
        </div>
      </div>

      {/* Inspection Information */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h2 className="text-xl font-bold text-slate-900 mb-4">Inspection Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-slate-600 mb-1">Created Date</p>
            <p className="font-medium text-slate-900">
              {new Date(inspection.createdAt).toLocaleDateString()} at{" "}
              {new Date(inspection.createdAt).toLocaleTimeString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-slate-600 mb-1">Last Updated</p>
            <p className="font-medium text-slate-900">
              {new Date(inspection.updatedAt).toLocaleDateString()} at{" "}
              {new Date(inspection.updatedAt).toLocaleTimeString()}
            </p>
          </div>
        </div>
      </div>

      {/* Approval Status */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h2 className="text-xl font-bold text-slate-900 mb-4">Approval Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border rounded-lg p-4 bg-slate-50">
            <p className="text-sm text-slate-600 mb-2">Tenant Approval</p>
            {inspection.tenantApprovedAt ? (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                <div>
                  <p className="font-semibold text-emerald-700">Approved</p>
                  <p className="text-xs text-slate-500">
                    {new Date(inspection.tenantApprovedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-slate-300 rounded-full"></div>
                <p className="font-medium text-slate-600">Pending</p>
              </div>
            )}
          </div>
          <div className="border rounded-lg p-4 bg-slate-50">
            <p className="text-sm text-slate-600 mb-2">Manager Approval</p>
            {inspection.managerApprovedAt ? (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                <div>
                  <p className="font-semibold text-emerald-700">Approved</p>
                  <p className="text-xs text-slate-500">
                    {new Date(inspection.managerApprovedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-slate-300 rounded-full"></div>
                  <p className="font-medium text-slate-600">Pending</p>
                </div>
                <button
                  onClick={handleManagerApprove}
                  disabled={approving}
                  className="flex items-center gap-2 px-3 py-1.5 bg-[#3f0ee3] text-white rounded-lg text-xs font-semibold hover:bg-[#3f0ee3]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {approving ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
                  Approve as Manager
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Inspection Sections with Images */}
      {inspection.sections && inspection.sections.length > 0 && (
        <div className="space-y-4">
          {inspection.sections.map((section) => (
            <div key={section.id} className="bg-white rounded-lg border border-slate-200 p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-2">{section.name}</h3>
              {section.description && (
                <p className="text-slate-600 text-sm mb-4">{section.description}</p>
              )}

              {/* Section Images */}
              {section.images && section.images.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                    <ImageIcon size={16} />
                    Images ({section.images.length})
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {section.images.map((image, idx) => (
                      <button
                        key={image.id}
                        onClick={() => openImageViewer(section.images, idx)}
                        className="relative group overflow-hidden rounded-lg border border-slate-200 hover:border-[#3f0ee3] transition-colors"
                      >
                        <img
                          src={image.url}
                          alt={image.fileName}
                          className="w-full h-32 object-cover group-hover:scale-110 transition-transform duration-200"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <p className="text-white text-xs text-center px-1">{image.fileName}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* General Images */}
      {inspection.images && inspection.images.length > 0 && (
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <ImageIcon size={20} />
            Inspection Photos ({inspection.images.length})
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {inspection.images.map((image, idx) => (
              <button
                key={image.id}
                onClick={() => openImageViewer(inspection.images || [], idx)}
                className="relative group overflow-hidden rounded-lg border border-slate-200 hover:border-[#3f0ee3] transition-colors"
              >
                <img
                  src={image.url}
                  alt={image.fileName}
                  className="w-full h-32 object-cover group-hover:scale-110 transition-transform duration-200"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-white text-xs text-center px-1">{image.fileName}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* No Images Message */}
      {(!inspection.images || inspection.images.length === 0) &&
        (!inspection.sections || inspection.sections.every((s) => !s.images || s.images.length === 0)) && (
          <div className="bg-slate-50 rounded-lg border border-slate-200 p-8 text-center">
            <ImageIcon size={32} className="mx-auto text-slate-300 mb-3" />
            <p className="text-slate-600">No images attached to this inspection</p>
          </div>
        )}

      {/* Image Viewer Modal */}
      {isImageViewerOpen && allImages.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90">
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Close Button */}
            <button
              onClick={() => setIsImageViewerOpen(false)}
              className="absolute top-4 right-4 text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
            >
              <X size={24} />
            </button>

            {/* Image */}
            <div className="relative max-w-4xl max-h-[80vh] flex flex-col items-center">
              <img
                src={allImages[selectedImageIndex].url}
                alt={allImages[selectedImageIndex].fileName}
                className="max-w-full max-h-[70vh] object-contain"
              />

              {/* Image Info */}
              <div className="mt-4 text-white text-center">
                <p className="font-medium">{allImages[selectedImageIndex].fileName}</p>
                <p className="text-sm text-gray-300">
                  {selectedImageIndex + 1} / {allImages.length}
                </p>
              </div>
            </div>

            {/* Navigation Buttons */}
            {allImages.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
                >
                  <ChevronLeft size={28} />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
                >
                  <ChevronRight size={28} />
                </button>
              </>
            )}

            {/* Thumbnail Strip */}
            {allImages.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 overflow-x-auto max-w-[90vw]">
                {allImages.map((image, idx) => (
                  <button
                    key={image.id}
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`flex-shrink-0 border-2 rounded-lg overflow-hidden transition-colors ${
                      idx === selectedImageIndex ? "border-white" : "border-gray-600"
                    }`}
                  >
                    <img src={image.url} alt="" className="w-16 h-16 object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
