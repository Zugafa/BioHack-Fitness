DROP TABLE IF EXISTS protocoale CASCADE;
DROP TYPE IF EXISTS tip_departament CASCADE;
DROP TYPE IF EXISTS tip_frecventa CASCADE;
DROP TYPE IF EXISTS nivel_experienta CASCADE;

CREATE TYPE tip_departament AS ENUM('Neural-Performance', 'Biomechanical-Power', 'Recovery-Protocols');
CREATE TYPE tip_frecventa AS ENUM('zi', 'luna', 'trimestrial', 'anual');
CREATE TYPE nivel_experienta AS ENUM('Initiate', 'Adaptive', 'Elite', 'Apex');

CREATE TABLE IF NOT EXISTS protocoale (
   id serial PRIMARY KEY,
   nume VARCHAR(100) UNIQUE NOT NULL,
   descriere TEXT,
   pret NUMERIC(8,2) CHECK (pret >= 0), -- NULL permis pentru Specimen Zero
   durata_zile INT NOT NULL CHECK (durata_zile >= 1), -- Zile de acces efectiv
   sesiuni_antrenor INT NOT NULL CHECK (sesiuni_antrenor >= 0), -- Ședințe 1 la 1 incluse
   reducere_maxima INT NOT NULL CHECK (reducere_maxima >= 0 AND reducere_maxima <= 100),
   departament tip_departament DEFAULT 'Biomechanical-Power',
   frecventa_plata tip_frecventa DEFAULT 'luna',
   nivel_subiect nivel_experienta DEFAULT 'Initiate', 
   tip_abonament VARCHAR(50) NOT NULL CHECK (tip_abonament IN ('Guest Breach', 'Baseline', 'Enhanced', 'BioHacker', 'Specimen Zero')),
   tehnologii_folosite VARCHAR[], -- Array de string-uri pentru tehnologii/facilitati
   este_recurent BOOLEAN NOT NULL DEFAULT FALSE, 
   necesita_analize BOOLEAN NOT NULL DEFAULT FALSE, 
   imagine VARCHAR(300),
   data_adaugare TIMESTAMP DEFAULT current_timestamp
);

INSERT INTO protocoale (nume, descriere, pret, durata_zile, sesiuni_antrenor, reducere_maxima, departament, frecventa_plata, nivel_subiect, tip_abonament, tehnologii_folosite, este_recurent, necesita_analize, imagine) VALUES 

-- GUEST BREACH (Abonamente de 1 zi)
('Guest Breach: Neural', 'Acces 24H la zona Neural. Include 1 sesiune de evaluare reflexe.', 45.00, 1, 1, 0, 'Neural-Performance', 'zi', 'Initiate', 'Guest Breach', '{"Scanner Biometric", "Combat Sim"}', FALSE, FALSE, 'guest_neural.png'),
('Guest Breach: Power', 'Acces 24H la zona de forță brută. Fără asistență PT.', 35.00, 1, 0, 0, 'Biomechanical-Power', 'zi', 'Initiate', 'Guest Breach', '{"Bara Olimpica", "Power Rack"}', FALSE, FALSE, 'guest_power.png'),
('Guest Breach: Recovery', 'Acces 24H la facilitățile de recuperare celulară.', 120.00, 1, 0, 0, 'Recovery-Protocols', 'zi', 'Initiate', 'Guest Breach', '{"Sauna Cryo", "Piscina"}', FALSE, FALSE, 'guest_rec.png'),
-- BASELINE (Human Access)
('Baseline Monthly', 'Abonament lunar The Forge. Include 2 evaluări biomecanice.', 250.00, 30, 2, 10, 'Biomechanical-Power', 'luna', 'Initiate', 'Baseline', '{"Raft Gantere", "Scripeti"}', TRUE, FALSE, 'base_mo.png'),
('Baseline Quarterly', 'Acces 3 luni. Include 6 antrenamente asistate.', 650.00, 90, 6, 15, 'Biomechanical-Power', 'trimestrial', 'Adaptive', 'Baseline', '{"Bicicleta Spinning", "Aparat Vaslit"}', TRUE, FALSE, 'base_q.png'),
('Baseline Annual', 'Acces 12 luni. 1 ședință PT/lună inclusă.', 2200.00, 365, 12, 20, 'Biomechanical-Power', 'anual', 'Adaptive', 'Baseline', '{"Bara Olimpica", "Raft Gantere"}', FALSE, FALSE, 'base_yr.png'),

-- ENHANCED (Augmented Access)
('Enhanced Monthly', 'Acces lunar cu zona de recuperare inclusă + 4 ședințe PT.', 450.00, 30, 4, 15, 'Biomechanical-Power', 'luna', 'Adaptive', 'Enhanced', '{"Sauna Cryo", "Leg Press"}', TRUE, FALSE, 'enh_mo.png'),
('Enhanced Quarterly', 'Acces 3 luni Augmented. 12 sesiuni PT.', 1200.00, 90, 12, 20, 'Biomechanical-Power', 'trimestrial', 'Elite', 'Enhanced', '{"Sauna Cryo", "Scripeti"}', TRUE, FALSE, 'enh_q.png'),
('Enhanced Annual', 'Acces 12 luni Augmented. 48 sesiuni PT.', 4200.00, 365, 48, 25, 'Biomechanical-Power', 'anual', 'Elite', 'Enhanced', '{"Sauna Cryo", "Piscina", "Power Rack"}', FALSE, FALSE, 'enh_yr.png'),

-- BIOHACKER (Full Node Access)
('BioHacker Monthly', 'Acces 24/7. Include 8 antrenamente AI & antrenor uman.', 850.00, 30, 8, 15, 'Neural-Performance', 'luna', 'Elite', 'BioHacker', '{"Scanner Biometric", "Combat Sim"}', TRUE, TRUE, 'bh_mo.png'),
('BioHacker Quarterly', '3 luni optimizare sistemică cu 24 antrenamente asistate.', 2300.00, 90, 24, 20, 'Neural-Performance', 'trimestrial', 'Apex', 'BioHacker', '{"Scanner Biometric", "Pista Sprint"}', TRUE, TRUE, 'bh_q.png'),
('BioHacker Annual', '12 luni evoluție absolută. Antrenor dedicat (96 sesiuni).', 8000.00, 365, 96, 30, 'Neural-Performance', 'anual', 'Apex', 'BioHacker', '{"Scanner Biometric", "Combat Sim", "Pista Sprint"}', FALSE, TRUE, 'bh_yr.png'),

-- SPECIMEN ZERO (Elite - Preț la cerere)
('Zero-Point Recovery', 'Resetare biologică absolută - 3 luni. Include 30 terapii asistate.', NULL, 90, 30, 0, 'Recovery-Protocols', 'trimestrial', 'Apex', 'Specimen Zero', '{"Sauna Cryo", "Piscina", "Scanner Biometric"}', FALSE, TRUE, 'zero_rec.png');
('Neural Singularity', 'Sincronizare neurală totală - 6 luni (180 zile). Antrenament la 2 zile.', NULL, 180, 90, 0, 'Neural-Performance', 'trimestrial', 'Apex', 'Specimen Zero', '{"Combat Sim", "Scanner Biometric"}', FALSE, TRUE, 'singularity.png'),
('Project: Titan Zero', 'Transformare somatică maximă - 12 luni. Antrenament zilnic cu Cyber-Coach.', NULL, 365, 200, 0, 'Biomechanical-Power', 'anual', 'Apex', 'Specimen Zero', '{"Power Rack", "Leg Press", "Scanner Biometric"}', FALSE, TRUE, 'titan_zero.png'),

GRANT ALL PRIVILEGES ON DATABASE biohack_2026 TO andrei ;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO andrei;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO andrei;