import { Share2 } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';

/**
 * Share the current page via the Web Share API, falling back to copying the
 * link. Browser APIs are only touched inside the click handler (SSR-safe).
 */
export function ShareButton({ title }: { title: string }) {
  const toast = useToast();

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        // User dismissed the share sheet; nothing to report.
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied', 'The page link is on your clipboard.');
    } catch {
      toast.error('Could not copy link', 'Copy the address from your browser bar instead.');
    }
  };

  return (
    <button
      type="button"
      onClick={handleShare}
      className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
    >
      <Share2 className="w-4 h-4" aria-hidden="true" />
      Share
    </button>
  );
}
