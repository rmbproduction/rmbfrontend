# Deployment Guide for Repair My Bike Frontend

## Environment Configuration - New Simplified Approach

### Local Development
1. Create a `.env` file in the root directory with the following variables:
   ```
   # Just set these two variables for your environment
   HOST_DOMAIN=localhost:8000
   HOST_PROTOCOL=http
   
   # The rest are derived automatically
   VITE_API_URL=${HOST_PROTOCOL}://${HOST_DOMAIN}/api
   VITE_MEDIA_URL=${HOST_PROTOCOL}://${HOST_DOMAIN}
   VITE_AUTH_ENABLED=true
   VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
   ```

### Vercel Deployment
1. Set the following environment variables in your Vercel project settings:
   ```
   # Just set these two variables for your environment
   HOST_DOMAIN=repairmybike.up.railway.app
   HOST_PROTOCOL=https
   
   # The rest are derived automatically
   VITE_API_URL=${HOST_PROTOCOL}://${HOST_DOMAIN}/api
   VITE_MEDIA_URL=${HOST_PROTOCOL}://${HOST_DOMAIN}
   VITE_AUTH_ENABLED=true
   VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
   ```

   > NOTE: Some deployment platforms may not support variable interpolation. In that case, set the full URLs directly:
   > ```
   > VITE_API_URL=https://repairmybike.up.railway.app/api
   > VITE_MEDIA_URL=https://repairmybike.up.railway.app
   > ```

2. Ensure your build command is set to `npm run build`

## Mobile Compatibility

The app now dynamically detects URL endpoints based on environment variables instead of hardcoded localhost URLs, making it compatible with mobile devices.

## Common Issues

### Vercel Build Errors

If you encounter a build error related to "terser", you have two options:

1. Use the built-in esbuild minifier (recommended):
   - In `vite.config.ts`, set `minify: 'esbuild'` (this is now the default)

2. Or install terser as a dependency:
   - Run `npm install --save-dev terser`

### CORS Issues

If you encounter CORS issues:

1. Ensure the backend's CORS settings include your frontend domain
2. Check that `CORS_ALLOW_CREDENTIALS` is set to `true` on the backend
3. Verify that the request includes proper headers

### Service Worker 

If you encounter service worker issues:
1. Clear your browser cache 
2. Unregister existing service workers
3. Reload the page 