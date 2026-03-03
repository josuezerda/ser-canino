-- Esquema para Directorio de Servicios (Veterinarias, Refugios)

CREATE TABLE public.directories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    name TEXT NOT NULL,
    type TEXT CHECK (type IN ('refugio', 'veterinaria_24h', 'centro_transito')) NOT NULL,
    contact_phone TEXT,
    address TEXT,
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    verified BOOLEAN DEFAULT false
);

ALTER TABLE public.directories ENABLE ROW LEVEL SECURITY;

-- Política: Cualquiera puede ver el directorio
CREATE POLICY "Directorio visible públicamente" 
ON public.directories FOR SELECT 
USING (true);

-- Insertar algunos datos de prueba (Mocks en Buenos Aires) para que ya veas algo en el mapa
INSERT INTO public.directories (name, type, contact_phone, address, lat, lng, verified) VALUES
('Veterinaria Central 24hs', 'veterinaria_24h', '011-4555-1234', 'Av. Rivadavia 4500, CABA', -34.6158, -58.4292, true),
('Refugio Colitas Felices', 'refugio', '011-15-5555-6789', 'Caballito, CABA', -34.6200, -58.4400, true),
('Centro de Tránsito Patitas', 'centro_transito', '011-4888-0000', 'Palermo, CABA', -34.5888, -58.4305, false);
