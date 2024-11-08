import React, { useEffect, useRef, useState } from 'react';
import './App.css';

// Define types for locations
interface LocationData {
  lat: number;
  lng: number;
  name: string;
}

interface LocationsMap {
  [key: string]: LocationData;
}

// Define location constants
const LOCATIONS: LocationsMap = {
  NEW_YORK: { lat: 40.7128, lng: -74.0060, name: 'New York' },
  LONDON: { lat: 51.5074, lng: -0.1278, name: 'London' },
  TOKYO: { lat: 35.6762, lng: 139.6503, name: 'Tokyo' },
  SYDNEY: { lat: -33.8688, lng: 151.2093, name: 'Sydney' }
};

// Add type declarations for Google Maps
declare global {
  interface Window {
    google: typeof google;
    initMap?: () => void;
  }
}

function App() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<{ [key: string]: google.maps.Marker }>({});
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  
  const [selectedLocation, setSelectedLocation] = useState<string>(LOCATIONS.NEW_YORK.name);
  const [mapsLoaded, setMapsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const initMap = () => {
    if (!mapRef.current) return;

    try {
      const mapOptions: google.maps.MapOptions = {
        center: LOCATIONS.NEW_YORK,
        zoom: 12,
        disableDefaultUI: false,
        mapId: 'DEMO_MAP_ID'
      };

      mapInstanceRef.current = new google.maps.Map(mapRef.current, mapOptions);
      infoWindowRef.current = new google.maps.InfoWindow();

      // Create markers for all locations
      Object.values(LOCATIONS).forEach((location: LocationData) => {
        const marker = new google.maps.Marker({
          position: { lat: location.lat, lng: location.lng },
          map: mapInstanceRef.current,
          title: location.name,
          animation: google.maps.Animation.DROP
        });

        marker.addListener('click', () => {
          if (infoWindowRef.current) {
            infoWindowRef.current.setContent(`
              <div class="info-window">
                <h3>${location.name}</h3>
                <p>Welcome to ${location.name}!</p>
                <p>Coordinates: ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}</p>
              </div>
            `);
            infoWindowRef.current.open(mapInstanceRef.current, marker);
          }
        });

        markersRef.current[location.name] = marker;
      });

      setMapsLoaded(true);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Failed to initialize map');
    }
  };

  useEffect(() => {
    // Verify API key exists
    const MAPS_API_KEY = import.meta.env.VITE_MAPS_API_KEY;
    if (!MAPS_API_KEY) {
      setLoadError('Google Maps API key is missing. Please check your .env.local file');
      return;
    }

    // Load Google Maps Script
    if (!window.google) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${MAPS_API_KEY}&libraries=places`;
      script.async = true;
      script.defer = true;
      
      script.onload = initMap;
      script.onerror = () => setLoadError('Failed to load Google Maps script');
      
      document.head.appendChild(script);
    } else {
      initMap();
    }

    return () => {
      // Cleanup markers and listeners on unmount
      if (infoWindowRef.current) {
        infoWindowRef.current.close();
      }
      Object.values(markersRef.current).forEach(marker => {
        google.maps.event.clearInstanceListeners(marker);
        marker.setMap(null);
      });
      markersRef.current = {};
    };
  }, []);

  const handleLocationChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const locationName = event.target.value;
    const location = Object.values(LOCATIONS).find(loc => loc.name === locationName);
    
    if (location && mapInstanceRef.current) {
      setSelectedLocation(location.name);
      
      // Animate to new location
      mapInstanceRef.current.panTo({ lat: location.lat, lng: location.lng });
      mapInstanceRef.current.setZoom(12);
      
      // Bounce the selected marker
      const marker = markersRef.current[location.name];
      if (marker) {
        marker.setAnimation(google.maps.Animation.BOUNCE);
        setTimeout(() => marker.setAnimation(null), 1500);
      }
    }
  };

  return (
    <div className="app-container">
      <h1 className="heading">Interactive World Map</h1>
      
      <div className="controls">
        <label htmlFor="location">Select Location: </label>
        <select
          id="location"
          value={selectedLocation}
          onChange={handleLocationChange}
          className="location-select"
          disabled={!mapsLoaded}
        >
          {Object.values(LOCATIONS).map(location => (
            <option key={location.name} value={location.name}>
              {location.name}
            </option>
          ))}
        </select>
      </div>

      {loadError && (
        <div className="error-message">
          {loadError}
        </div>
      )}

      <div ref={mapRef} className="map-container" />
    </div>
  );
}

export default App;