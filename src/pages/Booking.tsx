import { useState } from "react";

const vehicleTypes = ["Bike", "Car"];
const bikeTypes = ["Scooter", "Sports Bike", "Cruiser", "Standard", "Electric"];
const carTypes = ["Sedan", "SUV", "Hatchback", "Convertible", "Electric"];

const BookingForm = () => {
  const [formData, setFormData] = useState({
    name: "",
    phoneNumber: "",
    address: "",
    pincode: "",
    vehicle: "",
    bikeType: "",
    manufacture: "",
    bikeModel: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("Form Submitted", formData);
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-lg mx-auto bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-lg font-bold mb-4">Book Your Service</h2>
      
      {/* Name */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">Name</label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          className="mt-1 p-2 border border-gray-300 rounded-md w-full focus:ring-[#FF5733]"
        />
      </div>
      
      {/* Phone Number */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">Phone Number</label>
        <input
          type="tel"
          name="phoneNumber"
          value={formData.phoneNumber}
          onChange={handleChange}
          required
          className="mt-1 p-2 border border-gray-300 rounded-md w-full focus:ring-[#FF5733]"
        />
      </div>
      
      {/* Address */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">Address</label>
        <input
          type="text"
          name="address"
          value={formData.address}
          onChange={handleChange}
          required
          className="mt-1 p-2 border border-gray-300 rounded-md w-full focus:ring-[#FF5733]"
        />
      </div>
      
      {/* Pincode */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">Pincode</label>
        <input
          type="text"
          name="pincode"
          value={formData.pincode}
          onChange={handleChange}
          required
          className="mt-1 p-2 border border-gray-300 rounded-md w-full focus:ring-[#FF5733]"
        />
      </div>
      
      {/* Vehicle Type */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">Vehicle Type</label>
        <select
          name="vehicle"
          value={formData.vehicle}
          onChange={handleChange}
          required
          className="mt-1 p-2 border border-gray-300 rounded-md w-full focus:ring-[#FF5733]"
        >
          <option value="">Select Vehicle</option>
          {vehicleTypes.map((type, index) => (
            <option key={index} value={type}>{type}</option>
          ))}
        </select>
      </div>
      
      {/* Conditional Fields for Bike */}
      {formData.vehicle === "Bike" && (
        <>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Bike Type</label>
            <select
              name="bikeType"
              value={formData.bikeType}
              onChange={handleChange}
              required
              className="mt-1 p-2 border border-gray-300 rounded-md w-full focus:ring-[#FF5733]"
            >
              <option value="">Select Type</option>
              {bikeTypes.map((type, index) => (
                <option key={index} value={type}>{type}</option>
              ))}
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Manufacture</label>
            <input
              type="text"
              name="manufacture"
              value={formData.manufacture}
              onChange={handleChange}
              required
              className="mt-1 p-2 border border-gray-300 rounded-md w-full focus:ring-[#FF5733]"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Bike Model</label>
            <input
              type="text"
              name="bikeModel"
              value={formData.bikeModel}
              onChange={handleChange}
              required
              className="mt-1 p-2 border border-gray-300 rounded-md w-full focus:ring-[#FF5733]"
            />
          </div>
        </>
      )}
      
      {/* Submit Button */}
      <button
        type="submit"
        className="w-full bg-[#FF5733] text-white font-bold py-2 px-4 rounded-md hover:bg-[#E64A1E]"
      >
        Book Now
      </button>
    </form>
  );
};

export default BookingForm;
