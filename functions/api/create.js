export async function onRequestPost(context) {
  try {
    const body = await context.request.json();

    const imageUrl = String(body.image_url || "").trim();

    const title = String(body.title || "Image")
      .trim()
      .slice(0, 200);

    if (!imageUrl) {
      return json(
        {
          error: "Image URL is required."
        },
        400
      );
    }

    let parsedUrl;

    try {
      parsedUrl = new URL(imageUrl);
    } catch {
      return json(
        {
          error: "Invalid image URL."
        },
        400
      );
    }

    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      return json(
        {
          error: "Only HTTP and HTTPS image URLs are allowed."
        },
        400
      );
    }

    const id = generateId();

    await context.env.DB
      .prepare(`
        INSERT INTO links (
          id,
          image_url,
          title
        )
        VALUES (?, ?, ?)
      `)
      .bind(
        id,
        imageUrl,
        title || "Image"
      )
      .run();

    const requestUrl = new URL(
      context.request.url
    );

    const publicUrl =
      requestUrl.origin +
      "/pv.php?id=" +
      encodeURIComponent(id);

    return json({
      success: true,
      id: id,
      title: title || "Image",
      image_url: imageUrl,
      url: publicUrl
    });

  } catch (error) {

    return json(
      {
        error: "Unable to create link."
      },
      500
    );

  }
}


function generateId() {

  const chars =
    "0123456789abcdefghijklmnopqrstuvwxyz";

  const bytes =
    new Uint8Array(8);

  crypto.getRandomValues(bytes);

  let result = "";

  for (const byte of bytes) {
    result +=
      chars[byte % chars.length];
  }

  return result;
}


function json(
  data,
  status = 200
) {

  return new Response(
    JSON.stringify(data),
    {
      status: status,

      headers: {
        "Content-Type":
          "application/json; charset=UTF-8",

        "Cache-Control":
          "no-store"
      }
    }
  );
}
