-- 1. Actualizar la restricción (CHECK constraint) para permitir el tipo 'guarderia'.
-- En la creación inicial los tipos eran: 'refugio', 'veterinaria_24h', 'centro_transito'
ALTER TABLE public.directories DROP CONSTRAINT IF EXISTS directories_type_check;
ALTER TABLE public.directories ADD CONSTRAINT directories_type_check CHECK (type IN ('veterinaria_24h', 'refugio', 'centro_transito', 'guarderia'));

-- 2. Insertar mocks de guarderías en la tabla `directories`
INSERT INTO public.directories (name, type, address, contact_phone, lat, lng, verified)
VALUES 
('Hotel Canino "Patitas Felices"', 'guarderia', 'Av. Triunvirato 4500, Villa Urquiza', '011-5555-1234', -34.5786, -58.4828, true),
('Cuidadora Sofía (Particular)', 'guarderia', 'Caballito Norte, CABA', '011-3344-9988', -34.6133, -58.4411, false),
('Resort de Perros "El Retiro"', 'guarderia', 'Zona Norte, Pilar', '011-9988-7766', -34.5500, -58.4000, true);
