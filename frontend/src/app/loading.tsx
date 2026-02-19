export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        <p className="text-sm text-gray-500">Loading...</p>
        <p className="text-xs text-gray-400 max-w-xs text-center">
          First load may take a moment. If it takes too long, try refreshing.
        </p>
      </div>
    </div>
  );
}
