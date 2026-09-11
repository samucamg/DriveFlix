import urllib.request
import urllib.parse
import json
import re
import time
import subprocess
import os

TMDB_KEY = '844dba0bfd8f3a4f3799f6130ef9e335'
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    'Accept': 'application/json'
}

def clean_title(raw):
    s = raw
    ym = re.search(r'[\(\[](\d{4})[\)\]]', s)
    year = ym.group(1) if ym else None
    s = re.sub(r'\.(mp4|mkv|avi|m4v|mov|mp3|flac|aac)$', '', s, flags=re.I)
    s = re.sub(r'BaixarSeriesMP4(\.pm)?', '', s, flags=re.I)
    s = re.sub(r'\b(1080p|720p|480p|2160p|4k|uhd|fhd|hd|web-dl|webdl|bluray|bdrip|dvdrip|x264|x265|hevc|aac|mp3|ddp5\.1|ac3)\b', '', s, flags=re.I)
    s = re.sub(r'\b(LEG|DUB|DUBLADO|LEGENDADO|NACIONAL)\b', '', s, flags=re.I)
    s = re.sub(r'S\d+E\d+', '', s, flags=re.I)
    s = re.sub(r'S\d+', '', s, flags=re.I)
    s = re.sub(r'[\(\[]\d{4}[\)\]]', '', s)
    s = re.sub(r'[._\-]', ' ', s)
    q = ' '.join(s.split()).strip()
    return q, year

def tmdb_get(url):
    req = urllib.request.Request(url, headers=HEADERS)
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode('utf-8'))
    except Exception as e:
        print(f'Error fetching {url}: {e}')
        return None

def search_movie(name):
    q, y = clean_title(name)
    if not q:
        return None
    url = f'https://api.themoviedb.org/3/search/movie?api_key={TMDB_KEY}&query={urllib.parse.quote(q)}&language=pt-BR&include_adult=false'
    if y:
        url += f'&year={y}'
    data = tmdb_get(url)
    if (not data or not data.get('results')) and y:
        fallback = f'https://api.themoviedb.org/3/search/movie?api_key={TMDB_KEY}&query={urllib.parse.quote(q)}&language=pt-BR&include_adult=false'
        data = tmdb_get(fallback)
    if data and data.get('results'):
        return data['results'][0]
    return None

def escape_sql(val):
    if val is None:
        return 'NULL'
    return "'" + str(val).replace("'", "''") + "'"

print('Getting movies from D1...')
res = subprocess.run(['npx.cmd', 'wrangler', 'd1', 'execute', 'jellyfin_db_prod', '--remote', '--command', 'SELECT Id, Name FROM Items WHERE Type = "Movie" AND PrimaryImageFileId IS NULL', '--json'], capture_output=True, text=True, cwd='e:/jellyfin/backend')
try:
    d1_data = json.loads(res.stdout)
    movies = d1_data[0]['results']
except Exception as e:
    print('Failed to parse movies:', e, res.stdout, res.stderr)
    movies = []

print(f'Found {len(movies)} movies to enrich.')

statements = []
for m in movies:
    name = m['Name']
    print(f'Searching TMDB for: {name}')
    tmdb = search_movie(name)
    if tmdb:
        p = f"https://image.tmdb.org/t/p/w500{tmdb['poster_path']}" if tmdb.get('poster_path') else None
        b = f"https://image.tmdb.org/t/p/w1280{tmdb['backdrop_path']}" if tmdb.get('backdrop_path') else None
        overview = tmdb.get('overview', '')
        rel = tmdb.get('release_date', '')
        year = int(rel[:4]) if rel and len(rel) >= 4 else None
        rating = tmdb.get('vote_average', 0.0)
        tmdb_id = str(tmdb.get('id', ''))
        sql = f"UPDATE Items SET PrimaryImageFileId = {escape_sql(p)}, BackdropImageFileId = {escape_sql(b)}, Overview = {escape_sql(overview)}, TmdbId = {escape_sql(tmdb_id)}, ProductionYear = {year or 'NULL'}, CommunityRating = {rating} WHERE Id = {escape_sql(m['Id'])};"
        statements.append(sql)
        print(f"  -> MATCH: {tmdb.get('title')} ({year})")
    else:
        print('  -> NO MATCH')
    time.sleep(0.05)

# Also enrich seasons and episodes for existing series
print('Getting series and seasons from D1...')
s_res = subprocess.run(['npx.cmd', 'wrangler', 'd1', 'execute', 'jellyfin_db_prod', '--remote', '--command', 'SELECT Id, Name, TmdbId FROM Items WHERE Type = "Series" AND TmdbId IS NOT NULL', '--json'], capture_output=True, text=True, cwd='e:/jellyfin/backend')
try:
    series_list = json.loads(s_res.stdout)[0]['results']
except Exception:
    series_list = []

for s in series_list:
    tv_id = int(float(s['TmdbId']))
    s_id = s['Id']
    print(f"Checking seasons for series: {s['Name']} (tmdb: {tv_id})...")
    seasons_res = subprocess.run(['npx.cmd', 'wrangler', 'd1', 'execute', 'jellyfin_db_prod', '--remote', '--command', f'SELECT Id, IndexNumber FROM Items WHERE Type = "Season" AND ParentId = "{s_id}"', '--json'], capture_output=True, text=True, cwd='e:/jellyfin/backend')
    try:
        seasons = json.loads(seasons_res.stdout)[0]['results']
    except Exception:
        seasons = []
    for season in seasons:
        s_num = season.get('IndexNumber', 1)
        s_item_id = season['Id']
        s_data = tmdb_get(f'https://api.themoviedb.org/3/tv/{tv_id}/season/{s_num}?api_key={TMDB_KEY}&language=pt-BR')
        if s_data:
            if s_data.get('poster_path'):
                sp = f"https://image.tmdb.org/t/p/w500{s_data['poster_path']}"
                statements.append(f"UPDATE Items SET PrimaryImageFileId = {escape_sql(sp)} WHERE Id = {escape_sql(s_item_id)};")
            for ep in s_data.get('episodes', []):
                ep_num = ep.get('episode_number')
                ep_still = f"https://image.tmdb.org/t/p/w500{ep['still_path']}" if ep.get('still_path') else None
                ep_over = ep.get('overview', '')
                ep_name = ep.get('name', '')
                ep_rate = ep.get('vote_average', 0.0)
                if ep_still:
                    statements.append(f"UPDATE Items SET PrimaryImageFileId = {escape_sql(ep_still)}, Overview = COALESCE(NULLIF({escape_sql(ep_over)}, ''), Overview), CommunityRating = {ep_rate} WHERE ParentId = {escape_sql(s_item_id)} AND IndexNumber = {ep_num};")
        time.sleep(0.05)

os.makedirs('scripts', exist_ok=True)
with open('scripts/enrich.sql', 'w', encoding='utf-8') as f:
    f.write('\n'.join(statements))

print(f'Done! Wrote {len(statements)} SQL update statements to scripts/enrich.sql')
