// src/components/profile/equity-chart/EmptyState.tsx
interface EmptyStateProps {
  isLoading: boolean;
  isConnected: boolean;
}

export default function EmptyState({
  isLoading,
  isConnected,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-[320px] text-center">
      <div className="w-16 h-16 mb-4 bg-white/5 rounded-lg flex items-center justify-center">
        <span className="text-2xl text-white/20">📊</span>
      </div>
      <div className="space-y-2">
        <p className="text-white/60 text-sm">
          {isLoading
            ? "Loading equity data..."
            : !isConnected
            ? "Connect your wallet to view equity trends"
            : "No equity data available, Try refreshing"}
        </p>
        {!isConnected && (
          <p className="text-white/40 text-xs">
            Connect your wallet to start tracking
          </p>
        )}
      </div>
    </div>
  );
}
