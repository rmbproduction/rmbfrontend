/**
 * Cloudinary URL Testing Utility
 * 
 * This script helps diagnose issues with Cloudinary image URLs
 * Add this script to your HTML with:
 * <script src="/test-cloudinary.js"></script>
 */

(function() {
  console.log('Cloudinary URL Testing Utility loaded');
  
  // Example of correct Cloudinary URL format
  const EXAMPLE_URL = 'https://res.cloudinary.com/dz81bjuea/image/upload/v1747150610/vehicle_photos/back/hrj3dowlhp5biid3ardg.png';
  
  // Validate if a URL is a properly formatted Cloudinary URL with version number
  function isValidCloudinaryUrl(url) {
    if (!url || typeof url !== 'string') return false;
    
    // Check if it's a properly formatted Cloudinary URL with version number
    return url.includes('cloudinary.com') && 
          url.includes('/upload/v') && 
          !url.includes('/v1/') && 
          url.match(/\/v\d+\//) !== null;
  }
  
  // Test a URL
  function testUrl(url) {
    const result = {
      url: url,
      isValidFormat: isValidCloudinaryUrl(url),
      accessible: false,
      error: null
    };
    
    // Test if the URL is accessible
    return new Promise((resolve) => {
      if (!url) {
        result.error = 'URL is empty';
        resolve(result);
        return;
      }
      
      // Try to load the image
      const img = new Image();
      
      img.onload = function() {
        result.accessible = true;
        result.width = img.width;
        result.height = img.height;
        resolve(result);
      };
      
      img.onerror = function(e) {
        result.error = 'Failed to load image';
        resolve(result);
      };
      
      img.src = url;
      
      // Timeout after 5 seconds
      setTimeout(() => {
        if (!result.accessible) {
          result.error = 'Timeout after 5 seconds';
          resolve(result);
        }
      }, 5000);
    });
  }
  
  // Main test function
  async function testCloudinaryUrl(url) {
    console.log('Testing URL:', url);
    const result = await testUrl(url);
    console.log('Result:', result);
    return result;
  }
  
  // Extract all images on the page
  function extractAllImagesOnPage() {
    const images = document.querySelectorAll('img');
    console.log(`Found ${images.length} images on page`);
    
    const results = {
      total: images.length,
      cloudinaryCount: 0,
      validCloudinaryCount: 0,
      invalidUrls: []
    };
    
    images.forEach((img, index) => {
      const src = img.src;
      console.log(`Image ${index + 1}:`, src);
      
      if (src.includes('cloudinary.com')) {
        results.cloudinaryCount++;
        if (isValidCloudinaryUrl(src)) {
          results.validCloudinaryCount++;
        } else {
          results.invalidUrls.push(src);
        }
      }
    });
    
    console.log('Image analysis results:', results);
    return results;
  }
  
  // Expose functions to global scope
  window.CloudinaryTest = {
    testUrl: testCloudinaryUrl,
    extractAllImages: extractAllImagesOnPage,
    validateUrl: isValidCloudinaryUrl,
    exampleUrl: EXAMPLE_URL
  };
  
  // Auto-run the extraction when the page is loaded
  window.addEventListener('load', function() {
    setTimeout(extractAllImagesOnPage, 1000);
    
    console.log('Cloudinary URL test utility is ready. Use CloudinaryTest.testUrl() to test a URL.');
    console.log('Example of correct URL format:', EXAMPLE_URL);
  });
})(); 