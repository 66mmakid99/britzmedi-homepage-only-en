-- Seed verified name mappings for known doctors
INSERT OR REPLACE INTO name_mappings (name_ko, name_en, affiliation_ko, affiliation_en, specialty, verified, verified_source)
VALUES ('서의석', 'Yeui-seok Seo', NULL, NULL, NULL, 1, 'manual');

INSERT OR REPLACE INTO name_mappings (name_ko, name_en, affiliation_ko, affiliation_en, specialty, verified, verified_source)
VALUES ('김형주', 'Kim Hyung-ju', '더웰피부과', 'The Well Dermatology Clinic', 'Dermatology', 1, 'manual');
