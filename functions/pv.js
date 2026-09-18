export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  
  // ?id= parameter lo
  const id = url.searchParams.get('id');
  
  if (!id || !/^\d{6,7}$/.test(id)) {
    return new Response('Invalid ID. Use 6-7 digit numeric ID.', { status: 400 });
  }
  
  // D1 se fetch karo
  const link = await env.DB.prepare(
    "SELECT * FROM pv_links WHERE numeric_id = ?"
  ).bind(id).first();
  
  if (!link) {
    return new Response('Link not found', { status: 404 });
  }
  
  const userAgent = request.headers.get('user-agent') || '';
  const lowerUA = userAgent.toLowerCase();
  
  const isBot = [
    'twitterbot', 'facebookexternalhit', 'linkedinbot',
    'whatsapp', 'telegrambot', 'discordbot', 'slackbot',
    'bot', 'crawler', 'spider'
  ].some(bot => lowerUA.includes(bot));
  
  if (isBot) {
    // BOT ko fake imgur preview dikhaye
    const fakeImgurUrl = `https://imgur.com/gallery/${link.numeric_id}`;
    
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  
  <!-- Yeh line Twitter ko imgur.com dikhati hai -->
  <meta property="og:url" content="${fakeImgurUrl}">
  <meta property="og:type" content="website">
  <meta property="og:title" content="${escapeHtml(link.title)}">
  <meta property="og:description" content="${escapeHtml(link.description || 'View on Imgur')}">
  <meta property="og:image" content="${link.image}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  
  <!-- Twitter specific -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:site" content="@imgur">
  <meta name="twitter:title" content="${escapeHtml(link.title)}">
  <meta name="twitter:description" content="${escapeHtml(link.description || 'View on Imgur')}">
  <meta name="twitter:image" content="${link.image}">
  <meta name="twitter:image:src" content="${link.image}">
  
  <title>${escapeHtml(link.title)} - Imgur</title>
</head>
<body style="margin:0;background:#000;display:flex;justify-content:center;align-items:center;height:100vh;">
  <img src="${link.image}" style="max-width:100%;max-height:100vh;" alt="Image">
</body>
</html>`;
    
    return new Response(html, {
      status: 200,
      headers: { 
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=3600'
      }
    });
    
  } else {
    // REAL USER ko redirect
    return Response.redirect(link.destination_url, 302);
  }
}

function escapeHtml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}
