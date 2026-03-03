'use client';

import { useState, useEffect } from 'react';
import { AlertCircle, Clock, MapPin, ChevronRight, Filter } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function FeedPanel() {
    const [reports, setReports] = useState<any[]>([]);
    const [directories, setDirectories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'alertas' | 'directorio'>('alertas');

    useEffect(() => {
        const fetchReports = async () => {
            const { data, error } = await supabase
                .from('reports')
                .select('*')
                .eq('status', 'activo')
                .order('created_at', { ascending: false });

            if (!error && data) {
                setReports(data);
            }
            setLoading(false);
        };

        const fetchDirectories = async () => {
            const { data, error } = await supabase
                .from('directories')
                .select('*')
                .order('created_at', { ascending: false });

            if (!error && data) {
                setDirectories(data);
            }
        };

        fetchReports();
        fetchDirectories();

        // Realtime Subscription
        const channel = supabase
            .channel('reports-changes')
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

    return (
        <div className="glass-panel" style={{
            width: '350px',
            height: 'calc(100vh - 90px)',
            position: 'absolute',
            right: '1rem',
            top: '1rem',
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            zIndex: 100
        }}>
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--surface-hover)' }}>
                <button
                    onClick={() => setActiveTab('alertas')}
                    style={{ flex: 1, padding: '1rem', fontWeight: 600, fontSize: '0.875rem', borderBottom: activeTab === 'alertas' ? '2px solid var(--primary-color)' : '2px solid transparent', color: activeTab === 'alertas' ? 'var(--primary-color)' : 'var(--text-muted)', transition: 'var(--transition)' }}
                >
                    Alertas Activas
                </button>
                <button
                    onClick={() => setActiveTab('directorio')}
                    style={{ flex: 1, padding: '1rem', fontWeight: 600, fontSize: '0.875rem', borderBottom: activeTab === 'directorio' ? '2px solid var(--primary-color)' : '2px solid transparent', color: activeTab === 'directorio' ? 'var(--primary-color)' : 'var(--text-muted)', transition: 'var(--transition)' }}
                >
                    Directorio
                </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {loading ? (
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Cargando datos...</div>
                ) : activeTab === 'alertas' ? (
                    reports.length === 0 ? (
                        <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No hay alertas activas en tu zona.</div>
                    ) : reports.map((report) => (
                        <div key={report.id} style={{
                            backgroundColor: 'var(--surface)', padding: '1rem', borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--border-color)', display: 'flex', gap: '1rem', cursor: 'pointer',
                            transition: 'var(--transition)'
                        }}
                            className="report-card"
                            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}
                        >
                            <div style={{ width: '80px', height: '80px', borderRadius: 'var(--radius-md)', overflow: 'hidden', flexShrink: 0, backgroundColor: 'var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {report.image_url ? (
                                    <img src={report.image_url} alt={report.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <AlertCircle size={32} color="var(--text-muted)" />
                                )}
                            </div>

                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                <h3 style={{ fontSize: '0.875rem', fontWeight: 600, lineHeight: 1.2, marginBottom: '0.25rem' }}>
                                    {report.title}
                                </h3>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.125rem' }}>
                                    <MapPin size={12} /> {report.location || 'Reporte en mapa'}
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                        <Clock size={12} /> {new Date(report.created_at).toLocaleDateString()}
                                    </div>

                                    <span style={{
                                        fontSize: '0.625rem', fontWeight: 700, textTransform: 'uppercase', padding: '0.125rem 0.5rem', borderRadius: 'var(--radius-full)',
                                        backgroundColor: report.urgency === 'alta' ? '#FEE2E2' : report.urgency === 'media' ? '#FEF3C7' : '#E0F2FE',
                                        color: report.urgency === 'alta' ? '#DC2626' : report.urgency === 'media' ? '#D97706' : '#0284C7'
                                    }}>
                                        {report.urgency}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    directories.length === 0 ? (
                        <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>El directorio está vacío.</div>
                    ) : directories.map((dir) => (
                        <div key={dir.id} style={{
                            backgroundColor: 'var(--surface)', padding: '1rem', borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.5rem', cursor: 'pointer',
                            transition: 'var(--transition)'
                        }}
                            className="report-card"
                            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <h3 style={{ fontSize: '0.875rem', fontWeight: 600, lineHeight: 1.2, margin: 0 }}>{dir.name}</h3>
                                <span style={{
                                    fontSize: '0.625rem', fontWeight: 700, textTransform: 'uppercase', padding: '0.125rem 0.5rem', borderRadius: 'var(--radius-full)',
                                    backgroundColor: dir.type === 'veterinaria_24h' ? '#DCFCE7' : dir.type === 'guarderia' ? '#FFEDD5' : '#F3E8FF',
                                    color: dir.type === 'veterinaria_24h' ? '#16A34A' : dir.type === 'guarderia' ? '#EA580C' : '#9333EA'
                                }}>
                                    {dir.type === 'veterinaria_24h' ? 'Veterinaria 24h' : dir.type === 'guarderia' ? 'Guardería / Cuidador' : 'Refugio / Tránsito'}
                                </span>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                <MapPin size={12} /> {dir.address || 'Ubicación en el mapa'}
                            </div>

                            {dir.contact_phone && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                    📞 {dir.contact_phone}
                                </div>
                            )}

                            {dir.verified && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: '#0284C7', fontWeight: 600 }}>
                                    ✓ Perfil Verificado Oficialmente
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            <div style={{ padding: '1rem', borderTop: '1px solid var(--border-color)', textAlign: 'center' }}>
                <button style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--primary-color)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                    Ver todas las alertas <ChevronRight size={16} />
                </button>
            </div>
        </div>
    );
}
