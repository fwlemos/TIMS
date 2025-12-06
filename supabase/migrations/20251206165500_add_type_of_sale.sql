-- Add type_of_sale enum
CREATE TYPE type_of_sale AS ENUM ('Direct Importation', 'Nationalized', 'Commissioned');

-- Add type_of_sale column to opportunities table
ALTER TABLE opportunities ADD COLUMN type_of_sale type_of_sale;
