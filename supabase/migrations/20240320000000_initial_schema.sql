-- PHASES
CREATE TYPE user_role AS ENUM ('executive', 'product', 'marketing', 'sales', 'engineering', 'viewer');
CREATE TYPE team_name AS ENUM ('marketing', 'sales', 'engineering', 'product', 'executive');
CREATE TYPE launch_status AS ENUM ('planejamento', 'em_andamento', 'em_risco', 'atrasado', 'lançado', 'cancelado');
CREATE TYPE task_status AS ENUM ('todo', 'em_progresso', 'em_revisão', 'concluído', 'bloqueado');
CREATE TYPE priority_level AS ENUM ('baixa', 'média', 'alta', 'crítica');
CREATE TYPE severity_level AS ENUM ('baixa', 'média', 'alta');
CREATE TYPE risk_status AS ENUM ('aberto', 'mitigado', 'fechado');

-- PROFILES
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  nome TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  role user_role DEFAULT 'viewer',
  team team_name,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- LAUNCHES
CREATE TABLE IF NOT EXISTS launches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  descricao TEXT,
  produto TEXT,
  status launch_status DEFAULT 'planejamento',
  data_inicio DATE,
  data_lancamento_prevista DATE,
  data_lancamento_real DATE,
  owner_id UUID REFERENCES profiles(id),
  prioridade priority_level DEFAULT 'média',
  progresso INTEGER DEFAULT 0 CHECK (progresso >= 0 AND progresso <= 100),
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PHASES
CREATE TABLE IF NOT EXISTS phases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  launch_id UUID REFERENCES launches(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  ordem INTEGER NOT NULL,
  data_inicio DATE,
  data_fim DATE,
  status launch_status DEFAULT 'planejamento',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- TASKS
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  launch_id UUID REFERENCES launches(id) ON DELETE CASCADE,
  phase_id UUID REFERENCES phases(id) ON DELETE SET NULL,
  titulo TEXT NOT NULL,
  descricao TEXT,
  team team_name NOT NULL,
  assignee_id UUID REFERENCES profiles(id),
  status task_status DEFAULT 'todo',
  prioridade priority_level DEFAULT 'média',
  data_inicio DATE,
  data_entrega DATE,
  dependencies UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- COMMENTS
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  author_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  conteudo TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RISKS
CREATE TABLE IF NOT EXISTS risks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  launch_id UUID REFERENCES launches(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  descricao TEXT,
  severidade severity_level DEFAULT 'média',
  status risk_status DEFAULT 'aberto',
  owner_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- MILESTONES
CREATE TABLE IF NOT EXISTS milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  launch_id UUID REFERENCES launches(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  data DATE,
  descricao TEXT,
  concluido BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ACTIVITY LOG
CREATE TABLE IF NOT EXISTS activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  launch_id UUID REFERENCES launches(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  acao TEXT NOT NULL,
  entidade TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS POLICIES
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE launches ENABLE ROW LEVEL SECURITY;
ALTER TABLE phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE risks ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    -- PROFILES
    CREATE POLICY \"Public profiles are viewable by everyone.\" ON profiles FOR SELECT USING (true);
    CREATE POLICY \"Users can update own profile.\" ON profiles FOR UPDATE USING (auth.uid() = id);

    -- LAUNCHES
    CREATE POLICY \"Executive sees all launches\" ON launches FOR SELECT USING (
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'executive')
    );
    CREATE POLICY \"Product sees and manages all launches\" ON launches FOR ALL USING (
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'product')
    );
    CREATE POLICY \"Teams see relevant launches\" ON launches FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM profiles p 
        JOIN tasks t ON t.launch_id = launches.id 
        WHERE p.id = auth.uid() AND (p.team = t.team OR p.role = 'viewer')
      )
    );

    -- TASKS
    CREATE POLICY \"Executive sees all tasks\" ON tasks FOR SELECT USING (
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'executive')
    );
    CREATE POLICY \"Product manages all tasks\" ON tasks FOR ALL USING (
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'product')
    );
    CREATE POLICY \"Teams see only their tasks\" ON tasks FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND (team = tasks.team OR role = 'viewer')
      )
    );
    CREATE POLICY \"Teams update their tasks\" ON tasks FOR UPDATE USING (
      EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND team = tasks.team
      )
    );

    -- PHASES
    CREATE POLICY \"Executive sees all phases\" ON phases FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'executive'));
    CREATE POLICY \"Product manages all phases\" ON phases FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'product'));
    
    -- MILESTONES
    CREATE POLICY \"Executive sees all milestones\" ON milestones FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'executive'));
    CREATE POLICY \"Product manages all milestones\" ON milestones FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'product'));

    -- RISKS
    CREATE POLICY \"Executive sees all risks\" ON risks FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'executive'));
    CREATE POLICY \"Product manages all risks\" ON risks FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'product'));
    CREATE POLICY \"Teams see their risks\" ON risks FOR SELECT USING (EXISTS (SELECT 1 FROM profiles p JOIN tasks t ON t.launch_id = risks.launch_id WHERE p.id = auth.uid() AND p.team = t.team));

    -- COMMENTS
    CREATE POLICY \"Authors manage comments\" ON comments FOR ALL USING (auth.uid() = author_id);
    CREATE POLICY \"Relevant teams see comments\" ON comments FOR SELECT USING (
      EXISTS (SELECT 1 FROM profiles p JOIN tasks t ON t.id = comments.task_id WHERE p.id = auth.uid() AND (p.role IN ('executive', 'product') OR p.team = t.team))
    );

    -- ACTIVITY LOG
    CREATE POLICY \"Viewable by everyone\" ON activity_log FOR SELECT USING (true);

EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
