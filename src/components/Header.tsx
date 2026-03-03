'use client';

import { useState, useEffect } from 'react';
import { AlertCircle, Heart, LogOut, User } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import AuthModal from './AuthModal';
import ReportModal from './ReportModal';
import Image from 'next/image';

export default function Header() {
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [userLocation, setUserLocation] = useState<{ lat: number, lng: number } | null>(null);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        // Check active session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user || null);
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user || null);
        });

        return () => subscription.unsubscribe();
    }, []);

    const handleEmitirAlerta = () => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
                    setIsReportModalOpen(true);
                },
                () => setIsReportModalOpen(true)
            );
        } else {
            setIsReportModalOpen(true);
        }
    };

    const handleSignOut = async () => {
        await supabase.auth.signOut();
    };

    return (
        <>
            <header className="glass-panel" style={{
                position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
                padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
                <div
                    onClick={() => window.location.href = '/'}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 800, fontSize: '1.25rem', color: 'var(--primary-color)', letterSpacing: '-0.02em', cursor: 'pointer', transition: 'var(--transition)' }}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                >
                    <Image src="/logo.png" alt="Ser Canino Logo" width={32} height={32} style={{ borderRadius: '6px' }} />
                    <span>Ser Canino</span>
                </div>

                <nav style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <button onClick={() => window.location.href = '/'} className="btn-secondary" style={{ fontSize: '0.875rem', padding: '0.5rem 1rem', border: 'none', background: 'transparent' }}>
                        Mapa
                    </button>
                    <button onClick={() => window.location.href = '/adopciones'} className="btn-secondary" style={{ fontSize: '0.875rem', padding: '0.5rem 1rem', border: 'none', background: 'transparent' }}>
                        Adopciones
                    </button>
                    <button onClick={() => window.location.href = '/'} className="btn-secondary" style={{ fontSize: '0.875rem', padding: '0.5rem 1rem', border: 'none', background: 'transparent' }}>
                        Guardería
                    </button>

                    <button onClick={handleEmitirAlerta} className="btn-primary" style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}>
                        <AlertCircle size={16} /> Emitir Alerta
                    </button>

                    <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--border-color)', margin: '0 0.5rem' }} />

                    {user ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <button
                                onClick={() => window.location.href = '/perfil'}
                                style={{ fontSize: '0.875rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-main)', padding: '0.5rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--surface-hover)' }}
                            >
                                <User size={16} color="var(--primary-color)" /> Mi Credencial
                            </button>
                            <button onClick={handleSignOut} style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.875rem' }}>
                                <LogOut size={16} /> Salir
                            </button>
                        </div>
                    ) : (
                        <button onClick={() => setIsAuthModalOpen(true)} style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-main)' }}>
                            Iniciar Sesión
                        </button>
                    )}
                </nav>
            </header>

            <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
            <ReportModal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} userLocation={userLocation} />
        </>
    );
}
