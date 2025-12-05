import WatchHistoryAnalyzer from '@/components/WatchHistoryAnalyzer';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-[#0f0f0f] text-white">
      <h1 className="text-5xl md:text-7xl font-bold mb-12 tracking-tighter">
        <span className="text-[#ff0000]">YouTube</span>Wrap
      </h1>
      
      <WatchHistoryAnalyzer />

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
