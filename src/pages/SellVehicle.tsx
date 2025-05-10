import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Import all components from our new structure
import VehicleForm from '../features/sellVehicle/components/VehicleForm';
import UploadStep from '../features/sellVehicle/components/UploadStep';
import PreviousVehiclesInline from '../features/sellVehicle/components/PreviousVehiclesInline';
import { useVehicleForm } from '../features/sellVehicle/hooks/useVehicleForm';

const SellVehicle: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  
  // Use our custom hook to manage all form state and logic
  const { 
    formData, step, formErrors, photoErrors, documentErrors, 
    isSubmitting, photos, photoURLs, documents, documentURLs,
    hasPreviousVehicles, isAuthenticated,
    handleInputChange, handleCheckboxChange, handlePhotoUpload, 
    handleDocumentUpload, addFeature, removeFeature,
    addHighlight, removeHighlight, handleNextStep, handlePrevStep, 
    handleSubmit, setFormData, resetForm
  } = useVehicleForm();

  // Custom submit handler that will close the form upon success
  const handleFormSubmit = async (e: React.FormEvent) => {
    try {
      await handleSubmit(e);
      // If we reach here, submission was successful
      setShowForm(false);
    } catch (error) {
      // Error handling is already taken care of in the useVehicleForm hook
      console.error("Form submission failed:", error);
    }
  };

  // Handle closing the form
  const handleCloseForm = () => {
    resetForm();
    setShowForm(false);
  };

  return (
    <div className="bg-gray-50 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Sell Your Vehicle</h1>
          <p className="mt-2 text-lg text-gray-600">
            Get the best price for your two-wheeler in just a few easy steps
          </p>
          
          {!showForm && (
            <motion.button
              onClick={() => setShowForm(true)}
              className="mt-6 bg-[#FF5733] text-white py-3 px-8 rounded-xl hover:bg-[#ff4019] transition-colors font-semibold text-lg"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Fill Form
            </motion.button>
          )}
        </div>
        
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="lg:flex lg:gap-6"
            >
              {/* Main Form Column */}
              <div className="lg:flex-1">
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8">
                  {/* Header */}
                  <div className="bg-gradient-to-r from-[#FF5733] to-[#ff7a5c] p-8 text-white">
                    <div className="flex justify-between items-center">
                      <div>
                        <h1 className="text-3xl font-bold">Sell Your Vehicle</h1>
                        <p className="mt-2 text-white text-opacity-80">
                          Fill out the details below to list your vehicle for sale
                        </p>
                      </div>
                      <button
                        onClick={handleCloseForm}
                        className="text-white hover:text-white/70 p-2 rounded-full"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M18 6 6 18"></path>
                          <path d="m6 6 12 12"></path>
                        </svg>
                      </button>
                    </div>
                    
                    {/* Progress Steps */}
                    <div className="mt-8 flex items-center">
                      <div className={`flex items-center justify-center h-10 w-10 rounded-full ${step >= 1 ? 'bg-white text-[#FF5733]' : 'bg-white bg-opacity-30 text-white'} font-semibold`}>
                        1
                      </div>
                      <div className={`flex-1 h-1 mx-2 ${step >= 2 ? 'bg-white' : 'bg-white bg-opacity-30'}`}></div>
                      <div className={`flex items-center justify-center h-10 w-10 rounded-full ${step >= 2 ? 'bg-white text-[#FF5733]' : 'bg-white bg-opacity-30 text-white'} font-semibold`}>
                        2
                      </div>
                    </div>
                    <div className="mt-2 flex justify-between text-sm text-white text-opacity-80">
                      <span>Vehicle Details</span>
                      <span>Upload Photos & Documents</span>
                    </div>
                  </div>
                  
                  <form onSubmit={handleFormSubmit}>
                    {step === 1 ? (
                      <VehicleForm 
                        formData={formData}
                        formErrors={formErrors}
                        handleInputChange={handleInputChange}
                        handleCheckboxChange={handleCheckboxChange}
                        addFeature={addFeature}
                        removeFeature={removeFeature}
                        addHighlight={addHighlight}
                        removeHighlight={removeHighlight}
                        setFormData={setFormData}
                        onNextStep={handleNextStep}
                      />
                    ) : (
                      <UploadStep
                        photos={photos}
                        documents={documents}
                        photoURLs={photoURLs}
                        documentURLs={documentURLs}
                        photoErrors={photoErrors}
                        documentErrors={documentErrors}
                        isSubmitting={isSubmitting}
                        handlePhotoUpload={handlePhotoUpload}
                        handleDocumentUpload={handleDocumentUpload}
                        handlePrevStep={handlePrevStep}
                        handleSubmit={handleFormSubmit}
                      />
                    )}
                  </form>
                </div>
              </div>
              
              {/* Previous Vehicles Column - only show if user has previous vehicles */}
              {isAuthenticated && hasPreviousVehicles && (
                <div className="lg:w-1/3">
                  <PreviousVehiclesInline className="bg-white rounded-2xl shadow-lg p-6" />
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
        
        {!showForm && isAuthenticated && hasPreviousVehicles && (
          <div className="mt-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Previous Vehicles</h2>
            <PreviousVehiclesInline className="bg-white rounded-2xl shadow-lg p-6" />
          </div>
        )}
      </div>
    </div>
  );
};

export default SellVehicle; 