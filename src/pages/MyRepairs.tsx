import React, { useState } from 'react';
import { useMyRepairs, useCancelServiceBooking } from '../hooks/services/useServiceBooking';
import { Modal, Button, Input, Tag, Timeline } from 'antd';
import { formatPrice } from '../utils/formatters';
import { formatDate } from '../utils/dateUtils';
import { Loader2, Wrench, Calendar, MapPin, Clock, AlertCircle } from 'lucide-react';

const getStatusColor = (status: string) => {
  const colors: { [key: string]: string } = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    in_progress: 'bg-purple-100 text-purple-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};

const MyRepairs = () => {
  const { data: repairs, isLoading } = useMyRepairs();
  const cancelBooking = useCancelServiceBooking();
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [selectedBooking, setSelectedBooking] = useState<string | null>(null);

  const handleCancel = async () => {
    if (!selectedBooking || !cancelReason.trim()) return;

    await cancelBooking.mutateAsync({
      id: selectedBooking,
      reason: cancelReason,
    });

    setCancelModalVisible(false);
    setCancelReason('');
    setSelectedBooking(null);
  };

  const showCancelModal = (bookingId: string) => {
    setSelectedBooking(bookingId);
    setCancelModalVisible(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-[#FF5733]" />
      </div>
    );
  }

  if (!repairs || repairs.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Wrench className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900">No Repairs Found</h3>
        <p className="text-gray-600 mt-2">You haven't booked any repair services yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {repairs.map((booking: any) => (
        <div
          key={booking.id}
          className="bg-white rounded-xl shadow-sm p-6 space-y-4"
        >
          {/* Header */}
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                Service #{booking.reference}
              </h3>
              <p className="text-sm text-gray-500">
                Booked on {formatDate(booking.created_at)}
              </p>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(booking.status)}`}>
              {booking.status_display}
            </span>
          </div>

          {/* Service Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Wrench className="w-4 h-4 text-[#FF5733]" />
                Service Details
              </h4>
              <div className="space-y-1">
                <p className="text-gray-600">{booking.services[0]?.name}</p>
                <p className="text-gray-600">{booking.services[0]?.package?.name}</p>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#FF5733]" />
                Schedule
              </h4>
              <div className="space-y-1">
                <p className="text-gray-600">
                  Date: {formatDate(booking.schedule_date)}
                </p>
                <p className="text-gray-600">
                  Time: {booking.schedule_time}
                </p>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#FF5733]" />
                Service Location
              </h4>
              <p className="text-gray-600">{booking.address}</p>
            </div>

            <div>
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#FF5733]" />
                Status Timeline
              </h4>
              <Timeline
                items={[
                  {
                    color: 'blue',
                    children: `Booked on ${formatDate(booking.created_at)}`,
                  },
                  // Add more timeline items based on status updates
                ]}
              />
            </div>
          </div>

          {/* Actions */}
          {booking.status === 'pending' && (
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                danger
                onClick={() => showCancelModal(booking.id)}
              >
                Cancel Booking
              </Button>
            </div>
          )}
        </div>
      ))}

      {/* Cancel Modal */}
      <Modal
        title="Cancel Booking"
        open={cancelModalVisible}
        onOk={handleCancel}
        onCancel={() => {
          setCancelModalVisible(false);
          setCancelReason('');
          setSelectedBooking(null);
        }}
        okText="Confirm Cancellation"
        okButtonProps={{ danger: true }}
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-red-50 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-red-800">Are you sure?</h4>
              <p className="text-sm text-red-600">
                This action cannot be undone. The service booking will be cancelled.
              </p>
            </div>
          </div>
          
          <Input.TextArea
            placeholder="Please provide a reason for cancellation"
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            rows={4}
          />
        </div>
      </Modal>
    </div>
  );
};

export default MyRepairs; 