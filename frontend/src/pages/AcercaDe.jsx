import { Store } from 'lucide-react';

export function AcercaDe() {
  return (
    <div>
      <div style={{ marginBottom: '18px' }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>
          Acerca de
        </h1>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          Información institucional y técnica del sistema
        </p>
      </div>

      <div className="desktop-two-col">
        {/* Bloque Sistema ControlAR */}
        <div className="card" style={{ textAlign: 'center', padding: '24px 18px', marginBottom: 0 }}>
          {/* Logo Oficial ControlAR */}
          <div style={{
            width: '108px',
            height: '108px',
            margin: '0 auto 16px auto',
            borderRadius: '22px',
            overflow: 'hidden',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#090e17'
          }}>
            <img
              src="/ControlARimagen.png"
              alt="Logo oficial ControlAR"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block'
              }}
            />
          </div>

          <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.5px' }}>
            ControlAR
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600, marginTop: '2px' }}>
            Sistema de gestión para negocios pequeños
          </p>

          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'var(--bg-main)',
            padding: '6px 14px',
            borderRadius: 'var(--radius-full)',
            border: '1px solid var(--border-color)',
            fontSize: '0.8rem',
            fontWeight: 700,
            marginTop: '14px'
          }}>
            Versión 1.0.1 (Responsive Update)
          </div>

          <div style={{ marginTop: '20px', borderTop: '1px solid var(--border-color)', paddingTop: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', textAlign: 'left', fontSize: '0.85rem' }}>
            <div>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700 }}>
                Desarrollado por
              </span>
              <div style={{ fontWeight: 700, marginTop: '2px', color: '#fff' }}>Lucas Peralta</div>
            </div>

            <div>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700 }}>
                Año
              </span>
              <div style={{ fontWeight: 700, marginTop: '2px', color: '#fff' }}>2026</div>
            </div>
          </div>
        </div>

        {/* Bloque Negocio Victoria Productos Artesanales */}
        <div className="card" style={{ textAlign: 'center', padding: '24px 18px', marginBottom: 0 }}>
          {/* Placeholder Logo Negocio */}
          <div className="placeholder-box" style={{ width: '100px', height: '100px', margin: '0 auto 16px auto', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <Store size={36} color="var(--warning)" />
            <span style={{ fontSize: '0.65rem', marginTop: '4px' }}>[Logo Negocio]</span>
          </div>

          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff' }}>
            Victoria Productos Artesanales
          </h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '4px', maxWidth: '320px', margin: '4px auto 0 auto' }}>
            Despensa y negocio familiar enfocado en productos artesanales de calidad.
          </p>

          <div style={{ marginTop: '16px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Los logotipos y recursos gráficos oficiales se incorporarán una vez definidos por el negocio.
          </div>
        </div>
      </div>
    </div>
  );
}

export default AcercaDe;
