-- Esquema inicial de Base de Datos para Ser Canino

-- 1. Habilitar la extensión de postgis no es estrictamente necesario para empezar si usamos lat/lng como floats, pero es recomendable para cálculos geográficos avanzados.
-- Por simplicidad del MVP, usaremos dos columnas float.

-- 2. Crear tabla de reportes
CREATE TABLE public.reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    urgency TEXT CHECK (urgency IN ('baja', 'media', 'alta')) NOT NULL DEFAULT 'media',
    status TEXT CHECK (status IN ('activo', 'resuelto')) NOT NULL DEFAULT 'activo',
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    image_url TEXT
);

-- 3. Configurar Seguridad a Nivel de Fila (RLS)
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Política: Cualquiera puede ver los reportes activos
CREATE POLICY "Reportes visibles públicamente" 
ON public.reports FOR SELECT 
USING (true);

-- Política: Solo usuarios autenticados pueden insertar reportes
CREATE POLICY "Usuarios pueden insertar sus reportes" 
ON public.reports FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Política: Solo el creador puede actualizar su reporte
CREATE POLICY "Usuarios pueden actualizar sus propios reportes" 
ON public.reports FOR UPDATE 
USING (auth.uid() = user_id);

-- 4. Crear bucket de Storage para las imágenes de los reportes
INSERT INTO storage.buckets (id, name, public) 
VALUES ('report-images', 'report-images', true)
ON CONFLICT (id) DO NOTHING;

-- Permitir acceso público a las imágenes
CREATE POLICY "Imágenes de reportes públicas"
ON storage.objects FOR SELECT
USING (bucket_id = 'report-images');

-- Permitir a usuarios autenticados subir imágenes
CREATE POLICY "Usuarios autenticados pueden subir imágenes"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'report-images' AND auth.role() = 'authenticated');
