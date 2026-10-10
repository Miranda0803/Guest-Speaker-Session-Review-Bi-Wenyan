CREATE TABLE public.vaults (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  speaker TEXT NOT NULL DEFAULT '',
  topic TEXT NOT NULL DEFAULT '',
  date TEXT NOT NULL DEFAULT '',
  summary TEXT NOT NULL DEFAULT '',
  score_correct INTEGER,
  score_total INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vaults TO anon, authenticated;
GRANT ALL ON public.vaults TO service_role;
ALTER TABLE public.vaults ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read vaults" ON public.vaults FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public insert vaults" ON public.vaults FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "public update vaults" ON public.vaults FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "public delete vaults" ON public.vaults FOR DELETE TO anon, authenticated USING (true);

CREATE TABLE public.vault_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vault_id UUID NOT NULL REFERENCES public.vaults(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT '',
  data_url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vault_files TO anon, authenticated;
GRANT ALL ON public.vault_files TO service_role;
ALTER TABLE public.vault_files ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read vault_files" ON public.vault_files FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public insert vault_files" ON public.vault_files FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "public update vault_files" ON public.vault_files FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "public delete vault_files" ON public.vault_files FOR DELETE TO anon, authenticated USING (true);

CREATE TABLE public.notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vault_id UUID NOT NULL REFERENCES public.vaults(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  user_answer TEXT NOT NULL DEFAULT '',
  correct_answer TEXT NOT NULL DEFAULT '',
  explanation TEXT NOT NULL DEFAULT '',
  mastered BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notes TO anon, authenticated;
GRANT ALL ON public.notes TO service_role;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read notes" ON public.notes FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public insert notes" ON public.notes FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "public update notes" ON public.notes FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "public delete notes" ON public.notes FOR DELETE TO anon, authenticated USING (true);

INSERT INTO public.vaults (id, title, speaker, topic, date, summary, score_correct, score_total) VALUES
('11111111-1111-1111-1111-111111111111', 'Designing for Slowness', 'Maren Holt', 'Product Design', '2026-09-12', '# Designing for Slowness

Friction can be a feature when it creates reflection. Onboarding should reveal value before asking for commitment. Calm technology lives in the periphery of attention. Defaults shape the behaviour of most users. Delight comes from consistency rather than novelty.', 5, 6),
('22222222-2222-2222-2222-222222222222', 'The Analog Revival', 'Theo Abara', 'Music Industry', '2026-08-03', '# The Analog Revival

Vinyl sales grew for seventeen consecutive years. Collectors value ownership over access. Independent pressing plants face capacity bottlenecks. Physical media builds deeper fan loyalty.', NULL, NULL);

INSERT INTO public.notes (id, vault_id, question, user_answer, correct_answer, explanation, mastered) VALUES
('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'According to the talk, delight comes from ____ rather than novelty.', 'surprise', 'consistency', 'The speaker argued that predictable, consistent experiences build trust, which users perceive as delight.', false);