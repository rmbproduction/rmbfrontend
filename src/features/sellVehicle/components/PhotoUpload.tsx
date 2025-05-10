import React from 'react';
import { Camera, AlertCircle } from 'lucide-react';
import { VehiclePhotos, PhotoURLs } from '../types';
import SafeImage from '../../../components/SafeImage';

interface PhotoUploadProps {
  photos: VehiclePhotos;
  photoURLs: PhotoURLs;
  photoErrors: string | null;
  handlePhotoUpload: (e: React.ChangeEvent<HTMLInputElement>, view: keyof VehiclePhotos) => Promise<void>;
}

const PhotoUpload: React.FC<PhotoUploadProps> = ({
  photos,
  photoURLs,
  photoErrors,
  handlePhotoUpload
}) => {
  return (
    <div className="mb-8">
      <div className="flex items-center mb-4">
        <Camera className="h-6 w-6 text-[#FF5733] mr-2" />
        <h2 className="text-xl font-semibold text-gray-900">Upload Vehicle Photos</h2>
      </div>
      <p className="text-gray-600 mb-4">Upload clear photos of your vehicle from different angles. Front view is required.</p>
      
      {photoErrors && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start mb-6">
          <AlertCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-700">{photoErrors}</p>
        </div>
      )}
      
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start mb-6">
        <AlertCircle className="h-5 w-5 text-amber-500 mr-2 mt-0.5 flex-shrink-0" />
        <p className="text-sm text-amber-700">
          <span className="font-medium">Tip:</span> Good quality photos greatly increase your chances of selling quickly at the best price.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="col-span-1 sm:col-span-2 lg:col-span-3 mb-2">
          <h3 className="text-md font-medium text-gray-900">Required Photos</h3>
        </div>
        
        {/* Front View (Required) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Front View <span className="text-red-500">*</span>
          </label>
          <div 
            className={`relative h-48 border-2 ${photos.front ? 'border-[#FF5733]' : 'border-dashed border-gray-300'} rounded-lg overflow-hidden transition-all hover:border-[#FF5733] bg-gray-50`}
          >
            {photoURLs.front ? (
              <>
                <SafeImage 
                  src={photoURLs.front} 
                  alt="Front view" 
                  className="w-full h-full object-cover" 
                />
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <label htmlFor="front-upload" className="bg-white text-[#FF5733] px-4 py-2 rounded-lg cursor-pointer">
                    Change Photo
                  </label>
                </div>
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center px-4 py-4">
                <Camera className="h-10 w-10 text-gray-400 mb-2" />
                <label htmlFor="front-upload" className="cursor-pointer text-center">
                  <span className="text-[#FF5733] font-medium hover:underline">Upload Front View</span>
                  <p className="text-xs text-gray-500 mt-1">Front of the vehicle showing headlights and number plate</p>
                </label>
              </div>
            )}
            <input
              id="front-upload"
              name="front"
              type="file"
              className="sr-only"
              accept="image/*"
              onChange={(e) => handlePhotoUpload(e, 'front')}
            />
          </div>
        </div>

        {/* Other Views */}
        {['back', 'left', 'right'].map((view) => (
          <div key={view}>
            <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">
              {view} View <span className="text-red-500">*</span>
            </label>
            <div 
              className={`relative h-48 border-2 ${photos[view as keyof VehiclePhotos] ? 'border-[#FF5733]' : 'border-dashed border-gray-300'} rounded-lg overflow-hidden transition-all hover:border-[#FF5733] bg-gray-50`}
            >
              {photoURLs[view] ? (
                <>
                  <SafeImage 
                    src={photoURLs[view]} 
                    alt={`${view} view`} 
                    className="w-full h-full object-cover" 
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <label htmlFor={`${view}-upload`} className="bg-white text-[#FF5733] px-4 py-2 rounded-lg cursor-pointer">
                      Change Photo
                    </label>
                  </div>
                </>
              ) : (
                <div className="h-full flex flex-col items-center justify-center px-4 py-4">
                  <Camera className="h-10 w-10 text-gray-400 mb-2" />
                  <label htmlFor={`${view}-upload`} className="cursor-pointer text-center">
                    <span className="text-[#FF5733] font-medium hover:underline">Upload {view.charAt(0).toUpperCase() + view.slice(1)} View</span>
                  </label>
                </div>
              )}
              <input
                id={`${view}-upload`}
                name={view}
                type="file"
                className="sr-only"
                accept="image/*"
                onChange={(e) => handlePhotoUpload(e, view as keyof VehiclePhotos)}
              />
            </div>
          </div>
        ))}

        <div className="col-span-1 sm:col-span-2 lg:col-span-3 mt-4 mb-2">
          <h3 className="text-md font-medium text-gray-900">Additional Photos (Optional)</h3>
        </div>

        {/* Optional Views */}
        {['dashboard', 'odometer', 'engine', 'extras'].map((view) => (
          <div key={view}>
            <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">
              {view} View
            </label>
            <div 
              className={`relative h-48 border-2 ${photos[view as keyof VehiclePhotos] ? 'border-[#FF5733]' : 'border-dashed border-gray-300'} rounded-lg overflow-hidden transition-all hover:border-[#FF5733] bg-gray-50`}
            >
              {photoURLs[view] ? (
                <>
                  <SafeImage 
                    src={photoURLs[view]} 
                    alt={`${view} view`} 
                    className="w-full h-full object-cover" 
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <label htmlFor={`${view}-upload`} className="bg-white text-[#FF5733] px-4 py-2 rounded-lg cursor-pointer">
                      Change Photo
                    </label>
                  </div>
                </>
              ) : (
                <div className="h-full flex flex-col items-center justify-center px-4 py-4">
                  <Camera className="h-10 w-10 text-gray-400 mb-2" />
                  <label htmlFor={`${view}-upload`} className="cursor-pointer text-center">
                    <span className="text-[#FF5733] font-medium hover:underline">Upload {view.charAt(0).toUpperCase() + view.slice(1)} View</span>
                  </label>
                </div>
              )}
              <input
                id={`${view}-upload`}
                name={view}
                type="file"
                className="sr-only"
                accept="image/*"
                onChange={(e) => handlePhotoUpload(e, view as keyof VehiclePhotos)}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PhotoUpload; 