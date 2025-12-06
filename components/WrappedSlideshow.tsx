'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { type ChannelStats, type VideoStats, type YearComparison } from '@/lib/parseWatchHistory';

interface WrappedData {
  totalVideos: number;
  uniqueChannels: number;
  topChannels: ChannelStats[];
  topVideos: VideoStats[];
  comparison: YearComparison | null;
  dayNight: { persona: string };
}

interface WrappedSlideshowProps {
  data: WrappedData;
  onClose: () => void;
}

const SLIDE_DURATION = 5000; // 5 seconds per slide

export default function WrappedSlideshow({ data, onClose }: WrappedSlideshowProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAnimating, setIsAnimating] = useState(true);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareImageUrl, setShareImageUrl] = useState<string | null>(null);

  // Quiz state
  const [shuffledChannels, setShuffledChannels] = useState<ChannelStats[]>([]);
  const [shuffledVideos, setShuffledVideos] = useState<VideoStats[]>([]);
  const [quizChannelState, setQuizChannelState] = useState<{ answered: boolean; correct: boolean; selectedIndex: number | null }>({ answered: false, correct: false, selectedIndex: null });
  const [quizVideoState, setQuizVideoState] = useState<{ answered: boolean; correct: boolean; selectedIndex: number | null }>({ answered: false, correct: false, selectedIndex: null });

  useEffect(() => {
    if (data.topChannels.length > 0) {
      const top5 = data.topChannels.slice(0, 5);
      setShuffledChannels([...top5].sort(() => Math.random() - 0.5));
    }
    if (data.topVideos.length > 0) {
      const top5 = data.topVideos.slice(0, 5);
      setShuffledVideos([...top5].sort(() => Math.random() - 0.5));
    }
  }, [data]);

  const handleChannelGuess = (index: number, channel: ChannelStats) => {
    const isCorrect = channel.name === data.topChannels[0].name;
    setQuizChannelState({ answered: true, correct: isCorrect, selectedIndex: index });
  };

  const handleVideoGuess = (index: number, video: VideoStats) => {
    const isCorrect = video.url === data.topVideos[0].url;
    setQuizVideoState({ answered: true, correct: isCorrect, selectedIndex: index });
  };

  const slides = useMemo(() => [
    { type: 'intro' },
    { type: 'totalVideos' },
    ...(data.comparison ? [{ type: 'videosComparison' }] : []),
    { type: 'uniqueChannels' },
    ...(data.comparison ? [{ type: 'channelsComparison' }] : []),
    { type: 'quizChannel' },
    { type: 'topChannel' },
    ...(data.comparison?.newTopChannel ? [{ type: 'topChannelChange' }] : []),
    { type: 'top5Channels' },
    { type: 'quizVideo' },
    { type: 'topVideo' },
    { type: 'top5Videos' },
    ...(data.comparison ? [{ type: 'yearSummary' }] : []),
    { type: 'outro' },
  ], [data]);

  const nextSlide = useCallback(() => {
    if (currentSlide < slides.length - 1) {
      setIsAnimating(false);
      setTimeout(() => {
        setCurrentSlide(prev => prev + 1);
        setIsAnimating(true);
      }, 300);
    }
  }, [currentSlide, slides.length]);

  const prevSlide = useCallback(() => {
    if (currentSlide > 0) {
      setIsAnimating(false);
      setTimeout(() => {
        setCurrentSlide(prev => prev - 1);
        setIsAnimating(true);
      }, 300);
    }
  }, [currentSlide]);

  // Auto-advance slides
  useEffect(() => {
    const currentSlideType = slides[currentSlide].type;
    
    // Disable auto-advance for quiz slides to allow user interaction
    if (currentSlideType === 'quizChannel' || currentSlideType === 'quizVideo') return;

    if (currentSlide < slides.length - 1) {
      const timer = setTimeout(nextSlide, SLIDE_DURATION);
      return () => clearTimeout(timer);
    }
  }, [currentSlide, nextSlide, slides]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') nextSlide();
      if (e.key === 'ArrowLeft') prevSlide();
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextSlide, prevSlide, onClose]);

  const generateShareImage = useCallback(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1920;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background
    const gradient = ctx.createLinearGradient(0, 0, 0, 1920);
    gradient.addColorStop(0, '#0f0f0f');
    gradient.addColorStop(0.5, '#1a0505');
    gradient.addColorStop(1, '#2a0000');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1080, 1920);

    // Decorative elements
    ctx.fillStyle = '#ff0000';
    ctx.globalAlpha = 0.05;
    ctx.beginPath();
    ctx.arc(1080, 0, 800, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, 1920, 600, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1.0;

    // Header
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 60px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('YouTube Wrapped 2025', 540, 120);

    // Main Stats Row
    ctx.textAlign = 'center';
    
    // Total Videos
    ctx.fillStyle = '#888888';
    ctx.font = '30px sans-serif';
    ctx.fillText('VIDEOS WATCHED', 270, 250);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 70px sans-serif';
    ctx.fillText(data.totalVideos.toLocaleString(), 270, 320);

    // Unique Channels
    ctx.fillStyle = '#888888';
    ctx.font = '30px sans-serif';
    ctx.fillText('CHANNELS', 810, 250);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 70px sans-serif';
    ctx.fillText(data.uniqueChannels.toLocaleString(), 810, 320);

    // Divider
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(100, 380);
    ctx.lineTo(980, 380);
    ctx.stroke();

    // Helper to draw list items
    const drawList = async (title: string, items: any[], startY: number, type: 'video' | 'channel') => {
      const startX = 100;
      
      ctx.textAlign = 'left';
      ctx.fillStyle = '#ff0000';
      ctx.font = 'bold 45px sans-serif';
      ctx.fillText(title, startX, startY);

      let currentY = startY + 80;

      for (let i = 0; i < Math.min(items.length, 5); i++) {
        const item = items[i];
        const rank = `#${i + 1}`;
        
        // Rank
        ctx.fillStyle = i === 0 ? '#ff0000' : '#666666';
        ctx.font = 'bold 35px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(rank, startX, currentY);

        // Content
        const textX = startX + 80;
        const name = type === 'video' ? item.title : item.name;
        const subtext = type === 'video' ? item.channelName : `${item.viewCount} videos`;

        // Truncate text
        const maxTextWidth = type === 'video' ? 580 : 800;
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 32px sans-serif';
        
        let displayName = name;
        while (ctx.measureText(displayName).width > maxTextWidth && displayName.length > 0) {
            displayName = displayName.substring(0, displayName.length - 1);
        }
        if (displayName !== name) displayName += '...';
        
        ctx.fillText(displayName, textX, currentY);

        ctx.fillStyle = '#888888';
        ctx.font = '26px sans-serif';
        ctx.fillText(subtext, textX, currentY + 35);

        // Thumbnail for videos (if available and loaded)
        if (type === 'video' && item.thumbnailUrl) {
           try {
             const img = new Image();
             img.crossOrigin = "anonymous";  // Needed for external images
             await new Promise((resolve, reject) => {
               img.onload = resolve;
               img.onerror = reject;
               img.src = item.thumbnailUrl;
             });
             
             const thumbH = 60;
             const thumbW = 106; // 16:9
             const thumbX = 860; // Right aligned
             const thumbY = currentY - 25;
             const margin = 4;

             // White margin
             ctx.fillStyle = '#ffffff';
             ctx.beginPath();
             ctx.roundRect(thumbX - margin, thumbY - margin, thumbW + (margin * 2), thumbH + (margin * 2), 8);
             ctx.fill();

             // Draw thumbnail
             ctx.save();
             ctx.beginPath();
             ctx.roundRect(thumbX, thumbY, thumbW, thumbH, 6);
             ctx.clip();
             ctx.drawImage(img, thumbX, thumbY, thumbW, thumbH);
             ctx.restore();
           } catch (e) {
             // Ignore image load errors
           }
        }

        currentY += 100;
      }
    };

    // We need to handle async image loading for thumbnails
    const drawContent = async () => {
        // Top Channels (Up)
        await drawList('TOP CHANNELS', data.topChannels, 450, 'channel');

        // Top Videos (Down)
        await drawList('TOP VIDEOS', data.topVideos, 1050, 'video');

        // Footer
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffffff';
        ctx.font = '24px sans-serif';
        ctx.globalAlpha = 0.5;
        ctx.fillText('Generated by YouTubeWrap', 540, 1850);

        setShareImageUrl(canvas.toDataURL('image/png'));
        setShowShareModal(true);
    };

    drawContent();

  }, [data]);

  const gradients = [
    'from-[#1a0505] via-[#000000] to-[#0a0a0a]',
    'from-[#000000] via-[#1a0000] to-[#000000]',
    'from-[#0f0f0f] via-[#000000] to-[#1f0505]',
    'from-[#000000] via-[#1a1a1a] to-[#333333]',
    'from-[#0a0a0a] via-[#1a0505] to-[#000000]',
  ];

  const renderSlide = () => {
    const slide = slides[currentSlide];
    const gradient = gradients[currentSlide % gradients.length];

    switch (slide.type) {
      case 'intro':
        return (
          <div className={`flex flex-col items-center justify-center text-center text-white ${isAnimating ? 'animate-fade-in' : 'opacity-0'}`}>
            <h1 className="text-5xl md:text-7xl font-black mb-4 animate-slide-up tracking-tighter">
              Your YouTube
            </h1>
            <h1 className="text-6xl md:text-8xl font-black text-[#ff0000] animate-slide-up-delay tracking-tighter drop-shadow-2xl">
              Wrapped 2025
            </h1>
            <p className="mt-8 text-xl text-gray-300 animate-fade-in-delay">Ready to see what you've been watching?</p>
            <p className="mt-4 text-sm text-white/50 animate-pulse">Tap to continue →</p>
          </div>
        );

      case 'totalVideos':
        return (
          <div className={`flex flex-col items-center justify-center text-center text-white ${isAnimating ? 'animate-fade-in' : 'opacity-0'}`}>
            <p className="text-2xl mb-4 text-gray-300 animate-slide-down">It's been a busy year.</p>
            <p className="text-xl mb-8 text-gray-400 animate-slide-down">You watched a total of</p>
            <div className="animate-number-pop">
              <span className="text-8xl md:text-9xl font-black text-[#ff0000] drop-shadow-lg">{data.totalVideos.toLocaleString()}</span>
            </div>
            <p className="text-3xl mt-4 font-bold animate-slide-up">videos</p>
            <p className="text-xl mt-4 text-gray-400 animate-slide-up">That's a lot of content!</p>
          </div>
        );

      case 'uniqueChannels':
        return (
          <div className={`flex flex-col items-center justify-center text-center text-white ${isAnimating ? 'animate-fade-in' : 'opacity-0'}`}>
            <p className="text-2xl mb-4 text-gray-300 animate-slide-down">You have diverse taste.</p>
            <p className="text-xl mb-8 text-gray-400 animate-slide-down">You explored content from</p>
            <div className="animate-number-pop">
              <span className="text-8xl md:text-9xl font-black text-[#ff0000] drop-shadow-lg">{data.uniqueChannels.toLocaleString()}</span>
            </div>
            <p className="text-3xl mt-4 font-bold animate-slide-up">different creators</p>
          </div>
        );

      case 'quizChannel':
        return (
          <div className={`flex flex-col items-center justify-center w-full px-4 ${isAnimating ? 'animate-fade-in' : 'opacity-0'}`}>
            <h2 className="text-3xl md:text-4xl font-black mb-8 text-center animate-slide-down text-white">Guess your #1 Channel</h2>
            <div className="grid gap-3 w-full max-w-md">
              {shuffledChannels.map((channel, index) => {
                const isSelected = quizChannelState.selectedIndex === index;
                const isCorrect = channel.name === data.topChannels[0].name;
                const showResult = quizChannelState.answered;
                
                let bgClass = "bg-[#1f1f1f] border-gray-700";
                if (showResult) {
                  if (isCorrect) bgClass = "bg-green-600 border-green-500";
                  else if (isSelected && !isCorrect) bgClass = "bg-red-600 border-red-500";
                  else bgClass = "bg-[#1f1f1f] opacity-50 border-gray-800";
                } else {
                    bgClass = "bg-[#1f1f1f] hover:bg-[#333] border-gray-700 hover:border-gray-500";
                }

                return (
                  <button
                    key={index}
                    onClick={() => handleChannelGuess(index, channel)}
                    disabled={showResult}
                    className={`p-4 rounded-xl text-left transition-all font-bold text-white shadow-lg border-2 ${bgClass} ${!showResult ? 'hover:scale-105' : ''}`}
                  >
                    {channel.name}
                  </button>
                );
              })}
            </div>
             {quizChannelState.answered && (
                <div className="mt-8 animate-fade-in text-center">
                    <p className="text-2xl font-bold mb-4 text-white">{quizChannelState.correct ? "Correct!" : "Nice try!"}</p>
                    <button onClick={nextSlide} className="px-8 py-3 bg-white text-black rounded-full font-bold hover:scale-105 transition-transform">Reveal Stats →</button>
                </div>
             )}
          </div>
        );

      case 'topChannel':
        const topChannel = data.topChannels[0];
        return (
          <div className={`flex flex-col items-center justify-center text-center text-white px-8 ${isAnimating ? 'animate-fade-in' : 'opacity-0'}`}>
            <p className="text-2xl mb-4 text-gray-300 animate-slide-down">But one creator stood out above the rest.</p>
            <p className="text-xl mb-8 text-gray-400 animate-slide-down">Your absolute favorite was</p>
            <h2 className="text-4xl md:text-6xl font-black mb-4 animate-slide-up max-w-full truncate px-4 text-[#ff0000]">
              {topChannel?.name || 'Unknown'}
            </h2>
            <div className="animate-number-pop mt-4">
              <span className="text-5xl font-bold">{topChannel?.viewCount.toLocaleString()}</span>
              <span className="text-2xl ml-2 text-gray-400">videos watched</span>
            </div>
            <p className="mt-6 text-lg text-gray-300 italic">"You really couldn't get enough of them!"</p>
          </div>
        );

      case 'top5Channels':
        return (
          <div className={`flex flex-col items-center justify-center text-white px-8 w-full ${isAnimating ? 'animate-fade-in' : 'opacity-0'}`}>
            <h2 className="text-3xl md:text-4xl font-black mb-2 animate-slide-down">Your Top Squad</h2>
            <p className="text-gray-400 mb-8 animate-slide-down">The creators who kept you coming back</p>
            <div className="space-y-4 w-full max-w-lg">
              {data.topChannels.slice(0, 5).map((channel, index) => (
                <div 
                  key={channel.name}
                  className="flex items-center gap-4 bg-[#1f1f1f] border border-gray-800 rounded-xl p-4 animate-slide-right shadow-lg"
                  style={{ animationDelay: `${index * 150}ms` }}
                >
                  <span className={`text-3xl font-black w-12 ${index === 0 ? 'text-[#ff0000]' : 'text-gray-500'}`}>#{index + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold truncate text-white">{channel.name}</p>
                    <p className="text-gray-400 text-sm">{channel.viewCount} videos</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'quizVideo':
        return (
          <div className={`flex flex-col items-center justify-center w-full px-4 ${isAnimating ? 'animate-fade-in' : 'opacity-0'}`}>
            <h2 className="text-3xl md:text-4xl font-black mb-8 text-center animate-slide-down text-white">Guess your #1 Video</h2>
            <div className="grid gap-3 w-full max-w-md">
              {shuffledVideos.map((video, index) => {
                const isSelected = quizVideoState.selectedIndex === index;
                const isCorrect = video.url === data.topVideos[0].url;
                const showResult = quizVideoState.answered;
                
                let bgClass = "bg-[#1f1f1f] border-gray-700";
                if (showResult) {
                  if (isCorrect) bgClass = "bg-green-600 border-green-500";
                  else if (isSelected && !isCorrect) bgClass = "bg-red-600 border-red-500";
                  else bgClass = "bg-[#1f1f1f] opacity-50 border-gray-800";
                } else {
                    bgClass = "bg-[#1f1f1f] hover:bg-[#333] border-gray-700 hover:border-gray-500";
                }

                return (
                  <button
                    key={index}
                    onClick={() => handleVideoGuess(index, video)}
                    disabled={showResult}
                    className={`p-3 rounded-xl text-left transition-all font-bold text-white shadow-lg border-2 ${bgClass} ${!showResult ? 'hover:scale-105' : ''}`}
                  >
                    <div className="line-clamp-2 text-sm md:text-base">{video.title}</div>
                  </button>
                );
              })}
            </div>
             {quizVideoState.answered && (
                <div className="mt-8 animate-fade-in text-center">
                    <p className="text-2xl font-bold mb-4 text-white">{quizVideoState.correct ? "Correct!" : "Nice try!"}</p>
                    <button onClick={nextSlide} className="px-8 py-3 bg-white text-black rounded-full font-bold hover:scale-105 transition-transform">Reveal Stats →</button>
                </div>
             )}
          </div>
        );

      case 'topVideo':
        const topVideo = data.topVideos[0];
        return (
          <div className={`flex flex-col items-center justify-center text-center text-white px-8 ${isAnimating ? 'animate-fade-in' : 'opacity-0'}`}>
            <p className="text-2xl mb-4 text-gray-300 animate-slide-down">You kept hitting replay on this one.</p>
            <p className="text-xl mb-8 text-gray-400 animate-slide-down">Your most rewatched video</p>
            <h2 className="text-2xl md:text-4xl font-black mb-4 animate-slide-up max-w-full line-clamp-3 px-4 text-[#ff0000]">
              {topVideo?.title || 'Unknown'}
            </h2>
            <p className="text-xl text-gray-300 mb-4">by {topVideo?.channelName}</p>
            <div className="animate-number-pop mt-4">
              <span className="text-5xl font-bold">{topVideo?.viewCount.toLocaleString()}</span>
              <span className="text-2xl ml-2 text-gray-400">times watched</span>
            </div>
          </div>
        );

      case 'top5Videos':
        return (
          <div className={`flex flex-col items-center justify-center text-white px-8 w-full ${isAnimating ? 'animate-fade-in' : 'opacity-0'}`}>
            <h2 className="text-3xl md:text-4xl font-black mb-2 animate-slide-down">On Repeat</h2>
            <p className="text-gray-400 mb-8 animate-slide-down">The videos you couldn't stop watching</p>
            <div className="space-y-3 w-full max-w-lg">
              {data.topVideos.slice(0, 5).map((video, index) => (
                <div 
                  key={`${video.url}-${index}`}
                  className="flex items-center gap-4 bg-[#1f1f1f] border border-gray-800 rounded-xl p-3 animate-slide-right shadow-lg"
                  style={{ animationDelay: `${index * 150}ms` }}
                >
                  <span className={`text-2xl font-black w-10 ${index === 0 ? 'text-[#ff0000]' : 'text-gray-500'}`}>#{index + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold truncate text-sm text-white">{video.title}</p>
                    <p className="text-gray-400 text-xs">{video.channelName} • {video.viewCount}x</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'videosComparison':
        const vidComp = data.comparison!;
        const vidUp = vidComp.videosChange >= 0;
        return (
          <div className={`flex flex-col items-center justify-center text-center text-white ${isAnimating ? 'animate-fade-in' : 'opacity-0'}`}>
            <p className="text-2xl mb-4 text-gray-300 animate-slide-down">Compared to {vidComp.previousYear}</p>
            <div className="animate-number-pop">
              <span className={`text-7xl md:text-8xl font-black ${vidUp ? 'text-green-500' : 'text-red-500'}`}>
                {vidUp ? '+' : ''}{vidComp.videosChange.toLocaleString()}
              </span>
            </div>
            <p className="text-3xl mt-4 font-semibold animate-slide-up">
              videos ({vidUp ? '+' : ''}{vidComp.videosChangePercent}%)
            </p>
            <p className="mt-6 text-lg text-gray-400 animate-fade-in-delay">
              {vidComp.previousYear}: {vidComp.previousYearVideos.toLocaleString()} videos
            </p>
          </div>
        );

      case 'channelsComparison':
        const chanComp = data.comparison!;
        const chanUp = chanComp.channelsChange >= 0;
        return (
          <div className={`flex flex-col items-center justify-center text-center text-white ${isAnimating ? 'animate-fade-in' : 'opacity-0'}`}>
            <p className="text-2xl mb-4 text-gray-300 animate-slide-down">{chanUp ? 'You discovered' : 'You focused on'}</p>
            <div className="animate-number-pop">
              <span className={`text-7xl md:text-8xl font-black ${chanUp ? 'text-green-500' : 'text-amber-500'}`}>
                {chanUp ? '+' : ''}{chanComp.channelsChange.toLocaleString()}
              </span>
            </div>
            <p className="text-3xl mt-4 font-semibold animate-slide-up">
              {chanUp ? 'more creators' : 'fewer creators'}
            </p>
            <p className="mt-6 text-lg text-gray-400 animate-fade-in-delay">
              {chanComp.previousYear}: {chanComp.previousYearChannels.toLocaleString()} channels
            </p>
          </div>
        );

      case 'topChannelChange':
        const topComp = data.comparison!;
        return (
          <div className={`flex flex-col items-center justify-center text-center text-white px-8 ${isAnimating ? 'animate-fade-in' : 'opacity-0'}`}>
            <p className="text-2xl mb-4 text-gray-300 animate-slide-down">New favorite alert!</p>
            <div className="flex flex-col items-center gap-4 animate-slide-up">
              <div className="text-gray-500 text-lg line-through">{topComp.previousTopChannelName}</div>
              <div className="text-4xl text-[#ff0000]">↓</div>
              <div className="text-3xl md:text-4xl font-black text-white">{data.topChannels[0]?.name}</div>
            </div>
            <p className="mt-8 text-lg text-gray-400 animate-fade-in-delay">Your #1 channel changed from last year</p>
          </div>
        );

      case 'yearSummary':
        const sumComp = data.comparison!;
        const moreVideos = sumComp.videosChange > 0;
        const moreChannels = sumComp.channelsChange > 0;
        return (
          <div className={`flex flex-col items-center justify-center text-center text-white px-8 ${isAnimating ? 'animate-fade-in' : 'opacity-0'}`}>
            <h2 className="text-3xl md:text-4xl font-black mb-8 animate-slide-down">Year Over Year</h2>
            <div className="space-y-6 w-full max-w-md">
              <div className="flex items-center justify-between bg-[#1f1f1f] border border-gray-800 rounded-xl p-4 animate-slide-right">
                <span className="text-lg text-gray-300">Videos</span>
                <span className={`text-2xl font-bold ${moreVideos ? 'text-green-500' : 'text-red-500'}`}>
                  {moreVideos ? '↑' : '↓'} {Math.abs(sumComp.videosChangePercent)}%
                </span>
              </div>
              <div className="flex items-center justify-between bg-[#1f1f1f] border border-gray-800 rounded-xl p-4 animate-slide-right" style={{ animationDelay: '150ms' }}>
                <span className="text-lg text-gray-300">Creators</span>
                <span className={`text-2xl font-bold ${moreChannels ? 'text-green-500' : 'text-amber-500'}`}>
                  {moreChannels ? '↑' : '↓'} {Math.abs(sumComp.channelsChangePercent)}%
                </span>
              </div>
              {sumComp.consistentChannels.length > 0 && (
                <div className="bg-[#1f1f1f] border border-gray-800 rounded-xl p-4 animate-slide-right" style={{ animationDelay: '300ms' }}>
                  <p className="text-gray-400 text-sm mb-2">Still in your top 10</p>
                  <p className="font-bold text-white">{sumComp.consistentChannels.slice(0, 3).map(c => c.name).join(', ')}</p>
                </div>
              )}
            </div>
          </div>
        );

      case 'outro':
        return (
          <div className={`flex flex-col items-center justify-center text-center text-white ${isAnimating ? 'animate-fade-in' : 'opacity-0'}`}>
            <h1 className="text-4xl md:text-6xl font-black mb-4 animate-slide-up">That's a Wrap!</h1>
            <p className="text-xl text-gray-300 mb-8 animate-fade-in-delay">Thanks for being part of the community in 2025.</p>
            
            <button 
              onClick={generateShareImage}
              className="mb-6 px-8 py-4 bg-white text-black font-bold text-xl rounded-full hover:scale-105 transition-transform animate-slide-up-delay shadow-xl hover:bg-gray-200 flex items-center gap-2"
            >
              Show Shareable Card
            </button>

            <button 
              onClick={onClose}
              className="px-8 py-4 bg-[#ff0000] text-white font-bold text-xl rounded-full hover:scale-105 transition-transform animate-slide-up-delay shadow-xl hover:bg-red-700"
            >
              View Full Stats
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <div
        className={`fixed inset-0 z-50 bg-gradient-to-br ${gradients[currentSlide % gradients.length]} transition-all duration-500`}
        onClick={nextSlide}
      >
        {/* Progress bar */}
        <div className="absolute top-0 left-0 right-0 flex gap-1 p-4 z-10">
          {slides.map((_, index) => (
            <div key={index} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
              <div
                className={`h-full bg-white transition-all duration-300 ${
                  index < currentSlide ? 'w-full' :
                  index === currentSlide ? 'w-full animate-progress' : 'w-0'
                }`}
                style={index === currentSlide ? { animationDuration: `${SLIDE_DURATION}ms` } : {}}
              />
            </div>
          ))}
        </div>

        {/* Close button */}
        <button
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          className="absolute top-6 right-6 text-white/80 hover:text-white text-3xl z-10 transition-colors"
        >
          ✕
        </button>

        {/* Navigation arrows */}
        <button
          onClick={(e) => { e.stopPropagation(); prevSlide(); }}
          className={`absolute left-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white text-4xl z-10 transition-all ${currentSlide === 0 ? 'opacity-0' : ''}`}
        >
          ‹
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); nextSlide(); }}
          className={`absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white text-4xl z-10 transition-all ${currentSlide === slides.length - 1 ? 'opacity-0' : ''}`}
        >
          ›
        </button>

        {/* Slide content */}
        <div className="h-full flex items-center justify-center p-8">
          {renderSlide()}
        </div>

        {/* Tap hint */}
        <div className="absolute bottom-8 left-0 right-0 text-center text-white/50 text-sm">
          Tap anywhere to continue • Use ← → arrows
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && shareImageUrl && (
        <div className="fixed inset-0 z-[60] bg-black/90 flex flex-col items-center justify-center p-4 animate-fade-in" onClick={() => setShowShareModal(false)}>
          <div className="relative max-w-lg w-full flex flex-col items-center" onClick={e => e.stopPropagation()}>
            <h2 className="text-2xl font-bold text-white mb-4">Your Wrapped Card</h2>
            <img 
              src={shareImageUrl} 
              alt="Wrapped Summary" 
              className="max-h-[60vh] w-auto rounded-xl shadow-2xl mb-6 border border-gray-800" 
            />
            <div className="flex gap-4 w-full justify-center">
              <button 
                onClick={() => setShowShareModal(false)} 
                className="px-6 py-3 bg-gray-800 text-white font-bold rounded-full hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
              <a 
                href={shareImageUrl} 
                download="youtube-wrapped-2025.png" 
                className="px-6 py-3 bg-[#ff0000] text-white font-bold rounded-full hover:bg-red-700 transition-colors flex items-center gap-2 shadow-lg"
                onClick={(e) => e.stopPropagation()}
              >
                Download Image
              </a>
            </div>
            <p className="text-gray-500 text-sm mt-4">Image generated locally in your browser</p>
          </div>
        </div>
      )}
    </>
  );
}
