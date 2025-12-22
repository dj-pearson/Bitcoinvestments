import { useState, useEffect } from 'react';
import {
  getCourses,
  getCourse,
  enrollInCourse,
  getUserEnrollments,
  completeLesson,
  CATEGORY_LABELS,
  LEVEL_LABELS,
  LEVEL_COLORS
} from '../services/interactiveCourses';
import type {
  Course,
  Module,
  Lesson,
  UserEnrollment,
  CourseFilters,
  CourseCategory,
  CourseLevel
} from '../services/interactiveCourses';

// Icons
const PlayIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
  </svg>
);

const BookIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
);

const QuizIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
  </svg>
);

const ClockIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const StarIcon = ({ filled }: { filled: boolean }) => (
  <svg className={`w-4 h-4 ${filled ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} viewBox="0 0 20 20">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
  </svg>
);

const LockIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
  </svg>
);

const ArrowLeftIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);

type View = 'catalog' | 'my-courses' | 'course-detail' | 'lesson';

interface InteractiveCoursesProps {
  userId?: string;
}

export default function InteractiveCourses({ userId }: InteractiveCoursesProps) {
  const [view, setView] = useState<View>('catalog');
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<(UserEnrollment & { course: Course })[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [courseModules, setCourseModules] = useState<Module[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [currentEnrollment, setCurrentEnrollment] = useState<UserEnrollment | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [filters, setFilters] = useState<CourseFilters>({
    sortBy: 'popular',
    page: 1,
    limit: 12
  });
  const [totalCourses, setTotalCourses] = useState(0);

  useEffect(() => {
    loadCourses();
    if (userId) {
      loadEnrollments();
    }
  }, [userId, filters]);

  async function loadCourses() {
    setLoading(true);
    const { courses: data, total } = await getCourses(filters);
    setCourses(data);
    setTotalCourses(total);
    setLoading(false);
  }

  async function loadEnrollments() {
    if (!userId) return;
    const { enrollments: data } = await getUserEnrollments(userId);
    setEnrollments(data);
  }

  async function handleViewCourse(course: Course) {
    const { course: fullCourse, modules } = await getCourse(course.id);
    if (fullCourse) {
      setSelectedCourse(fullCourse);
      setCourseModules(modules);

      // Check if enrolled
      const enrollment = enrollments.find(e => e.courseId === course.id);
      setCurrentEnrollment(enrollment || null);

      setView('course-detail');
    }
  }

  async function handleEnroll() {
    if (!userId || !selectedCourse) return;

    setEnrolling(true);
    const { enrollment, error } = await enrollInCourse(userId, selectedCourse.id);

    if (enrollment && !error) {
      setCurrentEnrollment(enrollment);
      await loadEnrollments();
    }
    setEnrolling(false);
  }

  async function handleStartLesson(lesson: Lesson) {
    setSelectedLesson(lesson);
    setView('lesson');
  }

  async function handleCompleteLesson() {
    if (!currentEnrollment || !selectedLesson) return;

    await completeLesson(currentEnrollment.id, selectedLesson.id, 600);
    await loadEnrollments();

    // Find next lesson
    let foundCurrent = false;
    for (const module of courseModules) {
      for (const lesson of module.lessons) {
        if (foundCurrent) {
          setSelectedLesson(lesson);
          return;
        }
        if (lesson.id === selectedLesson.id) {
          foundCurrent = true;
        }
      }
    }

    // No more lessons, go back to course
    setView('course-detail');
  }

  function renderStars(rating: number) {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map(star => (
          <StarIcon key={star} filled={star <= rating} />
        ))}
        <span className="ml-1 text-sm text-gray-600">{rating.toFixed(1)}</span>
      </div>
    );
  }

  function renderCatalog() {
    return (
      <div>
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Course Catalog</h2>
            <p className="text-gray-600">Expand your crypto knowledge with structured learning paths</p>
          </div>
          {userId && (
            <button
              onClick={() => setView('my-courses')}
              className="px-4 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition"
            >
              My Courses ({enrollments.length})
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Category</label>
            <select
              value={filters.category || ''}
              onChange={e => setFilters({ ...filters, category: e.target.value as CourseCategory || undefined, page: 1 })}
              className="px-3 py-2 border rounded-lg bg-white"
            >
              <option value="">All Categories</option>
              {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Level</label>
            <select
              value={filters.level || ''}
              onChange={e => setFilters({ ...filters, level: e.target.value as CourseLevel || undefined, page: 1 })}
              className="px-3 py-2 border rounded-lg bg-white"
            >
              <option value="">All Levels</option>
              {Object.entries(LEVEL_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Type</label>
            <select
              value={filters.isPremium === undefined ? '' : filters.isPremium ? 'premium' : 'free'}
              onChange={e => {
                const val = e.target.value;
                setFilters({
                  ...filters,
                  isPremium: val === '' ? undefined : val === 'premium',
                  page: 1
                });
              }}
              className="px-3 py-2 border rounded-lg bg-white"
            >
              <option value="">All Courses</option>
              <option value="free">Free</option>
              <option value="premium">Premium</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Sort By</label>
            <select
              value={filters.sortBy || 'popular'}
              onChange={e => setFilters({ ...filters, sortBy: e.target.value as any })}
              className="px-3 py-2 border rounded-lg bg-white"
            >
              <option value="popular">Most Popular</option>
              <option value="newest">Newest</option>
              <option value="rating">Highest Rated</option>
              <option value="title">Title A-Z</option>
            </select>
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm text-gray-600 mb-1">Search</label>
            <input
              type="text"
              placeholder="Search courses..."
              value={filters.search || ''}
              onChange={e => setFilters({ ...filters, search: e.target.value, page: 1 })}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
        </div>

        {/* Course Grid */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map(course => (
                <div
                  key={course.id}
                  className="bg-white border rounded-xl overflow-hidden hover:shadow-lg transition cursor-pointer"
                  onClick={() => handleViewCourse(course)}
                >
                  {/* Thumbnail */}
                  <div className="relative h-40 bg-gradient-to-br from-orange-400 to-orange-600">
                    <div className="absolute inset-0 flex items-center justify-center text-white text-4xl font-bold opacity-20">
                      {course.title.charAt(0)}
                    </div>
                    {course.isPremium && (
                      <span className="absolute top-2 right-2 px-2 py-1 bg-yellow-400 text-yellow-900 text-xs font-medium rounded">
                        Premium
                      </span>
                    )}
                    {enrollments.find(e => e.courseId === course.id) && (
                      <span className="absolute top-2 left-2 px-2 py-1 bg-green-500 text-white text-xs font-medium rounded">
                        Enrolled
                      </span>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-0.5 text-xs font-medium rounded ${LEVEL_COLORS[course.level]}`}>
                        {LEVEL_LABELS[course.level]}
                      </span>
                      <span className="text-xs text-gray-500">{CATEGORY_LABELS[course.category]}</span>
                    </div>

                    <h3 className="font-semibold text-gray-900 mb-1">{course.title}</h3>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{course.shortDescription}</p>

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-3 text-gray-500">
                        <span className="flex items-center gap-1">
                          <ClockIcon />
                          {course.estimatedHours}h
                        </span>
                        <span>{course.totalLessons} lessons</span>
                      </div>
                      {renderStars(course.averageRating)}
                    </div>

                    {course.instructor && (
                      <div className="mt-3 pt-3 border-t flex items-center gap-2">
                        <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center text-xs font-medium">
                          {course.instructor.name.charAt(0)}
                        </div>
                        <span className="text-sm text-gray-600">{course.instructor.name}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalCourses > (filters.limit || 12) && (
              <div className="flex justify-center gap-2 mt-8">
                <button
                  onClick={() => setFilters({ ...filters, page: (filters.page || 1) - 1 })}
                  disabled={(filters.page || 1) <= 1}
                  className="px-4 py-2 border rounded-lg disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="px-4 py-2 text-gray-600">
                  Page {filters.page || 1} of {Math.ceil(totalCourses / (filters.limit || 12))}
                </span>
                <button
                  onClick={() => setFilters({ ...filters, page: (filters.page || 1) + 1 })}
                  disabled={(filters.page || 1) >= Math.ceil(totalCourses / (filters.limit || 12))}
                  className="px-4 py-2 border rounded-lg disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  function renderMyCourses() {
    const inProgress = enrollments.filter(e => !e.completedAt);
    const completed = enrollments.filter(e => e.completedAt);

    return (
      <div>
        <button
          onClick={() => setView('catalog')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeftIcon />
          Back to Catalog
        </button>

        <h2 className="text-2xl font-bold text-gray-900 mb-6">My Courses</h2>

        {enrollments.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <BookIcon />
            <h3 className="mt-4 text-lg font-medium text-gray-900">No courses yet</h3>
            <p className="mt-2 text-gray-600">Start learning by enrolling in a course</p>
            <button
              onClick={() => setView('catalog')}
              className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
            >
              Browse Courses
            </button>
          </div>
        ) : (
          <>
            {/* In Progress */}
            {inProgress.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">In Progress ({inProgress.length})</h3>
                <div className="space-y-4">
                  {inProgress.map(enrollment => (
                    <div
                      key={enrollment.id}
                      className="flex items-center gap-4 p-4 bg-white border rounded-xl hover:shadow-md transition cursor-pointer"
                      onClick={() => handleViewCourse(enrollment.course)}
                    >
                      <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg flex items-center justify-center text-white text-2xl font-bold">
                        {enrollment.course.title.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{enrollment.course.title}</h4>
                        <p className="text-sm text-gray-500">
                          Last accessed {new Date(enrollment.lastAccessedAt).toLocaleDateString()}
                        </p>
                        <div className="mt-2 flex items-center gap-3">
                          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-orange-500 rounded-full transition-all"
                              style={{ width: `${enrollment.progress}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-gray-700">{enrollment.progress}%</span>
                        </div>
                      </div>
                      <button className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600">
                        Continue
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Completed */}
            {completed.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Completed ({completed.length})</h3>
                <div className="space-y-4">
                  {completed.map(enrollment => (
                    <div
                      key={enrollment.id}
                      className="flex items-center gap-4 p-4 bg-white border rounded-xl"
                      onClick={() => handleViewCourse(enrollment.course)}
                    >
                      <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-lg flex items-center justify-center text-white">
                        <CheckIcon />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{enrollment.course.title}</h4>
                        <p className="text-sm text-gray-500">
                          Completed {new Date(enrollment.completedAt!).toLocaleDateString()}
                        </p>
                      </div>
                      <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                        Review
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  function renderCourseDetail() {
    if (!selectedCourse) return null;

    return (
      <div>
        <button
          onClick={() => {
            setSelectedCourse(null);
            setView('catalog');
          }}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeftIcon />
          Back to Catalog
        </button>

        {/* Course Header */}
        <div className="bg-gradient-to-br from-orange-500 to-orange-700 rounded-xl p-8 text-white mb-8">
          <div className="flex items-center gap-2 mb-3">
            <span className="px-2 py-1 bg-white/20 rounded text-sm">
              {LEVEL_LABELS[selectedCourse.level]}
            </span>
            <span className="px-2 py-1 bg-white/20 rounded text-sm">
              {CATEGORY_LABELS[selectedCourse.category]}
            </span>
            {selectedCourse.isPremium && (
              <span className="px-2 py-1 bg-yellow-400 text-yellow-900 rounded text-sm font-medium">
                Premium
              </span>
            )}
          </div>

          <h1 className="text-3xl font-bold mb-2">{selectedCourse.title}</h1>
          <p className="text-white/80 mb-4">{selectedCourse.description}</p>

          <div className="flex flex-wrap items-center gap-6 text-sm">
            <div className="flex items-center gap-1">
              <ClockIcon />
              {selectedCourse.estimatedHours} hours
            </div>
            <div>{selectedCourse.totalLessons} lessons</div>
            <div>{selectedCourse.totalQuizzes} quizzes</div>
            <div>{selectedCourse.enrollmentCount.toLocaleString()} students</div>
            <div className="flex items-center gap-1">
              {renderStars(selectedCourse.averageRating)}
              <span className="text-white/70">({selectedCourse.ratingCount})</span>
            </div>
          </div>

          {selectedCourse.instructor && (
            <div className="mt-6 pt-6 border-t border-white/20 flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-xl font-bold">
                {selectedCourse.instructor.name.charAt(0)}
              </div>
              <div>
                <div className="font-medium">{selectedCourse.instructor.name}</div>
                <div className="text-sm text-white/70">{selectedCourse.instructor.title}</div>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Course Content */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Course Content</h2>

            <div className="space-y-4">
              {courseModules.map((module, moduleIndex) => (
                <div key={module.id} className="border rounded-xl overflow-hidden">
                  <div className="bg-gray-50 p-4 border-b">
                    <h3 className="font-semibold text-gray-900">
                      Module {moduleIndex + 1}: {module.title}
                    </h3>
                    <p className="text-sm text-gray-600">{module.lessons.length} lessons</p>
                  </div>

                  <div className="divide-y">
                    {module.lessons.map((lesson) => {
                      const isLocked = !currentEnrollment && !lesson.isFree;

                      return (
                        <div
                          key={lesson.id}
                          className={`flex items-center gap-4 p-4 ${
                            isLocked ? 'opacity-60' : 'hover:bg-gray-50 cursor-pointer'
                          }`}
                          onClick={() => !isLocked && handleStartLesson(lesson)}
                        >
                          <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center">
                            {lesson.type === 'video' ? <PlayIcon /> :
                             lesson.type === 'quiz' ? <QuizIcon /> :
                             <BookIcon />}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900">{lesson.title}</span>
                              {lesson.isFree && !currentEnrollment && (
                                <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-xs rounded">
                                  Free
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-500">{lesson.durationMinutes} min</p>
                          </div>
                          {isLocked && <LockIcon />}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div>
            {/* Enrollment Card */}
            <div className="bg-white border rounded-xl p-6 sticky top-4">
              {currentEnrollment ? (
                <>
                  <div className="text-center mb-4">
                    <div className="text-3xl font-bold text-orange-500 mb-1">
                      {currentEnrollment.progress}%
                    </div>
                    <div className="text-gray-600">Complete</div>
                  </div>
                  <div className="h-3 bg-gray-200 rounded-full overflow-hidden mb-4">
                    <div
                      className="h-full bg-orange-500 rounded-full"
                      style={{ width: `${currentEnrollment.progress}%` }}
                    />
                  </div>
                  <button
                    onClick={() => {
                      const firstLesson = courseModules[0]?.lessons[0];
                      if (firstLesson) handleStartLesson(firstLesson);
                    }}
                    className="w-full py-3 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600"
                  >
                    {currentEnrollment.progress > 0 ? 'Continue Learning' : 'Start Course'}
                  </button>
                </>
              ) : (
                <>
                  {selectedCourse.isPremium && selectedCourse.price ? (
                    <div className="text-center mb-4">
                      <div className="text-3xl font-bold text-gray-900">${selectedCourse.price}</div>
                      <div className="text-gray-600">One-time purchase</div>
                    </div>
                  ) : (
                    <div className="text-center mb-4">
                      <div className="text-3xl font-bold text-green-600">Free</div>
                    </div>
                  )}
                  <button
                    onClick={handleEnroll}
                    disabled={enrolling}
                    className="w-full py-3 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 disabled:opacity-50"
                  >
                    {enrolling ? 'Enrolling...' : 'Enroll Now'}
                  </button>
                </>
              )}

              {/* Learning Outcomes */}
              <div className="mt-6 pt-6 border-t">
                <h4 className="font-semibold text-gray-900 mb-3">What you'll learn</h4>
                <ul className="space-y-2">
                  {selectedCourse.learningOutcomes.map((outcome, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                      <CheckIcon />
                      {outcome}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Prerequisites */}
              {selectedCourse.prerequisites.length > 0 && (
                <div className="mt-6 pt-6 border-t">
                  <h4 className="font-semibold text-gray-900 mb-3">Prerequisites</h4>
                  <ul className="space-y-1">
                    {selectedCourse.prerequisites.map((prereq, i) => (
                      <li key={i} className="text-sm text-gray-600">• {prereq}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  function renderLesson() {
    if (!selectedLesson || !selectedCourse) return null;

    return (
      <div>
        <button
          onClick={() => setView('course-detail')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeftIcon />
          Back to Course
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Lesson Content */}
          <div className="lg:col-span-3">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">{selectedLesson.title}</h1>

            {selectedLesson.type === 'video' && selectedLesson.videoUrl && (
              <div className="aspect-video bg-black rounded-xl mb-6">
                <iframe
                  src={selectedLesson.videoUrl}
                  className="w-full h-full rounded-xl"
                  allowFullScreen
                />
              </div>
            )}

            {selectedLesson.type === 'article' && (
              <div className="prose max-w-none mb-6">
                {selectedLesson.content.map(block => (
                  <div key={block.id}>
                    {block.type === 'text' && (
                      <div dangerouslySetInnerHTML={{ __html: block.content }} />
                    )}
                  </div>
                ))}
              </div>
            )}

            {selectedLesson.type === 'quiz' && (
              <div className="bg-orange-50 p-8 rounded-xl text-center">
                <QuizIcon />
                <h3 className="text-xl font-semibold mt-4">Quiz Time!</h3>
                <p className="text-gray-600 mt-2">Test your understanding of the material</p>
                <button className="mt-4 px-6 py-3 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600">
                  Start Quiz
                </button>
              </div>
            )}

            <div className="flex items-center justify-between pt-6 border-t">
              <button
                onClick={() => setView('course-detail')}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Back to Course
              </button>
              <button
                onClick={handleCompleteLesson}
                className="px-6 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600"
              >
                Mark Complete & Continue
              </button>
            </div>
          </div>

          {/* Lesson Sidebar */}
          <div>
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Course Progress</h3>
              <div className="space-y-2">
                {courseModules.map(module => (
                  <div key={module.id}>
                    <div className="text-sm font-medium text-gray-700 mb-1">{module.title}</div>
                    {module.lessons.map(lesson => (
                      <button
                        key={lesson.id}
                        onClick={() => setSelectedLesson(lesson)}
                        className={`w-full text-left px-2 py-1 text-sm rounded ${
                          lesson.id === selectedLesson.id
                            ? 'bg-orange-100 text-orange-700'
                            : 'hover:bg-gray-100 text-gray-600'
                        }`}
                      >
                        {lesson.title}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {view === 'catalog' && renderCatalog()}
      {view === 'my-courses' && renderMyCourses()}
      {view === 'course-detail' && renderCourseDetail()}
      {view === 'lesson' && renderLesson()}
    </div>
  );
}
