import WatchHistoryAnalyzer from '@/components/WatchHistoryAnalyzer';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-[#0f0f0f] text-white">
      <h1 className="text-5xl md:text-7xl font-bold mb-12 tracking-tighter">
        <span className="text-[#ff0000]">YouTube</span>Wrap
      </h1>
      
      <WatchHistoryAnalyzer />

      <div className="mt-12 max-w-2xl w-full bg-[#1f1f1f] rounded-xl p-6 md:p-8 border border-gray-800 shadow-xl">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <span>📥</span> How to get your data
        </h2>
        
        <ol className="space-y-4 text-gray-300 list-decimal list-inside">
          <li>
            Visit <a href="https://takeout.google.com" target="_blank" rel="noopener noreferrer" className="text-[#ff0000] hover:underline font-medium">Google Takeout</a> and sign in
          </li>
          <li>
            Click <span className="font-bold text-white">"Deselect all"</span>, then scroll down and select only <span className="font-bold text-white">"YouTube and YouTube Music"</span>
          </li>
          <li>
            Click <span className="font-bold text-white">"Multiple formats"</span> and ensure History is set to <span className="font-bold text-white">HTML</span>
          </li>
          <li>
            Click <span className="font-bold text-white">"Next step"</span> and then <span className="font-bold text-white">"Create export"</span>
          </li>
          <li>
            Wait for the email (usually takes a few minutes), download the zip, and find <code className="bg-black/50 px-2 py-1 rounded text-sm text-[#ff0000]">watch-history.html</code> inside the extracted folder
          </li>
        </ol>
        
        <p className="mt-6 text-sm text-gray-500 border-t border-gray-800 pt-4">
          Note: The file is processed entirely in your browser. No data is uploaded to any server.
        </p>
      </div>

      <div className="mt-16 text-center space-y-2">
        <p className="text-gray-500 font-medium flex items-center justify-center gap-2">
          <span>🔒</span> Data is processed locally on your device
        </p>
        <p className="text-gray-600">
          We are <span className="font-semibold text-gray-400">open source</span>
        </p>
      </div>
    </main>
  );
}
