export async function onRequestPost(context) {
  const { request, env } = context;
  
  try {
    const body = await request.json();
    const { slug, title, image, description, destination_url } = body;
    
    // Validation
    if (!slug || !title || !image || !destination_url) {
      return new Response(JSON.stringify({ 
        error: 'Missing required fields',
        required: ['slug', 'title', 'image', 'destination_url']
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Slug validation (alphanumeric, hyphen, underscore only)
    if (!/^[a-zA-Z0-9_-]+$/.test(slug)) {
      return new Response(JSON.stringify({ 
        error: 'Slug can only contain letters, numbers, hyphens and underscores' 
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // URL validation
    try {
      new URL(destination_url);
      new URL(image);
    } catch {
      return new Response(JSON.stringify({ 
        error: 'Invalid URL format. Must be full URL starting with http:// or https://' 
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Check if slug already exists
    const existing = await env.DB.prepare(
      "SELECT slug FROM links WHERE slug = ?"
    ).bind(slug).first();
    
    if (existing) {
      return new Response(JSON.stringify({ 
        error: 'Slug already exists. Choose a different one.' 
      }), { 
        status: 409,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Insert into D1
    await env.DB.prepare(
      `INSERT INTO links (slug, title, description, image, destination_url) 
       VALUES (?, ?, ?, ?, ?)`
    ).bind(slug, title, description || '', image, destination_url).run();
    
    const origin = new URL(request.url).origin;
    
    return new Response(JSON.stringify({ 
      success: true,
      message: 'Link created successfully',
      data: {
        slug,
        title,
        short_url: `${origin}/go/${slug}`,
        destination_url
      }
    }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    return new Response(JSON.stringify({ 
      error: 'Server error',
      details: error.message 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
