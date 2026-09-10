DROP TABLE IF EXISTS Users;
CREATE TABLE Users (
    Id TEXT PRIMARY KEY,
    Name TEXT NOT NULL,
    Password TEXT NOT NULL
);

DROP TABLE IF EXISTS Libraries;
CREATE TABLE Libraries (
    Id TEXT PRIMARY KEY,
    Name TEXT NOT NULL,
    FolderId TEXT NOT NULL
);

DROP TABLE IF EXISTS Items;
CREATE TABLE Items (
    Id TEXT PRIMARY KEY,
    ParentId TEXT,
    LibraryId TEXT,
    Type TEXT NOT NULL, -- 'Series', 'Season', 'Episode', 'Movie'
    Name TEXT NOT NULL,
    Overview TEXT,
    IndexNumber INTEGER, -- S01 -> 1
    ParentIndexNumber INTEGER, -- Season Number for Episodes
    FolderId TEXT,
    FileId TEXT,
    EncryptedName TEXT,
    Size INTEGER,
    PrimaryImageFileId TEXT,
    BackdropImageFileId TEXT,
    TmdbId TEXT,
    MediaInfo TEXT,
    DateCreated DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insert Default User
INSERT INTO Users (Id, Name, Password) VALUES ('user_admin_123', 'admin', 'Filmes@2026');
