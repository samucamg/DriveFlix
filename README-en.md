# 🎬 DriveFlin — Serverless Jellyfin on Cloudflare Workers & Google Drive

<p align="center">
  <a href="README.md"><img src="https://img.shields.io/badge/Portugu%C3%AAs-Brasil%20%F0%9F%87%A7%F0%9F%87%B7-2ea44f?style=for-the-badge" alt="Português (Brasil)"></a>
  <a href="README-en.md"><img src="https://img.shields.io/badge/English-USA%20%F0%9F%87%BA%F0%9F%87%B8-blue?style=for-the-badge" alt="English (US)"></a>
</p>

<p align="center">
  <a href="README.md">🇧🇷 <strong>Português</strong></a> &nbsp;|&nbsp; 🇺🇸 <strong>English</strong>
</p>

<p align="center">
  <img src="assets/DriveFlin.png" alt="DriveFlin Logo" width="320"/>
</p>

<p align="center">
  <strong>Transform your Google Drive into a high-performance, serverless personal streaming service with 100% Jellyfin client compatibility.</strong>
</p>

<p align="center">
  <a href="https://driveflin.org" target="_blank"><img src="https://img.shields.io/badge/Documentation-driveflin.org-0070f3?style=for-the-badge&logo=googlechrome&logoColor=white" alt="Documentation Website"></a>
  <a href="https://generator.driveflin.org" target="_blank"><img src="https://img.shields.io/badge/OAuth%20Generator-generator.driveflin.org-success?style=for-the-badge&logo=googlecloud&logoColor=white" alt="Token Generator"></a>
  <a href="#-repository-structure"><img src="https://img.shields.io/badge/Platform-Cloudflare%20Workers-orange?style=for-the-badge&logo=cloudflare" alt="Cloudflare Workers"></a>
  <a href="#-repository-structure"><img src="https://img.shields.io/badge/Storage-Google%20Drive-blue?style=for-the-badge&logo=googledrive" alt="Google Drive"></a>
  <a href="#-repository-structure"><img src="https://img.shields.io/badge/Database-Cloudflare%20D1-blueviolet?style=for-the-badge&logo=sqlite" alt="Cloudflare D1"></a>
</p>

<p align="center">
  <a href="https://driveflin.org" target="_blank"><strong>🌐 Official Website and Documentation: driveflin.org</strong></a>
</p>

---

## 📌 Overview

> 🌐 **Full Website & Documentation:** [https://driveflin.org](https://driveflin.org)  
> 🔑 **Automated Google Drive Connection Generator:** [https://generator.driveflin.org](https://generator.driveflin.org)  
> 📖 **Visual Deployment Guide:** [https://driveflin.org/deploy.php](https://driveflin.org/deploy.php)

**DriveFlin** is a complete, serverless reimplementation of the **Jellyfin** backend, engineered to run natively on **Cloudflare** global edge infrastructure (Workers + D1 SQL + Assets) streaming media directly from **Google Drive** (Personal or Shared/Team Drives).

With DriveFlin, you get all the features of the Jellyfin ecosystem — a modern Netflix-style dark web interface (JellyFlix), smart movie and TV show search, automated TMDB metadata, subtitle and dual audio track selection, Google Cast/Chromecast streaming, and full database backups — with **zero server hosting costs** and worldwide high availability.

---

## 📁 Repository Structure

The repository is structured cleanly, directly, and standardized for immediate deployment on Cloudflare Workers:

```text
DriveFlin/ (Repository Root)
├── src/
│   ├── index.ts          (Hono Worker: Jellyfin REST API routes & streaming engine)
│   ├── gdrive.ts         (Google Drive API v3 integration with full pagination)
│   ├── sync.ts           (Direct D1 library synchronization logic)
│   ├── tmdb.ts           (TMDB metadata search, synopses, posters & name cleaning)
│   ├── backup.ts         (Dual backup and restore routines: Google Drive + D1)
│   ├── inject.ts         (Web UI injection for Netflix dark theme & custom branding)
│   └── oauth_page.ts     (Built-in OAuth authentication & token exchange page)
├── public/               (Official Jellyfin Web client pre-configured for Workers)
├── wrangler.toml         (D1 database, Cron Triggers, and Worker config at root)
├── package.json          (Worker dependencies and scripts at root)
├── tsconfig.json         (TypeScript configuration for Workers)
├── schema.sql            (D1 database schema with default admin/admin account)
├── README.md             (Documentation and setup guide in Portuguese)
├── README-en.md          (Documentation and setup guide in English)
└── LICENSE               (MIT License)
```

---

## ✨ Key Features

- ⚡ **100% Serverless & Zero Hosting Cost**: No VPS, dedicated physical server, or 24/7 Docker container required. Runs within Cloudflare Workers' generous free tier.
- 📂 **Native Google Drive Integration**: High-speed direct streaming for `.mp4`, `.mkv`, `.avi`, `.mp3`, and `.flac` files.
- 🗂️ **Real-Time Folder Navigation**: When adding or editing a media library, browse your actual Google Drive folders visually right inside the Jellyfin dashboard.
- 🎬 **Automated Metadata & Posters via TMDB**: Automatic recognition of movie and TV show titles, overviews, release years, age ratings, and 1-click manual identification.
- 👥 **Automatic Version Grouping**: Multiple media files with the same title in a library are automatically merged into a single poster offering selectable *MediaSources*.
- 💾 **Dual Cloud Backup & 1-Click Restore**:
  - 1-click JSON snapshot exports of all tables (Libraries, Items, User Progress, Settings).
  - Dual persistence: automatically saved to the `DriveFlin_Backups` folder in Google Drive and Cloudflare D1.
  - Instant rollback and disaster recovery.
- 🎨 **Netflix Premium Interface (JellyFlix)**: Official Jellyfin Web client bundled with a cinematic dark theme, modern typography, and high-definition artwork.
- 📺 **Chromecast & Smart TV Streaming**: Fully compatible with the official Jellyfin Google Cast receiver app (`F007D354`), with native `206 Partial Content`, `Range` headers, and open CORS.
- 🔐 **Name Decryption with Rclone-Crypt**: Native support for encrypted or obfuscated media file and folder names on Google Drive.
- ⏰ **Automated Hourly Library Sync (Cron Trigger)**: Periodic background synchronization every hour (`0 * * * *`) to index newly uploaded media files.
- 🔑 **Built-In Google Drive Connection Generator**: Generate your secure Refresh Token in seconds without sharing credentials with third parties at [generator.driveflin.org](https://generator.driveflin.org).

---

## 🏗️ Architecture

```mermaid
flowchart TD
    User["👤 User (Browser / Mobile App / Chromecast)"]
    
    subgraph Cloudflare["☁️ Cloudflare Edge Network"]
        Worker["⚡ DriveFlin Worker (Hono Framework)"]
        D1[("🗄️ Cloudflare D1 (SQLite Database)")]
        Assets["📦 Jellyfin Web Frontend (Static Assets)"]
        Cron["⏰ Cron Trigger (Hourly)"]
    end
    
    subgraph External["🌐 External Services"]
        GDrive["📁 Google Drive API v3"]
        TMDB["🎬 The Movie Database (TMDB API)"]
    end

    User -->|HTTP / HTTPS| Worker
    User -->|Loads Web UI| Assets
    Cron -->|Triggers Sync| Worker
    Worker <-->|Queries & Stores Metadata| D1
    Worker <-->|Streams & Lists Folders| GDrive
    Worker <-->|Posters & Overviews| TMDB
```

---

## 🚀 Installation — 1-Click Deploy Button

There are **two ways** to deploy DriveFlin. The simplest is the **Deploy Button below**, which opens a Cloudflare setup wizard, shows all configuration fields as a form (including your TMDB API Key and Google Drive credentials), and does everything automatically.

---

### ⚡ Option A: Deploy with 1 Click (Recommended)

<p align="center">
  <a href="https://deploy.workers.cloudflare.com/?url=https://github.com/samucamg/DriveFlin" target="_blank">
    <img src="https://deploy.workers.cloudflare.com/button" alt="Deploy to Cloudflare Workers" />
  </a>
</p>

> [!TIP]
> **What this button does automatically:**
> - ✅ **Forks** the repository to your GitHub account
> - ✅ Creates the **D1 database** (`jellyfin_db_prod`) in your Cloudflare account
> - ✅ Shows **input fields** for you to fill in your credentials before deploying:
>   - `TMDB_API_KEY` (TheMovieDB API key)
>   - `GDRIVE_CLIENT_ID`, `GDRIVE_CLIENT_SECRET`, `GDRIVE_REFRESH_TOKEN` (Google Drive connection)
>   - Optional variables (admin password, Shared Drive, Rclone Crypt)
> - ✅ **Deploys** the Worker with everything configured at once

**Before clicking, have these ready:**

| What you need | Where to get it |
| :--- | :--- |
| 🔑 **TMDB API Key** | Free account at [themoviedb.org/settings/api](https://www.themoviedb.org/settings/api) |
| 🔗 **Google Drive OAuth** (Client ID, Secret, Refresh Token) | Free generator at [generator.driveflin.org](https://generator.driveflin.org) |
| ☁️ **Cloudflare account** (free) | Sign up at [cloudflare.com](https://cloudflare.com) |

---

### 🛠️ Option B: Manual Deploy via Cloudflare Workers & Pages (GitHub Import)

If you prefer to connect your fork manually to Cloudflare:

**Step 1: Fork**  
Click **Fork** in the top-right of this page and create your own copy of DriveFlin.

**Step 2: Create the D1 Database**  
In the [Cloudflare dashboard](https://dash.cloudflare.com), go to **Storage & Databases > D1 SQL Database > Create database**.  
Database name (exact): `jellyfin_db_prod`

> [!TIP]
> **Auto-Initialization:** You do NOT need to run SQL. DriveFlin automatically creates all tables the first time you open the site.

**Step 3: Connect in Workers & Pages**  
Go to **Workers & Pages > Create application > Connect GitHub**, select your `DriveFlin` fork, and click **Deploy**.

**Step 4: Add Your Credentials**  
After deployment, go to **Settings > Variables and Secrets** and add:

| Variable | Type | Description |
| :--- | :--- | :--- |
| `TMDB_API_KEY` | Secret | 🔑 Free key from [TheMovieDB](https://www.themoviedb.org/settings/api). **Required.** |
| `GDRIVE_CLIENT_ID` | Secret | Client ID from Google Cloud Console |
| `GDRIVE_CLIENT_SECRET` | Secret | Client Secret from Google Cloud Console |
| `GDRIVE_REFRESH_TOKEN` | Secret | Refresh Token from [generator.driveflin.org](https://generator.driveflin.org) |
| `ADMIN_PASSWORD` | Secret | *(Optional)* Admin password (default: `admin`) |
| `GDRIVE_TEAM_DRIVE_ID` | Secret | *(Optional)* Shared/Team Drive ID |
| `RCLONE_PASS` | Secret | *(Optional)* Rclone Crypt password |
| `RCLONE_SALT` | Secret | *(Optional)* Rclone Crypt salt |

Click **Save and Deploy**.

> [!NOTE]
> **Database binding error?**  
> Go to **Settings > Bindings > Add binding > D1 Database**, set variable name to `DB`, select `jellyfin_db_prod`, then click **Retry deployment**.

---

### Final Step: Access the Interface
1. Open your Worker's URL: `https://driveflin.your-subdomain.workers.dev/web/index.html`
2. **Initial login:** Username `admin` / Password `admin`
3. Go to **Dashboard > Libraries > + Add Media Library** and select your Google Drive folders!

---

## 💻 CLI Alternative: Deployment with Wrangler CLI

For developers who prefer managing everything locally via terminal:

```bash
# 1. Clone your repository
git clone https://github.com/samucamg/DriveFlin.git
cd DriveFlin

# 2. Install dependencies
npm install

# 3. Create Cloudflare D1 database
npx wrangler d1 create jellyfin_db_prod

# 4. Execute initial database schema
npx wrangler d1 execute jellyfin_db_prod --remote --file=schema.sql

# 5. Set secrets (including TMDB_API_KEY)
npx wrangler secret put TMDB_API_KEY
npx wrangler secret put GDRIVE_CLIENT_ID
npx wrangler secret put GDRIVE_CLIENT_SECRET
npx wrangler secret put GDRIVE_REFRESH_TOKEN

# 6. Deploy Worker
npx wrangler deploy
```

---

## 📖 Usage Guide & Daily Tips

1. **Factory Default Credentials**:
   - **Username**: `admin`
   - **Password**: `admin`
   - *We strongly recommend updating your password anytime in Dashboard > Users.*
2. **Identification & Posters (TMDB)**:
   - If an item does not load artwork automatically, click the three dots on the poster > **Identify**.
   - Type the movie or TV show title. DriveFlin will fetch and permanently persist high-resolution artwork and synopses.
3. **Generating & Restoring Backups**:
   - Go to **Dashboard** > **Backups**.
   - DriveFlin exports comprehensive `.json` snapshots saved both to Google Drive and Cloudflare D1 with 1-click restore.

---

## ⚖️ Project Purpose, Intended Use & Disclaimer

> [!IMPORTANT]
> **DriveFlin was engineered exclusively for personal use, private home media collections, and sharing among family and friends.**

- 🏠 **Personal Daily Focus**: DriveFlin's primary objective is to deliver a lightweight, zero-maintenance, and cost-free serverless streaming solution for everyday personal media consumption without keeping power-hungry PCs or servers running 24/7.
- 📚 **Massive Libraries (Thousands of Movies & TV Shows)**: For users managing massive catalogs (tens of thousands of titles and episodes), we strongly recommend using the **official [Jellyfin](https://jellyfin.org) desktop/server distribution (installed via Docker or Bare-Metal on dedicated PC/NAS)**. The official server offers multithreaded local database indexing and dedicated hardware video transcoding (GPU/FFmpeg).
- 🚫 **Not for Commercial Providers / Streaming Businesses**: DriveFlin is **NOT** designed, intended, or supported for internet providers, IPTV sellers, resellers, or commercial streaming distribution. For commercial or high-concurrency enterprise scenarios, we always and categorically recommend the official Jellyfin project infrastructure.
- ℹ️ **Trademark & Legal Notice**: DriveFlin is an independent open-source project compatible with the public API specifications of the Jellyfin and Google Drive ecosystems. It has NO affiliation, endorsement, sponsorship, or official connection with the Jellyfin Foundation or Google LLC.

---

## ⚠️ Important Constraints

- **Direct Play / Direct Stream Only**: Serverless edge environments (Cloudflare Workers / V8 Isolates) do not support binary executables like `ffmpeg` or dedicated GPUs. Therefore, **real-time server-side video transcoding is not supported**. Playback relies on the client device or web browser natively decoding the media formats (`H.264`, `AAC`, `MP3`, etc.).
- **C# (.NET) Plugins Not Supported**: Traditional Jellyfin plugins compiled as .NET DLLs are not supported, as DriveFlin's engine runs entirely on TypeScript/JavaScript inside V8 Isolates.

---

## 🔗 Useful Links & Official Documentation

- 🌐 **Website & Documentation:** [https://driveflin.org](https://driveflin.org)
- 🚀 **Illustrated Deployment Guide:** [https://driveflin.org/deploy.php](https://driveflin.org/deploy.php)
- 🔑 **Google Drive OAuth Connection Generator:** [https://generator.driveflin.org](https://generator.driveflin.org)
- 📂 **Library & Folder Organization Guide:** [https://driveflin.org/libraries.php](https://driveflin.org/libraries.php)
- ⚡ **Technical Differences & Serverless Architecture:** [https://driveflin.org/differences.php](https://driveflin.org/differences.php)
- ❓ **FAQ & Troubleshooting:** [https://driveflin.org/faq.php](https://driveflin.org/faq.php)
- 👥 **Community & Collaboration:** [https://driveflin.org/community.php](https://driveflin.org/community.php)

---

## 📄 License

Distributed under the MIT License. See [`LICENSE`](LICENSE) for details.

<p align="center">
  Developed with care for the open-source community. If this project helps you, please leave a ⭐ on GitHub!
</p>
