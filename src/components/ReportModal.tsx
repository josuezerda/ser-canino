'use client';

import { useState } from 'react';
import { X, MapPin, Camera, AlertTriangle } from 'lucide-react';
import { Turnstile } from '@marsidev/react-turnstile';
import { supabase } from '@/lib/supabase';

interface ReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    userLocation: { lat: number; lng: number } | null;
}

export default function ReportModal({ isOpen, onClose, userLocation }: ReportModalProps) {
    const [description, setDescription] = useState('');
    const [urgency, setUrgency] = useState('media');
    const [loading, setLoading] = useState(false);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

    const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
    const isSubmitDisabled = loading || (!!turnstileSiteKey && !turnstileToken);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                alert("Debes iniciar sesión para reportar");
                setLoading(false);
                return;
            }

            let imageUrl = null;

            if (imageFile) {
                const fileExt = imageFile.name.split('.').pop();
                const fileName = `${session.user.id}-${Date.now()}.${fileExt}`;

                const { error: uploadError, data: uploadData } = await supabase.storage
                    .from('report-images')
                    .upload(fileName, imageFile, {
                        cacheControl: '3600',
                        upsert: false
                    });

                if (uploadError) {
                    console.error("Storage Upload Error:", uploadError);
                    throw new Error("No se pudo subir la imagen.");
                }

                if (uploadData) {
                    const { data } = supabase.storage
                        .from('report-images')
                        .getPublicUrl(uploadData.path);
                    imageUrl = data.publicUrl;
                }
            }

            const { error } = await supabase.from('reports').insert([
                {
                    user_id: session.user.id,
                    title: `Reporte de Emergencia`,
                    description: description,
                    urgency: urgency,
                    lat: userLocation?.lat || -34.6037,
                    lng: userLocation?.lng || -58.3816,
                    status: 'activo',
                    image_url: imageUrl,
                }
            ]);

            if (error) {
                console.error("Supabase Insert Error:", error);
                throw new Error("No se pudo guardar el reporte en la base de datos.");
            }

            alert("¡Reporte enviado exitosamente!");
            setDescription('');
            setUrgency('media');
            setImageFile(null);
            setImagePreview(null);
            onClose();
        } catch (error) {
            console.error(error);
            alert("Error al enviar el reporte. Por favor intenta de nuevo.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)'
        }}>
            <div className="glass-panel" style={{
                width: '100%', maxWidth: '600px', padding: '2rem', borderTopLeftRadius: 'var(--radius-lg)', borderTopRightRadius: 'var(--radius-lg)', position: 'relative',
                maxHeight: '90vh', overflowY: 'auto'
            }}>
                <button onClick={onClose} style={{ position: 'absolute', top: '1rem', right: '1rem', color: 'var(--text-muted)' }}>
                    <X size={24} />
                </button>

                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <AlertTriangle color="var(--primary-color)" /> Emitir Alerta
                </h2>
                <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
                    Ayúdanos a localizar al animal proporcionando la mayor cantidad de detalles posibles.
                </p>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                    {/* Ubicación */}
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.875rem' }}>Ubicación Actual</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem', backgroundColor: 'var(--surface-hover)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                            <MapPin size={18} color="var(--primary-color)" />
                            <span style={{ fontSize: '0.875rem', color: 'var(--text-main)' }}>
                                {userLocation ? `${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}` : "Obteniendo ubicación..."}
                            </span>
                        </div>
                    </div>

                    {/* Foto */}
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.875rem' }}>Fotografía del Animal</label>
                        <input
                            type="file"
                            accept="image/*"
                            id="report-image"
                            style={{ display: 'none' }}
                            onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                    setImageFile(e.target.files[0]);
                                    setImagePreview(URL.createObjectURL(e.target.files[0]));
                                }
                            }}
                        />
                        <label htmlFor="report-image" style={{
                            border: '2px dashed var(--border-color)', borderRadius: 'var(--radius-md)', padding: imagePreview ? '0' : '2rem',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                            cursor: 'pointer', backgroundColor: 'var(--surface)', transition: 'var(--transition)', overflow: 'hidden'
                        }}>
                            {imagePreview ? (
                                <img src={imagePreview} alt="Vista previa" style={{ width: '100%', maxHeight: '200px', objectFit: 'cover' }} />
                            ) : (
                                <>
                                    <Camera size={32} color="var(--text-muted)" />
                                    <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 500 }}>Toca para subir o tomar una foto</span>
                                </>
                            )}
                        </label>
                    </div>

                    {/* Nivel de Urgencia */}
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.875rem' }}>Nivel de Urgencia</label>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
                            {['Baja', 'Media', 'Alta'].map((level) => (
                                <button
                                    key={level}
                                    type="button"
                                    onClick={() => setUrgency(level.toLowerCase())}
                                    style={{
                                        padding: '0.75rem', borderRadius: 'var(--radius-md)', fontSize: '0.875rem', fontWeight: 600,
                                        border: `1px solid ${urgency === level.toLowerCase() ? 'var(--primary-color)' : 'var(--border-color)'}`,
                                        backgroundColor: urgency === level.toLowerCase() ? 'var(--primary-color)' : 'var(--surface)',
                                        color: urgency === level.toLowerCase() ? '#FFF' : 'var(--text-main)',
                                        transition: 'var(--transition)'
                                    }}
                                >
                                    {level}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Descripción */}
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.875rem' }}>Descripción y Detalles</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            required
                            rows={4}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'var(--surface)', fontFamily: 'inherit', resize: 'vertical' }}
                            placeholder="Ej: Perro mestizo negro, parece lastimado en la pata derecha..."
                        />
                    </div>

                    {turnstileSiteKey && (
                        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '0.5rem' }}>
                            <Turnstile
                                siteKey={turnstileSiteKey}
                                onSuccess={(token) => setTurnstileToken(token)}
                            />
                        </div>
                    )}

                    <button type="submit" className="btn-primary" style={{ width: '100%', padding: '1rem', fontSize: '1rem' }} disabled={isSubmitDisabled}>
                        {loading ? 'Enviando...' : 'Publicar Alerta'}
                    </button>
                </form>
            </div>
        </div>
    );
}
