// WordPress-compatible Progress Indicator Component
// Matches original React widget design with step circles and wave animations

declare global {
  interface Window {
    React: any;
    ReactDOM: any;
  }
}

const React = window.React;

interface ProgressIndicatorProps {
  currentStep: number;
  stepFlow?: string[];
  totalSteps?: number;
}

const stepLabels = {
  'experience': { label: 'Experience', shortLabel: 'Exp', title: 'Choose Experience' },
  'options': { label: 'Options', shortLabel: 'Opt', title: 'Select Dates & Options' },
  'room-assignment': { label: 'Rooms', shortLabel: 'Rm', title: 'Assign Guests to Rooms' },
  'surf-week-room-selection': { label: 'Room', shortLabel: 'Rm', title: 'Choose Accommodation' },
  'add-ons': { label: 'Add-ons', shortLabel: 'Add', title: 'Enhance Your Stay' },
  'guest-details': { label: 'Details', shortLabel: 'Det', title: 'Guest Details' },
  'review-pay': { label: 'Review', shortLabel: 'Rev', title: 'Review & Pay' },
};

export function ProgressIndicator({ currentStep, stepFlow, totalSteps }: ProgressIndicatorProps) {
  // Use provided stepFlow or default to basic flow
  const currentStepFlow = stepFlow || ['experience', 'options', 'add-ons', 'guest-details', 'review-pay'];
  const maxSteps = totalSteps || currentStepFlow.length;

  return React.createElement('div', {
    style: { width: '100%', padding: '0 16px' }
  },
    React.createElement('div', {
      style: {
        overflowX: 'auto',
        paddingTop: '16px',
        paddingBottom: '16px'
      }
    },
      React.createElement('div', {
        style: {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          minWidth: 'max-content',
          padding: '0 16px'
        }
      }, currentStepFlow.map((stepType, index) => {
        const stepNumber = index + 1;
        const isCompleted = currentStep > stepNumber;
        const isCurrent = currentStep === stepNumber;
        const isUpcoming = currentStep < stepNumber;
        const stepInfo = stepLabels[stepType as keyof typeof stepLabels];

        return React.createElement('div', {
          key: stepType,
          style: { display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }
        }, [
          // Connector Line
          index < currentStepFlow.length - 1 && React.createElement('div', {
            key: 'connector',
            style: {
              position: 'absolute',
              top: '20px',
              left: '50%',
              width: '64px',
              height: '2px',
              transform: 'translateY(-50%)',
              zIndex: 0,
              backgroundColor: isCompleted ? '#10b981' : '#d1d5db',
              transition: 'all 0.5s ease-out'
            }
          }),

          // Step Circle
          React.createElement('div', {
            key: 'circle',
            style: {
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
              fontWeight: '600',
              backgroundColor: isCompleted ? '#10b981' : isCurrent ? '#f97316' : '#d1d5db',
              color: isCompleted || isCurrent ? 'white' : '#6b7280',
              transition: 'all 0.3s',
              position: 'relative',
              zIndex: 1,
              boxShadow: isCurrent ? '0 0 0 4px rgba(249, 115, 22, 0.2)' : 'none'
            }
          }, isCompleted ? '✓' : stepNumber),

          // Step Label
          React.createElement('span', {
            key: 'label',
            style: {
              marginTop: '8px',
              fontSize: '12px',
              fontWeight: '500',
              color: isActive ? '#f97316' : isCompleted ? '#10b981' : '#6b7280',
              textAlign: 'center',
              whiteSpace: 'nowrap'
            }
          }, stepInfo?.shortLabel || stepType)
        ]);
      }))
    )
  );
}
