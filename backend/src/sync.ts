import { GoogleDrive } from './gdrive';
import { Cipher } from '@fyears/rclone-crypt';

export async function runSync(env: any) {
  const gdrive = new GoogleDrive(env);
  const rc = new Cipher('base32');
  rc.dirNameEncrypt = false;
  if (env.RCLONE_PASS) {
    await rc.key(env.RCLONE_PASS, env.RCLONE_SALT || '');
  }

  // Obter todas as bibliotecas configuradas
  const { results: libraries } = await env.DB.prepare("SELECT * FROM Libraries").all();

  for (const lib of libraries) {
    const libraryId = lib.Id;
    const libraryFolderId = lib.FolderId;
    if (!libraryFolderId || libraryFolderId === 'root') continue;

    const isMovieLib = (lib.CollectionType === 'movies') || lib.Name.toLowerCase().includes('filme');
    const isTvLib = (lib.CollectionType === 'tvshows') || lib.Name.toLowerCase().includes('serie');
    const isMusicLib = (lib.CollectionType === 'music') || lib.Name.toLowerCase().includes('musica');

    const topList: any = await gdrive.listFolder(libraryFolderId);
    if (!topList || !topList.files) continue;

    if (isMovieLib) {
      // Library is Movies: items inside are movie files or movie folders
      for (const item of topList.files) {
        if (item.mimeType === 'application/vnd.google-apps.folder') {
          // Folder containing a movie file
          const subFiles: any = await gdrive.listFolder(item.id);
          for (const sub of (subFiles.files || [])) {
            let name = sub.name;
            try { name = await rc.decryptFileName(sub.name); } catch(e) {}
            if (name.endsWith('.mp4') || name.endsWith('.mkv') || name.endsWith('.avi')) {
              await env.DB.prepare(`
                INSERT INTO Items (Id, ParentId, LibraryId, Type, Name, FileId, EncryptedName, Size)
                VALUES (?, ?, ?, 'Movie', ?, ?, ?, ?)
                ON CONFLICT(Id) DO UPDATE SET Name = excluded.Name, Size = excluded.Size, FileId = excluded.FileId, EncryptedName = excluded.EncryptedName
              `).bind(`movie_${sub.id}`, libraryId, libraryId, name, sub.id, sub.name, sub.size || 0).run();
            }
          }
        } else {
          // Direct file in library root
          let name = item.name;
          try { name = await rc.decryptFileName(item.name); } catch(e) {}
          if (name.endsWith('.mp4') || name.endsWith('.mkv') || name.endsWith('.avi')) {
            await env.DB.prepare(`
              INSERT INTO Items (Id, ParentId, LibraryId, Type, Name, FileId, EncryptedName, Size)
              VALUES (?, ?, ?, 'Movie', ?, ?, ?, ?)
              ON CONFLICT(Id) DO UPDATE SET Name = excluded.Name, Size = excluded.Size, FileId = excluded.FileId, EncryptedName = excluded.EncryptedName
            `).bind(`movie_${item.id}`, libraryId, libraryId, name, item.id, item.name, item.size || 0).run();
          }
        }
      }
    } else if (isTvLib) {
      // Library is TV Shows: items inside are Series folders (e.g. "Farscape (1999)")
      for (const seriesFolder of topList.files) {
        if (seriesFolder.mimeType !== 'application/vnd.google-apps.folder') continue;

        let seriesName = seriesFolder.name;
        try { seriesName = await rc.decryptFileName(seriesFolder.name); } catch(e) {}

        // Never register Season or S01 as a Series!
        if (/^S\d+/i.test(seriesName) || /^Season/i.test(seriesName) || /^Temporada/i.test(seriesName)) {
          continue;
        }

        const seriesId = `series_${seriesFolder.id}`;
        await env.DB.prepare(`
          INSERT OR IGNORE INTO Items (Id, ParentId, LibraryId, Type, Name, FolderId)
          VALUES (?, ?, ?, 'Series', ?, ?)
        `).bind(seriesId, libraryId, libraryId, seriesName, seriesFolder.id).run();

        // List contents of the series folder: Seasons or direct Episodes
        const seasonList: any = await gdrive.listFolder(seriesFolder.id);
        for (const seasonItem of (seasonList.files || [])) {
          if (seasonItem.mimeType === 'application/vnd.google-apps.folder') {
            // It's a Season folder
            let seasonName = seasonItem.name;
            try { seasonName = await rc.decryptFileName(seasonItem.name); } catch(e) {}

            const sMatch = seasonName.match(/S(\d+)|Season\s*(\d+)|Temporada\s*(\d+)/i);
            const seasonNumber = sMatch ? parseInt(sMatch[1] || sMatch[2] || sMatch[3]) : 1;
            const seasonId = `season_${seasonItem.id}`;

            await env.DB.prepare(`
              INSERT INTO Items (Id, ParentId, LibraryId, Type, Name, IndexNumber, FolderId)
              VALUES (?, ?, ?, 'Season', ?, ?, ?)
              ON CONFLICT(Id) DO UPDATE SET Name = excluded.Name, IndexNumber = excluded.IndexNumber, FolderId = excluded.FolderId
            `).bind(seasonId, seriesId, libraryId, seasonName, seasonNumber, seasonItem.id).run();

            // List episodes inside season
            const epList: any = await gdrive.listFolder(seasonItem.id);
            for (const ep of (epList.files || [])) {
              if (ep.mimeType === 'application/vnd.google-apps.folder') continue;
              let epName = ep.name;
              try { epName = await rc.decryptFileName(ep.name); } catch(e) {}

              if (epName.endsWith('.mp4') || epName.endsWith('.mkv')) {
                const epMatch = epName.match(/(?:[Ss]\d+)?\s*[Ee](\d+)|\b\d+x(\d+)\b|\bEp[._\s]*(\d+)\b|(?:^|\D)(\d{1,3})\s*\./i);
                const epNumber = epMatch ? parseInt(epMatch[1] || epMatch[2] || epMatch[3] || epMatch[4]) : 1;
                await env.DB.prepare(`
                  INSERT INTO Items (Id, ParentId, LibraryId, Type, Name, IndexNumber, ParentIndexNumber, FileId, EncryptedName, Size)
                  VALUES (?, ?, ?, 'Episode', ?, ?, ?, ?, ?, ?)
                  ON CONFLICT(Id) DO UPDATE SET Name = excluded.Name, IndexNumber = excluded.IndexNumber, ParentIndexNumber = excluded.ParentIndexNumber, FileId = excluded.FileId, EncryptedName = excluded.EncryptedName, Size = excluded.Size
                `).bind(`ep_${ep.id}`, seasonId, libraryId, epName, epNumber, seasonNumber, ep.id, ep.name, ep.size || 0).run();
              } else if (epName.endsWith('.mp3') || epName.endsWith('.m4a') || epName.endsWith('.flac')) {
                await env.DB.prepare(`
                  INSERT INTO Items (Id, ParentId, LibraryId, Type, Name, IndexNumber, ParentIndexNumber, FileId, EncryptedName, Size)
                  VALUES (?, ?, ?, 'Audio', ?, ?, ?, ?, ?, ?)
                  ON CONFLICT(Id) DO UPDATE SET Name = excluded.Name, IndexNumber = excluded.IndexNumber, ParentIndexNumber = excluded.ParentIndexNumber, FileId = excluded.FileId, EncryptedName = excluded.EncryptedName, Size = excluded.Size
                `).bind(`ep_${ep.id}`, seasonId, libraryId, epName, 1, seasonNumber, ep.id, ep.name, ep.size || 0).run();
              }
            }
          } else {
            // Direct video file in series folder (create virtual Season 1)
            let epName = seasonItem.name;
            try { epName = await rc.decryptFileName(seasonItem.name); } catch(e) {}

            if (epName.endsWith('.mp4') || epName.endsWith('.mkv')) {
              const defaultSeasonId = `season_${seriesFolder.id}_s1`;
              await env.DB.prepare(`
                INSERT OR IGNORE INTO Items (Id, ParentId, LibraryId, Type, Name, IndexNumber, FolderId)
                VALUES (?, ?, ?, 'Season', 'Season 1', 1, ?)
              `).bind(defaultSeasonId, seriesId, libraryId, seriesFolder.id).run();

              const epMatch = epName.match(/(?:[Ss]\d+)?\s*[Ee](\d+)|\b\d+x(\d+)\b|\bEp[._\s]*(\d+)\b|(?:^|\D)(\d{1,3})\s*\./i);
              const epNumber = epMatch ? parseInt(epMatch[1] || epMatch[2] || epMatch[3] || epMatch[4]) : 1;
              await env.DB.prepare(`
                INSERT INTO Items (Id, ParentId, LibraryId, Type, Name, IndexNumber, ParentIndexNumber, FileId, EncryptedName, Size)
                VALUES (?, ?, ?, 'Episode', ?, ?, ?, ?, ?, ?)
                ON CONFLICT(Id) DO UPDATE SET Name = excluded.Name, IndexNumber = excluded.IndexNumber, ParentIndexNumber = excluded.ParentIndexNumber, FileId = excluded.FileId, EncryptedName = excluded.EncryptedName, Size = excluded.Size
              `).bind(`ep_${seasonItem.id}`, defaultSeasonId, libraryId, epName, epNumber, 1, seasonItem.id, seasonItem.name, seasonItem.size || 0).run();
            }
          }
        }
      }
    } else if (isMusicLib) {
      // Music library: traverse files
      for (const item of topList.files) {
        if (item.mimeType === 'application/vnd.google-apps.folder') {
          const subFiles: any = await gdrive.listFolder(item.id);
          for (const sub of (subFiles.files || [])) {
            let name = sub.name;
            try { name = await rc.decryptFileName(sub.name); } catch(e) {}
            if (name.endsWith('.mp3') || name.endsWith('.flac') || name.endsWith('.m4a') || name.endsWith('.aac')) {
              await env.DB.prepare(`
                INSERT OR REPLACE INTO Items (Id, ParentId, LibraryId, Type, Name, FileId, EncryptedName, Size)
                VALUES (?, ?, ?, 'Audio', ?, ?, ?, ?)
              `).bind(`audio_${sub.id}`, libraryId, libraryId, name, sub.id, sub.name, sub.size || 0).run();
            }
          }
        } else {
          let name = item.name;
          try { name = await rc.decryptFileName(item.name); } catch(e) {}
          if (name.endsWith('.mp3') || name.endsWith('.flac') || name.endsWith('.m4a') || name.endsWith('.aac')) {
            await env.DB.prepare(`
              INSERT OR REPLACE INTO Items (Id, ParentId, LibraryId, Type, Name, FileId, EncryptedName, Size)
              VALUES (?, ?, ?, 'Audio', ?, ?, ?, ?)
            `).bind(`audio_${item.id}`, libraryId, libraryId, name, item.id, item.name, item.size || 0).run();
          }
        }
      }
    }
  }

  return { success: true };
}
