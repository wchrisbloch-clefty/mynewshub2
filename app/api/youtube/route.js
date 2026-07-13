const YT = 'https://www.googleapis.com/youtube/v3';

function norm(video, channelTitle) {
  const { id, snippet, statistics } = video;
  const views = parseInt(statistics?.viewCount || '0', 10);
  const pub   = snippet?.publishedAt || new Date().toISOString();
  const ageH  = (Date.now() - new Date(pub).getTime()) / 3_600_000;
  const vph   = views / Math.max(ageH, 1);
  const signal =
    vph > 50_000 ? 'high'     :
    vph > 5_000  ? 'rising'   : 'moderate';
  const velocityNum =
    signal === 'high'   ? Math.round(vph / 1000) * 10 :
    signal === 'rising' ? Math.round(vph / 100)  * 5  :
                          Math.round(vph / 100);
  const videoId = typeof id === 'string' ? id : id?.videoId;
  return {
    id:       videoId,
    author:   channelTitle || snippet?.channelTitle || 'YouTube',
    platform: 'YouTube',
    time:     pub,
    signal,
    velocity: `+${velocityNum}%`,
    bw:       (snippet?.tags || []).slice(0, 4),
    eng:      `${(views / 1000).toFixed(0)}K views`,
    content:  `${snippet?.title || ''}\n\n${(snippet?.description || '').slice(0, 200)}`,
    url:      `https://youtube.com/watch?v=${videoId}`,
  };
}

async function channelVideos(handle, key) {
  const r1 = await fetch(
    `${YT}/channels?part=contentDetails,snippet&forHandle=${encodeURIComponent(handle)}&key=${key}`
  );
  const d1      = await r1.json();
  const channel = d1.items?.[0];
  if (!channel) return [];

  const uploadsId = channel.contentDetails?.relatedPlaylists?.uploads;
  const title     = channel.snippet?.title || handle;
  if (!uploadsId) return [];

  const r2  = await fetch(
    `${YT}/playlistItems?part=snippet&maxResults=3&playlistId=${uploadsId}&key=${key}`
  );
  const d2      = await r2.json();
  const videoIds = (d2.items || [])
    .map(i => i.snippet?.resourceId?.videoId)
    .filter(Boolean);
  if (!videoIds.length) return [];

  const r3 = await fetch(
    `${YT}/videos?part=snippet,statistics&id=${videoIds.join(',')}&key=${key}`
  );
  const d3 = await r3.json();
  return (d3.items || []).map(v => norm(v, title));
}

export async function POST(req) {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) return Response.json({ needsKey: true, posts: [] });

  try {
    const body   = await req.json();
    const { action } = body;

    if (action === 'channels') {
      const handles = body.handles || [];
      const results = await Promise.all(handles.map(h => channelVideos(h, key)));
      return Response.json({ posts: results.flat() });
    }

    if (action === 'search') {
      const r1 = await fetch(
        `${YT}/search?part=snippet&q=${encodeURIComponent(body.query || '')}&type=video&order=viewCount&maxResults=10&key=${key}`
      );
      const d1       = await r1.json();
      const videoIds = (d1.items || []).map(i => i.id?.videoId).filter(Boolean);
      if (!videoIds.length) return Response.json({ posts: [] });
      const r2 = await fetch(
        `${YT}/videos?part=snippet,statistics&id=${videoIds.join(',')}&key=${key}`
      );
      const d2 = await r2.json();
      return Response.json({ posts: (d2.items || []).map(v => norm(v, null)) });
    }

    if (action === 'trending') {
      const region = body.region || 'US';
      const r = await fetch(
        `${YT}/videos?part=snippet,statistics&chart=mostPopular&regionCode=${region}&maxResults=10&key=${key}`
      );
      const d = await r.json();
      return Response.json({ posts: (d.items || []).map(v => norm(v, null)) });
    }

    return Response.json({ posts: [] });
  } catch {
    return Response.json({ posts: [] });
  }
}
