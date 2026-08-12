-- Runs only when the local PostgreSQL volume is initialized for the first time.
SELECT 'CREATE DATABASE "komplekku_test"'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'komplekku_test') \gexec
