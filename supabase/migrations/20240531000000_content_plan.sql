-- Enums for content planning
DO $$ BEGIN
    CREATE TYPE public.content_format AS ENUM ('blog', 'ebook', 'webinar', 'video', 'post_social', 'email', 'outros');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.content_journey_stage AS ENUM ('aprendizado', 'reconhecimento', 'consideracao', 'decisao');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.content_publication_status AS ENUM ('ideia', 'producao', 'revisao', 'publicado', 'arquivado');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 1. Personas
CREATE TABLE IF NOT EXISTS public.content_personas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    nome TEXT NOT NULL,
    descricao TEXT,
    dores TEXT,
    objetivos TEXT,
    canais TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.content_personas TO authenticated;
GRANT ALL ON public.content_personas TO service_role;

ALTER TABLE public.content_personas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view personas for products they can access"
ON public.content_personas FOR SELECT
TO authenticated
USING (EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_id));

CREATE POLICY "Admins and product leads can manage personas"
ON public.content_personas FOR ALL
TO authenticated
USING (EXISTS (
    SELECT 1 FROM public.profiles pr 
    WHERE pr.id = auth.uid() 
    AND (pr.role = 'executive' OR pr.role = 'product')
));

-- 2. Journey Stages
CREATE TABLE IF NOT EXISTS public.content_journey_stages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    persona_id UUID REFERENCES public.content_personas(id) ON DELETE CASCADE NOT NULL,
    estagio public.content_journey_stage NOT NULL,
    necessidades TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(persona_id, estagio)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.content_journey_stages TO authenticated;
GRANT ALL ON public.content_journey_stages TO service_role;

ALTER TABLE public.content_journey_stages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view journey stages for products they can access"
ON public.content_journey_stages FOR SELECT
TO authenticated
USING (EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_id));

CREATE POLICY "Admins and product leads can manage journey stages"
ON public.content_journey_stages FOR ALL
TO authenticated
USING (EXISTS (
    SELECT 1 FROM public.profiles pr 
    WHERE pr.id = auth.uid() 
    AND (pr.role = 'executive' OR pr.role = 'product')
));

-- 3. Content Ideas
CREATE TABLE IF NOT EXISTS public.content_ideas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    persona_id UUID REFERENCES public.content_personas(id) ON DELETE SET NULL,
    titulo TEXT NOT NULL,
    formato public.content_format NOT NULL,
    etapa_jornada public.content_journey_stage NOT NULL,
    descricao TEXT,
    promovida BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.content_ideas TO authenticated;
GRANT ALL ON public.content_ideas TO service_role;

ALTER TABLE public.content_ideas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view ideas for products they can access"
ON public.content_ideas FOR SELECT
TO authenticated
USING (EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_id));

CREATE POLICY "Admins and product leads can manage ideas"
ON public.content_ideas FOR ALL
TO authenticated
USING (EXISTS (
    SELECT 1 FROM public.profiles pr 
    WHERE pr.id = auth.uid() 
    AND (pr.role = 'executive' OR pr.role = 'product')
));

-- 4. Content Publications
CREATE TABLE IF NOT EXISTS public.content_publications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    idea_id UUID REFERENCES public.content_ideas(id) ON DELETE SET NULL,
    responsavel_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    titulo TEXT NOT NULL,
    formato public.content_format NOT NULL,
    status public.content_publication_status DEFAULT 'ideia',
    canal TEXT,
    data_publicacao DATE,
    url TEXT,
    notas TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.content_publications TO authenticated;
GRANT ALL ON public.content_publications TO service_role;

ALTER TABLE public.content_publications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view publications for products they can access"
ON public.content_publications FOR SELECT
TO authenticated
USING (EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_id));

CREATE POLICY "Admins and product leads can manage publications"
ON public.content_publications FOR ALL
TO authenticated
USING (EXISTS (
    SELECT 1 FROM public.profiles pr 
    WHERE pr.id = auth.uid() 
    AND (pr.role = 'executive' OR pr.role = 'product')
));
