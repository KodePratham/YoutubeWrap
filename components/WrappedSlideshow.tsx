'use client';

import { useState, useEffect, useCallback } from 'react';
import { type ChannelStats, type VideoStats, type YearComparison } from '@/lib/parseWatchHistory';

interface WrappedData {
  totalVideos: number;
  uniqueChannels: number;
  topChannels: ChannelStats[];
  topVideos: VideoStats[];
  comparison: YearComparison | null;
}

interface WrappedSlideshowProps {
  data: WrappedData;
  onClose: () => void;
}

const SLIDE_DURATION = 5000; // 5 seconds per slide

export default function WrappedSlideshow({ data, onClose }: WrappedSlideshowProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAnimating, setIsAnimating] = useState(true);

  const slides = [
    { type: 'intro' },
    { type: 'totalVideos' },
    ...(data.comparison ? [{ type: 'videosComparison' }] : []),
    { type: 'uniqueChannels' },
    ...(data.comparison ? [{ type: 'channelsComparison' }] : []),
    { type: 'topChannel' },
    ...(data.comparison?.newTopChannel ? [{ type: 'topChannelChange' }] : []),
    { type: 'top5Channels' },
    { type: 'topVideo' },
    { type: 'top5Videos' },
    ...(data.comparison ? [{ type: 'yearSummary' }] : []),
    { type: 'outro' },
  ];

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
    if (currentSlide < slides.length - 1) {
      const timer = setTimeout(nextSlide, SLIDE_DURATION);
      return () => clearTimeout(timer);
    }
  }, [currentSlide, nextSlide, slides.length]);

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

  const gradients = [
    'from-[#ff0000] via-[#212121] to-[#000000]',
    'from-[#000000] via-[#330000] to-[#ff0000]',
    'from-[#1a1a1a] via-[#ff0000] to-[#000000]',
    'from-[#000000] via-[#1a1a1a] to-[#333333]',
    'from-[#212121] via-[#ff0000] to-[#212121]',
  ];

  const renderSlide = () => {
    const slide = slides[currentSlide];
    const gradient = gradients[currentSlide % gradients.length];

    switch (slide.type) {
      case 'intro':
        return (
          <div className={`flex flex-col items-center justify-center text-center text-white ${isAnimating ? 'animate-fade-in' : 'opacity-0'}`}>
            <div className="text-6xl mb-6 animate-bounce-slow">🎬</div>
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
            <div className="mt-8 text-6xl animate-bounce-slow">📺</div>
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
            <div className="mt-8 text-6xl animate-bounce-slow">👥</div>
          </div>
        );

      case 'topChannel':
        const topChannel = data.topChannels[0];
        return (
          <div className={`flex flex-col items-center justify-center text-center text-white px-8 ${isAnimating ? 'animate-fade-in' : 'opacity-0'}`}>
            <div className="text-6xl mb-6 animate-spin-slow">👑</div>
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
            <h2 className="text-3xl md:text-4xl font-black mb-2 animate-slide-down">🏆 Your Top Squad</h2>
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

      case 'topVideo':
        const topVideo = data.topVideos[0];
        return (
          <div className={`flex flex-col items-center justify-center text-center text-white px-8 ${isAnimating ? 'animate-fade-in' : 'opacity-0'}`}>
            <div className="text-6xl mb-6 animate-pulse">🔥</div>
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
            <h2 className="text-3xl md:text-4xl font-black mb-2 animate-slide-down">🎬 On Repeat</h2>
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
            <div className="text-6xl mb-6 animate-bounce-slow">{vidUp ? '📈' : '📉'}</div>
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
            <div className="text-6xl mb-6 animate-bounce-slow">{chanUp ? '🌟' : '🎯'}</div>
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
            <div className="text-6xl mb-6 animate-bounce-slow">🔄</div>
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
            <div className="text-6xl mb-6 animate-bounce-slow">📊</div>
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
            <div className="text-6xl mb-6 animate-bounce-slow">🎉</div>
            <h1 className="text-4xl md:text-6xl font-black mb-4 animate-slide-up">That's a Wrap!</h1>
            <p className="text-xl text-gray-300 mb-8 animate-fade-in-delay">Thanks for being part of the community in 2025.</p>
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
  );
}
