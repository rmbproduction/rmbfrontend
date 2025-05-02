import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api.service';
import { showNotification } from './NotificationCenter';

interface Review {
  id: string;
  rating: number;
  comment: string;
  user: {
    name: string;
    avatar?: string;
  };
  createdAt: string;
  serviceId: string;
  photos?: string[];
}

interface ReviewFormData {
  rating: number;
  comment: string;
  photos: File[];
}

interface ReviewSystemProps {
  serviceId: string;
  className?: string;
}

const ReviewSystem: React.FC<ReviewSystemProps> = ({ serviceId, className = '' }) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [formData, setFormData] = useState<ReviewFormData>({
    rating: 5,
    comment: '',
    photos: []
  });
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchReviews();
  }, [serviceId]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const response = await apiService.request<Review[]>(
        `/repairing_service/reviews/?service_id=${serviceId}`
      );
      setReviews(response.data);
    } catch (error) {
      showNotification({
        type: 'error',
        message: 'Failed to fetch reviews',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Create FormData for file upload
      const formDataObj = new FormData();
      formDataObj.append('rating', formData.rating.toString());
      formDataObj.append('comment', formData.comment);
      formDataObj.append('service_id', serviceId);
      
      formData.photos.forEach((photo, index) => {
        formDataObj.append(`photos[${index}]`, photo);
      });

      await apiService.request<Review>(
        '/repairing_service/reviews/',
        {
          method: 'POST',
          headers: {
            // Don't set Content-Type here, let the browser set it with the boundary
          },
          body: formDataObj
        }
      );

      showNotification({
        type: 'success',
        message: 'Review submitted successfully',
      });

      // Reset form and refresh reviews
      setFormData({
        rating: 5,
        comment: '',
        photos: []
      });
      fetchReviews();
    } catch (error) {
      showNotification({
        type: 'error',
        message: 'Failed to submit review',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newPhotos = Array.from(e.target.files);
      setFormData(prev => ({
        ...prev,
        photos: [...prev.photos, ...newPhotos]
      }));
    }
  };

  const removePhoto = (index: number) => {
    setFormData(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }));
  };

  const StarRating = ({ rating, onSelect }: { rating: number; onSelect?: (rating: number) => void }) => (
    <div className="flex items-center">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type={onSelect ? 'button' : undefined}
          onClick={() => onSelect?.(star)}
          className={`${onSelect ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-transform`}
        >
          <svg
            className={`w-6 h-6 ${
              star <= rating ? 'text-yellow-400' : 'text-gray-300'
            }`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
            />
          </svg>
        </button>
      ))}
    </div>
  );

  return (
    <div className={`review-system ${className}`}>
      {/* Review Form */}
      <form onSubmit={handleSubmit} className="mb-8 bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Write a Review</h3>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Rating
          </label>
          <StarRating
            rating={formData.rating}
            onSelect={(rating) => setFormData(prev => ({ ...prev, rating }))}
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Comment
          </label>
          <textarea
            value={formData.comment}
            onChange={(e) => setFormData(prev => ({ ...prev, comment: e.target.value }))}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            rows={4}
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Photos (optional)
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {formData.photos.map((photo, index) => (
              <div key={index} className="relative">
                <img
                  src={URL.createObjectURL(photo)}
                  alt={`Review photo ${index + 1}`}
                  className="w-20 h-20 object-cover rounded"
                />
                <button
                  type="button"
                  onClick={() => removePhoto(index)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handlePhotoChange}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
            submitting ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {submitting ? 'Submitting...' : 'Submit Review'}
        </button>
      </form>

      {/* Reviews List */}
      <div className="space-y-6">
        <h3 className="text-lg font-medium text-gray-900">Customer Reviews</h3>
        
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : reviews.length > 0 ? (
          reviews.map((review) => (
            <div key={review.id} className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-start">
                {review.user.avatar ? (
                  <img
                    src={review.user.avatar}
                    alt={review.user.name}
                    className="w-10 h-10 rounded-full"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-blue-600 font-medium">
                      {review.user.name.charAt(0)}
                    </span>
                  </div>
                )}
                
                <div className="ml-4 flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-gray-900">
                      {review.user.name}
                    </h4>
                    <p className="text-sm text-gray-500">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  
                  <StarRating rating={review.rating} />
                  
                  <p className="mt-2 text-sm text-gray-700">
                    {review.comment}
                  </p>

                  {review.photos && review.photos.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {review.photos.map((photo, index) => (
                        <img
                          key={index}
                          src={photo}
                          alt={`Review photo ${index + 1}`}
                          className="w-20 h-20 object-cover rounded"
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            No reviews yet. Be the first to review!
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewSystem; 