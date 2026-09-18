export async function onRequestGet(context) {
  const id = context.params.id;

  if (!id || !/^[A-Za-z0-9_-]{4,64}$/.test(id)) {
    return new Response("Invalid ID", {
      status: 400,
      headers: {
        "Content-Type": "text/plain; charset=UTF-8",
        "Cache-Control": "no-store"
      }
    });
  }

  const row = await context.env.DB
    .prepare(`
      SELECT id
      FROM links
      WHERE id = ?
    `)
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

  const destination = String(
    context.env.DESTINATION_URL || ""
  ).trim();

  if (!destination) {
    return new Response("Destination is not configured.", {
      status: 500,
      headers: {
        "Content-Type": "text/plain; charset=UTF-8",
        "Cache-Control": "no-store"
      }
    });
  }

  return Response.redirect(destination, 302);
}
