import urllib.request
import urllib.parse
import json
import time

TMDB_KEY = '844dba0bfd8f3a4f3799f6130ef9e335'
HEADERS = {'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json'}

def escape_sql(val):
    if val is None:
        return 'NULL'
    return "'" + str(val).replace("'", "''") + "'"

def search(q, y=None):
    url = f'https://api.themoviedb.org/3/search/movie?api_key={TMDB_KEY}&query={urllib.parse.quote(q)}&language=pt-BR'
    if y:
        url += f'&year={y}'
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req) as resp:
        d = json.loads(resp.read().decode('utf-8'))
        if d.get('results'):
            return d['results'][0]
        if y:
            return search(q, None)
    return None

manual = [
    ("movie_1SC5JI5fGiFfMpVg0mr_BoAMbsuycWHKc", "Capitão América Admirável Mundo Novo", 2025),
    ("movie_1RqJpguwwFBAwJVI9HVNcbbipjcXEyCq7", "1917", 2019),
    ("movie_1rLIYuDr-sEeFzRb0lMULKk6bp_g6fzaM", "101 Dálmatas", 1996),
    ("movie_1G1QIyFVKiO2d3JvsyuUCr0-JANMJvWkE", "Yojimbo", 1961),
    ("movie_13DmuUTMhlWinBIlEoyIzAVGo5WBj6Jj2", "You're Killing Me", 2023),
    ("movie_1gTU8kC4xycQPUEC0mGx6ezR1Ea3uZ0a8", "Yellow Submarine", 1968),
    ("movie_18EkdxREY6ulX_p_5lFDco5BC2ux9hx5H", "X", 2022),
    ("movie_13Blu5_c3JH3lEsW960a-x8w9ZfJSK_xw", "Yaksha: Operação Implacável", 2022),
    ("movie_1YcqkBNZGQW3F1Sztx20mTvuUsLUXpTVL", "12 Rounds 3: Caçada Mortal", 2015),
    ("movie_1DtH06P68g4mrUEpqJx67gzlvmptql8pF", "Eles Vão Te Matar", 2026),
    ("movie_1nVVrp1HgvNCnqh4QKk13cu23y43nCQRS", "A Maldição da Múmia", 2026),
    ("movie_11rqUkNXy8ANks7BPEL7NfVQIGM7zTeKB", "O Verão que Mudou Tudo", 2024),
    ("movie_1alr4cVrLvZRFvjZgLuX5uBXdql0DO_3B", "O Atirador", 2026),
    ("movie_1CA3ij8EJO2tUkWX8Kl9uEDy3-bgTjJD7", "A Pequena Amélie", 2025),
    ("movie_1O49_QhSDz0EznSlbzISFuwwpnIvdnK8j", "A Desconhecida", 2026),
]

stmts = []
for item_id, q, y in manual:
    tmdb = search(q, y)
    if tmdb:
        p = f"https://image.tmdb.org/t/p/w500{tmdb['poster_path']}" if tmdb.get('poster_path') else None
        b = f"https://image.tmdb.org/t/p/w1280{tmdb['backdrop_path']}" if tmdb.get('backdrop_path') else None
        overview = tmdb.get('overview', '')
        rel = tmdb.get('release_date', '')
        year = int(rel[:4]) if rel and len(rel) >= 4 else None
        rating = tmdb.get('vote_average', 0.0)
        tmdb_id = str(tmdb.get('id', ''))
        stmts.append(f"UPDATE Items SET PrimaryImageFileId = {escape_sql(p)}, BackdropImageFileId = {escape_sql(b)}, Overview = {escape_sql(overview)}, TmdbId = {escape_sql(tmdb_id)}, ProductionYear = {year or 'NULL'}, CommunityRating = {rating} WHERE Id = {escape_sql(item_id)};")
        print(f"MATCH: {q} -> {tmdb.get('title')} ({year})")
    else:
        print(f"NO MATCH: {q}")
    time.sleep(0.05)

with open('scripts/enrich.sql', 'a', encoding='utf-8') as f:
    f.write('\n' + '\n'.join(stmts))
print(f"Appended {len(stmts)} statements")
