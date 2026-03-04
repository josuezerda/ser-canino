'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ShieldAlert, Trash2, CheckCircle, XCircle, MapPin, Building, Activity, ShieldCheck } from 'lucide-react';
import Header from '@/components/Header';
import { useRouter } from 'next/navigation';

export default function SuperAdminPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);

    const [reports, setReports] = useState<any[]>([]);
    const [directories, setDirectories] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'reports' | 'directories'>('reports');

    useEffect(() => {
        const checkAdminAccess = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                router.push('/');
                return;
            }

            // Check if user is the designated super admin
            const { data: profile } = await supabase
                .from('animal_profiles')
                .select('is_super_admin')
                .eq('id', session.user.id)
                .single();

            if (profile?.is_super_admin || session.user.email === 'admin@sercanino.com.ar') {
                setIsAdmin(true);
                fetchData();
            } else {
                router.push('/perfil');
            }
            setIsLoading(false);
        };

        checkAdminAccess();
    }, [router]);

    const fetchData = async () => {
        const [reportsRes, dirsRes] = await Promise.all([
            supabase.from('reports').select('*').order('created_at', { ascending: false }),
            supabase.from('directories').select('*').order('created_at', { ascending: false })
        ]);

        if (reportsRes.data) setReports(reportsRes.data);
        if (dirsRes.data) setDirectories(dirsRes.data);
    };

    const deleteReport = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar este reporte de forma permanente?')) return;
        const { error } = await supabase.from('reports').delete().eq('id', id);
        if (!error) {
            setReports(reports.filter(r => r.id !== id));
        } else {
            alert('Error eliminando reporte: ' + error.message);
        }
    };

    const toggleDirectoryVerification = async (id: string, currentStatus: boolean) => {
        const { error } = await supabase
            .from('directories')
            .update({ verified: !currentStatus })
            .eq('id', id);

        if (!error) {
            setDirectories(directories.map(d => d.id === id ? { ...d, verified: !currentStatus } : d));
        } else {
            alert('Error actualizando directorio: ' + error.message);
        }
    };

    const deleteDirectory = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar este centro del mapa de forma permanente?')) return;
        const { error } = await supabase.from('directories').delete().eq('id', id);
        if (!error) {
            setDirectories(directories.filter(d => d.id !== id));
        } else {
            alert('Error eliminando directorio: ' + error.message);
        }
    };

    if (isLoading) {
        return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Cargando Panel Seguro...</div>;
    }

    if (!isAdmin) {
        return null; // El router redirect se encarga
    }

    return (
        <div style={{ minHeight: '100vh', backgroundColor: 'var(--background)' }}>
            <Header />

            <main style={{ paddingTop: '100px', maxWidth: '1200px', margin: '0 auto', padding: '100px 2rem 2rem 2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                    <div style={{ padding: '1rem', backgroundColor: '#FEE2E2', borderRadius: 'var(--radius-md)' }}>
                        <ShieldAlert size={32} color="#DC2626" />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: 0 }}>Centro de Comando</h1>
                        <p style={{ color: 'var(--text-muted)', margin: 0 }}>Panel exclusivo de Super Administrador</p>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                    <button
                        onClick={() => setActiveTab('reports')}
                        style={{
                            padding: '0.75rem 1.5rem',
                            borderRadius: 'var(--radius-full)',
                            fontWeight: 600,
                            backgroundColor: activeTab === 'reports' ? 'var(--primary-color)' : 'var(--surface)',
                            color: activeTab === 'reports' ? '#FFF' : 'var(--text-main)',
                            border: `1px solid ${activeTab === 'reports' ? 'var(--primary-color)' : 'var(--border-color)'}`,
                            display: 'flex', alignItems: 'center', gap: '0.5rem'
                        }}
                    >
                        <Activity size={18} /> Alertas de la Comunidad
                    </button>
                    <button
                        onClick={() => setActiveTab('directories')}
                        style={{
                            padding: '0.75rem 1.5rem',
                            borderRadius: 'var(--radius-full)',
                            fontWeight: 600,
                            backgroundColor: activeTab === 'directories' ? 'var(--primary-color)' : 'var(--surface)',
                            color: activeTab === 'directories' ? '#FFF' : 'var(--text-main)',
                            border: `1px solid ${activeTab === 'directories' ? 'var(--primary-color)' : 'var(--border-color)'}`,
                            display: 'flex', alignItems: 'center', gap: '0.5rem'
                        }}
                    >
                        <Building size={18} /> Directorio de Entidades
                    </button>
                </div>

                <div className="glass-panel" style={{ padding: '2rem', borderRadius: 'var(--radius-lg)' }}>
                    {activeTab === 'reports' && (
                        <div>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>Alertas Activas e Históricas ({reports.length})</h2>
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                                            <th style={{ padding: '1rem 0.5rem', color: 'var(--text-muted)' }}>Fecha</th>
                                            <th style={{ padding: '1rem 0.5rem', color: 'var(--text-muted)' }}>Urgencia</th>
                                            <th style={{ padding: '1rem 0.5rem', color: 'var(--text-muted)' }}>Descripción</th>
                                            <th style={{ padding: '1rem 0.5rem', color: 'var(--text-muted)' }}>Ubicación</th>
                                            <th style={{ padding: '1rem 0.5rem', color: 'var(--text-muted)', textAlign: 'right' }}>Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {reports.map(report => (
                                            <tr key={report.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                                <td style={{ padding: '1rem 0.5rem', fontSize: '0.875rem' }}>
                                                    {new Date(report.created_at).toLocaleDateString()}
                                                </td>
                                                <td style={{ padding: '1rem 0.5rem' }}>
                                                    <span style={{
                                                        padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase',
                                                        backgroundColor: report.urgency === 'alta' ? '#FEE2E2' : report.urgency === 'media' ? '#FEF9C3' : '#E0F2FE',
                                                        color: report.urgency === 'alta' ? '#DC2626' : report.urgency === 'media' ? '#A16207' : '#0369A1'
                                                    }}>
                                                        {report.urgency}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '1rem 0.5rem', maxWidth: '300px' }}>
                                                    <p style={{ margin: 0, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', fontSize: '0.875rem' }}>
                                                        {report.description}
                                                    </p>
                                                </td>
                                                <td style={{ padding: '1rem 0.5rem', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                    <MapPin size={14} color="var(--text-muted)" /> {report.lat.toFixed(2)}, {report.lng.toFixed(2)}
                                                </td>
                                                <td style={{ padding: '1rem 0.5rem', textAlign: 'right' }}>
                                                    <button onClick={() => deleteReport(report.id)} style={{ padding: '0.5rem', color: '#DC2626', backgroundColor: '#FEE2E2', borderRadius: '6px', transition: 'var(--transition)' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FECACA'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FEE2E2'}>
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {reports.length === 0 && (
                                            <tr><td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No hay reportes en la base de datos.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'directories' && (
                        <div>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>Gestión de Entidades ({directories.length})</h2>
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                                            <th style={{ padding: '1rem 0.5rem', color: 'var(--text-muted)' }}>Nombre y Dirección</th>
                                            <th style={{ padding: '1rem 0.5rem', color: 'var(--text-muted)' }}>Tipo</th>
                                            <th style={{ padding: '1rem 0.5rem', color: 'var(--text-muted)' }}>Estado Oficial</th>
                                            <th style={{ padding: '1rem 0.5rem', color: 'var(--text-muted)', textAlign: 'right' }}>Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {directories.map(dir => (
                                            <tr key={dir.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                                <td style={{ padding: '1rem 0.5rem' }}>
                                                    <strong style={{ display: 'block', fontSize: '0.875rem' }}>{dir.name}</strong>
                                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{dir.address}</span>
                                                </td>
                                                <td style={{ padding: '1rem 0.5rem', fontSize: '0.875rem', textTransform: 'capitalize' }}>
                                                    {dir.type.replace('_24h', '')}
                                                </td>
                                                <td style={{ padding: '1rem 0.5rem' }}>
                                                    <button
                                                        onClick={() => toggleDirectoryVerification(dir.id, dir.verified)}
                                                        style={{
                                                            display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', fontWeight: 600,
                                                            padding: '0.25rem 0.5rem', borderRadius: '999px',
                                                            backgroundColor: dir.verified ? '#DCFCE7' : '#F3F4F6',
                                                            color: dir.verified ? '#166534' : '#4B5563',
                                                            border: 'none', cursor: 'pointer'
                                                        }}
                                                        title="Clic para cambiar el estado de verificación"
                                                    >
                                                        {dir.verified ? <CheckCircle size={14} /> : <XCircle size={14} />}
                                                        {dir.verified ? 'Verificado' : 'Sin Verificar'}
                                                    </button>
                                                </td>
                                                <td style={{ padding: '1rem 0.5rem', textAlign: 'right' }}>
                                                    <button onClick={() => deleteDirectory(dir.id)} style={{ padding: '0.5rem', color: '#DC2626', backgroundColor: '#FEE2E2', borderRadius: '6px' }}>
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {directories.length === 0 && (
                                            <tr><td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No hay entidades en el directorio.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
