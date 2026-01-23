import React from 'react';

const BookingStatusStepper = ({ status }) => {
  // Status ko number assign karte hain
  const steps = ['pending', 'accepted', 'in_progress', 'completed'];
  const currentStepIndex = steps.indexOf(status);

  const labels = ["Request Sent", "Vendor Accepted", "Work Started", "Job Completed"];

  return (
    <div className="w-full py-6">
      <div className="flex items-center justify-between relative">
        {/* Background Line */}
        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-1 bg-gray-200 -z-10"></div>
        
        {/* Active Line (Green) */}
        <div 
            className="absolute left-0 top-1/2 transform -translate-y-1/2 h-1 bg-green-500 -z-10 transition-all duration-500"
            style={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
        ></div>

        {/* Dots & Labels */}
        {labels.map((label, index) => (
          <div key={index} className="flex flex-col items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 font-bold transition-all duration-300
              ${index <= currentStepIndex ? 'bg-green-500 border-green-500 text-white' : 'bg-white border-gray-300 text-gray-400'}`}>
              {index + 1}
            </div>
            <span className={`text-xs mt-2 font-medium ${index <= currentStepIndex ? 'text-green-600' : 'text-gray-400'}`}>
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BookingStatusStepper;