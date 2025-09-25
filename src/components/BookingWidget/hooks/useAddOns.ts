import { useState, useEffect, useCallback } from 'react';
import { AddOnSelection } from '../types';
import { wpFetch } from '../lib/wpApi';

interface AddOn {
  id: string;
  name: string;
  description: string;
  price: number;
  category: 'equipment' | 'service' | 'food' | 'transport' | 'other';
  images: string[];
  isActive: boolean;
  maxQuantity?: number;
}

interface UseAddOnsReturn {
  addOns: AddOn[];
  loading: boolean;
  error: string | null;
  selectedAddOns: AddOnSelection[];
  setSelectedAddOns: (addOns: AddOnSelection[]) => void;
  updateAddOnQuantity: (addOnId: string, quantity: number) => void;
  getAddOnSubtotal: () => number;
  clearSelections: () => void;
}

export function useAddOns(): UseAddOnsReturn {
  const [addOns, setAddOns] = useState<AddOn[]>([]);
  const [selectedAddOns, setSelectedAddOns] = useState<AddOnSelection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch available add-ons
  useEffect(() => {
    const fetchAddOns = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await wpFetch('/public/add-ons');
        if (!response.ok) {
          throw new Error(`Failed to fetch add-ons: ${response.status}`);
        }

        const json = await response.json();
        const list: AddOn[] = Array.isArray(json?.addOns) ? json.addOns : [];
        setAddOns(list);
      } catch (err) {
        console.error('Error fetching add-ons:', err);
        setError(err instanceof Error ? err.message : 'Failed to load add-ons');
      } finally {
        setLoading(false);
      }
    };

    fetchAddOns();
  }, []);

  // Update quantity for a specific add-on
  const updateAddOnQuantity = (addOnId: string, quantity: number) => {
    const addOn = addOns.find(a => a.id === addOnId);
    if (!addOn) return;

    // Enforce max quantity if specified
    const maxQty = addOn.maxQuantity || 99;
    const validQuantity = Math.max(0, Math.min(quantity, maxQty));

    setSelectedAddOns(prev => {
      const existing = prev.find(s => s.id === addOnId);
      
      if (validQuantity === 0) {
        // Remove if quantity is 0
        return prev.filter(s => s.id !== addOnId);
      }
      
      if (existing) {
        // Update existing
        return prev.map(s => 
          s.id === addOnId 
            ? { ...s, quantity: validQuantity }
            : s
        );
      } else {
        // Add new selection
        return [...prev, {
          id: addOn.id,
          name: addOn.name,
          description: addOn.description,
          price: addOn.price,
          quantity: validQuantity,
          category: addOn.category,
        }];
      }
    });
  };

  // Calculate subtotal for all selected add-ons
  const getAddOnSubtotal = useCallback(() => {
    return selectedAddOns.reduce((total, addOn) => {
      return total + (addOn.price * addOn.quantity);
    }, 0);
  }, [selectedAddOns]);

  // Clear all selections
  const clearSelections = () => {
    setSelectedAddOns([]);
  };

  return {
    addOns,
    loading,
    error,
    selectedAddOns,
    setSelectedAddOns,
    updateAddOnQuantity,
    getAddOnSubtotal,
    clearSelections,
  };
}
