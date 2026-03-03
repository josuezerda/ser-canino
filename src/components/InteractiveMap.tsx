'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { supabase } from '@/lib/supabase';

// Fix for default marker icons in Leaflet with Next.js
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

interface Location {
    lat: number;
    lng: number;
}

function LocationMarker({ location }: { location: Location | null }) {
    const map = useMap();

    useEffect(() => {
        if (location) {
            map.flyTo([location.lat, location.lng], 14, { animate: true });
        }
    }, [location, map]);

    return location === null ? null : (
        <Marker position={[location.lat, location.lng]}>
            <Popup>Estás aquí</Popup>
        </Marker>
    );
}

export default function InteractiveMap() {
    const [userLocation, setUserLocation] = useState<Location | null>(null);
    const [reports, setReports] = useState<any[]>([]);
    const [directories, setDirectories] = useState<any[]>([]);

    useEffect(() => {
        // Solicitar ubicación al usuario
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setUserLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                    });
                },
                (error) => {
                    // console.warn("Usando ubicación por defecto (Buenos Aires):", error.message);
                    setUserLocation({ lat: -34.6037, lng: -58.3816 });
                }
            );
        } else {
            // Default a Buenos Aires
            setUserLocation({ lat: -34.6037, lng: -58.3816 });
        }

        // Fetch reports
        const fetchReports = async () => {
            const { data, error } = await supabase
                .from('reports')
                .select('*')
                .eq('status', 'activo');
            if (!error && data) {
                setReports(data);
            }
        };

        // Fetch directories
        const fetchDirectories = async () => {
            const { data, error } = await supabase
                .from('directories')
                .select('*');
            if (!error && data) {
                setDirectories(data);
            }
        };

        fetchReports();
        fetchDirectories();

        // Subscribe to changes
        const channel = supabase
            .channel('map-reports')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, () => {
                fetchReports();
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'directories' }, () => {
                fetchDirectories();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    // Iconos personalizados
    const vetIcon = new L.Icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    });

    const shelterIcon = new L.Icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    });

    const careIcon = new L.Icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    });

    // Si aún no tenemos la ubicación, mostramos un cargando (o el default map)
    if (!userLocation) {
        return (
            <div style={{ width: '100%', height: '100%', backgroundColor: '#E4E4E7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#71717A' }}>
                <p>Buscando ubicación...</p>
            </div>
        );
    }

    return (
        <MapContainer
            center={[userLocation.lat, userLocation.lng]}
            zoom={14}
            style={{ width: '100%', height: '100%', zIndex: 10 }}
            zoomControl={false}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            />
            <LocationMarker location={userLocation} />

            {/* Marcadores de Directorio (Refugios, Veterinarias, Guarderías) */}
            {directories.map(dir => (
                <Marker
                    key={dir.id}
                    position={[dir.lat, dir.lng]}
                    icon={dir.type === 'veterinaria_24h' ? vetIcon : dir.type === 'guarderia' ? careIcon : shelterIcon}
                >
                    <Popup>
                        <div style={{ padding: '0.25rem' }}>
                            <strong style={{ display: 'block', fontSize: '1rem', marginBottom: '0.25rem' }}>{dir.name}</strong>
                            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)' }}>{dir.address}</p>
                            {dir.contact_phone && (
                                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: 'var(--text-muted)' }}>📞 {dir.contact_phone}</p>
                            )}
                            <div style={{ display: 'flex', alignItems: 'center', marginTop: '0.5rem', gap: '0.5rem' }}>
                                <span style={{
                                    fontSize: '0.625rem', fontWeight: 700,
                                    textTransform: 'uppercase', padding: '0.125rem 0.5rem', borderRadius: 'var(--radius-full)',
                                    backgroundColor: dir.type === 'veterinaria_24h' ? '#DCFCE7' : dir.type === 'guarderia' ? '#FFEDD5' : '#F3E8FF',
                                    color: dir.type === 'veterinaria_24h' ? '#16A34A' : dir.type === 'guarderia' ? '#EA580C' : '#9333EA'
                                }}>
                                    {dir.type === 'veterinaria_24h' ? 'Veterinaria 24h' : dir.type === 'guarderia' ? 'Guardería / Cuidador' : 'Refugio / Tránsito'}
                                </span>
                                {dir.verified && (
                                    <span style={{ fontSize: '0.625rem', color: '#0284C7', fontWeight: 700 }}>✓ Verificado</span>
                                )}
                            </div>
                        </div>
                    </Popup>
                </Marker>
            ))}

            {/* Marcadores de Alertas/Reportes */}
            {reports.map(report => (
                <Marker key={report.id} position={[report.lat, report.lng]}>
                    <Popup>
                        <div style={{ padding: '0.25rem' }}>
                            <strong style={{ display: 'block', fontSize: '1rem', marginBottom: '0.25rem' }}>{report.title}</strong>
                            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)' }}>{report.description}</p>
                            <span style={{
                                display: 'inline-block', marginTop: '0.5rem', fontSize: '0.625rem', fontWeight: 700,
                                textTransform: 'uppercase', padding: '0.125rem 0.5rem', borderRadius: 'var(--radius-full)',
                                backgroundColor: report.urgency === 'alta' ? '#FEE2E2' : report.urgency === 'media' ? '#FEF3C7' : '#E0F2FE',
                                color: report.urgency === 'alta' ? '#DC2626' : report.urgency === 'media' ? '#D97706' : '#0284C7'
                            }}>
                                Urgencia {report.urgency}
                            </span>
                        </div>
                    </Popup>
                </Marker>
            ))}
        </MapContainer>
    );
}
