import React, { useState } from 'react';
import LoadingSpinner from './LoadingSpinner';

/**
 * LoadingExamples
 * 
 * A component that demonstrates various uses of the LoadingSpinner component.
 * For reference purposes only - not for production use.
 */
const LoadingExamples: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  
  const simulateLoading = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 3000);
  };
  
  return (
    <div className="p-8 space-y-12">
      <h1 className="text-3xl font-bold mb-8">LoadingSpinner Usage Examples</h1>
      
      <section>
        <h2 className="text-xl font-semibold mb-4">Default Variants</h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <div className="p-4 border rounded-lg flex flex-col items-center">
            <h3 className="mb-4">Extra Small</h3>
            <LoadingSpinner size="xs" />
          </div>
          <div className="p-4 border rounded-lg flex flex-col items-center">
            <h3 className="mb-4">Small</h3>
            <LoadingSpinner size="sm" />
          </div>
          <div className="p-4 border rounded-lg flex flex-col items-center">
            <h3 className="mb-4">Medium (Default)</h3>
            <LoadingSpinner size="md" />
          </div>
          <div className="p-4 border rounded-lg flex flex-col items-center">
            <h3 className="mb-4">Large</h3>
            <LoadingSpinner size="lg" />
          </div>
          <div className="p-4 border rounded-lg flex flex-col items-center">
            <h3 className="mb-4">Extra Large</h3>
            <LoadingSpinner size="xl" />
          </div>
        </div>
      </section>
      
      <section>
        <h2 className="text-xl font-semibold mb-4">Custom Colors</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="p-4 border rounded-lg flex flex-col items-center">
            <h3 className="mb-4">Brand Color (Default)</h3>
            <LoadingSpinner color="#FF5733" />
          </div>
          <div className="p-4 border rounded-lg flex flex-col items-center">
            <h3 className="mb-4">Blue</h3>
            <LoadingSpinner color="#3B82F6" />
          </div>
          <div className="p-4 border rounded-lg flex flex-col items-center">
            <h3 className="mb-4">Green</h3>
            <LoadingSpinner color="#10B981" />
          </div>
          <div className="p-4 border rounded-lg flex flex-col items-center">
            <h3 className="mb-4">Purple</h3>
            <LoadingSpinner color="#8B5CF6" />
          </div>
        </div>
      </section>
      
      <section>
        <h2 className="text-xl font-semibold mb-4">Inline Variant</h2>
        <div className="p-4 border rounded-lg">
          <p className="mb-4">Use inline variant for text integration:</p>
          <div className="flex items-center">
            <span className="mr-2">Loading your profile</span>
            <LoadingSpinner variant="inline" size="sm" showMessage={false} />
          </div>
          <div className="mt-4 flex items-center">
            <LoadingSpinner 
              variant="inline" 
              size="md" 
              message="Fetching data..." 
            />
          </div>
        </div>
      </section>
      
      <section>
        <h2 className="text-xl font-semibold mb-4">Button Variant</h2>
        <div className="p-4 border rounded-lg">
          <p className="mb-4">Use button variant inside buttons:</p>
          <div className="flex space-x-4">
            <button 
              className="px-4 py-2 bg-[#FF5733] text-white rounded-lg flex items-center"
              onClick={simulateLoading}
              disabled={isLoading}
            >
              {isLoading && <LoadingSpinner variant="button" size="sm" color="white" />}
              Submit Form
            </button>
            
            <button 
              className="px-4 py-2 border border-[#FF5733] text-[#FF5733] rounded-lg flex items-center"
              disabled={isLoading}
            >
              {isLoading && <LoadingSpinner variant="button" size="sm" />}
              Cancel
            </button>
          </div>
        </div>
      </section>
      
      <section>
        <h2 className="text-xl font-semibold mb-4">Custom Messages</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 border rounded-lg flex flex-col items-center">
            <LoadingSpinner message="Processing payment..." />
          </div>
          <div className="p-4 border rounded-lg flex flex-col items-center">
            <LoadingSpinner message="Uploading images..." />
          </div>
          <div className="p-4 border rounded-lg flex flex-col items-center">
            <LoadingSpinner message="Completing your booking..." />
          </div>
        </div>
      </section>
      
      <section>
        <h2 className="text-xl font-semibold mb-4">Fullscreen Variant</h2>
        <div className="p-4 border rounded-lg">
          <p className="mb-4">For page transitions or blocking operations:</p>
          <button 
            className="px-4 py-2 bg-blue-600 text-white rounded-lg"
            onClick={() => {
              const fullscreenLoader = document.getElementById('fullscreen-loader');
              if (fullscreenLoader) {
                fullscreenLoader.style.display = 'flex';
                setTimeout(() => {
                  fullscreenLoader.style.display = 'none';
                }, 3000);
              }
            }}
          >
            Show Fullscreen Loader (3s)
          </button>
          
          {/* This would normally be at the root level */}
          <div id="fullscreen-loader" style={{ display: 'none' }}>
            <LoadingSpinner 
              variant="fullscreen" 
              size="lg"
              message="Loading page content..." 
            />
          </div>
        </div>
      </section>
      
      <section className="bg-gray-100 p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Implementation Tips</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>Use the default variant for standalone loading states</li>
          <li>Use the inline variant when integrating with text or for horizontal layouts</li>
          <li>Use the button variant for loading states within buttons</li>
          <li>Use the fullscreen variant for page transitions or blocking operations</li>
          <li>Customize size and color to match your UI context</li>
          <li>Set showMessage to false when you don't need the loading text</li>
        </ul>
      </section>
    </div>
  );
};

export default LoadingExamples; 