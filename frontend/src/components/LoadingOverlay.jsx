import { Sprout } from 'lucide-react';

/**
 * Full-screen loading overlay component
 * Useful for async operations that block user interaction
 * Redesigned with a plant/growth theme instead of a spinner
 */
export const LoadingOverlay = ({ isVisible = false, message = 'Loading...' }) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999]">
      <div className="bg-slate-900 border border-white/10 rounded-2xl p-8 shadow-2xl text-center">
        <div className="relative flex justify-center mb-4">
          {/* soil/base line */}
          <div className="absolute bottom-0 w-12 h-1 rounded-full bg-[#16a34a]/20" />
          <Sprout className="text-4xl text-[#16a34a] animate-bounce" style={{ animationDuration: '1.6s' }} />
        </div>
        <p className="text-white font-medium">{message}</p>
      </div>
    </div>
  );
};

export default LoadingOverlay;