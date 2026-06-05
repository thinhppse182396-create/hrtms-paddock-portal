IF DB_ID(N'HRTMS') IS NULL
BEGIN
    CREATE DATABASE [HRTMS];
END
GO

USE [HRTMS];
GO

-- EF Core migrations are the source of truth for the HRTMS schema.
-- Apply them after creating the database:
-- dotnet ef database update --project HRTMS --configuration Release
