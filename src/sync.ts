import { GoogleDrive } from './gdrive';
import { Cipher } from '@fyears/rclone-crypt';
import { toValidUuid } from './index';

// Sync a single series folder directly into the DB (no self-fetch needed)
async function syncSeriesFolder(env: any, gdrive: any, rc: any, libraryId: string, seriesId: string, seriesFolderId: string) {
  const seasonList: any = await gdrive.listFolder(seriesFolderId);
  for (const seasonItem of (seasonList.files || [])) {
    if (seasonItem.mimeType === 'application/vnd.google-apps.folder') {
      let seasonName = seasonItem.name;
      try { seasonName = await rc.decryptFileName(seasonItem.name); } catch(e) {}
      const sMatch = seasonName.match(/S(\d+)|Season\s*(\d+)|Temporada\s*(\d+)/i);
      const seasonNumber = sMatch ? parseInt(sMatch[1] || sMatch[2] || sMatch[3]) : 1;
      const seasonId = `season_${seasonItem.id}`;

      await env.DB.prepare(`
        INSERT INTO Items (Id, ParentId, LibraryId, Type, Name, IndexNumber, FolderId, Uuid)
        VALUES (?, ?, ?, 'Season', ?, ?, ?, ?)
        ON CONFLICT(Id) DO UPDATE SET Name = CASE WHEN Items.TmdbId IS NULL THEN excluded.Name ELSE Items.Name END, IndexNumber = excluded.IndexNumber, FolderId = excluded.FolderId, Uuid = excluded.Uuid
      `).bind(seasonId, seriesId, libraryId, seasonName, seasonNumber, seasonItem.id, toValidUuid(seasonId)).run();

      const epList: any = await gdrive.listFolder(seasonItem.id);
      for (const ep of (epList.files || [])) {
        if (ep.mimeType === 'application/vnd.google-apps.folder') continue;
        let epName = ep.name;
        try { epName = await rc.decryptFileName(ep.name); } catch(e) {}
        if (!epName.match(/\.(mp4|mkv|avi|webm|m4v|mov|wmv)$/i)) continue;
        const rowEpId = `ep_${ep.id}`;
        const epMatch = epName.match(/(?:[Ss]\d+)?\s*[Ee](\d+)|\b\d+x(\d+)\b|\bEp[._\s]*(\d+)\b|(?:^|\D)(\d{1,3})\s*\./i);
        const epNumber = epMatch ? parseInt(epMatch[1] || epMatch[2] || epMatch[3] || epMatch[4]) : 1;
        await env.DB.prepare(`
          INSERT INTO Items (Id, ParentId, LibraryId, Type, Name, IndexNumber, ParentIndexNumber, FileId, EncryptedName, Size, Uuid)
          VALUES (?, ?, ?, 'Episode', ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(Id) DO UPDATE SET Name = CASE WHEN Items.TmdbId IS NULL THEN excluded.Name ELSE Items.Name END, IndexNumber = excluded.IndexNumber, ParentIndexNumber = excluded.ParentIndexNumber, FileId = excluded.FileId, EncryptedName = excluded.EncryptedName, Size = excluded.Size, Uuid = excluded.Uuid
        `).bind(rowEpId, seasonId, libraryId, epName, epNumber, seasonNumber, ep.id, ep.name, ep.size || 0, toValidUuid(rowEpId)).run();
      }
    } else {
      // File at series root level (no season folder) — treat as S01
      let epName = seasonItem.name;
      try { epName = await rc.decryptFileName(seasonItem.name); } catch(e) {}
      if (!epName.match(/\.(mp4|mkv|avi|webm|m4v|mov|wmv)$/i)) continue;

      const defaultSeasonId = `season_${seriesFolderId}_s1`;
      await env.DB.prepare(`
        INSERT INTO Items (Id, ParentId, LibraryId, Type, Name, IndexNumber, FolderId, Uuid)
        VALUES (?, ?, ?, 'Season', 'Season 1', 1, ?, ?)
        ON CONFLICT(Id) DO UPDATE SET Name = CASE WHEN Items.TmdbId IS NULL THEN excluded.Name ELSE Items.Name END, IndexNumber = excluded.IndexNumber, FolderId = excluded.FolderId, Uuid = excluded.Uuid
      `).bind(defaultSeasonId, seriesId, libraryId, seriesFolderId, toValidUuid(defaultSeasonId)).run();

      const rowEpId = `ep_${seasonItem.id}`;
      const epMatch = epName.match(/(?:[Ss]\d+)?\s*[Ee](\d+)|\b\d+x(\d+)\b|\bEp[._\s]*(\d+)\b|(?:^|\D)(\d{1,3})\s*\./i);
      const epNumber = epMatch ? parseInt(epMatch[1] || epMatch[2] || epMatch[3] || epMatch[4]) : 1;
      await env.DB.prepare(`
        INSERT INTO Items (Id, ParentId, LibraryId, Type, Name, IndexNumber, ParentIndexNumber, FileId, EncryptedName, Size, Uuid)
        VALUES (?, ?, ?, 'Episode', ?, ?, 1, ?, ?, ?, ?)
        ON CONFLICT(Id) DO UPDATE SET Name = CASE WHEN Items.TmdbId IS NULL THEN excluded.Name ELSE Items.Name END, IndexNumber = excluded.IndexNumber, FileId = excluded.FileId, EncryptedName = excluded.EncryptedName, Size = excluded.Size, Uuid = excluded.Uuid
      `).bind(rowEpId, defaultSeasonId, libraryId, epName, epNumber, seasonItem.id, seasonItem.name, seasonItem.size || 0, toValidUuid(rowEpId)).run();
    }
  }
}

export async function runSync(env: any) {
  const gdrive = new GoogleDrive(env);
  const rc = new Cipher('base32');
  rc.dirNameEncrypt = false;
  if (env.RCLONE_PASS) {
    await rc.key(env.RCLONE_PASS, env.RCLONE_SALT || '');
  }

  const { results: libraries } = await env.DB.prepare("SELECT * FROM Libraries").all();

  for (const lib of libraries) {
    try {
      const libraryId = lib.Id;
      const libraryFolderId = lib.FolderId;
      if (!libraryFolderId || libraryFolderId === 'root') continue;

      const isMovieLib = (lib.CollectionType === 'movies') || lib.Name.toLowerCase().includes('filme');
      const isTvLib = (lib.CollectionType === 'tvshows') || lib.Name.toLowerCase().includes('serie');
      const isMusicLib = (lib.CollectionType === 'music') || lib.Name.toLowerCase().includes('musica');

      const topList: any = await gdrive.listFolder(libraryFolderId);
      if (!topList || !topList.files) continue;

      if (isTvLib) {
        for (const seriesFolder of topList.files) {
          if (seriesFolder.mimeType !== 'application/vnd.google-apps.folder') continue;
          let seriesName = seriesFolder.name;
          try { seriesName = await rc.decryptFileName(seriesFolder.name); } catch(e) {}
          if (/^S\d+/i.test(seriesName) || /^Season/i.test(seriesName) || /^Temporada/i.test(seriesName)) continue;

          const seriesId = `series_${seriesFolder.id}`;
          await env.DB.prepare(`
            INSERT INTO Items (Id, ParentId, LibraryId, Type, Name, FolderId, Uuid)
            VALUES (?, ?, ?, 'Series', ?, ?, ?)
            ON CONFLICT(Id) DO UPDATE SET Name = CASE WHEN Items.TmdbId IS NULL THEN excluded.Name ELSE Items.Name END, FolderId = excluded.FolderId, Uuid = excluded.Uuid
          `).bind(seriesId, libraryId, libraryId, seriesName, seriesFolder.id, toValidUuid(seriesId)).run();

          await syncSeriesFolder(env, gdrive, rc, libraryId, seriesId, seriesFolder.id).catch(err => {
            console.error(`Error syncing series ${seriesName}:`, err);
          });
        }
      } else if (isMovieLib) {
        for (const item of topList.files) {
          try {
            if (item.mimeType === 'application/vnd.google-apps.folder') {
              const subFiles: any = await gdrive.listFolder(item.id);
              for (const sub of (subFiles.files || [])) {
                let name = sub.name;
                try { name = await rc.decryptFileName(sub.name); } catch(e) {}
                if (!name.match(/\.(mp4|mkv|avi|webm|m4v|mov|wmv)$/i)) continue;
                const rowId = `movie_${sub.id}`;
                await env.DB.prepare(`
                  INSERT INTO Items (Id, ParentId, LibraryId, Type, Name, FileId, EncryptedName, Size, Uuid)
                  VALUES (?, ?, ?, 'Movie', ?, ?, ?, ?, ?)
                  ON CONFLICT(Id) DO UPDATE SET Name = CASE WHEN Items.TmdbId IS NULL THEN excluded.Name ELSE Items.Name END, Size = excluded.Size, FileId = excluded.FileId, EncryptedName = excluded.EncryptedName, Uuid = excluded.Uuid
                `).bind(rowId, libraryId, libraryId, name, sub.id, sub.name, sub.size || 0, toValidUuid(rowId)).run();
              }
            } else {
              let name = item.name;
              try { name = await rc.decryptFileName(item.name); } catch(e) {}
              if (!name.match(/\.(mp4|mkv|avi|webm|m4v|mov|wmv)$/i)) continue;
              const rowId = `movie_${item.id}`;
              await env.DB.prepare(`
                INSERT INTO Items (Id, ParentId, LibraryId, Type, Name, FileId, EncryptedName, Size, Uuid)
                VALUES (?, ?, ?, 'Movie', ?, ?, ?, ?, ?)
                ON CONFLICT(Id) DO UPDATE SET Name = CASE WHEN Items.TmdbId IS NULL THEN excluded.Name ELSE Items.Name END, Size = excluded.Size, FileId = excluded.FileId, EncryptedName = excluded.EncryptedName, Uuid = excluded.Uuid
              `).bind(rowId, libraryId, libraryId, name, item.id, item.name, item.size || 0, toValidUuid(rowId)).run();
            }
          } catch (err) {
            console.error(`Error syncing movie item:`, err);
          }
        }
      } else if (isMusicLib) {
        for (const item of topList.files) {
          try {
            let name = item.name;
            try { name = await rc.decryptFileName(item.name); } catch(e) {}
            if (!name.match(/\.(mp3|flac|m4a|ogg|wav|aac)$/i)) continue;
            const rowId = `audio_${item.id}`;
            await env.DB.prepare(`
              INSERT INTO Items (Id, ParentId, LibraryId, Type, Name, FileId, EncryptedName, Size, Uuid)
              VALUES (?, ?, ?, 'Audio', ?, ?, ?, ?, ?)
              ON CONFLICT(Id) DO UPDATE SET Name = CASE WHEN Items.TmdbId IS NULL THEN excluded.Name ELSE Items.Name END, Size = excluded.Size, FileId = excluded.FileId, EncryptedName = excluded.EncryptedName, Uuid = excluded.Uuid
            `).bind(rowId, libraryId, libraryId, name, item.id, item.name, item.size || 0, toValidUuid(rowId)).run();
          } catch (err) {
            console.error(`Error syncing audio item:`, err);
          }
        }
      }
    } catch (err) {
      console.error(`Error syncing library ${lib.Id}:`, err);
    }
  }

  return { success: true };
}
