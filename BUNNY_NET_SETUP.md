# Bunny.net Integration Setup Guide

This guide explains how to integrate Bunny.net CDN for property listing image uploads in the est8Ledger application.

## Prerequisites

- Bunny.net account (sign up at https://bunny.net)
- Node.js and npm installed

## Step 1: Create a Bunny.net Account and Storage Zone

1. Go to [bunny.net](https://bunny.net) and create an account
2. Verify your email address
3. In the Bunny.net dashboard:
   - Navigate to **Storage** section
   - Click **Create New Storage Zone**
   - Choose a name (e.g., `est8ledger-listings`)
   - Select a region closest to your users
   - Click **Create**

## Step 2: Get Your API Credentials

1. In the Bunny.net dashboard, go to **Account** → **Billing Settings**
2. Find your **Storage Zone Replication API Key** (or **FTP Password**)
3. Note your **Storage Zone Name** (e.g., `est8ledger-listings`)
4. Create your CDN URL: `https://[STORAGE_ZONE_NAME].b-cdn.net`

## Step 3: Configure Environment Variables

Create or update your `.env` file in the project root:

```env
# Bunny.net Configuration
VITE_BUNNY_API_KEY=your_api_key_here
VITE_BUNNY_STORAGE_ZONE=your_storage_zone_name
VITE_BUNNY_CDN_URL=https://your_storage_zone_name.b-cdn.net
```

**Example:**
```env
VITE_BUNNY_API_KEY=abc123def456ghi789
VITE_BUNNY_STORAGE_ZONE=est8ledger-listings
VITE_BUNNY_CDN_URL=https://est8ledger-listings.b-cdn.net
```

## Step 4: Implement the Upload Function

In `src/services/listingService.ts`, uncomment and complete the `uploadImagesToBunny` function:

```typescript
async uploadImagesToBunny(files: File[]): Promise<string[]> {
  try {
    const bunnyApiKey = import.meta.env.VITE_BUNNY_API_KEY;
    const bunnyStorageZone = import.meta.env.VITE_BUNNY_STORAGE_ZONE;
    const bunnycdnUrl = import.meta.env.VITE_BUNNY_CDN_URL;

    if (!bunnyApiKey || !bunnyStorageZone || !bunnycdnUrl) {
      throw new Error('Bunny.net configuration missing');
    }

    const uploadedUrls: string[] = [];

    for (const file of files) {
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(7);
      const filename = `${timestamp}-${randomId}-${file.name}`;

      const response = await fetch(
        `https://${bunnyStorageZone}.storage.bunnycdn.com/${filename}`,
        {
          method: 'PUT',
          headers: {
            'AccessKey': bunnyApiKey,
          },
          body: file,
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to upload ${file.name}`);
      }

      const cdnUrl = `${bunnycdnUrl}/${filename}`;
      uploadedUrls.push(cdnUrl);
    }

    return uploadedUrls;
  } catch (error) {
    console.error('Error uploading images to bunny.net:', error);
    throw error;
  }
}
```

## Step 5: Test the Implementation

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Navigate to the Advertise Property page (`/dashboard/advertise`)

3. Fill in the form:
   - Select a property
   - Enter monthly rent and currency
   - Add a description
   - Upload 3 images

4. Submit the form and check:
   - Images are uploaded to Bunny.net
   - URLs are returned correctly
   - Listing is created in your database

## Troubleshooting

### 401 Unauthorized
- Check that your API key is correct
- Verify the API key is copied without extra spaces
- Ensure the API key has proper permissions

### 403 Forbidden
- The storage zone name might be wrong
- Check the exact storage zone name in your Bunny.net dashboard
- Verify the region is correct

### Upload Times Out
- The file might be too large (max 5MB per image)
- Check your internet connection
- Try uploading to a closer region

### Images Not Showing
- Verify the CDN URL is correct
- Check if the storage zone has pull zone enabled
- Ensure public access is enabled for your storage zone

## Security Best Practices

1. **Never commit `.env` file** - Add to `.gitignore`
2. **Use separate keys for development and production**
3. **Rotate API keys periodically**
4. **Monitor bandwidth usage** in your Bunny.net dashboard
5. **Set up purge rules** to delete old/unused images
6. **Enable CORS** if serving from different domains
7. **Use signed URLs** for sensitive content (optional)

## API Rate Limits

Bunny.net has generous rate limits:
- Standard account: Up to 1TB/month included
- Overages: $0.01/GB
- API requests: No limits for storage operations

Monitor your usage in the Bunny.net dashboard.

## Additional Resources

- [Bunny.net Documentation](https://bunny.net/knowledge-base)
- [Storage API Reference](https://bunny.net/knowledge-base/article/30175/storage-api-reference)
- [CDN Zone Setup](https://bunny.net/knowledge-base/article/12/how-to-use-bunnycdn-with-a-storage-zone)

## Support

For Bunny.net issues:
- Check [Bunny.net Knowledge Base](https://bunny.net/knowledge-base)
- Contact Bunny.net support

For est8Ledger integration issues:
- Check the console for error messages
- Review the `listingService.ts` implementation
- Check environment variables are loaded correctly
