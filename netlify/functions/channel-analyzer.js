'use strict';

const { getCached, setCached } = require('./lib/cache');
const { fetchChannelDashboardSource } = require('./lib/youtube');
const { analyzeChannel } = require('./lib/channel-analytics');

const CACHE_TTL = 24 * 60 * 60 * 1000;
const rateLimits = new Map();

function json(statusCode, body) {
  return {
    statusCode,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
    body: JSON.stringify(body)
  };
}

function withinRateLimit(event) {
  const forwarded = event.headers?.['x-forwarded-for'] || event.headers?.['client-ip'] || 'unknown';
  const ip = forwarded.split(',')[0].trim();
  const now = Date.now();
  const entry = rateLimits.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimits.set(ip, { count: 1, resetAt: now + 60 * 60 * 1000 });
    return true;
  }
  if (entry.count >= 20) return false;
  entry.count += 1;
  return true;
}

function videoCard(video) {
  return {
    id: video.id,
    title: video.title,
    thumbnail: video.thumbnail || '',
    publishedAt: video.publishedAt,
    views: Number(video.views) || 0,
    viewsPerDay: video.viewsPerDay,
    engagementRate: video.engagementRate,
    url: video.url
  };
}

exports.handler = async event => {
  if (event.httpMethod !== 'GET') return json(405, { code: 'METHOD_NOT_ALLOWED', error: 'Method not allowed.' });
  if (!withinRateLimit(event)) return json(429, { code: 'RATE_LIMIT', error: 'Hourly channel-analysis limit reached.' });

  const type = event.queryStringParameters?.type === 'id' ? 'id' : 'handle';
  const value = String(event.queryStringParameters?.value || '').trim();
  if (!/^[\w.-]{3,100}$/.test(value)) return json(400, { code: 'INVALID_CHANNEL', error: 'Invalid channel identifier.' });

  const apiKey = process.env.YT_API_KEY;
  if (!apiKey) return json(503, { code: 'API_NOT_CONFIGURED', error: 'YouTube API is not configured.' });

  const cacheKey = `channel:${type}:${value.toLowerCase()}`;
  const cached = await getCached(cacheKey);
  if (cached) return json(200, { ...cached.value, cached: true });

  try {
    const source = await fetchChannelDashboardSource({ type, value, apiKey });
    if (!source) return json(404, { code: 'CHANNEL_NOT_FOUND', error: 'Channel not found.' });

    const { channel } = source;
    const analytics = analyzeChannel(source.videos, channel);
    const hiddenSubscriberCount = Boolean(channel.hiddenSubscriberCount);
    const result = {
      id: channel.id,
      title: channel.title || '',
      handle: channel.handle || '',
      description: channel.description || '',
      publishedAt: channel.publishedAt,
      country: channel.country || null,
      avatar: channel.avatar,
      banner: channel.banner,
      subscriberCount: hiddenSubscriberCount ? null : Number(channel.subscriberCount) || 0,
      hiddenSubscriberCount,
      viewCount: Number(channel.viewCount) || 0,
      videoCount: Number(channel.videoCount) || 0,
      engagementRate: analytics.performance?.recent?.averageEngagementRate ?? null,
      averageViewsPerDay: analytics.performance?.recent?.medianViewsPerDay ?? null,
      growthPercent: analytics.performance?.growthPercent ?? null,
      topVideos: (analytics.topVideos || []).slice(0, 8).map(videoCard),
      recentVideos: (analytics.recentVideos || []).slice(0, 10).map(videoCard)
    };
    await setCached(cacheKey, result, CACHE_TTL);
    return json(200, result);
  } catch (error) {
    return json(error.status === 403 ? 429 : 502, {
      code: 'YOUTUBE_UNAVAILABLE',
      error: 'YouTube public data is temporarily unavailable.'
    });
  }
};
