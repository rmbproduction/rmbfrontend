import React from 'react';
import { FileText, AlertCircle } from 'lucide-react';
import { VehicleDocuments, DocumentURLs } from '../types';

interface DocumentUploadProps {
  documents: VehicleDocuments;
  documentURLs: DocumentURLs;
  documentErrors: string | null;
  handleDocumentUpload: (e: React.ChangeEvent<HTMLInputElement>, docType: keyof VehicleDocuments) => Promise<void>;
}

const DocumentUpload: React.FC<DocumentUploadProps> = ({
  documents,
  documentURLs,
  documentErrors,
  handleDocumentUpload
}) => {
  return (
    <div>
      <div className="flex items-center mb-4">
        <FileText className="h-6 w-6 text-[#FF5733] mr-2" />
        <h2 className="text-xl font-semibold text-gray-900">Upload Documents</h2>
      </div>
      <p className="text-gray-600 mb-4">Please upload the following documents for verification.</p>
      
      {documentErrors && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start mb-6">
          <AlertCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-700">{documentErrors}</p>
        </div>
      )}
      
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start mb-6">
        <AlertCircle className="h-5 w-5 text-amber-500 mr-2 mt-0.5 flex-shrink-0" />
        <p className="text-sm text-amber-700">
          <span className="font-medium">Important:</span> Documents for Registration Certificate (RC) and Insurance are required for verification.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Registration Certificate */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Registration Certificate (RC) <span className="text-red-500">*</span>
          </label>
          <div className={`relative border-2 ${documents.rc ? 'border-[#FF5733]' : 'border-dashed border-gray-300'} rounded-lg p-4 transition-all hover:border-[#FF5733] bg-gray-50`}>
            {documentURLs.rc ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <FileText className="h-5 w-5 text-gray-500 mr-2" />
                  <span className="text-sm text-gray-700 truncate max-w-[180px]">RC Document</span>
                </div>
                <label htmlFor="rc-upload" className="text-sm text-[#FF5733] cursor-pointer hover:underline">
                  Change
                </label>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-4">
                <FileText className="h-10 w-10 text-gray-400 mb-2" />
                <label htmlFor="rc-upload" className="cursor-pointer text-center">
                  <span className="mt-2 block text-sm font-medium text-[#FF5733]">Upload RC</span>
                  <span className="mt-1 block text-xs text-gray-500">PDF, JPG or PNG up to 5MB</span>
                </label>
              </div>
            )}
            <input
              id="rc-upload"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              className="hidden"
              onChange={(e) => handleDocumentUpload(e, 'rc')}
            />
          </div>
        </div>

        {/* Insurance Document */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Insurance Document <span className="text-red-500">*</span>
          </label>
          <div className={`relative border-2 ${documents.insurance ? 'border-[#FF5733]' : 'border-dashed border-gray-300'} rounded-lg p-4 transition-all hover:border-[#FF5733] bg-gray-50`}>
            {documentURLs.insurance ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <FileText className="h-5 w-5 text-gray-500 mr-2" />
                  <span className="text-sm text-gray-700 truncate max-w-[180px]">Insurance Document</span>
                </div>
                <label htmlFor="insurance-upload" className="text-sm text-[#FF5733] cursor-pointer hover:underline">
                  Change
                </label>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-4">
                <FileText className="h-10 w-10 text-gray-400 mb-2" />
                <label htmlFor="insurance-upload" className="cursor-pointer text-center">
                  <span className="mt-2 block text-sm font-medium text-[#FF5733]">Upload Insurance</span>
                  <span className="mt-1 block text-xs text-gray-500">PDF, JPG or PNG up to 5MB</span>
                </label>
              </div>
            )}
            <input
              id="insurance-upload"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              className="hidden"
              onChange={(e) => handleDocumentUpload(e, 'insurance')}
            />
          </div>
        </div>

        {/* PUC Certificate */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            PUC Certificate
          </label>
          <div className={`relative border-2 ${documents.puc ? 'border-[#FF5733]' : 'border-dashed border-gray-300'} rounded-lg p-4 transition-all hover:border-[#FF5733] bg-gray-50`}>
            {documentURLs.puc ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <FileText className="h-5 w-5 text-gray-500 mr-2" />
                  <span className="text-sm text-gray-700 truncate max-w-[180px]">PUC Certificate</span>
                </div>
                <label htmlFor="puc-upload" className="text-sm text-[#FF5733] cursor-pointer hover:underline">
                  Change
                </label>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-4">
                <FileText className="h-10 w-10 text-gray-400 mb-2" />
                <label htmlFor="puc-upload" className="cursor-pointer text-center">
                  <span className="mt-2 block text-sm font-medium text-[#FF5733]">Upload PUC</span>
                  <span className="mt-1 block text-xs text-gray-500">PDF, JPG or PNG up to 5MB</span>
                </label>
              </div>
            )}
            <input
              id="puc-upload"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              className="hidden"
              onChange={(e) => handleDocumentUpload(e, 'puc')}
            />
          </div>
        </div>
        
        {/* Other Documents (Optional) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Other Documents (Optional)
          </label>
          <div className={`relative border-2 ${documents.additional ? 'border-[#FF5733]' : 'border-dashed border-gray-300'} rounded-lg p-4 transition-all hover:border-[#FF5733] bg-gray-50`}>
            {documentURLs.additional ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <FileText className="h-5 w-5 text-gray-500 mr-2" />
                  <span className="text-sm text-gray-700 truncate max-w-[180px]">Additional Document</span>
                </div>
                <label htmlFor="additional-upload" className="text-sm text-[#FF5733] cursor-pointer hover:underline">
                  Change
                </label>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-4">
                <FileText className="h-10 w-10 text-gray-400 mb-2" />
                <label htmlFor="additional-upload" className="cursor-pointer text-center">
                  <span className="mt-2 block text-sm font-medium text-[#FF5733]">Upload Additional</span>
                  <span className="mt-1 block text-xs text-gray-500">Service records, etc.</span>
                </label>
              </div>
            )}
            <input
              id="additional-upload"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              className="hidden"
              onChange={(e) => handleDocumentUpload(e, 'additional')}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentUpload; 