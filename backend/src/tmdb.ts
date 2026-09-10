export interface TmdbResult {
  id: number;
  title: string;
  overview: string;
  posterPath: string | null;
  backdropPath: string | null;
  voteAverage: number;
  releaseDate: string;
}

const DEFAULT_TMDB_API_KEY = "";

export function cleanMediaTitle(rawTitle: string): { query: string; year?: string } {
  let str = rawTitle;
  
  // Extract year if formatted as (YYYY) or [YYYY]
  const yearMatch = str.match(/[\(\[](\d{4})[\)\]]/);
  const year = yearMatch ? yearMatch[1] : undefined;

  // Remove file extensions
  str = str.replace(/\.(mp4|mkv|avi|m4v|mov|mp3|flac|aac)$/i, "");

  // Remove common scene tags
  str = str.replace(/BaixarSeriesMP4(\.pm)?/gi, "");
  str = str.replace(/\b(1080p|720p|480p|2160p|4k|uhd|fhd|hd|web-dl|webdl|bluray|bdrip|dvdrip|x264|x265|hevc|aac|mp3|ddp5\.1|ac3)\b/gi, "");
  str = str.replace(/\b(LEG|DUB|DUBLADO|LEGENDADO|NACIONAL)\b/gi, "");

  // Remove season / episode tags if present (e.g. S01E02)
  str = str.replace(/S\d+E\d+/gi, "");
  str = str.replace(/S\d+/gi, "");

  // Remove year and parentheses
  str = str.replace(/[\(\[]\d{4}[\)\]]/g, "");

  // Replace dots, underscores, dashes with space
  str = str.replace(/[._\-]/g, " ");

  // Trim multiple spaces
  const query = str.trim().replace(/\s+/g, " ");

  return { query, year };
}

export function cleanEpisodeTitle(rawTitle: string, indexNumber?: number): string {
  let name = rawTitle.replace(/\.(mp4|mkv|avi|m4v|mov)$/i, "");
  // Match S01E01 or 1x01 followed by title
  const match = name.match(/S\d+E\d+[._\-\s]+(.*?)(?:[._\-\s]+(?:\d{3,4}p|web|amzn|ddp|h264|h265|x264|dual|dubla|bluray|aac|ac3)|$)/i);
  if (match && match[1]) {
    const cleaned = match[1].replace(/[._\-]/g, " ").trim();
    if (cleaned && !cleaned.match(/^(1080p|720p|web|dl)/i)) {
      return (indexNumber ? `${indexNumber}. ` : "") + cleaned;
    }
  }
  return indexNumber ? `Episódio ${indexNumber}` : rawTitle;
}

export async function searchTmdb(
  apiKey: string,
  title: string,
  type: "Movie" | "Series" | "Episode" | "Season"
): Promise<TmdbResult | null> {
  const key = apiKey || DEFAULT_TMDB_API_KEY;
  const { query, year } = cleanMediaTitle(title);
  if (!query) return null;

  const searchType = type === "Movie" ? "movie" : "tv";
  let url = `https://api.themoviedb.org/3/search/${searchType}?api_key=${key}&query=${encodeURIComponent(
    query
  )}&language=pt-BR&include_adult=false`;

  if (year) {
    if (searchType === "movie") {
      url += `&year=${year}`;
    } else {
      url += `&first_air_date_year=${year}`;
    }
  }

  try {
    let res = await fetch(url);
    let data: any = await res.json();

    // Fallback search without year if no results
    if ((!data.results || data.results.length === 0) && year) {
      const fallbackUrl = `https://api.themoviedb.org/3/search/${searchType}?api_key=${key}&query=${encodeURIComponent(
        query
      )}&language=pt-BR&include_adult=false`;
      res = await fetch(fallbackUrl);
      data = await res.json();
    }

    if (data.results && data.results.length > 0) {
      const best = data.results[0];
      return {
        id: best.id,
        title: best.title || best.name,
        overview: best.overview || "",
        posterPath: best.poster_path
          ? `https://image.tmdb.org/t/p/w500${best.poster_path}`
          : null,
        backdropPath: best.backdrop_path
          ? `https://image.tmdb.org/t/p/w1280${best.backdrop_path}`
          : null,
        voteAverage: best.vote_average || 0,
        releaseDate: best.release_date || best.first_air_date || "",
      };
    }
  } catch (e) {
    console.error("TMDB search error for", title, e);
  }

  return null;
}

export interface TmdbFullDetails {
  id: number;
  title: string;
  overview: string;
  tagline: string;
  genres: string[];
  people: Array<{ Name: string; Id: string; Role: string; Type: string; PrimaryImageTag?: string }>;
  studios: Array<{ Name: string; Id: string }>;
  voteAverage: number;
  releaseDate: string;
  posterPath: string | null;
  backdropPath: string | null;
}

export async function getTmdbDetails(
  apiKey: string,
  tmdbId: number,
  type: "Movie" | "Series"
): Promise<TmdbFullDetails | null> {
  const key = apiKey || DEFAULT_TMDB_API_KEY;
  const endpoint = type === "Movie" ? "movie" : "tv";
  const url = `https://api.themoviedb.org/3/${endpoint}/${tmdbId}?api_key=${key}&language=pt-BR&append_to_response=credits`;

  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const data: any = await res.json();

    const cast = (data.credits?.cast || []).slice(0, 10).map((c: any) => ({
      Name: c.name,
      Id: `person_${c.id}`,
      Role: c.character || "Actor",
      Type: "Actor",
      PrimaryImageTag: c.profile_path ? `https://image.tmdb.org/t/p/w185${c.profile_path}` : undefined,
    }));

    const crew = (data.credits?.crew || [])
      .filter((c: any) => c.job === "Director" || c.job === "Writer")
      .slice(0, 5)
      .map((c: any) => ({
        Name: c.name,
        Id: `person_${c.id}`,
        Role: c.job,
        Type: c.job === "Director" ? "Director" : "Writer",
      }));

    return {
      id: data.id,
      title: data.title || data.name || "",
      overview: data.overview || "",
      tagline: data.tagline || "",
      genres: (data.genres || []).map((g: any) => g.name),
      people: [...cast, ...crew],
      studios: (data.production_companies || []).slice(0, 3).map((c: any) => ({
        Name: c.name,
        Id: `studio_${c.id}`,
      })),
      voteAverage: data.vote_average || 0,
      releaseDate: data.release_date || data.first_air_date || "",
      posterPath: data.poster_path ? `https://image.tmdb.org/t/p/w500${data.poster_path}` : null,
      backdropPath: data.backdrop_path ? `https://image.tmdb.org/t/p/w1280${data.backdrop_path}` : null,
    };
  } catch (e) {
    console.error("Failed to fetch TMDB details for id", tmdbId, e);
    return null;
  }
}

export async function getTvSeasonEpisodes(
  apiKey: string,
  tvId: number,
  seasonNumber: number
): Promise<Map<number, { name: string; overview: string; stillPath: string | null; voteAverage: number }>> {
  const key = apiKey || DEFAULT_TMDB_API_KEY;
  const url = `https://api.themoviedb.org/3/tv/${tvId}/season/${seasonNumber}?api_key=${key}&language=pt-BR`;
  const epMap = new Map<number, { name: string; overview: string; stillPath: string | null; voteAverage: number }>();

  try {
    const res = await fetch(url);
    if (!res.ok) return epMap;
    const data: any = await res.json();
    for (const ep of data.episodes || []) {
      epMap.set(ep.episode_number, {
        name: ep.name || `Episódio ${ep.episode_number}`,
        overview: ep.overview || "",
        stillPath: ep.still_path ? `https://image.tmdb.org/t/p/w500${ep.still_path}` : null,
        voteAverage: ep.vote_average || 0,
      });
    }
  } catch (e) {
    console.error("Failed to fetch TV season episodes", tvId, seasonNumber, e);
  }

  return epMap;
}

export interface RemoteSearchResultItem {
  Name: string;
  ProductionYear?: number;
  PremiereDate?: string | null;
  ImageUrl?: string | null;
  SearchProviderName: string;
  Overview: string;
  ProviderIds: {
    Tmdb?: string;
    Imdb?: string;
    Tvdb?: string;
  };
  Artists: any[];
  IndexNumber?: number;
}

export async function searchTmdbRemote(
  apiKey: string,
  query: string,
  type: "Movie" | "Series" | "Person" | "BoxSet",
  year?: number,
  tmdbId?: string,
  imdbId?: string
): Promise<RemoteSearchResultItem[]> {
  const key = apiKey || DEFAULT_TMDB_API_KEY;

  // 1. If explicit TMDB ID is provided:
  if (tmdbId && tmdbId.trim()) {
    try {
      const endpoint = type === "Series" ? "tv" : (type === "Person" ? "person" : "movie");
      const url = `https://api.themoviedb.org/3/${endpoint}/${tmdbId.trim()}?api_key=${key}&language=pt-BR`;
      const res = await fetch(url);
      if (res.ok) {
        const data: any = await res.json();
        const releaseDate = data.release_date || data.first_air_date || "";
        const prodYear = releaseDate ? parseInt(releaseDate.substring(0, 4)) : undefined;
        return [
          {
            Name: data.title || data.name || "",
            ProductionYear: prodYear,
            PremiereDate: releaseDate ? `${releaseDate}T00:00:00.0000000Z` : null,
            ImageUrl: data.poster_path
              ? `https://image.tmdb.org/t/p/w500${data.poster_path}`
              : (data.profile_path ? `https://image.tmdb.org/t/p/w500${data.profile_path}` : null),
            SearchProviderName: "TheMovieDb",
            Overview: data.overview || data.biography || "",
            ProviderIds: {
              Tmdb: String(data.id),
              Imdb: data.imdb_id || undefined,
            },
            Artists: [],
          },
        ];
      }
    } catch (e) {
      console.error("Failed to fetch TMDB by ID:", tmdbId, e);
    }
  }

  // 2. If explicit IMDb ID is provided:
  if (imdbId && imdbId.trim()) {
    try {
      const url = `https://api.themoviedb.org/3/find/${imdbId.trim()}?api_key=${key}&external_source=imdb_id&language=pt-BR`;
      const res = await fetch(url);
      if (res.ok) {
        const data: any = await res.json();
        const results = (type === "Series" ? data.tv_results : data.movie_results) || [];
        if (results.length > 0) {
          return results.map((r: any) => {
            const releaseDate = r.release_date || r.first_air_date || "";
            const prodYear = releaseDate ? parseInt(releaseDate.substring(0, 4)) : undefined;
            return {
              Name: r.title || r.name || "",
              ProductionYear: prodYear,
              PremiereDate: releaseDate ? `${releaseDate}T00:00:00.0000000Z` : null,
              ImageUrl: r.poster_path
                ? `https://image.tmdb.org/t/p/w500${r.poster_path}`
                : null,
              SearchProviderName: "TheMovieDb",
              Overview: r.overview || "",
              ProviderIds: {
                Tmdb: String(r.id),
                Imdb: imdbId.trim(),
              },
              Artists: [],
            };
          });
        }
      }
    } catch (e) {
      console.error("Failed to find by IMDb ID:", imdbId, e);
    }
  }

  // 3. Search by Query:
  const { query: cleanedQuery, year: cleanedYear } = cleanMediaTitle(query || "");
  const effectiveQuery = cleanedQuery || query?.trim();
  if (!effectiveQuery) return [];

  const effectiveYear = year || (cleanedYear ? parseInt(cleanedYear) : undefined);
  const searchType = type === "Series" ? "tv" : (type === "Person" ? "person" : "movie");
  let url = `https://api.themoviedb.org/3/search/${searchType}?api_key=${key}&query=${encodeURIComponent(
    effectiveQuery
  )}&language=pt-BR&include_adult=false`;

  if (effectiveYear && searchType !== "person") {
    if (searchType === "movie") {
      url += `&year=${effectiveYear}`;
    } else {
      url += `&first_air_date_year=${effectiveYear}`;
    }
  }

  try {
    let res = await fetch(url);
    let data: any = await res.json();

    // Fallback search without year if 0 results
    if ((!data.results || data.results.length === 0) && effectiveYear && searchType !== "person") {
      const fallbackUrl = `https://api.themoviedb.org/3/search/${searchType}?api_key=${key}&query=${encodeURIComponent(
        effectiveQuery
      )}&language=pt-BR&include_adult=false`;
      res = await fetch(fallbackUrl);
      data = await res.json();
    }

    if (data.results && Array.isArray(data.results)) {
      return data.results.slice(0, 20).map((r: any) => {
        const releaseDate = r.release_date || r.first_air_date || "";
        const prodYear = releaseDate ? parseInt(releaseDate.substring(0, 4)) : undefined;
        return {
          Name: r.title || r.name || "",
          ProductionYear: prodYear,
          PremiereDate: releaseDate ? `${releaseDate}T00:00:00.0000000Z` : null,
          ImageUrl: r.poster_path
            ? `https://image.tmdb.org/t/p/w500${r.poster_path}`
            : (r.profile_path ? `https://image.tmdb.org/t/p/w500${r.profile_path}` : null),
          SearchProviderName: "TheMovieDb",
          Overview: r.overview || "",
          ProviderIds: {
            Tmdb: String(r.id),
          },
          Artists: [],
        };
      });
    }
  } catch (e) {
    console.error("TMDB search error for", effectiveQuery, e);
  }

  return [];
}

export async function getTmdbImages(
  apiKey: string,
  tmdbId: number,
  type: "Movie" | "Series"
): Promise<Array<{ url: string; thumbnailUrl: string; width: number; height: number; type: "Primary" | "Backdrop"; communityRating: number; language?: string }>> {
  const key = apiKey || DEFAULT_TMDB_API_KEY;
  const endpoint = type === "Series" ? "tv" : "movie";
  const url = `https://api.themoviedb.org/3/${endpoint}/${tmdbId}/images?api_key=${key}`;
  const list: Array<{ url: string; thumbnailUrl: string; width: number; height: number; type: "Primary" | "Backdrop"; communityRating: number; language?: string }> = [];

  try {
    const res = await fetch(url);
    if (!res.ok) return list;
    const data: any = await res.json();

    for (const p of data.posters || []) {
      if (p.file_path) {
        list.push({
          url: `https://image.tmdb.org/t/p/original${p.file_path}`,
          thumbnailUrl: `https://image.tmdb.org/t/p/w500${p.file_path}`,
          width: p.width || 500,
          height: p.height || 750,
          type: "Primary",
          communityRating: p.vote_average || 0,
          language: p.iso_639_1 || undefined,
        });
      }
    }

    for (const b of data.backdrops || []) {
      if (b.file_path) {
        list.push({
          url: `https://image.tmdb.org/t/p/original${b.file_path}`,
          thumbnailUrl: `https://image.tmdb.org/t/p/w780${b.file_path}`,
          width: b.width || 1280,
          height: b.height || 720,
          type: "Backdrop",
          communityRating: b.vote_average || 0,
          language: b.iso_639_1 || undefined,
        });
      }
    }
  } catch (e) {
    console.error("Failed to fetch TMDB images for id", tmdbId, e);
  }

  return list;
}

