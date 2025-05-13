# bike_mechanic
This is website for repair bike and modify it.

# RepairMyBike Frontend

## Image URL Handling and CDN Usage

We've implemented a consistent approach to handling image URLs throughout the application to ensure all images are properly served from CDN when possible, improving performance and reliability.

### Key Components

- **marketplaceService.ts** - Processes image URLs when fetching data from the API, converting regular media URLs to Cloudinary CDN URLs for better performance.

- **VehicleDetailPage.tsx** - Displays vehicle details and images using CDN URLs provided by marketplaceService.

- **VehicleBuyPage.tsx** - Lists vehicles with thumbnails using CDN URLs.

### How Image URLs Are Handled

1. When fetching vehicle data from the API, `marketplaceService.getVehicleDetails()` and `marketplaceService.getAvailableVehicles()` automatically convert image URLs to Cloudinary CDN URLs.

2. Components like `VehicleDetailPage` and `VehicleBuyPage` prioritize CDN URLs and avoid reprocessing them.

3. The system uses a fallback mechanism to ensure images still display even if CDN URLs fail, defaulting to direct media URLs and finally to placeholder images.

### Benefits

- **Improved Performance**: Cloudinary CDN delivers optimized images faster than direct media server access.
- **Better Reliability**: Multiple fallback mechanisms ensure images always display.
- **Reduced Server Load**: CDN offloads image serving from the application server.
- **Automatic Optimization**: Cloudinary automatically optimizes images for different devices and connection speeds.

### Implementation Details

URLs are processed in this order of preference:

1. Check if a CDN URL already exists (`.includes('cloudinary.com')`)
2. Generate a Cloudinary URL based on the vehicle ID
3. Fall back to direct media URLs if Cloudinary generation fails
4. Use placeholder images as a last resort

Image URLs are cached in localStorage for offline access and faster loading on subsequent visits.
