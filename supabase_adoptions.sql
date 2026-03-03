-- Tabla para registrar animales en adopción o estado de tránsito
CREATE TABLE public.adoptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    pet_name TEXT NOT NULL,
    description TEXT NOT NULL,
    requirements TEXT,
    status TEXT CHECK (status IN ('buscando', 'en_transito', 'adoptado')) DEFAULT 'buscando',
    contact_phone TEXT,
    image_url TEXT
);

ALTER TABLE public.adoptions ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Adopciones son publicas" ON public.adoptions FOR SELECT USING (true);
CREATE POLICY "Super admin controla adopciones" ON public.adoptions FOR ALL USING (public.is_super_admin(auth.uid()));
CREATE POLICY "Publicar adopcion con inicio de sesion" ON public.adoptions FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Actualizar tu propia publicacion" ON public.adoptions FOR UPDATE USING (auth.uid() = owner_id);

-- Insertar un dato Mock (Ficticio) para probar visualmente la pantalla
INSERT INTO public.adoptions (pet_name, description, requirements, status, contact_phone, image_url)
VALUES 
('Milo', 'Perrito rescatado muy juguetón y cariñoso. Tamaño mediano, desparasitado.', 'Patio cerrado, familia sin niños muy pequeños. Compromiso de castración.', 'buscando', '011-5555-4444', 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=800'),
('Luna', 'Cachorra de 3 meses rescatada de la lluvia. Es super tranquila y aprende rápido.', 'Amor y paciencia.', 'en_transito', '011-4433-2211', 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&q=80&w=800');
