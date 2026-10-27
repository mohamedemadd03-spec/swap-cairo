import { useState, useEffect, useCallback } from 'react';
import { HUB_LOCATIONS } from '../data/mockData';
import { HubLocation } from '../types/swap';
import { calculateHaversineDistanceKm } from '../utils/swapLogic';
import { triggerHaptic } from './useSoundFX';

export interface UserCoordinates {
  lat: number;
  lng: number;
  accuracy?: number;
}

const STORAGE_KEY = 'swap_gps_coords_v1';

export function useUserLocation(currentHub: HubLocation, onSelectHub?: (hub: HubLocation) => void) {
  const [userCoords, setUserCoords] = useState<UserCoordinates | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY) || localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [gpsActive, setGpsActive] = useState<boolean>(() => Boolean(userCoords));
  const [gpsLoading, setGpsLoading] = useState<boolean>(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  const findClosestHub = useCallback((coords: UserCoordinates): HubLocation => {
    let closest = HUB_LOCATIONS[0];
    let minDistance = Infinity;

    for (const hub of HUB_LOCATIONS) {
      if (hub.lat != null && hub.lng != null) {
        const d = calculateHaversineDistanceKm(coords.lat, coords.lng, hub.lat, hub.lng);
        if (d < minDistance) {
          minDistance = d;
          closest = hub;
        }
      }
    }
    return closest;
  }, []);

  const requestGps = useCallback(async (): Promise<UserCoordinates | null> => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser');
      return null;
    }

    setGpsLoading(true);
    setGpsError(null);
    triggerHaptic('selection');

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords: UserCoordinates = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
          };
          setUserCoords(coords);
          setGpsActive(true);
          setGpsLoading(false);
          try {
            sessionStorage.setItem(STORAGE_KEY, JSON.stringify(coords));
            localStorage.setItem(STORAGE_KEY, JSON.stringify(coords));
          } catch {
            // storage quota fallback
          }

          // Auto-tune to closest hub
          const closest = findClosestHub(coords);
          if (onSelectHub && closest.id !== currentHub.id) {
            onSelectHub(closest);
          }
          triggerHaptic('trade');
          resolve(coords);
        },
        (error) => {
          setGpsLoading(false);
          setGpsError(error.message || 'GPS permission denied');
          triggerHaptic('error');
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000,
        }
      );
    });
  }, [findClosestHub, onSelectHub, currentHub]);

  return {
    userCoords,
    gpsActive,
    gpsLoading,
    gpsError,
    requestGps,
    findClosestHub,
  };
}
