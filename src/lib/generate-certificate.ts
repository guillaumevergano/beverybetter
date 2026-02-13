// ============================================
// Be Very Better — Certificate HTML Generator
// ============================================
// Generates a styled HTML certificate page.
// Used by the API route to serve as a printable/PDF page.

interface CertificateData {
  pseudo: string;
  techName: string;
  techIcon: string;
  score: number;
  total: number;
  mention: string;
  certNumber: string;
  certifiedAt: string;
  verificationUrl: string;
}

export function generateCertificateHTML(data: CertificateData): string {
  const percentage = Math.round((data.score / data.total) * 100);
  const date = new Date(data.certifiedAt).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://beverybetter.com";
  const fullVerificationUrl = `${baseUrl}${data.verificationUrl}`;

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Certificat ${data.certNumber} — Be Very Better</title>
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700;800&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'DM Sans', sans-serif;
      background: #f8fafc;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding: 2rem;
    }
    .cert {
      background: white;
      width: 800px;
      max-width: 100%;
      padding: 60px;
      border-radius: 20px;
      border: 2px solid #e2e8f0;
      box-shadow: 0 4px 24px rgba(0,0,0,0.06);
      position: relative;
      overflow: hidden;
    }
    .cert::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 6px;
      background: linear-gradient(90deg, #0070f3, #10b981, #f59e0b, #ef4444);
    }
    .header {
      text-align: center;
      margin-bottom: 40px;
    }
    .logo {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 24px;
      font-weight: 800;
      color: #0f172a;
    }
    .logo span { color: #0070f3; }
    .title {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 32px;
      font-weight: 700;
      color: #0f172a;
      margin-top: 32px;
    }
    .subtitle {
      font-size: 16px;
      color: #64748b;
      margin-top: 8px;
    }
    .name {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 42px;
      font-weight: 800;
      color: #0070f3;
      text-align: center;
      margin: 32px 0 16px;
    }
    .mastery {
      text-align: center;
      font-size: 18px;
      color: #64748b;
    }
    .tech {
      font-weight: 700;
      color: #0f172a;
    }
    .score-section {
      display: flex;
      justify-content: center;
      gap: 40px;
      margin: 40px 0;
    }
    .score-item {
      text-align: center;
    }
    .score-value {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 28px;
      font-weight: 700;
      color: #0f172a;
    }
    .score-label {
      font-size: 13px;
      color: #94a3b8;
      margin-top: 4px;
    }
    .mention {
      text-align: center;
      display: inline-block;
      padding: 8px 24px;
      border-radius: 12px;
      font-weight: 700;
      font-size: 16px;
      background: #f0fdf4;
      color: #065f46;
      border: 2px solid #10b981;
    }
    .mention-container { text-align: center; margin: 24px 0; }
    .footer {
      margin-top: 48px;
      padding-top: 24px;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .footer-left {
      font-size: 12px;
      color: #94a3b8;
    }
    .footer-right {
      text-align: right;
      font-size: 12px;
      color: #94a3b8;
    }
    .cert-number { font-weight: 600; color: #64748b; }
    .verify-link {
      color: #0070f3;
      text-decoration: none;
      font-size: 11px;
    }
    @media print {
      body { background: white; padding: 0; }
      .cert { border: none; box-shadow: none; border-radius: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="cert">
    <div class="header">
      <div class="logo"><span>B</span> Be Very Better</div>
      <h1 class="title">Certificat de Compétence</h1>
      <p class="subtitle">Ce document atteste que</p>
    </div>

    <div class="name">${escapeHTML(data.pseudo)}</div>

    <p class="mastery">
      a démontré sa maîtrise de<br>
      <span class="tech">${data.techIcon} ${escapeHTML(data.techName)}</span>
    </p>

    <div class="score-section">
      <div class="score-item">
        <div class="score-value">${percentage}%</div>
        <div class="score-label">Score obtenu</div>
      </div>
      <div class="score-item">
        <div class="score-value">${data.score}/${data.total}</div>
        <div class="score-label">Bonnes réponses</div>
      </div>
    </div>

    <div class="mention-container">
      <span class="mention">Mention : ${escapeHTML(data.mention)}</span>
    </div>

    <div class="footer">
      <div class="footer-left">
        <div>Délivré le ${date}</div>
        <div class="cert-number">N° ${escapeHTML(data.certNumber)}</div>
      </div>
      <div class="footer-right">
        <div>Be Very Better</div>
        <a class="verify-link" href="${fullVerificationUrl}">${fullVerificationUrl}</a>
      </div>
    </div>
  </div>

  <div class="no-print" style="text-align:center;margin-top:24px;">
    <button onclick="window.print()" style="padding:12px 32px;background:#0070f3;color:white;border:none;border-radius:12px;font-size:14px;font-weight:600;cursor:pointer;">
      Imprimer / Sauvegarder en PDF
    </button>
  </div>
</body>
</html>`;
}

function escapeHTML(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
