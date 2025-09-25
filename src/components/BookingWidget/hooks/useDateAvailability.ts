import { useState, useEffect, useCallback } from 'react';
import { wpFetch } from '../lib/wpApi';

interface DateAvailability {
  date: string;
  available: boolean;
  capacity: number;
  booked: number;
  remaining: number;
}

interface DateAvailabilityResponse {
  success: boolean;
  data: {
    date_availability: DateAvailability[];
    summary: {
      total_dates_checked: number;
      available_dates: number;
      sold_out_dates: number;
      total_capacity: number;
      participants_requested: number;
    };
  };
  meta: {
    checked_at: string;
    cache_expires_at: string;
    fallback?: boolean;
  };
}

interface UseDateAvailabilityOptions {
  participants?: number;
  autoFetch?: boolean;
  cacheTime?: number; // in milliseconds
}

export function useDateAvailability(options: UseDateAvailabilityOptions = {}) {
  const { participants = 1, autoFetch = false, cacheTime = 5 * 60 * 1000 } = options;
  
  const [dateAvailability, setDateAvailability] = useState<DateAvailability[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);
  const [cache, setCache] = useState<Map<string, { data: DateAvailability[]; timestamp: number }>>(new Map());

  const fetchDateAvailability = useCallback(async (startDate: string, endDate: string) => {
    const cacheKey = `${startDate}-${endDate}-${participants}`;
    
    // Check cache first
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < cacheTime) {
      setDateAvailability(cached.data);
      return cached.data;
    }

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        start_date: startDate,
        end_date: endDate,
        participants: participants.toString()
      });

      const response = await wpFetch(`/wordpress/dates/availability?${params}`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: DateAvailabilityResponse = await response.json();

      if (!data.success) {
        throw new Error(data.data?.summary ? 'No availability data returned' : 'API request failed');
      }

      const availability = data.data.date_availability;
      setDateAvailability(availability);
      setLastFetched(new Date());

      // Update cache
      setCache(prev => new Map(prev.set(cacheKey, {
        data: availability,
        timestamp: Date.now()
      })));

      return availability;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch date availability';
      setError(errorMessage);
      console.error('Date availability fetch error:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, [participants, cacheTime, cache]);

  const getDateStatus = useCallback((date: string): 'available' | 'sold-out' | 'unknown' => {
    const dateInfo = dateAvailability.find(d => d.date === date);
    if (!dateInfo) return 'unknown';
    return dateInfo.available ? 'available' : 'sold-out';
  }, [dateAvailability]);

  const isDateAvailable = useCallback((date: string): boolean => {
    return getDateStatus(date) === 'available';
  }, [getDateStatus]);

  const isDateSoldOut = useCallback((date: string): boolean => {
    return getDateStatus(date) === 'sold-out';
  }, [getDateStatus]);

  const getAvailabilityForRange = useCallback((startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const rangeAvailability = [];

    const currentDate = new Date(start);
    while (currentDate <= end) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const dateInfo = dateAvailability.find(d => d.date === dateStr);
      
      rangeAvailability.push({
        date: dateStr,
        status: dateInfo ? (dateInfo.available ? 'available' : 'sold-out') : 'unknown',
        remaining: dateInfo?.remaining || 0
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return rangeAvailability;
  }, [dateAvailability]);

  const clearCache = useCallback(() => {
    setCache(new Map());
  }, []);

  // Auto-fetch for current month if enabled
  useEffect(() => {
    if (autoFetch) {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      const startDate = startOfMonth.toISOString().split('T')[0];
      const endDate = endOfMonth.toISOString().split('T')[0];
      
      fetchDateAvailability(startDate, endDate);
    }
  }, [autoFetch, fetchDateAvailability]);

  return {
    dateAvailability,
    loading,
    error,
    lastFetched,
    fetchDateAvailability,
    getDateStatus,
    isDateAvailable,
    isDateSoldOut,
    getAvailabilityForRange,
    clearCache,
    // Helper methods for UI
    getSoldOutDates: () => dateAvailability.filter(d => !d.available).map(d => d.date),
    getAvailableDates: () => dateAvailability.filter(d => d.available).map(d => d.date),
    getTotalCapacity: () => dateAvailability[0]?.capacity || 0,
    getDateRange: () => {
      if (dateAvailability.length === 0) return null;
      return {
        start: dateAvailability[0].date,
        end: dateAvailability[dateAvailability.length - 1].date
      };
    }
  };
}
