export interface WatchEntry {
  title: string;
  channelName: string;
  channelUrl: string;
  watchedAt: Date;
  videoUrl: string;
}

export interface ChannelStats {
  name: string;
  url: string;
  viewCount: number;
}

export interface VideoStats {
  title: string;
  url: string;
  channelName: string;
  channelUrl: string;
  viewCount: number;
}

export interface YearComparison {
  currentYear: number;
  previousYear: number;
  videosChange: number;
  videosChangePercent: number;
  channelsChange: number;
  channelsChangePercent: number;
  previousYearVideos: number;
  previousYearChannels: number;
  currentYearVideos: number;
  currentYearChannels: number;
  newTopChannel: boolean; // Did #1 channel change?
  previousTopChannelName: string | null;
  consistentChannels: ChannelStats[]; // Channels in top 10 both years
}

// Common ad-related patterns to filter out
const AD_PATTERNS = [
  'googleads',
  'doubleclick',
  'googlesyndication',
  'youtube.com/ad',
  'youtube.com/pagead',
  '/ads/',
  'advertisement',
  'sponsored',
];

const AD_CHANNEL_NAMES = [
  'unknown channel',
  '',
  'youtube ads',
  'google ads',
];

function isAdEntry(videoUrl: string, channelName: string, title: string): boolean {
  const lowerUrl = videoUrl.toLowerCase();
  const lowerChannel = channelName.toLowerCase();
  const lowerTitle = title.toLowerCase();
  
  // Check if URL contains ad patterns
  if (AD_PATTERNS.some(pattern => lowerUrl.includes(pattern))) {
    return true;
  }
  
  // Check if channel name is ad-related or empty
  if (AD_CHANNEL_NAMES.includes(lowerChannel.trim())) {
    return true;
  }
  
  // Videos without proper channel info are likely ads
  if (!channelName || channelName === 'Unknown Channel') {
    return true;
  }
  
  // Check for "Watched an ad" or similar patterns in the title
  if (lowerTitle.includes('watched an ad') || lowerTitle.includes('ad break')) {
    return true;
  }
  
  return false;
}

export function parseWatchHistory(htmlContent: string): WatchEntry[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');
  
  const entries: WatchEntry[] = [];
  
  // YouTube Takeout watch history uses outer-cell divs for each entry
  const cells = doc.querySelectorAll('.outer-cell, .content-cell');
  
  cells.forEach((cell) => {
    try {
      // Find video link (first anchor with youtube.com/watch)
      const links = cell.querySelectorAll('a');
      let videoUrl = '';
      let title = '';
      let channelName = '';
      let channelUrl = '';
      
      links.forEach((link) => {
        const href = link.getAttribute('href') || '';
        if (href.includes('youtube.com/watch') && !videoUrl) {
          videoUrl = href;
          title = link.textContent?.trim() || '';
        } else if (href.includes('youtube.com/channel') || href.includes('youtube.com/@')) {
          channelUrl = href;
          channelName = link.textContent?.trim() || '';
        }
      });
      
      // Find timestamp - usually in a text node or specific element
      const textContent = cell.textContent || '';
      const dateMatch = textContent.match(/(\w{3}\s+\d{1,2},\s+\d{4},\s+\d{1,2}:\d{2}:\d{2}\s*(?:AM|PM)?(?:\s+\w+)?)/i);
      
      let watchedAt = new Date();
      if (dateMatch) {
        const parsedDate = new Date(dateMatch[1]);
        if (!isNaN(parsedDate.getTime())) {
          watchedAt = parsedDate;
        }
      }
      
      // Only add if it's a valid video (not an ad) with proper channel info
      if (videoUrl && title && channelName && !isAdEntry(videoUrl, channelName, title)) {
        entries.push({
          title,
          channelName,
          channelUrl,
          watchedAt,
          videoUrl,
        });
      }
    } catch (e) {
      // Skip malformed entries
    }
  });
  
  return entries;
}

export function getTopChannels(entries: WatchEntry[], year: number, limit = 100): ChannelStats[] {
  // Filter entries for the specified year
  const yearEntries = entries.filter(
    (entry) => entry.watchedAt.getFullYear() === year
  );
  
  // Count views per channel
  const channelCounts = new Map<string, ChannelStats>();
  
  yearEntries.forEach((entry) => {
    const key = entry.channelName.toLowerCase();
    const existing = channelCounts.get(key);
    
    if (existing) {
      existing.viewCount++;
    } else {
      channelCounts.set(key, {
        name: entry.channelName,
        url: entry.channelUrl,
        viewCount: 1,
      });
    }
  });
  
  // Sort by view count and return top channels
  return Array.from(channelCounts.values())
    .sort((a, b) => b.viewCount - a.viewCount)
    .slice(0, limit);
}

export function getTopVideos(entries: WatchEntry[], year: number, limit = 50): VideoStats[] {
  // Filter entries for the specified year
  const yearEntries = entries.filter(
    (entry) => entry.watchedAt.getFullYear() === year
  );
  
  // Count views per video (using video URL as unique identifier)
  const videoCounts = new Map<string, VideoStats>();
  
  yearEntries.forEach((entry) => {
    const key = entry.videoUrl;
    const existing = videoCounts.get(key);
    
    if (existing) {
      existing.viewCount++;
    } else {
      videoCounts.set(key, {
        title: entry.title,
        url: entry.videoUrl,
        channelName: entry.channelName,
        channelUrl: entry.channelUrl,
        viewCount: 1,
      });
    }
  });
  
  // Sort by view count and return top videos
  return Array.from(videoCounts.values())
    .sort((a, b) => b.viewCount - a.viewCount)
    .slice(0, limit);
}

export function getYearlyStats(entries: WatchEntry[], year: number) {
  const yearEntries = entries.filter(
    (entry) => entry.watchedAt.getFullYear() === year
  );
  
  return {
    totalVideos: yearEntries.length,
    uniqueChannels: new Set(yearEntries.map((e) => e.channelName.toLowerCase())).size,
    topChannels: getTopChannels(entries, year, 100),
    topVideos: getTopVideos(entries, year, 50),
  };
}

export function getYearComparison(entries: WatchEntry[], currentYear: number): YearComparison | null {
  const previousYear = currentYear - 1;
  
  const currentYearEntries = entries.filter(
    (entry) => entry.watchedAt.getFullYear() === currentYear
  );
  const previousYearEntries = entries.filter(
    (entry) => entry.watchedAt.getFullYear() === previousYear
  );
  
  // If no previous year data, return null
  if (previousYearEntries.length === 0) {
    return null;
  }
  
  const currentYearVideos = currentYearEntries.length;
  const previousYearVideos = previousYearEntries.length;
  const currentYearChannels = new Set(currentYearEntries.map((e) => e.channelName.toLowerCase())).size;
  const previousYearChannels = new Set(previousYearEntries.map((e) => e.channelName.toLowerCase())).size;
  
  const videosChange = currentYearVideos - previousYearVideos;
  const videosChangePercent = previousYearVideos > 0 
    ? Math.round((videosChange / previousYearVideos) * 100) 
    : 0;
  
  const channelsChange = currentYearChannels - previousYearChannels;
  const channelsChangePercent = previousYearChannels > 0 
    ? Math.round((channelsChange / previousYearChannels) * 100) 
    : 0;
  
  // Get top channels for both years
  const currentTopChannels = getTopChannels(entries, currentYear, 10);
  const previousTopChannels = getTopChannels(entries, previousYear, 10);
  
  const previousTopChannelName = previousTopChannels[0]?.name || null;
  const currentTopChannelName = currentTopChannels[0]?.name || null;
  const newTopChannel = previousTopChannelName?.toLowerCase() !== currentTopChannelName?.toLowerCase();
  
  // Find channels that appear in top 10 of both years
  const previousTopNames = new Set(previousTopChannels.map(c => c.name.toLowerCase()));
  const consistentChannels = currentTopChannels.filter(c => 
    previousTopNames.has(c.name.toLowerCase())
  );
  
  return {
    currentYear,
    previousYear,
    videosChange,
    videosChangePercent,
    channelsChange,
    channelsChangePercent,
    previousYearVideos,
    previousYearChannels,
    currentYearVideos,
    currentYearChannels,
    newTopChannel,
    previousTopChannelName,
    consistentChannels,
  };
}
