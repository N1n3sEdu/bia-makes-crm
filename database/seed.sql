-- SEEDS INICIAIS BIA MAKES CRM

-- Inserir Categorias
INSERT INTO categories (id, name, slug, description) VALUES
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Rosto', 'rosto', 'Bases, corretivos, pós e contornos'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'Lábios', 'labios', 'Batons, glosses e lápis labial'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'Olhos', 'olhos', 'Paletas de sombra, delineadores e máscaras de cílios'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'Pincéis & Acessórios', 'pinceis', 'Pincéis profissionais e esponjas beauty'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15', 'Skincare', 'skincare', 'Hidratantes, séruns e primers')
ON CONFLICT (slug) DO NOTHING;

-- Inserir Canais
INSERT INTO marketplace_channels (id, code, name, account_name, status, fee_percentage) VALUES
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b01', 'MERCADO_LIVRE', 'Mercado Livre', 'BIAMAKES_OFICIAL', 'CONECTADO', 16.00),
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b02', 'SHOPEE', 'Shopee', 'biamakes.beauty', 'CONECTADO', 14.00),
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b03', 'AMAZON', 'Amazon Brasil', 'Bia Makes Cosméticos', 'SINCRONIZANDO', 15.00),
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b04', 'TIKTOK', 'TikTok Shop', '@biamakeoficial_', 'CONECTADO', 10.00),
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b05', 'SITE', 'Loja Virtual Oficial', 'biamake.com.br', 'CONECTADO', 0.99)
ON CONFLICT (code) DO NOTHING;

-- Inserir Usuário Administrador Inicial
INSERT INTO users (name, email, password_hash, role) VALUES
('Bia Teixeira', 'contato@biamake.com.br', '$2b$12$e7kQWqQ4m6oD8.e6Tq0j..N2M8sK0x6Pj1X/0/Z01.ZqV.7N9/xS6', 'ADMIN')
ON CONFLICT (email) DO NOTHING;
