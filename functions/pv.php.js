export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const id = url.searchParams.get("id");

  if (!id || !/^[A-Za-z0-9_-]{4,64}$/.test(id)) {
    return new Response("Invalid or missing ID", {
      status: 400,
      headers: {
        "Content-Type": "text/plain; charset=UTF-8"
      }
    });
  }

  const row = await context.env.DB
    .prepare("SELECT id, image_url FROM links WHERE id = ?")
    .bind(id)
    .first();

  if (!row) {
    return new Response("Link not found", {
      status: 404,
      headers: {
        "Content-Type": "text/plain; charset=UTF-8"
      }
    });
  }

  const imageUrl = row.image_url;
  const destination = context.env.DESTINATION_URL;

  if (!destination) {
    return new Response("Destination is not configured.", {
      status: 500,
      headers: {
        "Content-Type": "text/plain; charset=UTF-8"
      }
    });
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <meta property="og:type" content="website">
  <meta property="og:title" content="Image">
  <meta property="og:image" content="${escapeHtml(imageUrl)}">
  <meta property="og:image:secure_url" content="${escapeHtml(imageUrl)}">

  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="Image">
  <meta name="twitter:image" content="${escapeHtml(imageUrl)}">

  <title>Image</title>

  <style>
    * {
      box-sizing: border-box;
    }

    html,
    body {
      margin: 0;
      padding: 0;
      min-height: 100%;
      background: #111;
      font-family: Arial, sans-serif;
    }

    body {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }

    .box {
      width: min(900px, 100%);
      text-align: center;
    }

    img {
      display: block;
      width: 100%;
      max-height: 80vh;
      object-fit: contain;
      border-radius: 12px;
    }

    .open {
      display: inline-block;
      margin-top: 18px;
      padding: 12px 22px;
      border-radius: 8px;
      background: #fff;
      color: #111;
      text-decoration: none;
      font-weight: 700;
    }
  </style>
</head>

<body>
  <main class="box">
    <img src="${escapeHtml(imageUrl)}" alt="Image">
    <a class="open" href="${escapeHtml(destination)}">Continue</a>
  </main>

  <script>
    setTimeout(function () {
      window.location.href = ${JSON.stringify(destination)};
    }, 2500);
  </script>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=UTF-8",
      "Cache-Control": "public, max-age=300"
    }
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
