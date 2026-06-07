import { useState } from 'react';
import StepSelectRoom from './StepSelectRoom';
import StepGuestInfo from './StepGuestInfo';
import StepPayment from './StepPayment';
import { Check } from 'lucide-react';

export default function BookingWizard() {
  const [currentStep, setCurrentStep] = useState(1);

  const steps = [
    { id: 1, title: 'Review Selection' },
    { id: 2, title: 'Guest Details' },
    { id: 3, title: 'Payment' },
  ];

  const handleNext = () => setCurrentStep((prev) => Math.min(prev + 1, 3));
  const handleBack = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  return (
    <div className="max-w-4xl mx-auto w-full">
      {/* Stepper Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between relative">
          {/* Connecting Line */}
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-200 rounded-full z-0" />
          <div 
            className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-gold-500 rounded-full z-0 transition-all duration-500" 
            style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
          />

          {steps.map((step) => {
            const isActive = step.id === currentStep;
            const isCompleted = step.id < currentStep;

            return (
              <div key={step.id} className="relative z-10 flex flex-col items-center gap-2">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-colors border-2 ${
                    isActive
                      ? 'bg-navy-900 border-navy-900 text-white shadow-lg'
                      : isCompleted
                      ? 'bg-gold-500 border-gold-500 text-white'
                      : 'bg-white border-gray-300 text-gray-400'
                  }`}
                >
                  {isCompleted ? <Check className="w-5 h-5" /> : step.id}
                </div>
                <span className={`text-xs md:text-sm font-medium absolute -bottom-6 w-32 text-center ${
                  isActive ? 'text-navy-900' : isCompleted ? 'text-gray-700' : 'text-gray-400'
                }`}>
                  {step.title}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      <div className="mt-12 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {currentStep === 1 && <StepSelectRoom onNext={handleNext} />}
        {currentStep === 2 && <StepGuestInfo onNext={handleNext} onBack={handleBack} />}
        {currentStep === 3 && <StepPayment onBack={handleBack} />}
      </div>
    </div>
  );
}
