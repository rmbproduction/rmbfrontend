import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { axiosInstance, API_ENDPOINTS } from '../../config/api.config';
import { format } from 'date-fns';
import { Calendar, Clock, MapPin } from 'lucide-react';

interface Visit {
  id: number;
  subscription_id: number;
  username: string;
  plan_name: string;
  scheduled_date: string;
  status: string;
  status_display: string;
  service_notes: string;
  completion_date: string | null;
  technician_notes: string | null;
  created_at: string;
}

const UpcomingVisits: React.FC = () => {
  // Fetch upcoming visits
  const { data: visits, isLoading, error } = useQuery<Visit[]>({
    queryKey: ['upcomingVisits'],
    queryFn: async () => {
      const response = await axiosInstance.get(API_ENDPOINTS.subscription.visits.upcoming);
      return response.data;
    }
  });

  if (isLoading) {
    return (
      <div className="w-full py-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-lg p-6 shadow-sm">
                <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 text-red-600 p-4 rounded-lg">
            An error occurred while fetching your upcoming visits. Please try again later.
          </div>
        </div>
      </div>
    );
  }

  if (!visits || visits.length === 0) {
    return (
      <div className="w-full py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg p-8 text-center shadow-sm">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Upcoming Visits
            </h3>
            <p className="text-gray-600">
              You don't have any visits scheduled at the moment.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full py-8">
      <div className="max-w-4xl mx-auto">
        <div className="space-y-4">
          {visits.map((visit) => (
            <div
              key={visit.id}
              className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {visit.plan_name}
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center text-gray-600">
                      <Calendar className="w-4 h-4 mr-2" />
                      <span>
                        {format(new Date(visit.scheduled_date), 'EEEE, MMMM d, yyyy')}
                      </span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Clock className="w-4 h-4 mr-2" />
                      <span>
                        {format(new Date(visit.scheduled_date), 'h:mm a')}
                      </span>
                    </div>
                    {visit.service_notes && (
                      <div className="flex items-start text-gray-600 mt-2">
                        <MapPin className="w-4 h-4 mr-2 mt-1" />
                        <span>{visit.service_notes}</span>
                      </div>
                    )}
                  </div>
                </div>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  {visit.status_display}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default UpcomingVisits; 