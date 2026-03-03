'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import Header from '@/components/Header';
import { Camera, MapPin, Key, Shield, AlertCircle, CheckCircle2, QrCode as QrCodeIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import QRCode from 'react-qr-code';

const LocationPickerMap = dynamic(() => import('@/components/LocationPickerMap'), {
    ssr: false,
    loading: () => <div style={{ height: '300px', backgroundColor: 'var(--surface-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Cargando mapa...</div>
});

export default function ProfileDashboard() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Form states
    const [petName, setPetName] = useState('');
    const [breed, setBreed] = useState('');
    const [medicalNotes, setMedicalNotes] = useState('');
    const [homeLocation, setHomeLocation] = useState<{ lat: number, lng: number } | null>(null);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [avatarUrl, setAvatarUrl] = useState('');
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Messages
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        const fetchProfile = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/');
                return;
            }
            setUser(user);

            const { data: profileData, error: profileError } = await supabase
                .from('animal_profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (profileData) {
                setProfile(profileData);
                setPetName(profileData.pet_name || '');
                setBreed(profileData.breed || '');
                setMedicalNotes(profileData.medical_notes || '');
                setAvatarUrl(profileData.avatar_url || '');
                if (profileData.home_lat && profileData.home_lng) {
                    setHomeLocation({ lat: profileData.home_lat, lng: profileData.home_lng });
                }
            }
            setLoading(false);
        };

        fetchProfile();
    }, [router]);

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setUploadingAvatar(true);
            setError('');

            if (!e.target.files || e.target.files.length === 0) {
                throw new Error('Debes seleccionar una imagen.');
            }

            const file = e.target.files[0];
            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}-${Math.random()}.${fileExt}`;
            const filePath = `${user.id}/${fileName}`; // Folder is User ID for RLS match

            // Upload image
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            setAvatarUrl(publicUrl);

            // Auto-save the avatar to profile
            await supabase
                .from('animal_profiles')
                .update({ avatar_url: publicUrl })
                .eq('id', user.id);

            setSuccess('¡Foto de perfil actualizada!');
        } catch (err: any) {
            setError(err.message || 'Error al subir la imagen');
        } finally {
            setUploadingAvatar(false);
        }
    };

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        setSuccess('');

        try {
            // 1. Update Profile info
            const { error: updateError } = await supabase
                .from('animal_profiles')
                .update({
                    pet_name: petName,
                    breed: breed,
                    medical_notes: medicalNotes,
                    home_lat: homeLocation?.lat,
                    home_lng: homeLocation?.lng
                })
                .eq('id', user.id);

            if (updateError) throw updateError;

            // 2. Update Password if provided
            if (password || confirmPassword) {
                if (password !== confirmPassword) {
                    throw new Error('Las contraseñas no coinciden.');
                }
                const { error: pwdError } = await supabase.auth.updateUser({ password: password });
                if (pwdError) throw pwdError;

                setPassword('');
                setConfirmPassword('');
                setSuccess('¡Perfil y contraseña actualizados correctamente!');
            } else {
                setSuccess('¡Perfil actualizado correctamente!');
            }

        } catch (err: any) {
            setError(err.message || 'Error al guardar los cambios');
        } finally {
            setSaving(false);
        }
    };

    // Helper: Generate a dynamic rotating token (changes every 6 seconds)
    const [provisionalToken, setProvisionalToken] = useState('');

    useEffect(() => {
        if (!user) return;

        const generateToken = () => {
            // Get current time in seconds, divided by 6
            const windowTime = Math.floor(Date.now() / 6000);

            // Simple hash function to mix user ID and windowTime for visual rotation
            const baseStr = `${user.id}-${windowTime}`;
            let hash = 0;
            for (let i = 0; i < baseStr.length; i++) {
                hash = Math.imul(31, hash) + baseStr.charCodeAt(i) | 0;
            }
            // Format to a readable token like SC-A1B2C3D4
            const tokenStr = Math.abs(hash).toString(16).toUpperCase().padStart(8, '0');
            setProvisionalToken(`SC-${tokenStr.substring(0, 8)}`);
        };

        generateToken(); // initial
        const interval = setInterval(generateToken, 1000); // Check every second to update UI exactly when window changes

        return () => clearInterval(interval);
    }, [user]);

    if (loading) {
        return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: '#F8FAFC' }}>Cargando tu credencial...</div>;
    }

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#F8FAFC' }}>
            <Header />

            <main style={{ maxWidth: '1000px', margin: '0 auto', padding: '100px 2rem 4rem 2rem', display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>

                {/* Lateral: Credencial & Token */}
                <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', borderRadius: 'var(--radius-lg)' }}>
                        <div style={{ position: 'relative', width: '150px', height: '150px', margin: '0 auto 1.5rem auto' }}>
                            <div style={{ width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden', backgroundColor: 'var(--border-color)', border: '4px solid white', boxShadow: 'var(--shadow-md)' }}>
                                {avatarUrl ? (
                                    <img src={avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                                        <Camera size={40} />
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploadingAvatar}
                                style={{ position: 'absolute', bottom: '0', right: '10px', backgroundColor: 'var(--primary-color)', color: 'white', padding: '0.75rem', borderRadius: '50%', border: '4px solid white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'var(--transition)' }}
                                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                            >
                                <Camera size={18} />
                            </button>
                            <input
                                type="file"
                                accept="image/*"
                                ref={fileInputRef}
                                style={{ display: 'none' }}
                                onChange={handleAvatarUpload}
                            />
                        </div>

                        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.25rem' }}>{petName || 'Sin Nombre'}</h1>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1rem' }}>{breed || 'Mestizo'}</p>

                        {profile?.is_super_admin && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', backgroundColor: '#FEF2F2', color: '#DC2626', padding: '0.25rem 0.75rem', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: 700 }}>
                                <Shield size={14} /> Súper Admin
                            </span>
                        )}
                    </div>

                    <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)', background: 'linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%)', color: 'white' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', opacity: 0.9 }}>
                            <QrCodeIcon size={20} /> <span style={{ fontWeight: 600 }}>Token de Asistencia</span>
                        </div>
                        <p style={{ fontSize: '0.875rem', opacity: 0.8, marginBottom: '1rem' }}>Muestra este QR en cualquier veterinaria adherida para acceder a tu historial médico.</p>
                        <div style={{ backgroundColor: 'white', padding: '1rem', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)' }}>
                            <div style={{ padding: '0.5rem', backgroundColor: 'white', borderRadius: '8px', width: '150px', height: '150px' }}>
                                {provisionalToken ? (
                                    <QRCode value={provisionalToken} size={150} style={{ height: "auto", maxWidth: "100%", width: "100%" }} />
                                ) : (
                                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>...</div>
                                )}
                            </div>
                            <div style={{ color: 'var(--text-main)', fontSize: '1.25rem', fontWeight: 900, letterSpacing: '2px' }}>
                                {provisionalToken}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Formulario de Perfil */}
                <div className="glass-panel" style={{ flex: '2 1 500px', padding: '2rem', borderRadius: 'var(--radius-lg)' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                        Actualizar Datos de Identidad
                    </h2>

                    {error && (
                        <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', color: '#B91C1C', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                            <AlertCircle size={16} /> {error}
                        </div>
                    )}
                    {success && (
                        <div style={{ backgroundColor: '#F0FDF4', border: '1px solid #86EFAC', color: '#15803D', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                            <CheckCircle2 size={16} /> {success}
                        </div>
                    )}

                    <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)' }}>Nombre del Animal</label>
                                <input
                                    type="text"
                                    value={petName}
                                    onChange={e => setPetName(e.target.value)}
                                    className="input-field"
                                    placeholder="Ej: Firulais"
                                />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)' }}>Raza o Descripción</label>
                                <input
                                    type="text"
                                    value={breed}
                                    onChange={e => setBreed(e.target.value)}
                                    className="input-field"
                                    placeholder="Ej: Mestizo pampa"
                                />
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)' }}>Notas Médicas Preventivas</label>
                            <textarea
                                value={medicalNotes}
                                onChange={e => setMedicalNotes(e.target.value)}
                                className="input-field"
                                placeholder="Alergias, condiciones especiales, vacunas..."
                                style={{ minHeight: '100px', resize: 'vertical' }}
                            />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <MapPin size={16} color="var(--primary-color)" /> Hogar Base (Ubicación)
                            </h3>
                            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                                Fija tu ubicación base (hogar) en el mapa para cuando haya alertas rápidas comunitarias. Solo haz clic en tu ubicación.
                            </p>

                            <div style={{ height: '300px', width: '100%', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border-color)', marginBottom: '0.5rem' }}>
                                <LocationPickerMap
                                    initialLocation={homeLocation}
                                    onLocationChange={(lat, lng) => setHomeLocation({ lat, lng })}
                                />
                            </div>

                            {homeLocation ? (
                                <div style={{ padding: '0.75rem', backgroundColor: '#F0FDF4', color: '#15803D', borderRadius: 'var(--radius-md)', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <CheckCircle2 size={16} /> Ubicación base seleccionada ({homeLocation.lat.toFixed(4)}, {homeLocation.lng.toFixed(4)})
                                </div>
                            ) : (
                                <div style={{ padding: '0.75rem', backgroundColor: '#FEF9C3', color: '#A16207', borderRadius: 'var(--radius-md)', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <AlertCircle size={16} /> Aún no has fijado tu hogar base en el mapa.
                                </div>
                            )}
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Key size={16} color="var(--primary-color)" /> Seguridad de la Cuenta
                            </h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '0.5rem' }}>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    className="input-field"
                                    placeholder="Nueva contraseña"
                                />
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={e => setConfirmPassword(e.target.value)}
                                    className="input-field"
                                    placeholder="Confirmar nueva contraseña"
                                />
                            </div>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Deja en blanco si no deseas cambiarla.</p>
                        </div>

                        <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                            <button
                                type="submit"
                                disabled={saving}
                                className="btn-primary"
                                style={{ padding: '0.75rem 2rem' }}
                            >
                                {saving ? 'Guardando...' : 'Guardar Cambios'}
                            </button>
                        </div>

                    </form>
                </div>
            </main>
        </div>
    );
}
