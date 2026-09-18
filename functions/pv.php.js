export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const id = url.searchParams.get("id");

  if (!id || !/^[A-Za-z0-9_-]{4,64}$/.test(id)) {
    return new Response("Invalid or missing ID", {
      status: 400,
      headers: {
        "Content-Type": "text/plain; charset=UTF-8",
        "Cache-Control": "no-store"
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
        "Content-Type": "text/plain; charset=UTF-8",
        "Cache-Control": "no-store"
      }
    });
  }

  const imageUrl = String(row.image_url || "").trim();
  const destination = String(context.env.DESTINATION_URL || "").trim();

  if (!imageUrl) {
    return new Response("Image is not configured.", {
      status: 500,
      headers: {
        "Content-Type": "text/plain; charset=UTF-8"
      }
    });
  }

  if (!destination) {
    return new Response("Destination is not configured.", {
      status: 500,
      headers: {
        "Content-Type": "text/plain; charset=UTF-8"
      }
    });
  }

  const safeImageUrl = escapeHtml(imageUrl);
  const safeDestination = escapeHtml(destination);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">

  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <meta property="og:type" content="website">
  <meta property="og:title" content="Image">
  <meta property="og:image" content="${safeImageUrl}">
  <meta property="og:image:secure_url" content="${safeImageUrl}">

  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="Image">
  <meta name="twitter:image" content="${safeImageUrl}">

  <title>Image</title>

  <style>
    * {
      box-sizing: border-box;
    }

    html,
    body {
      margin: 0;
      padding: 0;
      width: 100%;
      min-height: 100%;
      background: #111;
      font-family: Arial, sans-serif;
    }

    body {
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 20px;
    }

    .container {
      width: min(900px, 100%);
      text-align: center;
    }

    .image {
      display: block;
      width: 100%;
      max-height: 80vh;
      object-fit: contain;
      border-radius: 12px;
    }

    .continue {
      display: inline-block;
      margin-top: 18px;
      padding: 12px 24px;
      background: #ffffff;
      color: #111111;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 700;
    }
  </style>
</head>

<body>

  <main class="container">

    <img
      class="image"
      src="${safeImageUrl}"
      alt="Image"
    >

    <a
      class="continue"
      href="${safeDestination}"
      rel="nofollow"
    >
      Continue
    </a>

  </main>

  <script>
    setTimeout(function () {
      window.location.assign(${JSON.stringify(destination)});
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
