import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  GraduationCap,
  Search,
  Filter,
  Star,
  Clock,
  Users,
  Play,
  CheckCircle,
  Lock,
  ShoppingCart,
  Award,
  BookOpen,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import {
  getPublishedCourses,
  getFeaturedCourses,
  getCourseBySlug,
  hasCoursePurchase,
  createCourseCheckout,
  getCourseReviews,
  COURSE_CATEGORIES,
  type MarketplaceCourse,
  type CourseEducator,
} from '../services/courseMarketplace';

export function CourseMarketplace() {
  const { user } = useAuth();
  const { slug } = useParams();
  const [courses, setCourses] = useState<MarketplaceCourse[]>([]);
  const [featuredCourses, setFeaturedCourses] = useState<MarketplaceCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'popular' | 'newest' | 'rating' | 'price_low' | 'price_high'>('popular');
  const [selectedCourse, setSelectedCourse] = useState<MarketplaceCourse | null>(null);
  const [hasPurchased, setHasPurchased] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [reviews, setReviews] = useState<{ rating: number; review: string; review_at: string }[]>([]);

  useEffect(() => {
    loadCourses();
  }, [selectedCategory, selectedDifficulty, sortBy]);

  useEffect(() => {
    if (slug) {
      loadSingleCourse(slug);
    }
  }, [slug, user?.id]);

  async function loadCourses() {
    setLoading(true);
    try {
      const [published, featured] = await Promise.all([
        getPublishedCourses({
          category: selectedCategory !== 'all' ? selectedCategory : undefined,
          difficulty: selectedDifficulty !== 'all' ? selectedDifficulty : undefined,
          sortBy,
          limit: 20,
        }),
        getFeaturedCourses(4),
      ]);
      setCourses(published);
      setFeaturedCourses(featured);
    } catch (error) {
      console.error('Error loading courses:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadSingleCourse(courseSlug: string) {
    setLoading(true);
    try {
      const course = await getCourseBySlug(courseSlug);
      setSelectedCourse(course);

      if (course && user?.id) {
        const purchased = await hasCoursePurchase(user.id, course.id);
        setHasPurchased(purchased);
      }

      if (course) {
        const courseReviews = await getCourseReviews(course.id, 5);
        setReviews(courseReviews);
      }
    } catch (error) {
      console.error('Error loading course:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handlePurchase(course: MarketplaceCourse) {
    if (!user) {
      window.location.href = `/login?redirect=/courses/${course.slug}`;
      return;
    }

    setPurchasing(true);
    try {
      const { url, error } = await createCourseCheckout(
        course.id,
        user.id,
        user.email || ''
      );

      if (error) {
        alert(error);
        return;
      }

      if (url) {
        window.location.href = url;
      }
    } finally {
      setPurchasing(false);
    }
  }

  const filteredCourses = courses.filter(
    (course) =>
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const difficulties = ['all', 'beginner', 'intermediate', 'advanced', 'expert'];

  // Single course view
  if (selectedCourse) {
    const educator = selectedCourse.educator as CourseEducator | undefined;
    const isOnSale = selectedCourse.sale_price && selectedCourse.sale_ends_at &&
      new Date(selectedCourse.sale_ends_at) > new Date();

    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Link
          to="/courses"
          className="text-orange-500 hover:text-orange-400 mb-6 inline-flex items-center gap-2"
        >
          Back to Courses
        </Link>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Course Header */}
            <div className="glass-card p-8 mb-6">
              {selectedCourse.thumbnail_url && (
                <img
                  src={selectedCourse.thumbnail_url}
                  alt={selectedCourse.title}
                  className="w-full h-64 object-cover rounded-lg mb-6"
                />
              )}

              <div className="flex items-center gap-2 mb-4">
                <span className="px-3 py-1 bg-orange-500/20 text-orange-500 text-sm font-medium rounded-full">
                  {selectedCourse.category}
                </span>
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                  selectedCourse.difficulty === 'beginner' ? 'bg-green-500/20 text-green-500' :
                  selectedCourse.difficulty === 'intermediate' ? 'bg-yellow-500/20 text-yellow-500' :
                  selectedCourse.difficulty === 'advanced' ? 'bg-orange-500/20 text-orange-500' :
                  'bg-red-500/20 text-red-500'
                }`}>
                  {selectedCourse.difficulty}
                </span>
              </div>

              <h1 className="text-3xl font-bold text-white mb-4">
                {selectedCourse.title}
              </h1>

              <p className="text-gray-300 mb-6">{selectedCourse.description}</p>

              <div className="flex items-center gap-6 text-sm text-gray-400">
                <span className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  {Math.round(selectedCourse.total_duration_minutes / 60)}h total
                </span>
                <span className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  {selectedCourse.lessons_count} lessons
                </span>
                <span className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  {selectedCourse.enrollments_count} students
                </span>
                {selectedCourse.average_rating > 0 && (
                  <span className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-yellow-500" />
                    {selectedCourse.average_rating.toFixed(1)} ({selectedCourse.reviews_count} reviews)
                  </span>
                )}
              </div>
            </div>

            {/* What You'll Learn */}
            {selectedCourse.outcomes && selectedCourse.outcomes.length > 0 && (
              <div className="glass-card p-8 mb-6">
                <h2 className="text-xl font-bold text-white mb-4">What You'll Learn</h2>
                <div className="grid md:grid-cols-2 gap-3">
                  {selectedCourse.outcomes.map((outcome, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-300">{outcome}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Curriculum */}
            <div className="glass-card p-8 mb-6">
              <h2 className="text-xl font-bold text-white mb-4">Course Curriculum</h2>
              <div className="space-y-4">
                {selectedCourse.curriculum.map((section, index) => (
                  <div key={section.id} className="border border-gray-700 rounded-lg overflow-hidden">
                    <div className="bg-gray-800 px-4 py-3 flex items-center justify-between">
                      <h3 className="font-semibold text-white">
                        Section {index + 1}: {section.title}
                      </h3>
                      <span className="text-sm text-gray-400">
                        {section.lessons.length} lessons
                      </span>
                    </div>
                    <div className="divide-y divide-gray-700">
                      {section.lessons.map((lesson) => (
                        <div key={lesson.id} className="px-4 py-3 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {lesson.is_preview || hasPurchased ? (
                              <Play className="w-4 h-4 text-orange-500" />
                            ) : (
                              <Lock className="w-4 h-4 text-gray-500" />
                            )}
                            <span className="text-gray-300">{lesson.title}</span>
                            {lesson.is_preview && (
                              <span className="px-2 py-0.5 bg-green-500/20 text-green-500 text-xs rounded">
                                Preview
                              </span>
                            )}
                          </div>
                          <span className="text-sm text-gray-500">
                            {lesson.duration_minutes} min
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Reviews */}
            {reviews.length > 0 && (
              <div className="glass-card p-8">
                <h2 className="text-xl font-bold text-white mb-4">Student Reviews</h2>
                <div className="space-y-4">
                  {reviews.map((review, index) => (
                    <div key={index} className="border-b border-gray-700 pb-4 last:border-0">
                      <div className="flex items-center gap-2 mb-2">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < review.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-600'
                            }`}
                          />
                        ))}
                        <span className="text-sm text-gray-500 ml-2">
                          {new Date(review.review_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-gray-300">{review.review}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar - Purchase Card */}
          <div className="lg:col-span-1">
            <div className="glass-card p-6 sticky top-24">
              {/* Price */}
              <div className="text-center mb-6">
                {isOnSale ? (
                  <>
                    <div className="text-4xl font-bold text-white">${selectedCourse.sale_price}</div>
                    <div className="text-lg text-gray-500 line-through">${selectedCourse.price}</div>
                    <div className="text-sm text-green-500 mt-1">
                      Sale ends {new Date(selectedCourse.sale_ends_at!).toLocaleDateString()}
                    </div>
                  </>
                ) : (
                  <div className="text-4xl font-bold text-white">${selectedCourse.price}</div>
                )}
              </div>

              {/* CTA Button */}
              {hasPurchased ? (
                <Link
                  to={`/my-courses/${selectedCourse.id}`}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  Continue Learning
                </Link>
              ) : (
                <button
                  onClick={() => handlePurchase(selectedCourse)}
                  disabled={purchasing}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  <ShoppingCart className="w-4 h-4" />
                  {purchasing ? 'Processing...' : 'Buy Now'}
                </button>
              )}

              {/* Features */}
              <div className="mt-6 space-y-3">
                <div className="flex items-center gap-3 text-sm text-gray-300">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Lifetime access
                </div>
                {selectedCourse.certificate_included && (
                  <div className="flex items-center gap-3 text-sm text-gray-300">
                    <Award className="w-4 h-4 text-green-500" />
                    Certificate of completion
                  </div>
                )}
                <div className="flex items-center gap-3 text-sm text-gray-300">
                  <Clock className="w-4 h-4 text-green-500" />
                  {Math.round(selectedCourse.total_duration_minutes / 60)} hours of content
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-300">
                  <BookOpen className="w-4 h-4 text-green-500" />
                  {selectedCourse.resources_count} downloadable resources
                </div>
              </div>

              {/* Educator */}
              {educator && (
                <div className="mt-6 pt-6 border-t border-gray-700">
                  <h3 className="text-sm font-semibold text-gray-400 mb-3">Instructor</h3>
                  <div className="flex items-center gap-3">
                    {educator.avatar_url ? (
                      <img
                        src={educator.avatar_url}
                        alt={educator.name}
                        className="w-12 h-12 rounded-full"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center">
                        <GraduationCap className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-white">{educator.name}</p>
                      {educator.is_verified && (
                        <span className="text-xs text-green-500 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> Verified Educator
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Course listing
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
          Crypto Course Marketplace
        </h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto">
          Learn from verified crypto educators. One-time purchase, lifetime access.
        </p>
      </div>

      {/* Featured Courses */}
      {featuredCourses.length > 0 && (
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <Star className="w-6 h-6 text-yellow-500" />
            Featured Courses
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredCourses.map((course) => (
              <Link
                key={course.id}
                to={`/courses/${course.slug}`}
                className="glass-card overflow-hidden hover:border-orange-500/50 transition-all group"
              >
                {course.thumbnail_url && (
                  <img
                    src={course.thumbnail_url}
                    alt={course.title}
                    className="w-full h-40 object-cover"
                  />
                )}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-orange-500">
                      {course.category}
                    </span>
                    <span className="text-lg font-bold text-green-400">
                      ${course.sale_price || course.price}
                    </span>
                  </div>
                  <h3 className="font-semibold text-white group-hover:text-orange-500 transition-colors line-clamp-2 mb-2">
                    {course.title}
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span>{course.lessons_count} lessons</span>
                    <span>{course.enrollments_count} students</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search courses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:border-orange-500"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:border-orange-500"
        >
          <option value="all">All Categories</option>
          {COURSE_CATEGORIES.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
        <select
          value={selectedDifficulty}
          onChange={(e) => setSelectedDifficulty(e.target.value)}
          className="px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:border-orange-500"
        >
          {difficulties.map((diff) => (
            <option key={diff} value={diff}>
              {diff === 'all' ? 'All Levels' : diff.charAt(0).toUpperCase() + diff.slice(1)}
            </option>
          ))}
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          className="px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:border-orange-500"
        >
          <option value="popular">Most Popular</option>
          <option value="newest">Newest</option>
          <option value="rating">Highest Rated</option>
          <option value="price_low">Price: Low to High</option>
          <option value="price_high">Price: High to Low</option>
        </select>
      </div>

      {/* Courses Grid */}
      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="glass-card overflow-hidden animate-pulse">
              <div className="h-40 bg-gray-700"></div>
              <div className="p-4">
                <div className="h-4 bg-gray-700 rounded w-1/4 mb-2"></div>
                <div className="h-6 bg-gray-700 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-700 rounded w-full"></div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="text-center py-12">
          <GraduationCap className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No courses found</h3>
          <p className="text-gray-400">
            Try adjusting your search or filter criteria.
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <Link
              key={course.id}
              to={`/courses/${course.slug}`}
              className="glass-card overflow-hidden hover:border-orange-500/50 transition-all group"
            >
              {course.thumbnail_url && (
                <img
                  src={course.thumbnail_url}
                  alt={course.title}
                  className="w-full h-40 object-cover"
                />
              )}
              <div className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2 py-1 bg-gray-700 text-gray-300 text-xs font-medium rounded">
                    {course.category}
                  </span>
                  <span className={`px-2 py-1 text-xs font-medium rounded ${
                    course.difficulty === 'beginner' ? 'bg-green-500/20 text-green-500' :
                    course.difficulty === 'intermediate' ? 'bg-yellow-500/20 text-yellow-500' :
                    course.difficulty === 'advanced' ? 'bg-orange-500/20 text-orange-500' :
                    'bg-red-500/20 text-red-500'
                  }`}>
                    {course.difficulty}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-white group-hover:text-orange-500 transition-colors line-clamp-2 mb-2">
                  {course.title}
                </h3>
                <p className="text-sm text-gray-400 line-clamp-2 mb-4">
                  {course.short_description || course.description}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {Math.round(course.total_duration_minutes / 60)}h
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {course.enrollments_count}
                    </span>
                    {course.average_rating > 0 && (
                      <span className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500" />
                        {course.average_rating.toFixed(1)}
                      </span>
                    )}
                  </div>
                  <span className="text-lg font-bold text-green-400">
                    ${course.sale_price || course.price}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Become an Educator CTA */}
      <div className="mt-16 text-center glass-card p-12 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/30">
        <GraduationCap className="w-16 h-16 text-purple-500 mx-auto mb-4" />
        <h2 className="text-3xl font-bold text-white mb-4">
          Want to Teach on Our Platform?
        </h2>
        <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
          Share your crypto knowledge and earn 75-85% of every sale.
          Join our community of verified educators.
        </p>
        <Link to="/become-educator" className="btn-primary">
          Apply as Educator
        </Link>
      </div>
    </div>
  );
}
