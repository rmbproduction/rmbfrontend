import React from 'react';
import PhotoUpload from './PhotoUpload';
import DocumentUpload from './DocumentUpload';
import { VehiclePhotos, VehicleDocuments, PhotoURLs, DocumentURLs } from '../types';

interface UploadStepProps {
  photos: VehiclePhotos;
  documents: VehicleDocuments;
  photoURLs: PhotoURLs;
  documentURLs: DocumentURLs;
  photoErrors: string | null;
  documentErrors: string | null;
  isSubmitting: boolean;
  handlePhotoUpload: (e: React.ChangeEvent<HTMLInputElement>, view: keyof VehiclePhotos) => Promise<void>;
  handleDocumentUpload: (e: React.ChangeEvent<HTMLInputElement>, docType: keyof VehicleDocuments) => Promise<void>;
  handlePrevStep: () => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
}

const UploadStep: React.FC<UploadStepProps> = ({
  photos,
  documents,
  photoURLs,
  documentURLs,
  photoErrors,
  documentErrors,
  isSubmitting,
  handlePhotoUpload,
  handleDocumentUpload,
  handlePrevStep,
  handleSubmit
}) => {
  return (
    <div className="p-8">
      {/* Photo Upload Section */}
      <PhotoUpload 
        photos={photos} 
        photoURLs={photoURLs} 
        photoErrors={photoErrors}
        handlePhotoUpload={handlePhotoUpload}
      />

      {/* Document Upload Section */}
      <div className="mt-10 mb-6">
        <DocumentUpload 
          documents={documents} 
          documentURLs={documentURLs} 
          documentErrors={documentErrors}
          handleDocumentUpload={handleDocumentUpload}
        />
      </div>

      <div className="mt-8 flex flex-col sm:flex-row gap-4">
        <button
          type="button"
          onClick={handlePrevStep}
          className="py-3 px-6 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors"
        >
          Back to Details
        </button>
        
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="flex-1 bg-[#FF5733] text-white py-3 px-6 rounded-xl hover:bg-[#ff4019] transition-colors font-semibold flex items-center justify-center disabled:bg-opacity-70 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <div className="w-5 h-5 border-t-2 border-b-2 border-white rounded-full animate-spin mr-2"></div>
              Submitting...
            </>
          ) : (
            'Submit Vehicle for Sale'
          )}
        </button>
      </div>
    </div>
  );
};

export default UploadStep; 