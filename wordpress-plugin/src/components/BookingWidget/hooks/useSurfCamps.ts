// WordPress-compatible Surf Camps Hook
// Manages surf camp options and selection

declare global {
  interface Window {
    React: any;
    ReactDOM: any;
  }
}

const React = window.React;
const { useState, useEffect } = React;

export interface SurfCamp {
  id: string;
  name: string;
  description: string;
  location: string;
  price: number;
  duration: number; // in days
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  maxParticipants: number;
  availableSpots: number;
  rating: number;
  features: string[];
  images: string[];
}

export function useSurfCamps(apiUrl?: string) {
  const [surfCamps, setSurfCamps] = useState<SurfCamp[]>([]);
  const [selectedCamp, setSelectedCamp] = useState<SurfCamp | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Mock surf camps data - in real implementation, fetch from API
  useEffect(() => {
    const fetchSurfCamps = async () => {
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 400));
        
        const mockCamps: SurfCamp[] = [
          {
            id: 'beginner-bliss',
            name: 'Beginner Bliss Surf Camp',
            description: 'Perfect for first-time surfers. Learn the basics in a supportive environment.',
            location: 'Lisbon, Portugal',
            price: 599,
            duration: 7,
            difficulty: 'beginner',
            maxParticipants: 8,
            availableSpots: 3,
            rating: 4.8,
            features: [
              'Beginner-friendly waves',
              'Professional instructors',
              'Small group sessions',
              'Beachside accommodation',
              'Daily meals included'
            ],
            images: ['camp1.jpg', 'camp1-2.jpg']
          },
          {
            id: 'intermediate-wave',
            name: 'Intermediate Wave Rider',
            description: 'Take your surfing to the next level with advanced techniques and bigger waves.',
            location: 'Taghazout, Morocco',
            price: 799,
            duration: 7,
            difficulty: 'intermediate',
            maxParticipants: 6,
            availableSpots: 2,
            rating: 4.9,
            features: [
              'Consistent intermediate waves',
              'Video analysis sessions',
              'Advanced techniques focus',
              'Ocean view accommodation',
              'Cultural immersion activities'
            ],
            images: ['camp2.jpg', 'camp2-2.jpg']
          },
          {
            id: 'advanced-power',
            name: 'Advanced Power Surfer',
            description: 'Master advanced surfing techniques in challenging conditions.',
            location: 'Biarritz, France',
            price: 999,
            duration: 7,
            difficulty: 'advanced',
            maxParticipants: 4,
            availableSpots: 1,
            rating: 5.0,
            features: [
              'Big wave surfing',
              'Professional coaching',
              'Competition preparation',
              'Luxury accommodation',
              'Performance analysis'
            ],
            images: ['camp3.jpg', 'camp3-2.jpg']
          }
        ];
        
        setSurfCamps(mockCamps);
        setLoading(false);
      } catch (err) {
        setError('Failed to load surf camps');
        setLoading(false);
      }
    };

    fetchSurfCamps();
  }, [apiUrl]);

  const selectCamp = (campId: string) => {
    const camp = surfCamps.find(c => c.id === campId);
    setSelectedCamp(camp || null);
  };

  const clearSelection = () => {
    setSelectedCamp(null);
  };

  const getCampsByDifficulty = (difficulty: string) => {
    return surfCamps.filter(camp => camp.difficulty === difficulty);
  };

  const getAvailableCamps = () => {
    return surfCamps.filter(camp => camp.availableSpots > 0);
  };

  const getCampPrice = (campId: string) => {
    const camp = surfCamps.find(c => c.id === campId);
    return camp?.price || 0;
  };

  return {
    surfCamps,
    selectedCamp,
    loading,
    error,
    selectCamp,
    clearSelection,
    getCampsByDifficulty,
    getAvailableCamps,
    getCampPrice
  };
}
