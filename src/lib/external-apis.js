const axios = require('axios');
const config = require('../config');

const http = axios.create({
  timeout: 20000,
  headers: {
    Accept: 'application/json, text/plain, */*',
    'User-Agent': 'DENTSU-MD-V10',
  },
});

function isUrl(value) {
  return typeof value === 'string' && /^https?:\/\//i.test(value);
}

function firstUrl(value, preferredKeys = []) {
  if (isUrl(value)) return value;
  if (!value || typeof value !== 'object') return null;

  for (const key of preferredKeys) {
    if (isUrl(value[key])) return value[key];
  }

  for (const key of ['data', 'result', 'results', 'response', 'download', 'BK9']) {
    if (value[key]) {
      const found = firstUrl(value[key], preferredKeys);
      if (found) return found;
    }
  }

  for (const child of Object.values(value)) {
    if (child && typeof child === 'object') {
      const found = firstUrl(child, preferredKeys);
      if (found) return found;
    }
  }
  return null;
}

function firstText(value, keys = []) {
  if (!value || typeof value !== 'object') return '';
  for (const key of keys) {
    if (typeof value[key] === 'string' && value[key].trim()) return value[key].trim();
  }
  for (const key of ['data', 'result', 'response', 'BK9']) {
    const found = firstText(value[key], keys);
    if (found) return found;
  }
  return '';
}

async function tryRequests(requests, accept = (data) => data !== undefined) {
  let lastError;
  for (const request of requests) {
    try {
      const response = await request();
      if (response?.data !== undefined && accept(response.data)) return response.data;
      lastError = new Error('Provider returned no usable data');
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError || new Error('All API providers failed');
}

function encoded(value) {
  return encodeURIComponent(String(value || '').trim());
}

function hasValue(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function ytQuery(input) {
  return isUrl(input) ? input : input.trim();
}

async function youtubeAudio(input) {
  const value = ytQuery(input);
  const requests = [
    () => http.get(`https://api.fvckers.my.id/api/downloader/ytplay?q=${encoded(value)}`),
    () => http.get(`https://api.nexray.eu.cc/downloader/ytplay?q=${encoded(value)}`),
    () => http.get(`https://api.nexray.web.id/downloader/ytplay?q=${encoded(value)}`),
  ];

  if (hasValue(config.GIFTEDTECH_API_KEY) && isUrl(value)) {
    requests.push(
      () => http.get(`https://api.giftedtech.web.id/api/download/ytmp3?apikey=${encoded(config.GIFTEDTECH_API_KEY)}&url=${encoded(value)}`),
      () => http.get(`https://api.giftedtech.co.ke/api/download/ytmp3?apikey=${encoded(config.GIFTEDTECH_API_KEY)}&url=${encoded(value)}`),
    );
  }

  if (isUrl(value)) {
    requests.push(
      () => http.get(`https://api.ryzendesu.vip/api/downloader/ytmp3?url=${encoded(value)}`),
    );
  }

  if (!isUrl(value)) {
    try {
      const yts = require('yt-search');
      const search = await yts(value);
      const firstResult = search.all?.[0];
      if (firstResult?.url) {
        requests.push(
          () => http.get(`https://api.ryzendesu.vip/api/downloader/ytmp3?url=${encoded(firstResult.url)}`),
        );
        if (hasValue(config.GIFTEDTECH_API_KEY)) {
          requests.push(
            () => http.get(`https://api.giftedtech.web.id/api/download/ytmp3?apikey=${encoded(config.GIFTEDTECH_API_KEY)}&url=${encoded(firstResult.url)}`),
            () => http.get(`https://api.giftedtech.co.ke/api/download/ytmp3?apikey=${encoded(config.GIFTEDTECH_API_KEY)}&url=${encoded(firstResult.url)}`),
          );
        }
      }
    } catch (_) {}
  }

  const data = await tryRequests(
    requests,
    (value) => Boolean(firstUrl(value, ['download_url', 'downloadUrl', 'audio_url', 'audioUrl', 'mp3', 'url', 'download', 'play'])),
  );
  const url = firstUrl(data, ['download_url', 'downloadUrl', 'audio_url', 'audioUrl', 'mp3', 'url', 'download', 'play']);
  if (!url) throw new Error('No audio URL returned by the providers');
  return {
    url,
    title: firstText(data, ['title', 'name', 'filename']) || value,
    thumbnail: firstUrl(data, ['thumbnail', 'thumbnail_url', 'image']),
  };
}

async function spotifyAudio(query) {
  const data = await tryRequests(
    [
      () => http.get(`https://api.nexray.web.id/downloader/spotifyplay?q=${encoded(query)}`),
    ],
    (value) => Boolean(firstUrl(value, ['download_url', 'downloadUrl', 'audio_url', 'audioUrl', 'url'])),
  );
  const url = firstUrl(data, ['download_url', 'downloadUrl', 'audio_url', 'audioUrl', 'url']);
  if (!url) throw new Error('No Spotify audio URL returned');
  return {
    url,
    title: firstText(data, ['title', 'name']) || query,
    thumbnail: firstUrl(data, ['thumbnail', 'thumbnail_url', 'image']),
  };
}

async function youtubeVideo(input) {
  const value = ytQuery(input);
  const requests = [];

  if (hasValue(config.THRESAV_API_KEY) && isUrl(value)) {
    requests.push(() => http.get(`https://api.theresav.biz.id/download/ytmp4?apikey=${encoded(config.THRESAV_API_KEY)}&url=${encoded(value)}&resolution=360`));
  }
  requests.push(
    () => http.get(`https://api.nexray.web.id/downloader/ytplayvid?q=${encoded(value)}`),
  );

  if (isUrl(value)) {
    requests.push(
      () => http.get(`https://api.ryzendesu.vip/api/downloader/ytmp4?url=${encoded(value)}`),
    );
  } else {
    try {
      const yts = require('yt-search');
      const search = await yts(value);
      const firstResult = search.all?.[0];
      if (firstResult?.url) {
        requests.push(
          () => http.get(`https://api.ryzendesu.vip/api/downloader/ytmp4?url=${encoded(firstResult.url)}`),
        );
      }
    } catch (_) {}
  }

  const data = await tryRequests(
    requests,
    (value) => Boolean(firstUrl(value, ['download_url', 'downloadUrl', 'video_url', 'videoUrl', 'mp4', 'url', 'download', 'play'])),
  );
  const url = firstUrl(data, ['download_url', 'downloadUrl', 'video_url', 'videoUrl', 'mp4', 'url', 'download', 'play']);
  if (!url) throw new Error('No video URL returned by the providers');
  return {
    url,
    title: firstText(data, ['title', 'name', 'filename']) || value,
    thumbnail: firstUrl(data, ['thumbnail', 'thumbnail_url', 'image']),
  };
}

async function tiktokVideo(url) {
  const data = await tryRequests(
    [
      () => http.get(`https://api.nekolabs.web.id/downloader/tiktok?url=${encoded(url)}`),
      () => http.get(`https://api.bk9.dev/download/tiktok?url=${encoded(url)}`),
    ],
    (value) => Boolean(firstUrl(value, ['video_url', 'videoUrl', 'play', 'download', 'url', 'hd', 'sd'])),
  );
  const videoUrl = firstUrl(data, ['video_url', 'videoUrl', 'play', 'download', 'url', 'hd', 'sd']);
  if (!videoUrl) throw new Error('No TikTok video URL returned');
  return { url: videoUrl, title: firstText(data, ['title', 'desc']) || 'TikTok video' };
}

async function facebookVideo(url) {
  const data = await tryRequests(
    [
      // Kept as a fallback because this endpoint is listed in the supplied API file.
      () => http.get(`https://api.nexray.web.id/downloader/ytplay?q=${encoded(url)}`),
      () => http.get(`https://suhas-bro-api.vercel.app/download/fbdown?url=${encoded(url)}`),
    ],
    (value) => Boolean(firstUrl(value, ['video_url', 'videoUrl', 'hd', 'sd', 'download', 'url'])),
  );
  const videoUrl = firstUrl(data, ['video_url', 'videoUrl', 'hd', 'sd', 'download', 'url']);
  if (!videoUrl) throw new Error('No Facebook video URL returned');
  return { url: videoUrl, title: firstText(data, ['title', 'name']) || 'Facebook video' };
}

async function apkDownload(query) {
  const data = await tryRequests(
    [
      () => http.get(`https://apiskeith.top/download/apk?url=${encoded(query)}`),
    ],
    (value) => Boolean(firstUrl(value, ['download_url', 'downloadUrl', 'apk_url', 'apkUrl', 'url', 'download'])),
  );
  const url = firstUrl(data, ['download_url', 'downloadUrl', 'apk_url', 'apkUrl', 'url', 'download']);
  if (!url) throw new Error('No APK URL returned');
  return { url, title: firstText(data, ['title', 'name', 'filename']) || query };
}

async function youtubeSearch(query) {
  try {
    const data = await tryRequests([
      () => http.get(`https://api.ootaizumi.web.id/search/youtube?query=${encoded(query)}`),
    ]);
    const candidates = Array.isArray(data)
      ? data
      : data?.data || data?.result || data?.results || [];
    if (Array.isArray(candidates) && candidates.length) return candidates;
  } catch (_) {}

  const yts = require('yt-search');
  const result = await yts(query);
  return result.all || [];
}

async function characterSearch(query) {
  const response = await http.get(`https://api.jikan.moe/v4/characters?q=${encoded(query || 'naruto')}&limit=1`);
  return response.data?.data?.[0] || null;
}

module.exports = {
  firstUrl,
  youtubeAudio,
  spotifyAudio,
  youtubeVideo,
  tiktokVideo,
  facebookVideo,
  apkDownload,
  youtubeSearch,
  characterSearch,
};