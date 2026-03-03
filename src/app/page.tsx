'use client';

import { AlertCircle, Heart, ArrowDown, Shield, Users, Map as MapIcon } from 'lucide-react';
import dynamic from 'next/dynamic';
import Header from '@/components/Header';
import FeedPanel from '@/components/FeedPanel';

const InteractiveMap = dynamic(() => import('@/components/InteractiveMap'), {
  ssr: false,
  loading: () => (
    <div style={{ width: '100%', height: '100%', backgroundColor: '#E4E4E7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#71717A' }}>
      <p>Cargando mapa interactivo...</p>
    </div>
  )
});

export default function Home() {
  const scrollToMap = () => {
    document.getElementById('map-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', position: 'relative', overflowX: 'hidden' }}>
      <Header />

      {/* Hero Landing Page */}
      <section style={{
        minHeight: '100vh',
        paddingTop: '70px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        background: 'linear-gradient(135deg, rgba(14,165,233,0.1) 0%, rgba(139,92,246,0.1) 50%, rgba(234,179,8,0.1) 100%)',
      }}>
        <div style={{
          position: 'absolute', top: '10%', left: '5%', width: '300px', height: '300px', borderRadius: '50%',
          background: 'var(--primary-color)', filter: 'blur(100px)', opacity: 0.15, zIndex: -1
        }} />
        <div style={{
          position: 'absolute', bottom: '10%', right: '5%', width: '300px', height: '300px', borderRadius: '50%',
          background: 'var(--accent-yellow)', filter: 'blur(100px)', opacity: 0.15, zIndex: -1
        }} />

        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem', textAlign: 'center', zIndex: 10 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'rgba(139, 92, 246, 0.1)', color: 'var(--secondary-color)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-full)', fontWeight: 600, fontSize: '0.875rem', marginBottom: '2rem' }}>
            <Heart size={16} fill="currentColor" /> La primera red ciudadana de protección animal
          </div>

          <h1 style={{ fontSize: 'clamp(3rem, 8vw, 5rem)', fontWeight: 900, lineHeight: 1.1, marginBottom: '1.5rem', letterSpacing: '-0.02em' }}>
            Uniendo corazones <br /> para <span style={{ background: 'linear-gradient(to right, var(--primary-color), var(--secondary-color))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>salvar vidas</span>
          </h1>

          <p style={{ fontSize: '1.25rem', color: 'var(--text-muted)', maxWidth: '800px', margin: '0 auto 3rem auto', lineHeight: 1.6 }}>
            <b>Ser Canino</b> es el ecosistema definitivo que conecta a personas compasivas, refugios y profesionales. Si ves a un animal en peligro, repórtalo en segundos. Juntos construimos un mapa de empatía y acción rápida.
          </p>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '4rem' }}>
            <button onClick={scrollToMap} className="btn-primary" style={{ fontSize: '1.125rem', padding: '1rem 2rem', boxShadow: 'var(--shadow-glow)' }}>
              <MapIcon size={20} /> Entrar al Mapa Interactivo
            </button>
            <button className="btn-secondary" style={{ fontSize: '1.125rem', padding: '1rem 2rem', borderColor: 'var(--secondary-color)', color: 'var(--secondary-color)' }}>
              <Users size={20} /> Conocer la Comunidad
            </button>
          </div>

          {/* Feature Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginTop: '2rem', textAlign: 'left' }}>
            <div className="glass-panel" style={{ padding: '2rem', borderRadius: 'var(--radius-lg)' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: 'rgba(14, 165, 233, 0.1)', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                <MapIcon size={24} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>Geolocalización Inmediata</h3>
              <p style={{ color: 'var(--text-muted)' }}>Ubica exactamente dónde está el animal que necesita ayuda. Nuestro mapa en tiempo real sincroniza alertas con toda la comunidad cercana al instante.</p>
            </div>
            <div className="glass-panel" style={{ padding: '2rem', borderRadius: 'var(--radius-lg)' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--accent-red)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                <AlertCircle size={24} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>Sistema de Urgencias</h3>
              <p style={{ color: 'var(--text-muted)' }}>Clasifica las alertas como bajas, medias o críticas. Las alertas críticas se notifican inmediatamente a veterinarias y rescatistas registrados.</p>
            </div>
            <div className="glass-panel" style={{ padding: '2rem', borderRadius: 'var(--radius-lg)' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: 'rgba(234, 179, 8, 0.1)', color: 'var(--accent-yellow)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                <Shield size={24} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>Adopción Segura</h3>
              <p style={{ color: 'var(--text-muted)' }}>Conecta animales rescatados con hogares de tránsito y familias definitivas a través de nuestro proceso de validación seguro.</p>
            </div>
          </div>
        </div>

        <button onClick={scrollToMap} style={{ position: 'absolute', bottom: '2rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', animation: 'bounce 2s infinite' }}>
          <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Desliza para ver el mapa</span>
          <ArrowDown size={24} />
        </button>
      </section>

      {/* Main Map Content Area */}
      <section id="map-section" style={{ height: '100vh', display: 'flex', position: 'relative' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <InteractiveMap />
          <FeedPanel />
        </div>
      </section>

      <style jsx global>{`
        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-10px); }
          60% { transform: translateY(-5px); }
        }
      `}</style>
    </div>
  );
}
