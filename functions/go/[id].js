export async function onRequestGet(context) {
  const { request, env } = context;
  
  // URL se slug nikalo
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/');
  const slug = pathParts[pathParts.length - 1] || pathParts[pathParts.length - 2];
  
  if (!slug || slug === 'go') {
    return new Response('Invalid link', { status: 400 });
  }
  
  // D1 se link fetch karo
  const link = await env.DB.prepare(
    "SELECT * FROM links WHERE slug = ?"
  ).bind(slug).first();
  
  if (!link) {
    return new Response('Link not found', { status: 404 });
  }
  
  const userAgent = request.headers.get('user-agent') || '';
  const lowerUA = userAgent.toLowerCase();
  
  // Bot detection
  const isBot = [
    'twitterbot', 'facebookexternalhit', 'linkedinbot', 
    'whatsapp', 'telegrambot', 'discordbot', 'slackbot',
    'googlebot', 'bingbot', 'yandexbot', 'applebot',
    'bot', 'crawler', 'spider', 'preview'
  ].some(bot => lowerUA.includes(bot));
  
  if (isBot) {
    // BOT ko 200 + HTML with Open Graph meta tags
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="website">
  <meta property="og:url" content="${request.url}">
  <meta property="og:title" content="${escapeHtml(link.title)}">
  <meta property="og:description" content="${escapeHtml(link.description || 'Click to view')}">
  <meta property="og:image" content="${link.image}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:site_name" content="Imgur">
  
  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:site" content="@imgur">
  <meta name="twitter:creator" content="@imgur">
  <meta name="twitter:title" content="${escapeHtml(link.title)}">
  <meta name="twitter:description" content="${escapeHtml(link.description || 'Click to view')}">
  <meta name="twitter:image" content="${link.image}">
  <meta name="twitter:image:alt" content="${escapeHtml(link.title)}">
  
  <title>${escapeHtml(link.title)} - Imgur</title>
  <style>
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
      text-align: center; 
      padding: 50px; 
      background: #f8f9fa;
      color: #333;
    }
    .container { max-width: 600px; margin: 0 auto; }
    .loader { 
      border: 4px solid #e9ecef; 
      border-top: 4px solid #007bff; 
      border-radius: 50%; 
      width: 40px; 
      height: 40px; 
      animation: spin 1s linear infinite; 
      margin: 30px auto; 
    }
    @keyframes spin { 
      0% { transform: rotate(0deg); } 
      100% { transform: rotate(360deg); } 
    }
    h1 { font-size: 24px; margin-bottom: 10px; }
    p { color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <h1>${escapeHtml(link.title)}</h1>
    <div class="loader"></div>
    <p>Loading content...</p>
  </div>
</body>
</html>`;
    
    return new Response(html, {
      status: 200,
      headers: { 
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
        'X-Robots-Tag': 'index, follow'
      }
    });
  } else {
    // REAL USER ko 302 redirect
    return Response.redirect(link.destination_url, 302);
  }
}

function escapeHtml(text) {
  if (!text) return '';
  const div = typeof document !== 'undefined' ? document.createElement('div') : null;
  if (div) {
    div.textContent = text;
    return div.innerHTML;
  }
  // Server-side fallback
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
