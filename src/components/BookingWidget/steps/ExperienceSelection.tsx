import { Home, Waves } from 'lucide-react';
import { BookingState } from '../types';

interface ExperienceSelectionProps {
  state: BookingState;
  actions: {
    setExperienceType: (type: 'room' | 'surf-week') => void;
    nextStep: () => void;
  };
}

const experiences = [
  {
    id: 'room',
    type: 'room' as const,
    title: 'Book a Room',
    description: 'Choose your dates and accommodation. Perfect for flexible stays.',
    icon: Home,
    gradient: 'from-blue-500 to-cyan-500',
    features: ['Flexible dates', 'Choose your room', 'Self-guided experience'],
    priceFrom: 45,
    backgroundImage: '', // Remove broken image reference
    surfPattern: 'gentle-waves',
  },
  {
    id: 'surf-week',
    type: 'surf-week' as const,
    title: 'All-Inclusive Surf Week',
    description: 'Join our structured surf camp programs with coaching and community.',
    icon: Waves,
    gradient: 'from-orange-500 to-red-500',
    features: ['Professional coaching', 'All meals included', 'Structured program'],
    priceFrom: 599,
    backgroundImage: '', // Remove broken image reference
    surfPattern: 'dynamic-waves',
  },
];

export function ExperienceSelection({ state, actions }: ExperienceSelectionProps) {
  const handleSelection = (type: 'room' | 'surf-week') => {
    // Debug: selection handler
    try { console.log('[HeiwaWidget] Experience selected:', type); } catch {}
    actions.setExperienceType(type);
    
    // Allow the user to manually click Next instead of auto-advancing
    // This gives them time to review their selection and see the pricing update
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h3 className="text-2xl font-bold text-gray-900">
          Choose Your Adventure
        </h3>
        <p className="text-gray-600">
          How would you like to experience Heiwa House?
        </p>
      </div>

      {/* Experience Options */}
      <div className="space-y-4">
        {experiences.map((experience, index) => {
          const Icon = experience.icon;
          const isSelected = state.experienceType === experience.type;

          return (
            <button
              key={experience.id}
              onClick={() => handleSelection(experience.type)}
              className={`
                relative w-full p-6 rounded-xl border-2 text-left overflow-hidden
                transition-all duration-700 ease-out
                hover:scale-[1.02] hover:shadow-xl hover:-translate-y-1
                focus:outline-none focus:ring-4 focus:ring-orange-500/30
                animate-in fade-in-0 slide-in-from-bottom-4 duration-700
                ${isSelected
                  ? 'border-orange-500 shadow-lg shadow-orange-500/20 animate-in zoom-in-95 duration-300'
                  : 'border-gray-200 hover:border-orange-300'
                }
              `}
              style={{
                animationDelay: `${index * 150}ms`,
                backgroundImage: `
                  linear-gradient(135deg,
                    ${experience.type === 'surf-week'
                      ? 'rgba(236, 104, 28, 0.9) 0%, rgba(236, 104, 28, 0.7) 100%'
                      : 'rgba(59, 130, 246, 0.9) 0%, rgba(59, 130, 246, 0.7) 100%'
                    }
                  ),
                  url('${experience.backgroundImage}')
                `,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat'
              }}
            >
              {/* Surf Pattern Overlay */}
              <div
                className={`
                  absolute inset-0 opacity-10 pointer-events-none
                  ${experience.surfPattern === 'dynamic-waves'
                    ? 'bg-gradient-to-r from-transparent via-white to-transparent animate-pulse'
                    : 'bg-gradient-to-b from-transparent via-white/20 to-transparent'
                  }
                `}
                style={{
                  backgroundImage: experience.surfPattern === 'dynamic-waves'
                    ? `url("data:image/svg+xml,%3csvg width='120' height='40' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='M0,20 C30,5 60,35 90,20 C105,12.5 120,27.5 120,20 L120,40 L0,40 Z' fill='rgba(255,255,255,0.1)'/%3e%3cpath d='M0,25 C40,10 80,40 120,25 L120,40 L0,40 Z' fill='rgba(255,255,255,0.05)'/%3e%3c/svg%3e")`
                    : `url("data:image/svg+xml,%3csvg width='60' height='20' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='M0,10 C15,2 30,18 45,10 C52.5,6 60,14 60,10 L60,20 L0,20 Z' fill='rgba(255,255,255,0.05)'/%3e%3c/svg%3e")`,
                  backgroundRepeat: 'repeat-x',
                  backgroundPosition: 'bottom'
                }}
              />
              {/* Card Header */}
              <div className="relative z-10 flex items-start gap-4">
                {/* Icon */}
                <div className={`
                  p-3 rounded-lg bg-gradient-to-br ${experience.gradient}
                  text-white shadow-lg backdrop-blur-sm
                  border border-white/20
                `}>
                  <Icon size={24} />
                </div>

                {/* Content */}
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-semibold text-white drop-shadow-lg">
                      {experience.title}
                    </h4>
                    <div className="text-right">
                      <div className="text-sm text-white/80 drop-shadow">From</div>
                      <div className="text-lg font-bold text-white drop-shadow-lg bg-black/20 px-2 py-1 rounded-lg backdrop-blur-sm">
                        €{experience.priceFrom}
                      </div>
                    </div>
                  </div>

                  <p className="text-white/90 text-sm leading-relaxed drop-shadow">
                    {experience.description}
                  </p>

                  {/* Features */}
                  <div className="flex flex-wrap gap-2 mt-3">
                    {experience.features.map((feature, index) => (
                      <span
                        key={index}
                        className="
                          px-2 py-1 text-xs font-medium
                          bg-white/20 text-white rounded-full
                          backdrop-blur-sm border border-white/30
                          drop-shadow
                        "
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Selection Indicator */}
              {isSelected && (
                <div className="relative z-10 mt-4 flex items-center gap-2 text-white">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse drop-shadow" />
                  <span className="text-sm font-medium drop-shadow bg-black/20 px-2 py-1 rounded-full backdrop-blur-sm">
                    Selected
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Help Text */}
      <div className="text-center">
        <p className="text-sm text-gray-500">
          Not sure which option? Our room booking offers more flexibility,
          while surf weeks provide a complete guided experience.
        </p>
      </div>
    </div>
  );
}
