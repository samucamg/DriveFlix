// ==========================================================================
// DriveFlix - Built-in OAuth 2.0 Refresh Token Generator Page & API
// ==========================================================================

export const oauthHtml = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DriveFlix — Gerador de Conexão Google Drive</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Cascadia+Code:wght@400;600&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #0a0a0c;
      --surface: #141418;
      --surface-alt: #1a1a20;
      --surface-hover: #22222a;
      --border: #272730;
      --accent: #e50914;
      --accent-hover: #f40612;
      --accent-glow: rgba(229, 9, 20, 0.25);
      --text: #ffffff;
      --text-muted: #a3a3b2;
      --green: #10b981;
      --green-soft: rgba(16, 185, 129, 0.1);
      --yellow: #f59e0b;
      --yellow-soft: rgba(245, 158, 11, 0.1);
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background-color: var(--bg);
      color: var(--text);
      font-family: 'Inter', sans-serif;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 40px 20px;
    }
    .wrapper {
      width: 100%;
      max-width: 680px;
    }
    .header {
      text-align: center;
      margin-bottom: 32px;
    }
    .logo {
      font-size: 28px;
      font-weight: 800;
      margin-bottom: 8px;
      letter-spacing: -0.5px;
    }
    .logo span { color: var(--accent); }
    .subtitle {
      font-size: 15px;
      color: var(--text-muted);
      line-height: 1.5;
    }
    .card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 28px;
      margin-bottom: 24px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.5);
    }
    .step-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 26px;
      height: 26px;
      background: var(--accent);
      color: #fff;
      border-radius: 50%;
      font-size: 13px;
      font-weight: 700;
      margin-right: 8px;
    }
    .step-title {
      font-size: 16px;
      font-weight: 700;
      display: flex;
      align-items: center;
      margin-bottom: 14px;
    }
    .form-group {
      margin-bottom: 16px;
    }
    label {
      display: block;
      font-size: 13px;
      font-weight: 600;
      color: var(--text-muted);
      margin-bottom: 6px;
    }
    input[type="text"] {
      width: 100%;
      background: var(--bg);
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: 12px 14px;
      color: #fff;
      font-size: 14px;
      font-family: inherit;
      transition: all 0.2s;
    }
    input[type="text"]:focus {
      outline: none;
      border-color: var(--accent);
      box-shadow: 0 0 0 3px var(--accent-glow);
    }
    .form-help {
      font-size: 12px;
      color: #6e6e80;
      margin-top: 5px;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      width: 100%;
      padding: 12px 20px;
      font-size: 14px;
      font-weight: 600;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s;
      border: none;
    }
    .btn-primary {
      background: var(--accent);
      color: #fff;
    }
    .btn-primary:hover {
      background: var(--accent-hover);
      transform: translateY(-1px);
    }
    .btn-secondary {
      background: var(--surface-alt);
      color: #fff;
      border: 1px solid var(--border);
    }
    .btn-secondary:hover {
      background: var(--surface-hover);
      border-color: var(--text-muted);
    }
    .alert {
      padding: 14px 16px;
      border-radius: 6px;
      font-size: 13px;
      margin-bottom: 18px;
      display: flex;
      gap: 10px;
      align-items: flex-start;
      line-height: 1.5;
    }
    .alert-warning {
      background: var(--yellow-soft);
      border: 1px solid rgba(245, 158, 11, 0.3);
      color: #fde68a;
    }
    .alert-success {
      background: var(--green-soft);
      border: 1px solid rgba(16, 185, 129, 0.3);
      color: #a7f3d0;
    }
    .result-box {
      display: none;
      background: #000;
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 18px;
      margin-top: 20px;
    }
    .token-display {
      background: #111;
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: 10px 12px;
      font-family: 'Cascadia Code', monospace;
      font-size: 13px;
      color: var(--green);
      word-break: break-all;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
    }
    .copy-btn {
      background: var(--surface-alt);
      border: 1px solid var(--border);
      color: var(--text-muted);
      border-radius: 4px;
      padding: 4px 10px;
      font-size: 12px;
      cursor: pointer;
      flex-shrink: 0;
    }
    .copy-btn:hover { color: #fff; border-color: var(--accent); }
    .env-box {
      font-family: 'Cascadia Code', monospace;
      font-size: 12px;
      color: #cbd5e1;
      background: #0d0d11;
      padding: 12px;
      border-radius: 6px;
      border: 1px solid #1f1f27;
      white-space: pre-wrap;
      line-height: 1.6;
    }
    .footer {
      text-align: center;
      font-size: 13px;
      color: var(--text-muted);
      margin-top: 20px;
    }
    .footer a {
      color: var(--accent);
      text-decoration: none;
    }
    .footer a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div class="logo">🎬 Drive<span>Flix</span></div>
      <p class="subtitle">Gerador Seguro de Conexão Google Drive (OAuth 2.0)</p>
    </div>

    <div class="alert alert-warning">
      <span>💡</span>
      <div>
        <strong>100% Privado e Seguro:</strong> Este gerador roda diretamente no seu próprio Cloudflare Worker. Seus códigos e chaves não passam por nenhum servidor de terceiros.
      </div>
    </div>

    <div class="card">
      <div class="step-title">
        <span class="step-badge">1</span>
        Suas Credenciais do Google Cloud
      </div>
      
      <div class="form-group">
        <label for="clientId">Client ID</label>
        <input type="text" id="clientId" placeholder="ex: 123456789-xxxx.apps.googleusercontent.com">
        <div class="form-help">Criado no Google Cloud Console em Credenciais > ID do cliente OAuth (Desktop App).</div>
      </div>

      <div class="form-group">
        <label for="clientSecret">Client Secret</label>
        <input type="text" id="clientSecret" placeholder="ex: GOCSPX-xxxxxxxxxxxxxxxxxxxxxxxx">
      </div>

      <button class="btn btn-secondary" onclick="openGoogleAuth()">
        🔗 1. Abrir Autorização Google
      </button>
      <div id="authError" style="color: #f87171; font-size: 12px; margin-top: 8px; display: none;"></div>
    </div>

    <div class="card">
      <div class="step-title">
        <span class="step-badge">2</span>
        Código de Retorno da Google
      </div>

      <div class="form-group">
        <label for="authCode">Cole a URL de redirecionamento ou o código:</label>
        <input type="text" id="authCode" placeholder="http://localhost/?code=4/0Axxxx... ou o código 4/0A...">
        <div class="form-help">Após autorizar no Google, seu navegador mostrará uma página de erro (normal). Copie o endereço completo da barra de navegação e cole acima.</div>
      </div>

      <button class="btn btn-primary" id="exchangeBtn" onclick="exchangeToken()">
        🔑 2. Gerar Refresh Token
      </button>
      <div id="exchangeError" style="color: #f87171; font-size: 13px; margin-top: 10px; display: none;"></div>

      <div class="result-box" id="resultBox">
        <div class="alert alert-success" style="margin-bottom: 12px;">
          <span>✓</span>
          <div><strong>Sucesso!</strong> Seu Refresh Token foi gerado com sucesso!</div>
        </div>

        <label>Seu Refresh Token:</label>
        <div class="token-display">
          <span id="tokenVal"></span>
          <button class="copy-btn" onclick="copyToken()">Copiar</button>
        </div>

        <label style="margin-top: 14px;">Copie e adicione no Cloudflare (Workers & Pages > Settings > Variables and Secrets):</label>
        <div class="env-box" id="envBox"></div>
      </div>
    </div>

    <div class="footer">
      <a href="/web/index.html">← Voltar para a Interface do Jellyfin</a> &nbsp;•&nbsp; 
      <a href="https://console.cloud.google.com/" target="_blank">Google Cloud Console ↗</a> &nbsp;•&nbsp; 
      <a href="https://github.com/samucamg/DriveFlix" target="_blank">GitHub ↗</a>
    </div>
  </div>

  <script>
    function openGoogleAuth() {
      const cid = document.getElementById('clientId').value.trim();
      const err = document.getElementById('authError');
      if (!cid) {
        err.innerText = 'Preencha o Client ID antes de abrir a autorização.';
        err.style.display = 'block';
        return;
      }
      err.style.display = 'none';
      const authUrl = 'https://accounts.google.com/o/oauth2/v2/auth'
        + '?scope=' + encodeURIComponent('https://www.googleapis.com/auth/drive')
        + '&response_type=code'
        + '&access_type=offline'
        + '&prompt=consent'
        + '&client_id=' + encodeURIComponent(cid)
        + '&redirect_uri=' + encodeURIComponent('http://localhost');
      
      window.open(authUrl, '_blank');
    }

    async function exchangeToken() {
      const cid = document.getElementById('clientId').value.trim();
      const cs = document.getElementById('clientSecret').value.trim();
      const codeInput = document.getElementById('authCode').value.trim();
      const err = document.getElementById('exchangeError');
      const btn = document.getElementById('exchangeBtn');
      const resultBox = document.getElementById('resultBox');

      err.style.display = 'none';
      resultBox.style.display = 'none';

      if (!cid || !cs || !codeInput) {
        err.innerText = 'Preencha todos os campos (Client ID, Client Secret e Código).';
        err.style.display = 'block';
        return;
      }

      btn.disabled = true;
      btn.innerText = 'Trocando código com a Google...';

      try {
        const res = await fetch('/api/oauth/exchange', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: codeInput, clientId: cid, clientSecret: cs })
        });
        const data = await res.json();

        if (!data.success) {
          throw new Error(data.error || 'Erro desconhecido ao obter Refresh Token.');
        }

        document.getElementById('tokenVal').innerText = data.refresh_token;
        document.getElementById('envBox').innerText = 
          'GDRIVE_CLIENT_ID = ' + cid + '\\n' +
          'GDRIVE_CLIENT_SECRET = ' + cs + '\\n' +
          'GDRIVE_REFRESH_TOKEN = ' + data.refresh_token;

        resultBox.style.display = 'block';
      } catch (e) {
        err.innerText = 'Erro: ' + e.message;
        err.style.display = 'block';
      } finally {
        btn.disabled = false;
        btn.innerText = '🔑 2. Gerar Refresh Token';
      }
    }

    function copyToken() {
      const token = document.getElementById('tokenVal').innerText;
      navigator.clipboard.writeText(token).then(() => {
        alert('Refresh Token copiado para a área de transferência!');
      });
    }
  </script>
</body>
</html>`;
