'use client';

import { useState, useCallback } from 'react';
import { parseWatchHistory, getYearlyStats, getYearComparison, type ChannelStats, type VideoStats, type YearComparison } from '@/lib/parseWatchHistory';
import WrappedSlideshow from './WrappedSlideshow';

interface AnalysisResult {
  totalVideos: number;
  uniqueChannels: number;
  topChannels: ChannelStats[];
  topVideos: VideoStats[];
  comparison: YearComparison | null;
  dayNight: { persona: string };
}

export default function WatchHistoryAnalyzer() {
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showWrapped, setShowWrapped] = useState(false);

  const analyzeFile = useCallback(async (file: File) => {
    setIsAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      const content = await file.text();
      const entries = parseWatchHistory(content);
      
      if (entries.length === 0) {
        setError('No watch history entries found. Make sure you uploaded the correct file.');
        return;
      }
      const stats = getYearlyStats(entries, 2025);
      const comparison = getYearComparison(entries, 2025);
      setResult({ 
        ...stats, 
        comparison 
      });
      setShowWrapped(true);
      setShowWrapped(true);
    } catch (e) {
      setError('Failed to parse the file. Please ensure it\'s a valid YouTube watch history HTML file.');
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith('.html') || file.name.endsWith('.htm'))) {
      analyzeFile(file);
    } else {
      setError('Please upload an HTML file');
    }
  }, [analyzeFile]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      analyzeFile(file);
    }
  }, [analyzeFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleCloseWrapped = useCallback(() => {
    setShowWrapped(false);
  }, []);

  const handleRestartWrapped = useCallback(() => {
    setShowWrapped(true);
  }, []);

  // Show the Wrapped slideshow
  if (showWrapped && result) {
    return <WrappedSlideshow data={result} onClose={handleCloseWrapped} />;
  }

  return (
    <div className="w-full max-w-4xl">
      {!showWrapped && (
        <label 
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`w-full p-16 border-2 border-dashed rounded-xl flex flex-col items-center justify-center bg-[#1f1f1f] shadow-sm transition-all cursor-pointer
          ${isDragging ? 'border-[#ff0000] bg-[#2a1f1f] scale-105' : 'border-gray-700 hover:border-[#ff0000] hover:bg-[#2a2a2a]'}
          ${isAnalyzing ? 'opacity-50 pointer-events-none' : ''}`}
        >
          <input 
            type="file" 
            accept=".html,.htm"
            onChange={handleFileInput}
            className="hidden"
          />
          
          <div className={`text-6xl mb-4 transition-transform ${isDragging ? 'scale-125' : 'group-hover:scale-110'}`}>
            {isAnalyzing ? '⏳' : '📂'}
          </div>
          
          <p className="text-xl md:text-2xl text-gray-300 font-medium text-center">
            {isAnalyzing ? 'Analyzing your watch history...' : 'Drop your watch-history.html file here'}
          </p>
          <p className="text-gray-500 mt-2">or click to browse</p>
        </label>
      )}

      {error && (
        <div className="mt-6 p-4 bg-red-900/20 border border-red-900/50 rounded-lg text-red-400">
          {error}
        </div>
      )}

      {result && !showWrapped && (
        <div className="mt-8 space-y-6">
          <button 
            onClick={handleRestartWrapped}
            className="w-full py-4 bg-[#ff0000] text-white font-bold text-xl rounded-xl hover:bg-red-700 transition-all transform hover:scale-105 shadow-lg"
          >
            🎬 Watch Your 2025 Wrapped Again
          </button>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#1f1f1f] p-6 rounded-xl shadow-sm border border-gray-800">
              <p className="text-gray-400 text-sm">Videos Watched in 2025</p>
              <p className="text-4xl font-bold text-white">{result.totalVideos.toLocaleString()}</p>
            </div>
            <div className="bg-[#1f1f1f] p-6 rounded-xl shadow-sm border border-gray-800">
              <p className="text-gray-400 text-sm">Unique Channels</p>
              <p className="text-4xl font-bold text-white">{result.uniqueChannels.toLocaleString()}</p>
            </div>
          </div>

          <div className="bg-[#1f1f1f] p-6 rounded-xl shadow-sm border border-gray-800">
            <h2 className="text-xl font-bold text-white mb-4">🎬 Top 50 Most Watched Videos in 2025</h2>
            {result.topVideos && result.topVideos.length > 0 ? (
              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                {result.topVideos.map((video, index) => (
                  <div key={`${video.url}-${index}`} className="flex items-center gap-4 p-3 rounded-lg hover:bg-[#2a2a2a] transition-colors">
                    <span className={`text-xl font-bold min-w-[3rem] text-right ${index === 0 ? 'text-[#ff0000]' : 'text-gray-500'}`}>
                      #{index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <a href={video.url} target="_blank" rel="noopener noreferrer" className="font-medium text-white hover:text-[#ff0000] truncate block">
                        {video.title}
                      </a>
                      <a href={video.channelUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-gray-400 hover:text-[#ff0000] truncate block">
                        {video.channelName}
                      </a>
                    </div>
                    <div className="text-right whitespace-nowrap">
                      <span className="text-lg font-semibold text-white">{video.viewCount.toLocaleString()}</span>
                      <span className="text-gray-500 text-sm ml-1">{video.viewCount === 1 ? 'view' : 'views'}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No watch history found for 2025</p>
            )}
          </div>

          <div className="bg-[#1f1f1f] p-6 rounded-xl shadow-sm border border-gray-800">
            <h2 className="text-xl font-bold text-white mb-4">🏆 Top 100 Channels in 2025</h2>
            {result.topChannels.length > 0 ? (
              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                {result.topChannels.map((channel, index) => (
                  <div key={`${channel.name}-${index}`} className="flex items-center gap-4 p-3 rounded-lg hover:bg-[#2a2a2a] transition-colors">
                    <span className={`text-xl font-bold min-w-[3rem] text-right ${index === 0 ? 'text-[#ff0000]' : 'text-gray-500'}`}>
                      #{index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      {channel.url ? (
                        <a href={channel.url} target="_blank" rel="noopener noreferrer" className="font-medium text-white hover:text-[#ff0000] truncate block">
                          {channel.name}
                        </a>
                      ) : (
                        <span className="font-medium text-white truncate block">{channel.name}</span>
                      )}
                    </div>
                    <div className="text-right whitespace-nowrap">
                      <span className="text-lg font-semibold text-white">{channel.viewCount.toLocaleString()}</span>
                      <span className="text-gray-500 text-sm ml-1">{channel.viewCount === 1 ? 'video' : 'videos'}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No watch history found for 2025</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
