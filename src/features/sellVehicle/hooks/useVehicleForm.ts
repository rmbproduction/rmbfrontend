import { useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { VehicleFormData, VehiclePhotos, VehicleDocuments, FormErrors, PhotoURLs, DocumentURLs, FORM_STORAGE_KEY, PHOTOS_STORAGE_KEY, DOCUMENTS_STORAGE_KEY } from '../types';
import { validateForm, validatePhotos, validateDocuments } from '../utils/validation';
import marketplaceService from '../../../services/marketplaceService';
import { formatDateForBackend } from '../utils/helpers';
import { checkUserAuthentication } from '../../../utils/auth';
import {
  cleanupBlobUrls,
  safeRevokeUrl,
  fileToBase64,
  safeStoreBase64Image
} from '../../../services/imageUtils';
import persistentStorageService from '../../../services/persistentStorageService';

export const useVehicleForm = () => {
  const navigate = useNavigate();

  // Get saved form data from localStorage or use defaults
  const getSavedFormData = (): VehicleFormData => {
    const savedData = localStorage.getItem(FORM_STORAGE_KEY);
    if (savedData) {
      try {
        return JSON.parse(savedData);
      } catch (e) {
        console.error('Error parsing saved form data:', e);
      }
    }
    
    // Return default values if no saved data exists
    return {
      type: '',
      brand: '',
      model: '',
      year: '',
      color: '',
      registrationNumber: '',
      kmsDriven: '',
      mileage: '',
      condition: '',
      expectedPrice: '',
      description: '',
      fuelType: 'petrol',
      engineCapacity: '',
      lastServiceDate: '',
      insuranceValidTill: '',
      contactNumber: localStorage.getItem('userPhone') || '',
      pickupAddress: localStorage.getItem('userAddress') || '',
      features: [],
      highlights: [],
      isPriceNegotiable: true,
      sellerNotes: '',
      hasPucCertificate: false,
      emiAvailable: false
    };
  };

  // Form state
  const [formData, setFormData] = useState<VehicleFormData>(getSavedFormData());
  const [step, setStep] = useState(1);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [photoErrors, setPhotoErrors] = useState<string | null>(null);
  const [documentErrors, setDocumentErrors] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasPreviousVehicles, setHasPreviousVehicles] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Photo and document states
  const [photos, setPhotos] = useState<VehiclePhotos>({
    front: null,
    back: null,
    left: null,
    right: null,
    dashboard: null,
    odometer: null,
    engine: null,
    extras: null
  });

  const [documents, setDocuments] = useState<VehicleDocuments>({
    rc: null,
    insurance: null,
    puc: null,
    transfer: null,
    additional: null
  });

  // Get saved photo URLs from localStorage
  const getSavedPhotoURLs = (): PhotoURLs => {
    const savedURLs = localStorage.getItem(PHOTOS_STORAGE_KEY);
    if (savedURLs) {
      try {
        return JSON.parse(savedURLs);
      } catch (e) {
        console.error('Error parsing saved photo URLs:', e);
      }
    }
    return {};
  };
  
  // Get saved document URLs from localStorage
  const getSavedDocumentURLs = (): DocumentURLs => {
    const savedURLs = localStorage.getItem(DOCUMENTS_STORAGE_KEY);
    if (savedURLs) {
      try {
        return JSON.parse(savedURLs);
      } catch (e) {
        console.error('Error parsing saved document URLs:', e);
      }
    }
    return {};
  };

  const [photoURLs, setPhotoURLs] = useState<PhotoURLs>(getSavedPhotoURLs());
  const [documentURLs, setDocumentURLs] = useState<DocumentURLs>(getSavedDocumentURLs());

  // Save form data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(formData));
  }, [formData]);
  
  // Save photo URLs to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(PHOTOS_STORAGE_KEY, JSON.stringify(photoURLs));
  }, [photoURLs]);
  
  // Save document URLs to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(DOCUMENTS_STORAGE_KEY, JSON.stringify(documentURLs));
  }, [documentURLs]);

  // Check if user has previous vehicles on component mount
  useEffect(() => {
    const checkPreviousVehicles = async () => {
      if (checkUserAuthentication()) {
        try {
          const response = await marketplaceService.getUserSellRequests();
          setHasPreviousVehicles(Array.isArray(response) && response.length > 0);
          setIsAuthenticated(true);
        } catch (err) {
          console.error('Error checking previous vehicles:', err);
        }
      } else {
        setIsAuthenticated(false);
      }
    };
    
    checkPreviousVehicles();
  }, []);
  
  // Check authentication when component mounts
  useEffect(() => {
    const authenticated = checkUserAuthentication();
    setIsAuthenticated(authenticated);
    
    if (!authenticated) {
      toast.error('You must be logged in to sell a vehicle', {
        position: 'top-right',
        autoClose: 5000
      });
      // Redirect to login page after a short delay
      setTimeout(() => {
        navigate('/login-signup', { state: { redirectTo: '/sell-vehicle' } });
      }, 2000);
    }
  }, [navigate]);

  // Clean up object URLs when component unmounts
  useEffect(() => {
    return () => {
      // Clean up photo URLs
      cleanupBlobUrls(photoURLs);
      
      // Clean up document URLs
      cleanupBlobUrls(documentURLs);
    };
  }, [photoURLs, documentURLs]);

  // Reset form data to initial state
  const resetForm = () => {
    // Clean up existing blob URLs
    cleanupBlobUrls(photoURLs);
    cleanupBlobUrls(documentURLs);
    
    // Reset all state
    setFormData(getSavedFormData());
    setStep(1);
    setFormErrors({});
    setPhotoErrors(null);
    setDocumentErrors(null);
    setSubmitError(null);
    setIsSubmitting(false);
    
    setPhotos({
      front: null,
      back: null,
      left: null,
      right: null,
      dashboard: null,
      odometer: null,
      engine: null,
      extras: null
    });
    
    setDocuments({
      rc: null,
      insurance: null,
      puc: null,
      transfer: null,
      additional: null
    });
    
    setPhotoURLs({});
    setDocumentURLs({});
    
    // Clear localStorage items
    localStorage.removeItem(FORM_STORAGE_KEY);
    localStorage.removeItem(PHOTOS_STORAGE_KEY);
    localStorage.removeItem(DOCUMENTS_STORAGE_KEY);
  };

  // Input handlers
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error for this field when user types
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  // Photo upload handler
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, view: keyof VehiclePhotos) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // If we already have a URL for this view, revoke it
      if (photoURLs[view]) {
        safeRevokeUrl(photoURLs[view]);
      }

      // Update the file state
      setPhotos(prev => ({
        ...prev,
        [view]: file
      }));

      try {
        // Convert to base64 for storage
        const base64 = await fileToBase64(file);
        
        // Store blob URL for UI
        const blobUrl = URL.createObjectURL(file);
        setPhotoURLs(prev => ({
          ...prev,
          [view]: blobUrl
        }));
        
        // Compress and store base64 in localStorage for persistence
        // Use a smaller size (0.5MB) for photos to ensure they fit in storage
        await safeStoreBase64Image('sell_vehicle_photos_base64', view, base64, 0.5);
      } catch (error) {
        console.error(`Error processing photo for ${view}:`, error);
        toast.error(`Failed to process the image. Please try again with a different image.`);
      }
    }
  };

  // Document upload handler
  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>, docType: keyof VehicleDocuments) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // If we already have a URL for this document, revoke it
      if (documentURLs[docType]) {
        safeRevokeUrl(documentURLs[docType]);
      }

      // Update the file state
      setDocuments(prev => ({
        ...prev,
        [docType]: file
      }));
      
      try {
        // Convert to base64 for storage
        const base64 = await fileToBase64(file);
        
        // Create blob URL for UI
        const blobUrl = URL.createObjectURL(file);
        setDocumentURLs(prev => ({
          ...prev,
          [docType]: blobUrl
        }));
        
        // Safely store the document with compression if it's an image
        if (file.type.startsWith('image/')) {
          await safeStoreBase64Image('sell_vehicle_docs_base64', docType, base64, 0.5);
        } else {
          // For non-image files, just store as is (or skip if too large)
          const base64Docs = JSON.parse(localStorage.getItem('sell_vehicle_docs_base64') || '{}');
          base64Docs[docType] = base64;
          localStorage.setItem('sell_vehicle_docs_base64', JSON.stringify(base64Docs));
        }
      } catch (error) {
        console.error(`Error processing document for ${docType}:`, error);
        toast.error(`Failed to process the document. Please try again with a different file.`);
      }
    }
  };

  // Add/remove feature
  const addFeature = (feature: string) => {
    if (feature && !formData.features.includes(feature)) {
      setFormData(prev => ({
        ...prev,
        features: [...prev.features, feature]
      }));
    }
  };

  const removeFeature = (feature: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter(f => f !== feature)
    }));
  };

  // Add/remove highlight
  const addHighlight = (highlight: string) => {
    if (highlight && !formData.highlights.includes(highlight)) {
      setFormData(prev => ({
        ...prev,
        highlights: [...prev.highlights, highlight]
      }));
    }
  };

  const removeHighlight = (highlight: string) => {
    setFormData(prev => ({
      ...prev,
      highlights: prev.highlights.filter(h => h !== highlight)
    }));
  };

  // Navigation between steps
  const handleNextStep = () => {
    if (step === 1) {
      const errors = validateForm(formData);
      if (Object.keys(errors).length === 0) {
        setStep(2);
        window.scrollTo(0, 0);
      } else {
        setFormErrors(errors);
        toast.error('Please fix the errors in the form');
      }
    } else if (step === 2) {
      const photoErrorMessage = validatePhotos(photos);
      const documentErrorMessage = validateDocuments(documents);
      
      if (!photoErrorMessage && !documentErrorMessage) {
        const syntheticEvent = {
          preventDefault: () => {},
        } as React.FormEvent;
        handleSubmit(syntheticEvent);
      } else {
        setPhotoErrors(photoErrorMessage);
        setDocumentErrors(documentErrorMessage);
        if (photoErrorMessage) {
          toast.error(photoErrorMessage);
        }
        if (documentErrorMessage) {
          toast.error(documentErrorMessage);
        }
      }
    }
  };

  const handlePrevStep = () => {
    if (step === 3) {
      setStep(2);
    } else if (step === 2) {
      setStep(1);
    }
    window.scrollTo(0, 0);
  };

  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check user authentication
    const isAuthenticated = await checkUserAuthentication();
    if (!isAuthenticated) {
      toast.error('Please log in to submit your vehicle');
      navigate('/login-signup', { state: { redirectTo: '/sell-vehicle' } });
      return;
    }

    // Validate form data
    const errors = validateForm(formData);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast.error('Please fix the errors in the form');
      return;
    }
    
    // Validate required photos
    const photoErrors = validatePhotos(photos);
    if (photoErrors) {
      setPhotoErrors(photoErrors);
      toast.error(photoErrors);
      return;
    }
    
    // Validate required documents
    const documentErrors = validateDocuments(documents);
    if (documentErrors) {
      setDocumentErrors(documentErrors);
      toast.error(documentErrors);
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    
    try {
      // Store expected price in session storage
      try {
        sessionStorage.setItem('vehicle_expected_price', formData.expectedPrice);
        console.log('Expected price saved to session storage:', formData.expectedPrice);
      } catch (storageError) {
        console.error('Failed to save expected price to session storage:', storageError);
      }
      
      // Submit to backend API
      const response = await marketplaceService.submitVehicle(
        // First argument: formData
        formData,
        // Second argument: photos
        photos,
        // Third argument: documents
        documents
      );
      
      // Check if this was an existing sell request
      if (response._isExistingSellRequest) {
        // Show a message explaining the situation to the user
        toast.info('A sell request for this vehicle already exists. We\'ll take you to the existing request details.', {
          position: 'top-right',
          autoClose: 5000
        });
      } else {
        toast.success('Your vehicle has been submitted successfully!', {
          position: 'top-right',
          autoClose: 5000
        });
      }
      
      // CRITICAL IMPROVEMENT: Save response data directly to sessionStorage for immediate access
      try {
        // Use the enrichVehicleData function to ensure consistent data structure
        const enrichedData = marketplaceService.enrichVehicleData(response);
        
        // Save directly to session storage with the proper key for immediate access
        sessionStorage.setItem(`vehicle_summary_${response.id}`, JSON.stringify(enrichedData));
        console.log('Saved vehicle data to sessionStorage after submission:', response.id);
        
        // Also save to persistent storage if available
        await persistentStorageService.saveVehicleData(response.id, enrichedData);
      } catch (storageError) {
        console.error('Error saving submission data to storage:', storageError);
        // Non-fatal error, just log it
      }
      
      // Clean up blobs to prevent memory leaks
      cleanupBlobUrls(photoURLs);
      cleanupBlobUrls(documentURLs);
      
      // Reset the form after successful submission
      resetForm();
      
      // Redirect to the submission confirmation page
      navigate(`/sell-vehicle/${response.id}/summary`);
    } catch (error: any) {
      console.error('Error submitting vehicle:', error);
      
      // Check if this is a duplicate vehicle error
      if (error.message && error.message.includes('sell request with this vehicle already exists') 
          || (error as any).isDuplicateSellRequest) {
        // Try to extract vehicle ID from the error details if available
        let vehicleId = null;
        if ((error as any).details && (error as any).details.vehicle) {
          // Extract the vehicle ID
          try {
            const detailsString = Array.isArray((error as any).details.vehicle) 
              ? (error as any).details.vehicle[0] 
              : (error as any).details.vehicle;
            
            // Check if the message contains the ID
            const match = detailsString.match(/vehicle with id (\d+)/i);
            if (match && match[1]) {
              vehicleId = match[1];
            }
          } catch (e) {
            console.error('Error extracting vehicle ID from details:', e);
          }
        }
        
        // Handle the duplicate case with a helpful message
        toast.info('A sell request for this vehicle already exists.', {
          position: 'top-right',
          autoClose: 5000
        });
        
        if (vehicleId) {
          // If we have the vehicle ID, redirect to its summary
          resetForm();
          navigate(`/sell-vehicle/${vehicleId}/summary`);
          return;
        }
        
        // If we couldn't extract the vehicle ID, show a different message
        toast.info('Please check your vehicle listings to view the existing request.', {
          position: 'top-right',
          autoClose: 5000
        });
        
        // Redirect to the sell vehicle page
        resetForm();
        navigate('/sell-vehicle');
        return;
      }
      
      // Regular error handling for other errors
      setSubmitError(error.message || 'An error occurred while submitting your vehicle');
      
      // Show error toast
      toast.error(`Submission failed: ${error.message || 'Unknown error'}`, {
        position: 'top-right',
        autoClose: 5000
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    formData,
    step,
    formErrors,
    photoErrors,
    documentErrors,
    submitError,
    isSubmitting,
    photos,
    photoURLs,
    documents,
    documentURLs,
    hasPreviousVehicles,
    isAuthenticated,
    setFormData,
    setStep,
    handleInputChange,
    handleCheckboxChange,
    handlePhotoUpload,
    handleDocumentUpload,
    addFeature,
    removeFeature,
    addHighlight,
    removeHighlight,
    handleNextStep,
    handlePrevStep,
    handleSubmit,
    setPhotoErrors,
    setDocumentErrors,
    resetForm
  };
}; 