'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons
const defaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = defaultIcon;

interface LocationPickerProps {
    initialLocation: { lat: number; lng: number } | null;
    onLocationChange: (lat: number, lng: number) => void;
}

function LocationMarker({ position, setPosition, onLocationChange }: { position: L.LatLng | null, setPosition: (pos: L.LatLng) => void, onLocationChange: (lat: number, lng: number) => void }) {
    useMapEvents({
        click(e) {
            setPosition(e.latlng);
            onLocationChange(e.latlng.lat, e.latlng.lng);
        },
    });

    return position === null ? null : (
        <Marker position={position} />
    );
}

export default function LocationPickerMap({ initialLocation, onLocationChange }: LocationPickerProps) {
    const [position, setPosition] = useState<L.LatLng | null>(
        initialLocation ? new L.LatLng(initialLocation.lat, initialLocation.lng) : null
    );

    // Default center: Buenos Aires 
    const defaultCenter = { lat: -34.6037, lng: -58.3816 };

    return (
        <MapContainer
            center={position ? [position.lat, position.lng] : [defaultCenter.lat, defaultCenter.lng]}
            zoom={13}
            style={{ width: '100%', height: '100%', borderRadius: 'var(--radius-md)', zIndex: 10 }}
        >
            <TileLayer
                attribution='&copy; OpenStreetMap contributors'
                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            />
            <LocationMarker position={position} setPosition={setPosition} onLocationChange={onLocationChange} />
        </MapContainer>
    );
}
