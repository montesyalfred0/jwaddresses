import { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { X, MapPin, Crosshair } from 'lucide-react';

const googlePinIcon = L.divIcon({
  className: '',
  iconSize: [28, 42],
  iconAnchor: [14, 42],
  popupAnchor: [0, -42],
  html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 42" width="28" height="42">
    <defs>
      <filter id="pin-shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-opacity="0.3"/>
      </filter>
    </defs>
    <g filter="url(#pin-shadow)">
      <path d="M14 0C6.27 0 0 6.27 0 14c0 10.5 14 28 14 28s14-17.5 14-28C28 6.27 21.73 0 14 0z" fill="#ea4335"/>
      <circle cx="14" cy="13" r="5" fill="#fff"/>
    </g>
  </svg>`
});

function LocationMarker({ position, onMapClick }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng);
    },
  });
  return position ? <Marker position={position} icon={googlePinIcon} /> : null;
}

function MapCenter({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, map.getZoom());
    }
  }, [center, map]);
  return null;
}

function parseLatLng(locationString) {
  if (!locationString) return null;
  try {
    const url = new URL(locationString);
    const q = url.searchParams.get('q');
    if (!q) return null;
    const [lat, lng] = q.split(',').map(Number);
    if (isNaN(lat) || isNaN(lng)) return null;
    return { lat, lng };
  } catch {
    return null;
  }
}

const DEFAULT_CENTER = { lat: 12.1149, lng: -86.2362 };

export default function MapPicker({ isOpen, onClose, onConfirm, initialLocation }) {
  const initialPos = parseLatLng(initialLocation) || DEFAULT_CENTER;
  const [position, setPosition] = useState(initialPos);
  const [mapCenter, setMapCenter] = useState(initialPos);

  useEffect(() => {
    if (isOpen) {
      const pos = parseLatLng(initialLocation) || DEFAULT_CENTER;
      setPosition(pos);
      setMapCenter({ ...pos });
    }
  }, [isOpen, initialLocation]);

  const handleMapClick = useCallback((latlng) => {
    setPosition(latlng);
  }, []);

  const handleConfirm = useCallback(() => {
    if (position) {
      const url = `https://www.google.com/maps?q=${position.lat},${position.lng}`;
      onConfirm(url);
    }
  }, [position, onConfirm]);

  const handleUseDeviceLocation = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setPosition({ lat: latitude, lng: longitude });
          setMapCenter({ lat: latitude, lng: longitude });
        },
        () => {
          /* ignore error */
        },
        { enableHighAccuracy: false, timeout: 5000 }
      );
    }
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-jwtext flex items-center gap-2">
            <MapPin className="w-5 h-5 text-jw-700" />
            Seleccionar ubicación
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="relative h-[50vh] min-h-[300px]">
          <MapContainer
            center={mapCenter}
            zoom={15}
            className="h-full w-full"
            zoomControl={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <LocationMarker position={position} onMapClick={handleMapClick} />
            <MapCenter center={mapCenter} />
          </MapContainer>

          <button
            type="button"
            onClick={handleUseDeviceLocation}
            className="absolute top-3 right-3 z-[1000] bg-white text-jw-700 p-2.5 rounded-lg shadow-md hover:bg-jw-50 transition-colors"
            title="Usar mi ubicación"
          >
            <Crosshair className="w-5 h-5" />
          </button>
        </div>

        <div className="px-5 py-3 text-xs text-jwtextm text-center border-t border-gray-50">
          {position
            ? `${position.lat.toFixed(6)}, ${position.lng.toFixed(6)}`
            : 'Haga clic en el mapa para colocar un marcador'}
        </div>

        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-medium text-jwtextm hover:text-jwtext bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!position}
            className="flex items-center gap-1.5 px-5 py-2.5 text-sm font-medium text-white bg-jw-700 hover:bg-jw-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors shadow-sm"
          >
            <MapPin className="w-4 h-4" />
            Confirmar ubicación
          </button>
        </div>
      </div>
    </div>
  );
}
