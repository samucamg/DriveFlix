# 🎬 DriveFlin — Serverless Jellyfin on Cloudflare Workers & Google Drive

<p align="center">
  <a href="README.md"><img src="https://img.shields.io/badge/Portugu%C3%AAs-Brasil%20%F0%9F%87%A7%F0%9F%87%B7-2ea44f?style=for-the-badge" alt="Português (Brasil)"></a>
  <a href="README-en.md"><img src="https://img.shields.io/badge/English-USA%20%F0%9F%87%BA%F0%9F%87%B8-blue?style=for-the-badge" alt="English (US)"></a>
</p>

<p align="center">
  🇧🇷 <strong>Português</strong> &nbsp;|&nbsp; <a href="README-en.md">🇺🇸 <strong>English</strong></a>
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
  <a href="#-estrutura-do-repositório"><img src="https://img.shields.io/badge/Platform-Cloudflare%20Workers-orange?style=for-the-badge&logo=cloudflare" alt="Cloudflare Workers"></a>
  <a href="#-estrutura-do-repositório"><img src="https://img.shields.io/badge/Storage-Google%20Drive-blue?style=for-the-badge&logo=googledrive" alt="Google Drive"></a>
  <a href="#-estrutura-do-repositório"><img src="https://img.shields.io/badge/Database-Cloudflare%20D1-blueviolet?style=for-the-badge&logo=sqlite" alt="Cloudflare D1"></a>
</p>

<p align="center">
  <a href="https://driveflin.org" target="_blank"><strong>🌐 Website e Documentação Oficial: driveflin.org</strong></a>
</p>

---

## 📌 Visão Geral / Overview

> 🌐 **Site e Documentação Completa:** [https://driveflin.org](https://driveflin.org)  
> 🔑 **Gerador Automático de Conexão Google Drive:** [https://generator.driveflin.org](https://generator.driveflin.org)  
> 📖 **Guia Visual de Deploy:** [https://driveflin.org/deploy.php](https://driveflin.org/deploy.php)

**DriveFlin** é uma implementação completa e serverless do backend do **Jellyfin**, projetada para rodar nativamente sobre a infraestrutura global da **Cloudflare** (Workers + D1 SQL + Assets) consumindo arquivos de mídia diretamente do **Google Drive** (Pessoal ou Shared/Team Drives).

Com o DriveFlin, você tem todos os recursos do ecossistema Jellyfin — interface web moderna com tema Netflix (JellyFlix), busca inteligente de filmes e séries, metadados automáticos do TMDB, suporte a legendas e dual áudio, transmissão para Chromecast e recuperação de backups — com **custo zero de servidor** e alta disponibilidade mundial.

---

## 📁 Estrutura do Repositório

O repositório foi organizado de forma limpa, direta e padronizada para deploy imediato na Cloudflare Workers:

```text
DriveFlin/ (Raiz do repositório)
├── src/
│   ├── index.ts          (Worker Hono: rotas do Jellyfin API e streaming)
│   ├── gdrive.ts         (Integração Google Drive API v3 com paginação)
│   ├── sync.ts           (Sincronização de bibliotecas direta no D1)
│   ├── tmdb.ts           (Busca de metadados, sinopses e capas TMDB)
│   ├── backup.ts         (Rotinas de backup e restauração dupla)
│   ├── inject.ts         (Injeção de scripts e customizações na Web UI)
│   └── oauth_page.ts     (Página interna de autenticação OAuth)
├── public/               (Interface Web oficial do Jellyfin pronta para o Worker)
├── wrangler.toml         (Configuração D1, Cron Triggers e Worker na raiz)
├── package.json          (Dependências e scripts do Worker na raiz)
├── tsconfig.json         (Configuração TypeScript para Workers)
├── schema.sql            (Esquema do banco D1 com usuário padrão admin/admin)
├── README.md             (Documentação completa e guia de instalação em Português)
├── README-en.md          (Documentação e guia de instalação em Inglês)
└── LICENSE               (Licença MIT)
```

---

## ✨ Recursos Principais

- ⚡ **100% Serverless & Custo Zero**: Não requer VPS, servidor dedicado nem Docker ligado 24/7. Executa no plano gratuito da Cloudflare.
- 📂 **Integração Nativa com Google Drive**: Streaming direto de arquivos `.mp4`, `.mkv`, `.avi`, `.mp3` e `.flac`.
- 🗂️ **Navegação de Pastas no Painel**: Ao criar ou editar uma biblioteca, navegue pelas pastas do Google Drive diretamente na janela do Jellyfin.
- 🎬 **Metadados & Capas via TMDB**: Identificação automática de títulos, sinopse, ano, classificação indicativa e busca remota com 1 clique.
- 👥 **Agrupamento Automático de Versões**: Múltiplos arquivos com o mesmo nome na biblioteca são unificados em um único cartaz com seleção de fontes de mídia (*MediaSources*).
- 💾 **Sistema Duplo de Backup & Restauração**:
  - Exportação em 1 clique de todas as tabelas (Bibliotecas, Itens, Progresso e Configurações).
  - Salva os backups na pasta `DriveFlin_Backups` do seu Google Drive e na tabela interna do Cloudflare D1.
  - Restauração instantânea para fácil migração.
- 🎨 **Interface Netflix Premium (JellyFlix)**: Jellyfin Web oficial pré-configurado com tema escuro estilo Netflix, fontes modernas e cartazes em alta definição.
- 📺 **Transmissão para Chromecast & Smart TVs**: Compatível com o app oficial do Jellyfin para Google Cast (`F007D354`), suporte a `206 Partial Content`, cabeçalhos `Range` e CORS aberto.
- 🔐 **Descriptografia de Nomes via Rclone-Crypt**: Suporte a nomes de arquivos ofuscados ou criptografados via Rclone no Google Drive.
- ⏰ **Tarefas Agendadas Automáticas (Cron Trigger)**: Sincronização periódica a cada hora (`0 * * * *`) para indexar novos arquivos adicionados ao Google Drive.
- 🔑 **Gerador de Conexão Google Drive Embutido**: Obtenha seu Refresh Token de forma 100% segura e privada pelo [generator.driveflin.org](https://generator.driveflin.org).

---

## 🏗️ Arquitetura

```mermaid
flowchart TD
    User["👤 Usuário (Navegador / App / Chromecast)"]
    
    subgraph Cloudflare["☁️ Cloudflare Edge Network"]
        Worker["⚡ DriveFlin Worker (Hono Framework)"]
        D1[("🗄️ Cloudflare D1 (SQLite Database)")]
        Assets["📦 Jellyfin Web Frontend (Static Assets)"]
        Cron["⏰ Cron Trigger (1h)"]
    end
    
    subgraph External["🌐 Serviços Externos"]
        GDrive["📁 Google Drive API v3"]
        TMDB["🎬 The Movie Database (TMDB API)"]
    end

    User -->|HTTP / HTTPS| Worker
    User -->|Acessa Web UI| Assets
    Cron -->|Dispara Sincronização| Worker
    Worker <-->|Consulta & Grava Metadados| D1
    Worker <-->|Streaming & Leitura de Pastas| GDrive
    Worker <-->|Posters & Sinopses| TMDB
```

---

### 🚀 Instalação — 1 Clique com o Botão Deploy

A instalação pode ser feita de **duas formas**. A mais simples é o **botão de deploy abaixo**, que abre um assistente visual da Cloudflare, preenche todos os campos de configuração (incluindo sua TMDB API Key e credenciais do Google Drive) e faz tudo automaticamente.

---

### ⚡ Opção A: Deploy com 1 Clique (Recomendado)

<p align="center">
  <a href="https://deploy.workers.cloudflare.com/?url=https://github.com/samucamg/DriveFlin" target="_blank">
    <img src="https://deploy.workers.cloudflare.com/button" alt="Deploy to Cloudflare Workers" />
  </a>
</p>

> [!TIP]
> **O que esse botão faz automaticamente:**
> - ✅ Faz o **fork** do repositório para a sua conta do GitHub
> - ✅ Cria o **banco D1** (`jellyfin_db_prod`) na sua conta da Cloudflare
> - ✅ Exibe **campos de formulário** para você preencher suas credenciais antes de implantar:
>   - `TMDB_API_KEY` (chave da API do TheMovieDB)
>   - `GDRIVE_CLIENT_ID`, `GDRIVE_CLIENT_SECRET`, `GDRIVE_REFRESH_TOKEN` (conexão Google Drive)
>   - Variáveis opcionais (senha admin, Shared Drive, Rclone Crypt)
> - ✅ Faz o **deploy** do Worker com tudo configurado de uma vez

**Antes de clicar no botão, tenha em mãos:**

| O que você precisa | Onde obter |
| :--- | :--- |
| 🔑 **TMDB API Key** | Conta gratuita em [themoviedb.org/settings/api](https://www.themoviedb.org/settings/api) |
| 🔗 **Google Drive OAuth** (Client ID, Secret, Refresh Token) | Use o gerador gratuito em [generator.driveflin.org](https://generator.driveflin.org) |
| ☁️ **Conta Cloudflare** (gratuita) | Cadastre-se em [cloudflare.com](https://cloudflare.com) |

---

### 🛠️ Opção B: Deploy Manual via Cloudflare Workers & Pages (GitHub Import)

Se preferir fazer o deploy conectando manualmente seu fork do GitHub à Cloudflare:

**Passo 1: Faça o Fork**  
Clique em **Fork** no canto superior direito desta página e crie uma cópia do DriveFlin na sua conta.

**Passo 2: Crie o Banco D1**  
No [painel da Cloudflare](https://dash.cloudflare.com), vá em **Storage & Databases > D1 SQL Database > Create database**.  
Nome do banco (exato): `jellyfin_db_prod`

> [!TIP]
> **Auto-Inicialização:** Você NÃO precisa rodar SQL. O DriveFlin cria todas as tabelas automaticamente na primeira vez que você abrir o site.

**Passo 3: Conecte no Workers & Pages**  
Em **Workers & Pages > Create application > Connect GitHub**, selecione seu fork `DriveFlin` e clique em **Deploy**.

**Passo 4: Adicione suas Credenciais**  
Após o deploy, vá em **Settings > Variables and Secrets** e adicione:

| Variável | Tipo | Descrição |
| :--- | :--- | :--- |
| `TMDB_API_KEY` | Secret | 🔑 Chave gratuita do [TheMovieDB](https://www.themoviedb.org/settings/api). **Obrigatória.** |
| `GDRIVE_CLIENT_ID` | Secret | Client ID do Google Cloud Console |
| `GDRIVE_CLIENT_SECRET` | Secret | Client Secret do Google Cloud Console |
| `GDRIVE_REFRESH_TOKEN` | Secret | Refresh Token de [generator.driveflin.org](https://generator.driveflin.org) |
| `ADMIN_PASSWORD` | Secret | *(Opcional)* Senha do admin (padrão: `admin`) |
| `GDRIVE_TEAM_DRIVE_ID` | Secret | *(Opcional)* ID do Shared/Team Drive |
| `RCLONE_PASS` | Secret | *(Opcional)* Senha Rclone Crypt |
| `RCLONE_SALT` | Secret | *(Opcional)* Salt Rclone Crypt |

Clique em **Save and Deploy**.

> [!NOTE]
> **Erro de banco não encontrado?**  
> Vá em **Settings > Bindings > Add binding > D1 Database**, defina a variável como `DB` e selecione `jellyfin_db_prod`. Depois clique em **Retry deployment**.

---

### Passo Final: Acessar a Interface
1. Abra a URL do seu Worker: `https://driveflin.seu-subdominio.workers.dev/web/index.html`
2. **Login inicial:** Usuário `admin` / Senha `admin`
3. Vá em **Painel > Bibliotecas > + Adicionar Biblioteca** e selecione suas pastas do Google Drive!

---

## 💻 Alternativa: Deploy via Linha de Comando (Wrangler CLI)

Para desenvolvedores que preferem gerenciar tudo pelo terminal local:

```bash
# 1. Clonar o repositório
git clone https://github.com/samucamg/DriveFlin.git
cd DriveFlin

# 2. Instalar dependências
npm install

# 3. Criar banco D1 na Cloudflare
npx wrangler d1 create jellyfin_db_prod

# 4. Executar o schema inicial
npx wrangler d1 execute jellyfin_db_prod --remote --file=schema.sql

# 5. Configurar os segredos (incluindo TMDB_API_KEY)
npx wrangler secret put TMDB_API_KEY
npx wrangler secret put GDRIVE_CLIENT_ID
npx wrangler secret put GDRIVE_CLIENT_SECRET
npx wrangler secret put GDRIVE_REFRESH_TOKEN

# 6. Publicar o Worker
npx wrangler deploy
```

---

## 📖 Como Usar & Dicas do Dia a Dia

1. **Credenciais de Fábrica**:
   - **Usuário**: `admin`
   - **Senha**: `admin`
   - *Recomendamos alterar a senha a qualquer momento no menu de usuários do painel.*
2. **Identificação e Capas (TMDB)**:
   - Se algum título não carregar a capa automaticamente, clique nos três pontinhos do cartaz > **Identificar**.
   - Digite o nome do filme ou série. O DriveFlin salvará a capa em alta resolução e a sinopse em português de forma permanente.
3. **Gerar e Restaurar Backups**:
   - Acesse **Painel de Controle** > **Backups**.
   - O sistema gera arquivos `.json` gravados tanto no Google Drive quanto no Cloudflare D1 para restauração com 1 clique.

---

## ⚖️ Propósito do Projeto, Uso Recomendado & Isenção (Disclaimer)

> [!IMPORTANT]
> **O DriveFlin foi desenvolvido exclusivamente para uso pessoal, acervos familiares e compartilhamento privado com amigos.**

- 🏠 **Foco em Uso Pessoal e Diário**: O objetivo primordial do DriveFlin é oferecer uma alternativa serverless econômica, ágil e livre de manutenção para o consumo diário de mídia, eliminando a necessidade de manter computadores ou servidores dedicados ligados 24 horas por dia consumindo energia.
- 📚 **Bibliotecas com Milhares de Filmes e Séries**: Para acervos de grande porte (milhares de filmes, séries e dezenas de milhares de episódios), recomendamos utilizar o **aplicativo desktop / servidor tradicional do [Jellyfin Oficial](https://jellyfin.org)** (instalado em PC dedicado, NAS ou Docker). O servidor oficial conta com banco de dados local de alta capacidade, indexação multithread pesada e suporte a transcodificação dedicada por GPU/FFmpeg.
- 🚫 **Não Indicado para Provedores e Fins Comerciais**: O DriveFlin **NÃO** é indicado, projetado ou homologado para provedores de internet, revendedores de listas/contas, empresas ou qualquer atividade comercial de distribuição de streaming. Nesses cenários corporativos ou de grande volume de tráfego concorrente, recomendamos sempre e categoricamente a infraestrutura e a distribuição do projeto oficial do Jellyfin.
- ℹ️ **Isenção de Vínculo**: O DriveFlin é uma implementação independente e open-source compatível com as APIs abertas do ecossistema Jellyfin e Google Drive. Não possui vínculo, afiliação, patrocínio ou endosso da Jellyfin Foundation ou da Google LLC.

---

## ⚠️ Limitações Importantes

- **Apenas Direct Play / Direct Stream**: O ambiente serverless de borda (Cloudflare Workers / V8 Isolates) não possui suporte a execução de binários locais como `ffmpeg` nem placas de vídeo dedicadas. Portanto, **não há transcodificação de vídeo em tempo real**. A reprodução depende da capacidade do navegador ou dispositivo do usuário decodificar diretamente os formatos de mídia (`H.264`, `AAC`, `MP3`, etc.).
- **Plugins Jellyfin em C# (.NET)**: Plugins tradicionais compilados em DLLs .NET não são suportados, pois o backend roda inteiramente em TypeScript/JavaScript na V8.

---

## 🔗 Links Úteis e Documentação Oficial

- 🌐 **Website e Documentação:** [https://driveflin.org](https://driveflin.org)
- 🚀 **Tutorial Ilustrado de Deploy:** [https://driveflin.org/deploy.php](https://driveflin.org/deploy.php)
- 🔑 **Gerador de Conexão OAuth Google Drive:** [https://generator.driveflin.org](https://generator.driveflin.org)
- 📂 **Organização de Bibliotecas e Pastas:** [https://driveflin.org/libraries.php](https://driveflin.org/libraries.php)
- ⚡ **Comparativo Técnico e Serverless:** [https://driveflin.org/differences.php](https://driveflin.org/differences.php)
- ❓ **FAQ e Resolução de Problemas:** [https://driveflin.org/faq.php](https://driveflin.org/faq.php)
- 👥 **Comunidade e Colaboração:** [https://driveflin.org/community.php](https://driveflin.org/community.php)

---

## 📄 Licença

Distribuído sob a licença MIT. Consulte [`LICENSE`](LICENSE) para mais detalhes.

<p align="center">
  Desenvolvido com carinho para a comunidade open-source. Se este projeto foi útil para você, deixe uma ⭐ no repositório!
</p>
