import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react';
import { Upload, X, Check, Loader, AlertCircle, Image as ImageIcon } from 'lucide-react';

import agreementService from '../../services/agreementService';
import listingService from '../../services/listingService';
import { toast } from 'react-toastify';

export const Route = createFileRoute('/dashboard/advertise')({
  component: AdvertisePage,
})

interface PropertyImage {
  id: string;
  file: File;
  preview: string;
}

interface AdvertiseFormData {
  propertyAgreementId: string;
  monthlyRent: string;
  currency: string;
  description: string;
  images: PropertyImage[];
}

function AdvertisePage() {
  const [loading, setLoading] = useState(false);
  const [properties, setProperties] = useState<any[]>([]);
  const [formData, setFormData] = useState<AdvertiseFormData>({
    propertyAgreementId: '',
    monthlyRent: '',
    currency: 'UGX',
    description: '',
    images: [],
  });

  // Load properties on mount
  useEffect(() => {
    loadProperties();
  }, []);

  const loadProperties = async () => {
    try {
      const response = await agreementService.getPropertyAgreements();
      setProperties(response.data || []);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load properties');
    }
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    if (formData.images.length >= 3) {
      toast.error('You can only upload 3 images');
      return;
    }

    const remainingSlots = 3 - formData.images.length;
    const filesToAdd = Array.from(files).slice(0, remainingSlots);

    filesToAdd.forEach(file => {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not a valid image file`);
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is larger than 5MB`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const newImage: PropertyImage = {
          id: `image-${Date.now()}-${Math.random()}`,
          file,
          preview: event.target?.result as string,
        };

        setFormData(prev => ({
          ...prev,
          images: [...prev.images, newImage],
        }));
      };
      reader.readAsDataURL(file);
    });

    // Reset input
    e.target.value = '';
  };

  const removeImage = (imageId: string) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter(img => img.id !== imageId),
    }));
  };

  const validateForm = () => {
    if (!formData.propertyAgreementId) {
      toast.error('Please select a property');
      return false;
    }
    if (!formData.monthlyRent || parseFloat(formData.monthlyRent) <= 0) {
      toast.error('Please enter a valid monthly rent');
      return false;
    }
    if (!formData.currency) {
      toast.error('Please select a currency');
      return false;
    }
    if (!formData.description.trim()) {
      toast.error('Please provide a description');
      return false;
    }
    if (formData.images.length === 0) {
      toast.error('Please upload at least one image');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Upload images to bunny.net
      const imageFiles = formData.images.map(img => img.file);
      const uploadedImageUrls = await listingService.uploadImagesToBunny(imageFiles);

      const listingData = {
        propertyAgreementId: parseInt(formData.propertyAgreementId),
        monthlyRent: parseFloat(formData.monthlyRent),
        currency: formData.currency,
        description: formData.description,
        imageUrls: uploadedImageUrls,
      };

      // Create listing in database
      await listingService.createListing(listingData);

      toast.success('Property listing created successfully!');

      // Reset form
      setFormData({
        propertyAgreementId: '',
        monthlyRent: '',
        currency: 'UGX',
        description: '',
        images: [],
      });
    } catch (error) {
      console.error(error);
      toast.error('Failed to create property listing');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Advertise Property</h1>
          <p className="text-slate-600">Create a listing to attract potential tenants</p>
        </div>

        {/* Info Alert */}
        <div className="mb-8 bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-blue-900">Creating a property listing</p>
            <p className="text-sm text-blue-800 mt-1">Fill in the details below to create an attractive listing for potential tenants. Include clear photos and a detailed description.</p>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Property Selection */}
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-3">
                Select Property <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.propertyAgreementId}
                onChange={(e) => handleInputChange('propertyAgreementId', e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#552ae7] focus:border-transparent outline-none transition"
              >
                <option value="">Choose a property...</option>
                {properties.map((property) => (
                  <option key={property.id} value={property.id}>
                    {property.propertyName} - {property.propertyAddress}
                  </option>
                ))}
              </select>
              {properties.length === 0 && (
                <p className="text-sm text-amber-600 mt-2">No properties available. Create a property first.</p>
              )}
            </div>

            {/* Rent and Currency Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Monthly Rent */}
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-3">
                  Monthly Rent <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  placeholder="e.g., 500000"
                  min="0"
                  step="1000"
                  value={formData.monthlyRent}
                  onChange={(e) => handleInputChange('monthlyRent', e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#552ae7] focus:border-transparent outline-none transition"
                />
              </div>

              {/* Currency */}
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-3">
                  Currency <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.currency}
                  onChange={(e) => handleInputChange('currency', e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#552ae7] focus:border-transparent outline-none transition"
                >
                  <option value="UGX">🇺🇬 UGX (Ugandan Shilling)</option>
                  <option value="USD">🇺🇸 USD (US Dollar)</option>
                  <option value="EUR">🇪🇺 EUR (Euro)</option>
                  <option value="GBP">🇬🇧 GBP (British Pound)</option>
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-3">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                placeholder="Describe the property features, amenities, location benefits, and any special highlights..."
                rows={6}
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#552ae7] focus:border-transparent outline-none transition resize-none"
              />
              <p className="text-xs text-slate-600 mt-2">Min 50 characters recommended</p>
            </div>

            {/* Image Upload Section */}
            <div className="border-t border-slate-200 pt-8">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Property Images</h3>
                <p className="text-sm text-slate-600">Upload up to 3 high-quality images (Max 5MB each)</p>
              </div>

              {/* Image Preview Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {[0, 1, 2].map((index) => {
                  const image = formData.images[index];
                  return (
                    <div key={index} className="relative">
                      {image ? (
                        <div className="relative group rounded-lg overflow-hidden bg-slate-100 h-48">
                          <img
                            src={image.preview}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => removeImage(image.id)}
                              className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                            >
                              <X size={18} />
                            </button>
                            <span className="text-white text-sm font-semibold">Remove</span>
                          </div>
                          <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded text-xs font-semibold flex items-center gap-1">
                            <Check size={14} /> Added
                          </div>
                        </div>
                      ) : (
                        <label className="block border-2 border-dashed border-slate-300 rounded-lg p-6 h-48 cursor-pointer hover:border-[#552ae7] hover:bg-[#552ae7]/5 transition-all group">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                            disabled={formData.images.length >= 3}
                          />
                          <div className="flex flex-col items-center justify-center h-full text-center">
                            <ImageIcon className="w-8 h-8 text-slate-400 mb-2 group-hover:text-[#552ae7] transition-colors" />
                            <p className="text-sm font-semibold text-slate-700 group-hover:text-[#552ae7] transition-colors">
                              Image {index + 1}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">Click to upload</p>
                          </div>
                        </label>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Upload All Button */}
              {formData.images.length < 3 && (
                <label className="inline-flex items-center gap-2 px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold cursor-pointer transition-colors">
                  <Upload size={18} />
                  <span>Upload Images</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={formData.images.length >= 3}
                  />
                </label>
              )}

              {/* Image Counter */}
              <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
                <p className="text-sm text-slate-700">
                  <span className="font-semibold">{formData.images.length}</span> / 3 images uploaded
                </p>
              </div>
            </div>

            {/* Submit Button */}
            <div className="border-t border-slate-200 pt-8">
              <button
                type="submit"
                disabled={loading || properties.length === 0}
                className="w-full flex items-center justify-center gap-2 px-8 py-3 bg-linear-to-r from-[#552ae7] to-[#552ae7]/80 hover:from-[#552ae7]/90 hover:to-[#552ae7]/70 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg active:scale-95"
              >
                {loading ? (
                  <>
                    <Loader size={20} className="animate-spin" />
                    Creating Listing...
                  </>
                ) : (
                  <>
                    <Check size={20} />
                    Create Listing
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Bunny.net Integration Notes */}
        <div className="mt-8 bg-amber-50 border border-amber-200 rounded-lg p-6">
          <h3 className="font-semibold text-amber-900 mb-2">📝 Integration Instructions</h3>
          <div className="text-sm text-amber-800 space-y-2">
            <p><strong>Image Upload to Bunny.net:</strong></p>
            <ol className="list-decimal list-inside space-y-1 ml-2">
              <li>Create a bunny.net account and storage zone</li>
              <li>Set up API credentials in environment variables</li>
              <li>Implement <code className="bg-amber-100 px-1 rounded">uploadImagesToBunny()</code> function in <code className="bg-amber-100 px-1 rounded">listingService.ts</code></li>
              <li>Replace the TODO comments in this form with actual upload logic</li>
              <li>Return CDN URLs from bunny.net to store in database</li>
            </ol>
          </div>
        </div>
      </div>
    </>
  );
}
