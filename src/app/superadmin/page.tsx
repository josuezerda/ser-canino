'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ShieldAlert, Trash2, CheckCircle, XCircle, MapPin, Building, Activity, ShieldCheck, Users, Edit } from 'lucide-react';
import Header from '@/components/Header';
import { useRouter } from 'next/navigation';

export default function SuperAdminPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);

    const [reports, setReports] = useState<any[]>([]);
    const [directories, setDirectories] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'reports' | 'directories' | 'users'>('reports');

    // Edit logic for directories
    const [editingDir, setEditingDir] = useState<any>(null);

    useEffect(() => {
        const checkAdminAccess = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                router.push('/');
                return;
            }

            // Check if user is the designated super admin
            const { data: profile, error } = await supabase
                .from('user_profiles')
                .select('system_role')
                .eq('id', session.user.id)
                .single();

            if (profile?.system_role === 'superadmin' || session.user.email === 'admin@sercanino.com.ar') {
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
        try {
            const [reportsRes, dirsRes, usersRes] = await Promise.all([
                supabase.from('reports').select('*').order('created_at', { ascending: false }),
                supabase.from('directories').select('*').order('created_at', { ascending: false }),
                supabase.from('user_profiles').select('*').order('created_at', { ascending: false })
            ]);

            if (reportsRes.data) setReports(reportsRes.data);
            if (dirsRes.data) setDirectories(dirsRes.data);
            if (usersRes.data) setUsers(usersRes.data);
        } catch (error) {
            console.error(error);
        }
    };

    // --- REPORTS ---
    const deleteReport = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar este reporte de forma permanente?')) return;
        const { error } = await supabase.from('reports').delete().eq('id', id);
        if (!error) {
            setReports(reports.filter(r => r.id !== id));
        } else {
            alert('Error eliminando reporte: ' + error.message);
        }
    };

    // --- DIRECTORIES ---
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

    const handleSaveEditDir = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingDir) return;
        const { id, name, address, contact_phone, type } = editingDir;
        const { error } = await supabase
            .from('directories')
            .update({ name, address, contact_phone, type })
            .eq('id', id);

        if (!error) {
            setDirectories(directories.map(d => d.id === id ? { ...d, name, address, contact_phone, type } : d));
            setEditingDir(null);
            alert('Directorio actualizado.');
        } else {
            alert('Error actualizando directorio: ' + error.message);
        }
    };

    // --- USERS ---
    const updateUserRole = async (userId: string, currentRole: string) => {
        const roles = ['tutor', 'veterinaria', 'moderador', 'superadmin', 'colaborador'];
        const currentIdx = roles.indexOf(currentRole);
        const nextRole = roles[(currentIdx + 1) % roles.length];

        const { error } = await supabase
            .from('user_profiles')
            .update({ system_role: nextRole })
            .eq('id', userId);

        if (!error) {
            setUsers(users.map(u => u.id === userId ? { ...u, system_role: nextRole } : u));
        } else {
            alert('Error al cambiar rol. Asegúrate que el ENUM soporta este rol: ' + error.message);
        }
    };

    if (isLoading) {
        return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Cargando Panel Seguro...</div>;
    }

    if (!isAdmin) {
        return null;
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

                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '2rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                    <button
                        onClick={() => setActiveTab('reports')}
                        key="reports"
                        style={{
                            padding: '0.75rem 1.5rem', borderRadius: 'var(--radius-full)', fontWeight: 600,
                            backgroundColor: activeTab === 'reports' ? 'var(--primary-color)' : 'var(--surface)',
                            color: activeTab === 'reports' ? '#FFF' : 'var(--text-main)',
                            border: `1px solid ${activeTab === 'reports' ? 'var(--primary-color)' : 'var(--border-color)'}`,
                            display: 'flex', alignItems: 'center', gap: '0.5rem'
                        }}
                    >
                        <Activity size={18} /> Alertas ({reports.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('directories')}
                        key="directories"
                        style={{
                            padding: '0.75rem 1.5rem', borderRadius: 'var(--radius-full)', fontWeight: 600,
                            backgroundColor: activeTab === 'directories' ? 'var(--primary-color)' : 'var(--surface)',
                            color: activeTab === 'directories' ? '#FFF' : 'var(--text-main)',
                            border: `1px solid ${activeTab === 'directories' ? 'var(--primary-color)' : 'var(--border-color)'}`,
                            display: 'flex', alignItems: 'center', gap: '0.5rem'
                        }}
                    >
                        <Building size={18} /> Directorio ({directories.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('users')}
                        key="users"
                        style={{
                            padding: '0.75rem 1.5rem', borderRadius: 'var(--radius-full)', fontWeight: 600,
                            backgroundColor: activeTab === 'users' ? 'var(--primary-color)' : 'var(--surface)',
                            color: activeTab === 'users' ? '#FFF' : 'var(--text-main)',
                            border: `1px solid ${activeTab === 'users' ? 'var(--primary-color)' : 'var(--border-color)'}`,
                            display: 'flex', alignItems: 'center', gap: '0.5rem'
                        }}
                    >
                        <Users size={18} /> Roles y Usuarios ({users.length})
                    </button>
                </div>

                <div className="glass-panel" style={{ padding: '2rem', borderRadius: 'var(--radius-lg)' }}>

                    {/* ===== TAB: REPORTS ===== */}
                    {activeTab === 'reports' && (
                        <div>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>Alertas Activas e Históricas</h2>
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                    {/* (El cuerpo sigue igual que el anterior, sin grandes cambios) */}
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
                                                    <button onClick={() => deleteReport(report.id)} style={{ padding: '0.5rem', color: '#DC2626', backgroundColor: '#FEE2E2', borderRadius: '6px', transition: 'var(--transition)' }}>
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {reports.length === 0 && (
                                            <tr><td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No hay reportes.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* ===== TAB: DIRECTORIES ===== */}
                    {activeTab === 'directories' && (
                        <div>
                            {editingDir ? (
                                <div style={{ backgroundColor: 'var(--surface-hover)', padding: '1.5rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
                                    <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1rem' }}>Editar Entidad</h3>
                                    <form onSubmit={handleSaveEditDir} style={{ display: 'grid', gap: '1rem', gridTemplateColumns: '1fr 1fr' }}>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.25rem' }}>Nombre</label>
                                            <input type="text" className="input-field" value={editingDir.name} onChange={e => setEditingDir({ ...editingDir, name: e.target.value })} required />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.25rem' }}>Teléfono</label>
                                            <input type="text" className="input-field" value={editingDir.contact_phone} onChange={e => setEditingDir({ ...editingDir, contact_phone: e.target.value })} />
                                        </div>
                                        <div style={{ gridColumn: 'span 2' }}>
                                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.25rem' }}>Dirección</label>
                                            <input type="text" className="input-field" value={editingDir.address} onChange={e => setEditingDir({ ...editingDir, address: e.target.value })} />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.25rem' }}>Tipo</label>
                                            <select className="input-field" value={editingDir.type} onChange={e => setEditingDir({ ...editingDir, type: e.target.value })}>
                                                <option value="veterinaria_24h">Veterinaria 24h</option>
                                                <option value="refugio">Refugio</option>
                                                <option value="centro_transito">Centro de Tránsito</option>
                                                <option value="guarderia">Guardería</option>
                                            </select>
                                        </div>
                                        <div style={{ gridColumn: 'span 2', display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                                            <button type="submit" className="btn-primary">Guardar Cambios</button>
                                            <button type="button" className="btn-secondary" onClick={() => setEditingDir(null)}>Cancelar</button>
                                        </div>
                                    </form>
                                </div>
                            ) : null}

                            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>Directorio Integral de Servicios</h2>
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
                                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{dir.address} • {dir.contact_phone}</span>
                                                </td>
                                                <td style={{ padding: '1rem 0.5rem', fontSize: '0.875rem', textTransform: 'capitalize' }}>
                                                    {dir.type.replace('_24h', ' 24h').replace('_', ' ')}
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
                                                    >
                                                        {dir.verified ? <CheckCircle size={14} /> : <XCircle size={14} />}
                                                        {dir.verified ? 'Verificado' : 'Sin Verificar'}
                                                    </button>
                                                </td>
                                                <td style={{ padding: '1rem 0.5rem', textAlign: 'right', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                                    <button onClick={() => setEditingDir(dir)} style={{ padding: '0.5rem', color: '#0369A1', backgroundColor: '#E0F2FE', borderRadius: '6px' }}>
                                                        <Edit size={16} />
                                                    </button>
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

                    {/* ===== TAB: USERS ===== */}
                    {activeTab === 'users' && (
                        <div>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>Gestión de Identidades (Tutor / Profesional)</h2>
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                                            <th style={{ padding: '1rem 0.5rem', color: 'var(--text-muted)' }}>Nombre y Contacto</th>
                                            <th style={{ padding: '1rem 0.5rem', color: 'var(--text-muted)' }}>Fecha Registro</th>
                                            <th style={{ padding: '1rem 0.5rem', color: 'var(--text-muted)' }}>Rol de Sistema (DB)</th>
                                            <th style={{ padding: '1rem 0.5rem', color: 'var(--text-muted)', textAlign: 'right' }}>Rotar Rol</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.map(u => (
                                            <tr key={u.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                                <td style={{ padding: '1rem 0.5rem' }}>
                                                    <strong style={{ display: 'block', fontSize: '0.875rem' }}>{u.full_name || 'Sin Nombre'}</strong>
                                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{u.phone_number || 'Sin teléfono'} • {u.id.substring(0, 8)}...</span>
                                                </td>
                                                <td style={{ padding: '1rem 0.5rem', fontSize: '0.875rem' }}>
                                                    {new Date(u.created_at).toLocaleDateString()}
                                                </td>
                                                <td style={{ padding: '1rem 0.5rem' }}>
                                                    <span style={{
                                                        padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600, textTransform: 'capitalize',
                                                        backgroundColor: u.system_role === 'superadmin' ? '#FEF2F2' : u.system_role === 'veterinaria' ? '#E0F2FE' : '#F3F4F6',
                                                        color: u.system_role === 'superadmin' ? '#DC2626' : u.system_role === 'veterinaria' ? '#0369A1' : '#4B5563',
                                                        border: `1px solid ${u.system_role === 'superadmin' ? '#FCA5A5' : u.system_role === 'veterinaria' ? '#7DD3FC' : '#D1D5DB'}`
                                                    }}>
                                                        {u.system_role}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '1rem 0.5rem', textAlign: 'right' }}>
                                                    {u.system_role !== 'superadmin' ? (
                                                        <button onClick={() => updateUserRole(u.id, u.system_role)} style={{
                                                            padding: '0.25rem 0.75rem', fontSize: '0.75rem', fontWeight: 600,
                                                            border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', backgroundColor: 'transparent'
                                                        }}>
                                                            Cambiar Rol
                                                        </button>
                                                    ) : (
                                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Protegido</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                        {users.length === 0 && (
                                            <tr><td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No hay usuarios.</td></tr>
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
