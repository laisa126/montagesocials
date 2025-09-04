export default function HomePage() {
  return (
    <div className="flex flex-col h-screen bg-white">
      {/* 🔝 Top bar */}
      <div className="flex justify-between items-center px-4 py-2 border-b">
        <h1 className="font-bold text-lg">Montage</h1>
      </div>
      
      {/* Main content */}
      <div className="flex-1 overflow-y-auto flex items-center justify-center">
        <div className="text-center text-gray-500 py-4">
          Welcome to Montage! Use the bottom navigation to explore.
        </div>
      </div>
    </div>
  );
}