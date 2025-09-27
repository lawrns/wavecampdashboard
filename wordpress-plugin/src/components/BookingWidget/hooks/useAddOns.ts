// WordPress-compatible Add-ons Hook
// Manages optional services and extras

declare global {
  interface Window {
    React: any;
    ReactDOM: any;
  }
}

const React = window.React;
const { useState, useEffect } = React;

export interface AddOn {
  id: string;
  name: string;
  description: string;
  price: number;
  category: 'surf' | 'transfer' | 'wellness' | 'food';
  maxQuantity?: number;
}

export function useAddOns(apiUrl?: string) {
  const [addOns, setAddOns] = useState<AddOn[]>([]);
  const [selectedAddOns, setSelectedAddOns] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Mock add-ons data - in real implementation, fetch from API
  useEffect(() => {
    const fetchAddOns = async () => {
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 300));
        
        const mockAddOns: AddOn[] = [
          {
            id: 'surf-lesson-private',
            name: 'Private Surf Lesson',
            description: '2-hour private surf lesson with our expert instructors',
            price: 80,
            category: 'surf',
            maxQuantity: 1
          },
          {
            id: 'surf-lesson-group',
            name: 'Group Surf Lesson',
            description: 'Group surf lesson with up to 4 participants',
            price: 40,
            category: 'surf'
          },
          {
            id: 'yoga-session',
            name: 'Beach Yoga Session',
            description: 'Relaxing 1-hour yoga session at sunrise',
            price: 25,
            category: 'wellness'
          },
          {
            id: 'airport-transfer',
            name: 'Airport Transfer',
            description: 'Round-trip airport transfer service',
            price: 45,
            category: 'transfer'
          },
          {
            id: 'massage',
            name: 'Relaxation Massage',
            description: '1-hour relaxation massage session',
            price: 60,
            category: 'wellness'
          },
          {
            id: 'meal-plan',
            name: 'Healthy Meal Plan',
            description: 'Nutritious meals throughout your stay',
            price: 35,
            category: 'food'
          }
        ];
        
        setAddOns(mockAddOns);
        setLoading(false);
      } catch (err) {
        setError('Failed to load add-ons');
        setLoading(false);
      }
    };

    fetchAddOns();
  }, [apiUrl]);

  const selectAddOn = (addOnId: string, quantity: number = 1) => {
    setSelectedAddOns(prev => ({
      ...prev,
      [addOnId]: Math.max(0, quantity)
    }));
  };

  const removeAddOn = (addOnId: string) => {
    setSelectedAddOns(prev => {
      const newSelected = { ...prev };
      delete newSelected[addOnId];
      return newSelected;
    });
  };

  const getTotalAddOnsPrice = () => {
    return Object.entries(selectedAddOns).reduce((total, [addOnId, quantity]) => {
      const addOn = addOns.find(a => a.id === addOnId);
      return total + (addOn ? addOn.price * quantity : 0);
    }, 0);
  };

  const getSelectedAddOns = () => {
    return Object.entries(selectedAddOns)
      .filter(([, quantity]) => quantity > 0)
      .map(([addOnId, quantity]) => {
        const addOn = addOns.find(a => a.id === addOnId);
        return addOn ? { ...addOn, quantity, totalPrice: addOn.price * quantity } : null;
      })
      .filter(Boolean);
  };

  const clearSelection = () => {
    setSelectedAddOns({});
  };

  return {
    addOns,
    selectedAddOns,
    loading,
    error,
    selectAddOn,
    removeAddOn,
    getTotalAddOnsPrice,
    getSelectedAddOns,
    clearSelection
  };
}
