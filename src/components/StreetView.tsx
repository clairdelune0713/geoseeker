/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useEffect, useRef, useState } from 'react';
import { useMapsLibrary } from '@vis.gl/react-google-maps';
import { EyeOff } from 'lucide-react';

interface StreetViewProps {
  location: { lat: number; lng: number };
}

export default function StreetView({ location }: StreetViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const streetViewLibrary = useMapsLibrary('streetView');
  const panoramaRef = useRef<google.maps.StreetViewPanorama | null>(null);
  const [hasStreetView, setHasStreetView] = useState<boolean | null>(null);

  useEffect(() => {
    if (!containerRef.current || !streetViewLibrary) return;

    const svService = new streetViewLibrary.StreetViewService();
    
    // Check for nearest panorama within 5000 meters
    svService.getPanorama({ location, radius: 5000 }, (data, status) => {
      if (status === 'OK' && data?.location?.latLng) {
        setHasStreetView(true);
        const validLocation = data.location.latLng;
        
        if (!panoramaRef.current) {
          panoramaRef.current = new streetViewLibrary.StreetViewPanorama(containerRef.current!, {
            position: validLocation,
            pov: { heading: 0, pitch: 0 },
            zoom: 1,
            addressControl: false,
            showRoadLabels: false,
            linksControl: false,
            panControl: true,
            enableCloseButton: false,
            fullscreenControl: true,
            zoomControl: true,
          });
        } else {
          panoramaRef.current.setPosition(validLocation);
        }
      } else {
        setHasStreetView(false);
      }
    });
  }, [location, streetViewLibrary]);

  if (hasStreetView === false) {
    return (
      <div className="w-full h-full rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-inner bg-slate-100 dark:bg-slate-800 flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 p-4 text-center">
        <EyeOff className="w-8 h-8 mb-2 opacity-50" />
        <p className="text-sm font-medium">No Street View available near this location.</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-inner relative bg-slate-100 dark:bg-slate-800">
      <div ref={containerRef} className="w-full h-full" />
      {hasStreetView === null && (
        <div className="absolute inset-0 bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}
    </div>
  );
}
