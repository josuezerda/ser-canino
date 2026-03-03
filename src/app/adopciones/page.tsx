'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { supabase } from '@/lib/supabase';
import { Heart, Search, MapPin, Phone, CheckCircle } from 'lucide-react';

export default function AdoptionsPage() {
    const [adoptions, setAdoptions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('todos'); // 'todos', 'buscando', 'en_transito'

    useEffect(() => {
        const fetchAdoptions = async () => {
            setLoading(true);
            let query = supabase.from('adoptions').select('*').order('created_at', { ascending: false });

            if (filter !== 'todos') {
                query = query.eq('status', filter);
            }

            const { data, error } = await query;
            if (!error && data) {
                setAdoptions(data);
            }
            setLoading(false);
        };

        fetchAdoptions();
    }, [filter]);

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#F8FAFC' }}>
            <Header />

            {/* Header Section */}
            <div style={{ backgroundColor: 'var(--primary-color)', color: 'white', padding: '100px 2rem 4rem 2rem', textAlign: 'center' }}>
                <h1 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
                    <Heart fill="white" /> Familias de Corazón
                </h1>
                <p style={{ fontSize: '1.125rem', opacity: 0.9, maxWidth: '600px', margin: '0 auto' }}>
                    Encuentra a tu próximo compañero de vida o conviértete en hogar de tránsito para un animal rescatado. Ellos te están esperando.
                </p>
            </div>

            {/* Filters */}
            <div style={{ maxWidth: '1200px', margin: '-2rem auto 2rem auto', position: 'relative', zIndex: 10, padding: '0 1rem' }}>
                <div className="glass-panel" style={{ display: 'flex', gap: '1rem', padding: '1rem', borderRadius: 'var(--radius-lg)', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button
                        onClick={() => setFilter('todos')}
                        style={{ padding: '0.75rem 1.5rem', borderRadius: 'var(--radius-full)', fontWeight: 600, transition: 'var(--transition)', backgroundColor: filter === 'todos' ? 'var(--secondary-color)' : 'transparent', color: filter === 'todos' ? 'white' : 'var(--text-main)' }}
                    >
                        Todos
                    </button>
                    <button
                        onClick={() => setFilter('buscando')}
                        style={{ padding: '0.75rem 1.5rem', borderRadius: 'var(--radius-full)', fontWeight: 600, transition: 'var(--transition)', backgroundColor: filter === 'buscando' ? 'var(--secondary-color)' : 'transparent', color: filter === 'buscando' ? 'white' : 'var(--text-main)' }}
                    >
                        Adopción Definitiva
                    </button>
                    <button
                        onClick={() => setFilter('en_transito')}
                        style={{ padding: '0.75rem 1.5rem', borderRadius: 'var(--radius-full)', fontWeight: 600, transition: 'var(--transition)', backgroundColor: filter === 'en_transito' ? 'var(--secondary-color)' : 'transparent', color: filter === 'en_transito' ? 'white' : 'var(--text-main)' }}
                    >
                        Buscando Tránsito
                    </button>
                </div>
            </div>

            {/* Grid de Animales */}
            <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 2rem 4rem 2rem' }}>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>Cargando peludos...</div>
                ) : adoptions.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)', backgroundColor: 'white', borderRadius: 'var(--radius-lg)', border: '1px dashed var(--border-color)' }}>
                        <Heart size={48} style={{ margin: '0 auto 1rem auto', opacity: 0.2 }} />
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>No hay animales en esta categoría</h3>
                        <p>Pronto habrá amiguitos necesitando hogar aquí.</p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem' }}>
                        {adoptions.map(pet => (
                            <div key={pet.id} className="glass-panel" style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden', transition: 'transform 0.2s', cursor: 'pointer' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                                <div style={{ width: '100%', height: '220px', backgroundColor: 'var(--border-color)', position: 'relative' }}>
                                    {pet.image_url ? (
                                        <img src={pet.image_url} alt={pet.pet_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>Sin Foto</div>
                                    )}
                                    <div style={{ position: 'absolute', top: '1rem', right: '1rem' }}>
                                        <span style={{
                                            padding: '0.25rem 0.75rem', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', boxShadow: 'var(--shadow-sm)',
                                            backgroundColor: pet.status === 'buscando' ? '#FEE2E2' : pet.status === 'en_transito' ? '#FEF3C7' : '#DCFCE7',
                                            color: pet.status === 'buscando' ? '#DC2626' : pet.status === 'en_transito' ? '#D97706' : '#16A34A'
                                        }}>
                                            {pet.status === 'buscando' ? 'Adopción' : pet.status === 'en_transito' ? 'Tránsito' : 'Adoptado'}
                                        </span>
                                    </div>
                                </div>
                                <div style={{ padding: '1.5rem' }}>
                                    <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>{pet.pet_name}</h2>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
                                        {pet.description.length > 100 ? pet.description.substring(0, 100) + '...' : pet.description}
                                    </p>

                                    {pet.requirements && (
                                        <div style={{ marginBottom: '1.5rem', padding: '0.75rem', backgroundColor: 'var(--surface-hover)', borderRadius: 'var(--radius-md)', fontSize: '0.75rem', color: 'var(--text-main)', display: 'flex', gap: '0.5rem' }}>
                                            <CheckCircle size={16} color="var(--primary-color)" style={{ flexShrink: 0 }} />
                                            <span><strong>Requisitos:</strong> {pet.requirements}</span>
                                        </div>
                                    )}

                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button className="btn-primary" style={{ flex: 1, padding: '0.75rem', fontSize: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                            <Heart size={16} /> Me postulo
                                        </button>
                                        {pet.contact_phone && (
                                            <button className="btn-secondary" style={{ padding: '0.75rem', color: 'var(--text-muted)' }} title={pet.contact_phone}>
                                                <Phone size={16} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
