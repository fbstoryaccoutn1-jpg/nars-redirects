export async function onRequestPost(context) {
  const { request, env } = context;
  
  try {
    const body = await request.json();
    const { title, image, description, destination_url } = body;
    
    if (!title || !image || !destination_url) {
      return new Response(JSON.stringify({ 
        error: 'Missing required fields' 
      }), { status: 400, headers: { 'Content-Type': 'application/json' }});
    }
    
    // Validate URLs
    try {
      new URL(destination_url);
      new URL(image);
    } catch {
      return new Response(JSON.stringify({ 
        error: 'Invalid URL format' 
      }), { status: 400, headers: { 'Content-Type': 'application/json' }});
    }
    
    // Generate random 6-7 digit ID
    const numericId = Math.floor(100000 + Math.random() * 9000000).toString();
    
    // Check if exists
    const existing = await env.DB.prepare(
      "SELECT numeric_id FROM pv_links WHERE numeric_id = ?"
    ).bind(numericId).first();
    
    if (existing) {
      return new Response(JSON.stringify({ 
        error: 'ID collision, try again' 
      }), { status: 409, headers: { 'Content-Type': 'application/json' }});
    }
    
    // Insert
    await env.DB.prepare(
      `INSERT INTO pv_links (numeric_id, title, description, image, destination_url, created_at) 
       VALUES (?, ?, ?, ?, ?, datetime('now'))`
    ).bind(numericId, title, description || '', image, destination_url).run();
    
    const origin = new URL(request.url).origin;
    
    return new Response(JSON.stringify({ 
      success: true,
      numeric_id: numericId,
      pv_url: `${origin}/pv?id=${numericId}`,
      destination: destination_url
    }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    return new Response(JSON.stringify({ 
      error: error.message 
    }), { status: 500, headers: { 'Content-Type': 'application/json' }});
  }
}
