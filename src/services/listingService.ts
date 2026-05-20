import apiClient from './api';

interface PropertyListing {
  propertyAgreementId: number;
  monthlyRent: number;
  currency: string;
  description: string;
  imageUrls?: string[];
}

class ListingService {
  /**
   * Upload images to bunny.net CDN
   * @param files - Array of File objects to upload
   * @returns Promise containing array of CDN URLs
   *
   * Integration steps:
   * 1. Sign up for bunny.net account (https://bunny.net)
   * 2. Create a storage zone and get API key
   * 3. Set VITE_BUNNY_API_KEY and VITE_BUNNY_STORAGE_ZONE in .env
   * 4. Implement the actual upload logic using bunny.net API
   *
   * Example bunny.net upload API:
   * POST https://[STORAGE_ZONE].storage.bunnycdn.com/[FILENAME]
   * Headers: AccessKey: [API_KEY], Content-Type: application/octet-stream
   */
  async uploadImagesToBunny(files: File[]): Promise<string[]> {
    try {
      // TODO: Implement actual bunny.net upload
      // const bunnyApiKey = import.meta.env.VITE_BUNNY_API_KEY;
      // const bunnyStorageZone = import.meta.env.VITE_BUNNY_STORAGE_ZONE;

      // if (!bunnyApiKey || !bunnyStorageZone) {
      //   throw new Error('Bunny.net configuration missing');
      // }

      // const uploadedUrls: string[] = [];

      // for (const file of files) {
      //   const formData = new FormData();
      //   formData.append('file', file);

      //   const response = await fetch(
      //     `https://${bunnyStorageZone}.storage.bunnycdn.com/${Date.now()}-${file.name}`,
      //     {
      //       method: 'PUT',
      //       headers: {
      //         'AccessKey': bunnyApiKey,
      //       },
      //       body: file,
      //     }
      //   );

      //   if (!response.ok) {
      //     throw new Error(`Failed to upload ${file.name}`);
      //   }

      //   const cdnUrl = `https://${bunnyStorageZone}.b-cdn.net/${Date.now()}-${file.name}`;
      //   uploadedUrls.push(cdnUrl);
      // }

      // return uploadedUrls;

      // For now, return mock URLs
      return files.map((file, index) =>
        `https://cdn.example.com/listings/${Date.now()}-${index}-${file.name}`
      );
    } catch (error) {
      console.error('Error uploading images to bunny.net:', error);
      throw error;
    }
  }

  /**
   * Create a new property listing
   */
  async createListing(listingData: PropertyListing) {
    try {
      const response = await apiClient.post('/listings', listingData);
      return response.data;
    } catch (error) {
      console.error('Error creating listing:', error);
      throw error;
    }
  }

  /**
   * Get all listings for a property
   */
  async getPropertyListings(propertyAgreementId: number) {
    try {
      const response = await apiClient.get(`/listings/property/${propertyAgreementId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching listings:', error);
      throw error;
    }
  }

  /**
   * Get listing details by ID
   */
  async getListing(listingId: number) {
    try {
      const response = await apiClient.get(`/listings/${listingId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching listing:', error);
      throw error;
    }
  }

  /**
   * Update an existing listing
   */
  async updateListing(listingId: number, listingData: Partial<PropertyListing>) {
    try {
      const response = await apiClient.put(`/listings/${listingId}`, listingData);
      return response.data;
    } catch (error) {
      console.error('Error updating listing:', error);
      throw error;
    }
  }

  /**
   * Delete a listing
   */
  async deleteListing(listingId: number) {
    try {
      const response = await apiClient.delete(`/listings/${listingId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting listing:', error);
      throw error;
    }
  }

  /**
   * Get all active listings (for tenant browsing)
   */
  async getActiveListing(filters?: {
    city?: string;
    propertyType?: string;
    minRent?: number;
    maxRent?: number;
  }) {
    try {
      const response = await apiClient.get('/listings/active', {
        params: filters,
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching active listings:', error);
      throw error;
    }
  }
}

const listingService = new ListingService();
export default listingService;
