import { useState, useEffect, useRef } from 'react';
import {
  Play,
  Clock,
  Eye,
  ThumbsUp,
  Bookmark,
  BookmarkCheck,
  Search,
  ChevronRight,
  Lock,
  CheckCircle,
  RefreshCw,
  List,
  Grid3X3,
} from 'lucide-react';
import {
  getVideos,
  getVideo,
  getFeaturedVideos,
  getPlaylists,
  getUserProgress,
  updateProgress,
  toggleBookmark,
  toggleLike,
  formatDuration,
  CATEGORY_INFO,
  type Video,
  type Playlist,
  type VideoCategory,
  type VideoFilters,
  type UserVideoProgress,
} from '../services/videoTutorials';

interface VideoLibraryProps {
  userId?: string;
  isPremium?: boolean;
}

export function VideoLibrary({ userId, isPremium }: VideoLibraryProps) {
  const [videos, setVideos] = useState<Video[]>([]);
  const [featuredVideos, setFeaturedVideos] = useState<Video[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [userProgress, setUserProgress] = useState<Map<string, UserVideoProgress>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filters, setFilters] = useState<VideoFilters>({
    sortBy: 'newest',
    page: 1,
    limit: 12,
  });
  const [total, setTotal] = useState(0);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    loadVideos();
  }, [filters]);

  useEffect(() => {
    if (userId) {
      loadUserProgress();
    }
  }, [userId]);

  const loadInitialData = async () => {
    setIsLoading(true);
    const [featured, playlistData] = await Promise.all([
      getFeaturedVideos(),
      getPlaylists(),
    ]);
    setFeaturedVideos(featured);
    setPlaylists(playlistData);
    setIsLoading(false);
  };

  const loadVideos = async () => {
    const result = await getVideos(filters);
    if (!result.error) {
      setVideos(result.videos);
      setTotal(result.total);
    }
  };

  const loadUserProgress = async () => {
    if (userId) {
      const progress = await getUserProgress(userId);
      setUserProgress(progress);
    }
  };

  const handleCategoryFilter = (category?: VideoCategory) => {
    setFilters((prev) => ({ ...prev, category, page: 1 }));
  };

  const handleSearch = (query: string) => {
    setFilters((prev) => ({ ...prev, query, page: 1 }));
  };

  if (selectedVideo) {
    return (
      <VideoPlayer
        videoId={selectedVideo}
        userId={userId}
        isPremium={isPremium}
        userProgress={userProgress}
        onBack={() => setSelectedVideo(null)}
        onProgressUpdate={loadUserProgress}
      />
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30 rounded-2xl p-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-3 mb-2">
          <Play className="h-7 w-7 text-purple-400" />
          Video Tutorials
        </h1>
        <p className="text-slate-400">
          Learn crypto at your own pace with our curated video library
        </p>
      </div>

      {/* Featured Videos */}
      {featuredVideos.length > 0 && !filters.category && !filters.query && (
        <section>
          <h2 className="text-xl font-semibold text-white mb-4">Featured</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {featuredVideos.slice(0, 3).map((video) => (
              <VideoCard
                key={video.id}
                video={video}
                progress={userProgress.get(video.id)}
                isPremium={isPremium}
                onClick={() => setSelectedVideo(video.id)}
                featured
              />
            ))}
          </div>
        </section>
      )}

      {/* Playlists */}
      {playlists.length > 0 && !filters.category && !filters.query && (
        <section>
          <h2 className="text-xl font-semibold text-white mb-4">Learning Paths</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {playlists.map((playlist) => (
              <PlaylistCard
                key={playlist.id}
                playlist={playlist}
                onClick={() => setSelectedVideo(playlist.videos[0]?.id)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Search and Filters */}
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search videos..."
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500"
              />
            </div>
          </div>

          {/* Difficulty Filter */}
          <select
            value={filters.difficulty || ''}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                difficulty: e.target.value as Video['difficulty'] || undefined,
                page: 1,
              }))
            }
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
          >
            <option value="">All Levels</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>

          {/* Sort */}
          <select
            value={filters.sortBy}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                sortBy: e.target.value as VideoFilters['sortBy'],
                page: 1,
              }))
            }
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
          >
            <option value="newest">Newest</option>
            <option value="popular">Most Popular</option>
            <option value="duration">Shortest First</option>
          </select>

          {/* View Toggle */}
          <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'grid'
                  ? 'bg-purple-500 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Grid3X3 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'list'
                  ? 'bg-purple-500 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Category Quick Filters */}
        <div className="flex flex-wrap gap-2 mt-4">
          <button
            onClick={() => handleCategoryFilter(undefined)}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
              !filters.category
                ? 'bg-purple-500 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            All
          </button>
          {Object.entries(CATEGORY_INFO).map(([key, info]) => (
            <button
              key={key}
              onClick={() =>
                handleCategoryFilter(
                  filters.category === key ? undefined : (key as VideoCategory)
                )
              }
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                filters.category === key
                  ? 'text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
              style={{
                backgroundColor: filters.category === key ? info.color : undefined,
              }}
            >
              {info.icon} {info.label}
            </button>
          ))}
        </div>
      </div>

      {/* Videos Grid/List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 text-purple-400 animate-spin" />
        </div>
      ) : videos.length === 0 ? (
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-8 text-center">
          <Play className="h-12 w-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No Videos Found</h3>
          <p className="text-slate-400">Try adjusting your filters</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {videos.map((video) => (
            <VideoCard
              key={video.id}
              video={video}
              progress={userProgress.get(video.id)}
              isPremium={isPremium}
              onClick={() => setSelectedVideo(video.id)}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {videos.map((video) => (
            <VideoListItem
              key={video.id}
              video={video}
              progress={userProgress.get(video.id)}
              isPremium={isPremium}
              onClick={() => setSelectedVideo(video.id)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {total > filters.limit && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setFilters((prev) => ({ ...prev, page: prev.page - 1 }))}
            disabled={filters.page === 1}
            className="px-4 py-2 bg-slate-800 text-white rounded-lg disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-slate-400">
            Page {filters.page} of {Math.ceil(total / filters.limit)}
          </span>
          <button
            onClick={() => setFilters((prev) => ({ ...prev, page: prev.page + 1 }))}
            disabled={filters.page >= Math.ceil(total / filters.limit)}
            className="px-4 py-2 bg-slate-800 text-white rounded-lg disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

// Video Card
function VideoCard({
  video,
  progress,
  isPremium,
  onClick,
  featured,
}: {
  video: Video;
  progress?: UserVideoProgress;
  isPremium?: boolean;
  onClick: () => void;
  featured?: boolean;
}) {
  const isLocked = video.isPremium && !isPremium;
  const watchProgress = progress
    ? Math.round((progress.watchedSeconds / video.duration) * 100)
    : 0;
  const categoryInfo = CATEGORY_INFO[video.category];

  return (
    <div
      onClick={!isLocked ? onClick : undefined}
      className={`bg-slate-900 border border-slate-700 rounded-xl overflow-hidden transition-all ${
        isLocked ? 'opacity-75' : 'hover:border-purple-500/50 cursor-pointer hover:scale-[1.02]'
      } ${featured ? 'ring-2 ring-purple-500/30' : ''}`}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-slate-800">
        <img
          src={video.thumbnailUrl}
          alt={video.title}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        {isLocked && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <Lock className="h-8 w-8 text-white" />
          </div>
        )}
        <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/80 rounded text-xs text-white">
          {formatDuration(video.duration)}
        </div>
        {progress?.completed && (
          <div className="absolute top-2 right-2">
            <CheckCircle className="h-6 w-6 text-green-400" />
          </div>
        )}
        {watchProgress > 0 && !progress?.completed && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-700">
            <div
              className="h-full bg-purple-500"
              style={{ width: `${watchProgress}%` }}
            />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <span
            className="px-2 py-0.5 rounded text-xs"
            style={{
              backgroundColor: `${categoryInfo.color}20`,
              color: categoryInfo.color,
            }}
          >
            {categoryInfo.label}
          </span>
          <span
            className={`px-2 py-0.5 rounded text-xs ${
              video.difficulty === 'beginner'
                ? 'bg-green-500/20 text-green-400'
                : video.difficulty === 'intermediate'
                ? 'bg-yellow-500/20 text-yellow-400'
                : 'bg-red-500/20 text-red-400'
            }`}
          >
            {video.difficulty}
          </span>
          {video.isPremium && (
            <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded text-xs">
              Premium
            </span>
          )}
        </div>

        <h3 className="font-medium text-white line-clamp-2 mb-2">{video.title}</h3>

        <div className="flex items-center gap-3 text-sm text-slate-500">
          <span className="flex items-center gap-1">
            <Eye className="h-3 w-3" />
            {video.views.toLocaleString()}
          </span>
          <span className="flex items-center gap-1">
            <ThumbsUp className="h-3 w-3" />
            {video.likes}
          </span>
        </div>
      </div>
    </div>
  );
}

// Video List Item
function VideoListItem({
  video,
  progress,
  isPremium,
  onClick,
}: {
  video: Video;
  progress?: UserVideoProgress;
  isPremium?: boolean;
  onClick: () => void;
}) {
  const isLocked = video.isPremium && !isPremium;
  const categoryInfo = CATEGORY_INFO[video.category];

  return (
    <div
      onClick={!isLocked ? onClick : undefined}
      className={`bg-slate-900 border border-slate-700 rounded-xl p-4 flex gap-4 transition-all ${
        isLocked ? 'opacity-75' : 'hover:border-purple-500/50 cursor-pointer'
      }`}
    >
      {/* Thumbnail */}
      <div className="relative w-48 flex-shrink-0">
        <div className="aspect-video bg-slate-800 rounded-lg overflow-hidden">
          <img
            src={video.thumbnailUrl}
            alt={video.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          {isLocked && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-lg">
              <Lock className="h-6 w-6 text-white" />
            </div>
          )}
          <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/80 rounded text-xs text-white">
            {formatDuration(video.duration)}
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span
            className="px-2 py-0.5 rounded text-xs"
            style={{
              backgroundColor: `${categoryInfo.color}20`,
              color: categoryInfo.color,
            }}
          >
            {categoryInfo.label}
          </span>
          {video.isPremium && (
            <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded text-xs">
              Premium
            </span>
          )}
          {progress?.completed && (
            <CheckCircle className="h-4 w-4 text-green-400" />
          )}
        </div>

        <h3 className="font-medium text-white mb-1">{video.title}</h3>
        <p className="text-sm text-slate-400 line-clamp-2 mb-2">{video.description}</p>

        <div className="flex items-center gap-4 text-sm text-slate-500">
          <span className="flex items-center gap-1">
            <Eye className="h-3 w-3" />
            {video.views.toLocaleString()} views
          </span>
          <span className="flex items-center gap-1">
            <ThumbsUp className="h-3 w-3" />
            {video.likes} likes
          </span>
          <span>{video.instructor.name}</span>
        </div>
      </div>
    </div>
  );
}

// Playlist Card
function PlaylistCard({
  playlist,
  onClick,
}: {
  playlist: Playlist;
  onClick: () => void;
}) {
  const categoryInfo = CATEGORY_INFO[playlist.category];

  return (
    <div
      onClick={onClick}
      className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden hover:border-purple-500/50 cursor-pointer transition-all flex"
    >
      {/* Thumbnail */}
      <div className="relative w-40 flex-shrink-0">
        <div className="aspect-video bg-slate-800">
          <img
            src={playlist.thumbnailUrl}
            alt={playlist.title}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-slate-900/90" />
        <div className="absolute bottom-2 left-2 right-2">
          <div className="text-white text-sm font-medium">
            {playlist.videoCount} videos
          </div>
          <div className="text-slate-300 text-xs">
            {formatDuration(playlist.totalDuration)}
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="p-4 flex-1">
        <span
          className="inline-block px-2 py-0.5 rounded text-xs mb-2"
          style={{
            backgroundColor: `${categoryInfo.color}20`,
            color: categoryInfo.color,
          }}
        >
          {categoryInfo.label}
        </span>
        <h3 className="font-medium text-white mb-1">{playlist.title}</h3>
        <p className="text-sm text-slate-400 line-clamp-2">{playlist.description}</p>
      </div>

      <div className="p-4 flex items-center">
        <ChevronRight className="h-5 w-5 text-slate-400" />
      </div>
    </div>
  );
}

// Video Player
function VideoPlayer({
  videoId,
  userId,
  isPremium,
  userProgress,
  onBack,
  onProgressUpdate,
}: {
  videoId: string;
  userId?: string;
  isPremium?: boolean;
  userProgress: Map<string, UserVideoProgress>;
  onBack: () => void;
  onProgressUpdate: () => void;
}) {
  const [video, setVideo] = useState<Video | null>(null);
  const [relatedVideos, setRelatedVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const progressRef = useRef<number>(0);

  useEffect(() => {
    loadVideo();
  }, [videoId]);

  useEffect(() => {
    const progress = userProgress.get(videoId);
    if (progress) {
      setIsBookmarked(progress.bookmarked);
      setIsLiked(progress.liked);
    }
  }, [videoId, userProgress]);

  const loadVideo = async () => {
    setIsLoading(true);
    const result = await getVideo(videoId);
    if (!result.error && result.video) {
      setVideo(result.video);
      setRelatedVideos(result.related);
    }
    setIsLoading(false);
  };

  // Progress handler for video playback - reserved for future use
  void progressRef;

  const handleBookmark = async () => {
    if (!userId) return;
    const result = await toggleBookmark(userId, videoId);
    if (!result.error) {
      setIsBookmarked(result.bookmarked);
    }
  };

  const handleLike = async () => {
    if (!userId) return;
    const result = await toggleLike(userId, videoId);
    if (!result.error) {
      setIsLiked(result.liked);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-8 w-8 text-purple-400 animate-spin" />
      </div>
    );
  }

  if (!video) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400">Video not found</p>
        <button onClick={onBack} className="mt-4 text-purple-400 hover:text-purple-300">
          Go back
        </button>
      </div>
    );
  }

  const isLocked = video.isPremium && !isPremium;
  const categoryInfo = CATEGORY_INFO[video.category];

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
      >
        ← Back to library
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-4">
          {/* Video Player */}
          <div className="aspect-video bg-slate-900 rounded-xl overflow-hidden">
            {isLocked ? (
              <div className="w-full h-full flex flex-col items-center justify-center bg-slate-800">
                <Lock className="h-16 w-16 text-slate-400 mb-4" />
                <h3 className="text-xl font-medium text-white mb-2">Premium Content</h3>
                <p className="text-slate-400 mb-4">Upgrade to access this video</p>
                <button className="px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600">
                  Upgrade Now
                </button>
              </div>
            ) : (
              <iframe
                src={`https://www.youtube.com/embed/${video.embedId}?enablejsapi=1`}
                title={video.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            )}
          </div>

          {/* Video Info */}
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-3">
              <span
                className="px-2 py-0.5 rounded text-sm"
                style={{
                  backgroundColor: `${categoryInfo.color}20`,
                  color: categoryInfo.color,
                }}
              >
                {categoryInfo.icon} {categoryInfo.label}
              </span>
              <span
                className={`px-2 py-0.5 rounded text-sm ${
                  video.difficulty === 'beginner'
                    ? 'bg-green-500/20 text-green-400'
                    : video.difficulty === 'intermediate'
                    ? 'bg-yellow-500/20 text-yellow-400'
                    : 'bg-red-500/20 text-red-400'
                }`}
              >
                {video.difficulty}
              </span>
            </div>

            <h1 className="text-2xl font-bold text-white mb-2">{video.title}</h1>

            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4 text-slate-400">
                <span className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  {video.views.toLocaleString()} views
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {formatDuration(video.duration)}
                </span>
              </div>

              {userId && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleLike}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-colors ${
                      isLiked
                        ? 'bg-purple-500/20 text-purple-400'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <ThumbsUp className="h-4 w-4" />
                    {video.likes + (isLiked ? 1 : 0)}
                  </button>
                  <button
                    onClick={handleBookmark}
                    className={`p-2 rounded-lg transition-colors ${
                      isBookmarked
                        ? 'bg-purple-500/20 text-purple-400'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {isBookmarked ? (
                      <BookmarkCheck className="h-5 w-5" />
                    ) : (
                      <Bookmark className="h-5 w-5" />
                    )}
                  </button>
                </div>
              )}
            </div>

            <p className="text-slate-300">{video.description}</p>

            {/* Instructor */}
            <div className="flex items-center gap-3 mt-6 pt-4 border-t border-slate-700">
              <img
                src={video.instructor.avatar}
                alt={video.instructor.name}
                className="w-10 h-10 rounded-full"
              />
              <div>
                <div className="font-medium text-white">{video.instructor.name}</div>
                <div className="text-sm text-slate-400">{video.instructor.bio}</div>
              </div>
            </div>

            {/* Tags */}
            {video.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {video.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 bg-slate-800 text-slate-400 rounded text-sm"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar - Related Videos */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Related Videos</h3>
          {relatedVideos.map((relVideo) => (
            <div
              key={relVideo.id}
              onClick={() => window.location.reload()}
              className="bg-slate-900 border border-slate-700 rounded-lg p-3 flex gap-3 cursor-pointer hover:border-purple-500/50 transition-colors"
            >
              <div className="w-32 flex-shrink-0">
                <div className="aspect-video bg-slate-800 rounded overflow-hidden">
                  <img
                    src={relVideo.thumbnailUrl}
                    alt={relVideo.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-white line-clamp-2">
                  {relVideo.title}
                </h4>
                <div className="text-xs text-slate-400 mt-1">
                  {formatDuration(relVideo.duration)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
