'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import Header from '@/components/Header';
import { Camera, MapPin, Key, Shield, ShieldAlert, AlertCircle, CheckCircle2, QrCode as QrCodeIcon, Plus, User, Phone, Trash2 } from 'lucide-react';
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
    const [pets, setPets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Tabs
    const [activeTab, setActiveTab] = useState<'profile' | 'pets'>('profile');

    // Human Profile Form States
    const [fullName, setFullName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [homeLocation, setHomeLocation] = useState<{ lat: number, lng: number } | null>(null);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // Pet Form States (for adding new or editing)
    const [isEditingPet, setIsEditingPet] = useState(false);
    const [currentPetId, setCurrentPetId] = useState<string | null>(null);
    const [petName, setPetName] = useState('');
    const [breed, setBreed] = useState('');
    const [ageYears, setAgeYears] = useState<number | ''>('');
    const [medicalNotes, setMedicalNotes] = useState('');
    const [avatarUrl, setAvatarUrl] = useState('');
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Messages
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        const fetchProfileData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/');
                return;
            }
            setUser(user);

            // Fetch Human Profile
            const { data: profileData, error: profileError } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (profileData) {
                setProfile(profileData);
                setFullName(profileData.full_name || '');
                setPhoneNumber(profileData.phone_number || '');
                if (profileData.home_lat && profileData.home_lng) {
                    setHomeLocation({ lat: profileData.home_lat, lng: profileData.home_lng });
                }

                // Fetch Pets for this human
                const { data: petsData } = await supabase
                    .from('pets')
                    .select('*')
                    .eq('owner_id', user.id)
                    .order('created_at', { ascending: true });

                if (petsData) setPets(petsData);
            } else {
                // Posiblemente no corrió la migración de SQL aún, o es un usuario completamente nuevo cuya tabla no ha casteado el trigger
                setError('No se encontró el perfil humano. Por favor, asegúrate de correr el script de migración SQL en Supabase.');
            }
            setLoading(false);
        };

        fetchProfileData();
    }, [router]);

    // ===== GUARDAR PERFIL HUMANO =====
    const handleSaveHumanProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true); setError(''); setSuccess('');

        try {
            const { error: updateError } = await supabase
                .from('user_profiles')
                .update({
                    full_name: fullName,
                    phone_number: phoneNumber,
                    home_lat: homeLocation?.lat,
                    home_lng: homeLocation?.lng
                })
                .eq('id', user.id);

            if (updateError) throw updateError;

            if (password || confirmPassword) {
                if (password !== confirmPassword) throw new Error('Las contraseñas no coinciden.');
                const { error: pwdError } = await supabase.auth.updateUser({ password: password });
                if (pwdError) throw pwdError;
                setPassword(''); setConfirmPassword('');
                setSuccess('¡Perfil humano y contraseña actualizados!');
            } else {
                setSuccess('¡Perfil humano actualizado correctamente!');
            }

            // local update
            setProfile({ ...profile, full_name: fullName, phone_number: phoneNumber, home_lat: homeLocation?.lat, home_lng: homeLocation?.lng });
        } catch (err: any) {
            setError(err.message || 'Error al guardar los cambios');
        } finally {
            setSaving(false);
        }
    };

    // ===== GESTIÓN DE MASCOTAS =====
    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setUploadingAvatar(true); setError('');

            if (!e.target.files || e.target.files.length === 0) throw new Error('Debes seleccionar una imagen.');

            const file = e.target.files[0];
            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}-${Math.random()}.${fileExt}`;
            const filePath = `${user.id}/${fileName}`;

            const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file);
            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
            setAvatarUrl(publicUrl);
            setSuccess('¡Foto subida correctamente! (Se guardará al enviar el formulario de la mascota)');
        } catch (err: any) {
            setError(err.message || 'Error al subir la imagen');
        } finally {
            setUploadingAvatar(false);
        }
    };

    const resetPetForm = () => {
        setCurrentPetId(null);
        setPetName(''); setBreed(''); setAgeYears(''); setMedicalNotes(''); setAvatarUrl('');
        setError(''); setSuccess('');
    };

    const handleEditPetClick = (pet: any) => {
        setCurrentPetId(pet.id);
        setPetName(pet.pet_name);
        setBreed(pet.breed || '');
        setAgeYears(pet.age_years || '');
        setMedicalNotes(pet.medical_notes || '');
        setAvatarUrl(pet.avatar_url || '');
        setIsEditingPet(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSavePet = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!petName) { setError('El nombre de la mascota es obligatorio.'); return; }

        setSaving(true); setError(''); setSuccess('');
        try {
            const petData = {
                owner_id: user.id,
                pet_name: petName,
                breed,
                age_years: ageYears === '' ? null : Number(ageYears),
                medical_notes: medicalNotes,
                avatar_url: avatarUrl
            };

            if (currentPetId) {
                // Update
                const { error: updateError } = await supabase.from('pets').update(petData).eq('id', currentPetId);
                if (updateError) throw updateError;
                setPets(pets.map(p => p.id === currentPetId ? { ...p, ...petData } : p));
                setSuccess('Mascota actualizada con éxito.');
            } else {
                // Insert
                const { data, error: insertError } = await supabase.from('pets').insert([petData]).select().single();
                if (insertError) throw insertError;
                if (data) setPets([...pets, data]);
                setSuccess('¡Nueva mascota añadida a la familia!');
            }
            resetPetForm();
            setIsEditingPet(false);
        } catch (err: any) {
            setError(err.message || 'Error guardando mascota');
        } finally {
            setSaving(false);
        }
    };

    const handleDeletePet = async (id: string, name: string) => {
        if (!confirm(`¿Estás seguro de eliminar a ${name} de tu cuenta?`)) return;
        const { error } = await supabase.from('pets').delete().eq('id', id);
        if (!error) {
            setPets(pets.filter(p => p.id !== id));
            if (currentPetId === id) {
                resetPetForm();
                setIsEditingPet(false);
            }
        } else {
            alert('Error eliminando mascota: ' + error.message);
        }
    };

    // Helper: Generate dynamic rotating token for a specific pet
    const [petTokens, setPetTokens] = useState<Record<string, string>>({});

    useEffect(() => {
        if (pets.length === 0) return;

        const generateTokens = () => {
            const windowTime = Math.floor(Date.now() / 6000);
            const newTokens: Record<string, string> = {};

            pets.forEach(pet => {
                const baseStr = `${pet.id}-${windowTime}`;
                let hash = 0;
                for (let i = 0; i < baseStr.length; i++) {
                    hash = Math.imul(31, hash) + baseStr.charCodeAt(i) | 0;
                }
                const tokenStr = Math.abs(hash).toString(16).toUpperCase().padStart(8, '0');
                newTokens[pet.id] = `SC-${tokenStr.substring(0, 8)}`;
            });
            setPetTokens(newTokens);
        };

        generateTokens();
        const interval = setInterval(generateTokens, 1000);
        return () => clearInterval(interval);
    }, [pets]);

    if (loading) {
        return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: '#F8FAFC' }}>Cargando tu cuenta familiar...</div>;
    }

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#F8FAFC' }}>
            <Header />

            <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '100px 2rem 4rem 2rem' }}>

                {/* Cabecera del Hub Familiar */}
                <div className="glass-panel" style={{ padding: '2rem', borderRadius: 'var(--radius-lg)', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <User size={32} color="var(--primary-color)" /> Familia de {profile?.full_name || 'Tutor/a'}
                        </h1>
                        <p style={{ color: 'var(--text-muted)', margin: 0 }}>Gestiona tus datos de contacto y el inventario de tus mascotas.</p>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {profile?.system_role === 'superadmin' && (
                            <button
                                onClick={() => router.push('/superadmin')}
                                style={{ padding: '0.75rem 1.5rem', backgroundColor: '#18181B', color: 'white', borderRadius: 'var(--radius-md)', fontSize: '0.875rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                            >
                                <ShieldAlert size={16} color="#38BDF8" /> Centro de Comando
                            </button>
                        )}
                        {(profile?.system_role === 'veterinaria' || profile?.system_role === 'moderador') && (
                            <span style={{ padding: '0.75rem 1.5rem', backgroundColor: '#E0F2FE', color: '#0369A1', borderRadius: 'var(--radius-md)', fontSize: '0.875rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Shield size={16} /> Personal Autorizado ({profile.system_role})
                            </span>
                        )}
                    </div>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                    <button
                        onClick={() => { setActiveTab('profile'); resetPetForm(); }}
                        style={{ padding: '0.75rem 1.5rem', borderRadius: 'var(--radius-full)', fontWeight: 600, backgroundColor: activeTab === 'profile' ? 'var(--primary-color)' : 'var(--surface)', color: activeTab === 'profile' ? '#FFF' : 'var(--text-main)', border: `1px solid ${activeTab === 'profile' ? 'var(--primary-color)' : 'var(--border-color)'}`, display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                        <User size={18} /> Mis Datos (Humanos)
                    </button>
                    <button
                        onClick={() => setActiveTab('pets')}
                        style={{ padding: '0.75rem 1.5rem', borderRadius: 'var(--radius-full)', fontWeight: 600, backgroundColor: activeTab === 'pets' ? 'var(--primary-color)' : 'var(--surface)', color: activeTab === 'pets' ? '#FFF' : 'var(--text-main)', border: `1px solid ${activeTab === 'pets' ? 'var(--primary-color)' : 'var(--border-color)'}`, display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                        <Shield size={18} /> Mis Mascotas ({pets.length})
                    </button>
                </div>

                {error && <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', color: '#B91C1C', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}><AlertCircle size={16} /> {error}</div>}
                {success && <div style={{ backgroundColor: '#F0FDF4', border: '1px solid #86EFAC', color: '#15803D', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}><CheckCircle2 size={16} /> {success}</div>}

                {/* ====== TAB HUMANA ====== */}
                {activeTab === 'profile' && (
                    <div className="glass-panel" style={{ padding: '2rem', borderRadius: 'var(--radius-lg)' }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                            Actualizar Datos de Identidad
                        </h2>
                        <form onSubmit={handleSaveHumanProfile} style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'minmax(300px, 1fr) minmax(300px, 1fr)' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Nombre Completo o Alias</label>
                                <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} className="input-field" placeholder="Ej: Juan Pérez" />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <label style={{ fontSize: '0.875rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Phone size={14} /> Teléfono de Contacto</label>
                                <input type="text" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} className="input-field" placeholder="Ej: +54 9 11 1234 5678" />
                            </div>

                            <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <MapPin size={16} color="var(--primary-color)" /> Hogar Base (Ubicación Geográfica)
                                </h3>
                                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Ubicación para alertas comunitarias cercanas (Tus mascotas usarán esta base de forma predeterminada).</p>
                                <div style={{ height: '300px', width: '100%', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                                    <LocationPickerMap initialLocation={homeLocation} onLocationChange={(lat, lng) => setHomeLocation({ lat, lng })} />
                                </div>
                            </div>

                            <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
                                <h3 style={{ fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Key size={16} color="var(--primary-color)" /> Cambio de Contraseña
                                </h3>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '0.5rem' }}>
                                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="input-field" placeholder="Nueva contraseña" />
                                    <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="input-field" placeholder="Confirmar nueva contraseña" />
                                </div>
                            </div>

                            <div style={{ gridColumn: '1 / -1', marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                                <button type="submit" disabled={saving} className="btn-primary" style={{ padding: '0.75rem 2rem' }}>
                                    {saving ? 'Guardando...' : 'Guardar Datos Personales'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}


                {/* ====== TAB MASCOTAS ====== */}
                {activeTab === 'pets' && (
                    <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>

                        {/* Lista de Mascotas (Izquierda) */}
                        <div style={{ flex: '1 1 350px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <button
                                onClick={() => { resetPetForm(); setIsEditingPet(true); }}
                                style={{ padding: '1rem', border: '2px dashed var(--border-color)', borderRadius: 'var(--radius-lg)', backgroundColor: 'transparent', color: 'var(--text-main)', fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', cursor: 'pointer', transition: 'var(--transition)' }}
                                onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--primary-color)'}
                                onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
                            >
                                <Plus size={20} /> Añadir otra mascota
                            </button>

                            {pets.map(pet => (
                                <div key={pet.id} className="glass-panel" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: currentPetId === pet.id ? '2px solid var(--primary-color)' : '1px solid transparent' }}>
                                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                        <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: 'var(--surface-hover)', overflow: 'hidden' }}>
                                            {pet.avatar_url ? <img src={pet.avatar_url} alt={pet.pet_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Camera size={24} style={{ margin: '18px auto', display: 'block', color: 'var(--text-muted)' }} />}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700 }}>{pet.pet_name}</h3>
                                            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)' }}>{pet.breed || 'Sin raza definida'} {pet.age_years ? `• ${pet.age_years} años` : ''}</p>
                                        </div>
                                    </div>

                                    {/* Módulo de QR para cada mascota dentro de su tarjeta mini */}
                                    <div style={{ marginTop: '1.5rem', padding: '1rem', borderRadius: 'var(--radius-md)', background: 'linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%)', color: 'white', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                        <div style={{ backgroundColor: 'white', padding: '0.5rem', borderRadius: '8px', minWidth: '80px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            {petTokens[pet.id] ? <QRCode value={petTokens[pet.id]} size={70} /> : '...'}
                                        </div>
                                        <div>
                                            <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 600, opacity: 0.9 }}>Token de Asistencia para Vet</p>
                                            <h4 style={{ margin: '0.25rem 0', fontSize: '1.25rem', fontWeight: 800, letterSpacing: '1px' }}>{petTokens[pet.id]}</h4>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                                        <button onClick={() => handleEditPetClick(pet)} className="btn-secondary" style={{ flex: 1, padding: '0.5rem', fontSize: '0.875rem' }}>Ver/Editar Datos</button>
                                        <button onClick={() => handleDeletePet(pet.id, pet.pet_name)} style={{ padding: '0.5rem', backgroundColor: '#FEE2E2', color: '#DC2626', borderRadius: 'var(--radius-md)' }}><Trash2 size={18} /></button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Formulario de Mascota (Derecha) */}
                        {isEditingPet && (
                            <div className="glass-panel" style={{ flex: '1 1 450px', padding: '2rem', borderRadius: 'var(--radius-lg)', position: 'sticky', top: '100px' }}>
                                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                                    {currentPetId ? `Expediente de ${petName}` : 'Nueva Mascota'}
                                </h2>

                                <form onSubmit={handleSavePet} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                    {/* Avatar Picker Integrado */}
                                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', padding: '1rem', backgroundColor: 'var(--surface)', borderRadius: 'var(--radius-md)' }}>
                                        <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'var(--surface-hover)', overflow: 'hidden', border: '3px solid white', boxShadow: 'var(--shadow-sm)' }}>
                                            {avatarUrl ? <img src={avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Camera size={30} style={{ margin: '22px auto', display: 'block', color: 'var(--text-muted)' }} />}
                                        </div>
                                        <div>
                                            <button type="button" onClick={() => fileInputRef.current?.click()} className="btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }} disabled={uploadingAvatar}>
                                                {uploadingAvatar ? 'Subiendo...' : 'Cambiar Foto de Perfil'}
                                            </button>
                                            <input type="file" accept="image/*" ref={fileInputRef} style={{ display: 'none' }} onChange={handleAvatarUpload} />
                                        </div>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                            <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Nombre del Animal *</label>
                                            <input type="text" value={petName} onChange={e => setPetName(e.target.value)} className="input-field" placeholder="Ej: Firulais" required />
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                            <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Edad (Años)</label>
                                            <input type="number" value={ageYears} onChange={e => setAgeYears(e.target.value ? Number(e.target.value) : '')} className="input-field" placeholder="Ej: 3" min="0" />
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Raza o Descripción Física</label>
                                        <input type="text" value={breed} onChange={e => setBreed(e.target.value)} className="input-field" placeholder="Ej: Mestizo color canela" />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Registro Médico e Historial (Importante para Vet)</label>
                                        <textarea value={medicalNotes} onChange={e => setMedicalNotes(e.target.value)} className="input-field" placeholder="Vacunas aplicadas, alergias, operaciones, enfermedades..." style={{ minHeight: '120px', resize: 'vertical' }} />
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem' }}>
                                        <button type="button" onClick={() => { setIsEditingPet(false); resetPetForm(); }} className="btn-secondary">Cancelar</button>
                                        <button type="submit" disabled={saving} className="btn-primary" style={{ padding: '0.75rem 2rem' }}>
                                            {saving ? 'Guardando...' : (currentPetId ? 'Actualizar Expediente' : 'Añadir Mascota')}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}
                        {!isEditingPet && pets.length === 0 && (
                            <div style={{ flex: '1 1 450px', padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                <Shield size={48} style={{ margin: '0 auto 1rem auto', opacity: 0.2 }} />
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>Sin Mascotas Registradas</h3>
                                <p style={{ maxWidth: '400px', margin: '0 auto' }}>Haz clic en "+ Añadir otra mascota" para registrar a tu primer integrante de la familia y generarle su DNI Pata.</p>
                            </div>
                        )}
                    </div>
                )}

            </main>
        </div>
    );
}
