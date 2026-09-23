import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Clock,
  BookOpen,
  CheckCircle,
  GraduationCap,
  Target,
  ChevronRight,
  CalendarCheck,
} from 'lucide-react';
import { getCourse } from '../data/courses';
import { formatGuideDate, EDITORIAL_AUTHOR } from '../data/guides';
import { Newsletter } from '../components/Newsletter';
import { NotFound } from './NotFound';
import { useCourseProgress } from '../hooks/useCourseProgress';
import { SEO, generateBreadcrumbSchema, generateFAQSchema } from '../components/SEO';

const SITE_URL = 'https://bitcoinvestments.net';

export function CourseLanding() {
  const { courseId } = useParams<{ courseId: string }>();
  const course = courseId ? getCourse(courseId) : undefined;
  // Hooks must run unconditionally; an unknown id simply has no progress.
  const progress = useCourseProgress(course?.id ?? '__none__');

  if (!course) {
    return <NotFound />;
  }

  const difficultyColors = {
    Beginner: 'bg-green-500/20 text-green-500',
    Intermediate: 'bg-yellow-500/20 text-yellow-500',
    Advanced: 'bg-red-500/20 text-red-500',
  };

  const courseUrl = `${SITE_URL}/course/${course.id}`;
  const doneCount = course.modules.filter((m) => progress.completed.has(m.id)).length;
  const nextModule = course.modules.find((m) => !progress.completed.has(m.id)) ?? course.modules[0];
  const allDone = progress.loaded && doneCount === course.modules.length && doneCount > 0;

  const courseSchema = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: course.title,
    description: course.metaDescription,
    url: courseUrl,
    inLanguage: 'en',
    educationalLevel: course.difficulty,
    isAccessibleForFree: true,
    timeRequired: `PT${Math.round(course.totalDuration / 60)}H`,
    teaches: course.outcomes,
    datePublished: course.datePublished,
    dateModified: course.dateModified,
    provider: { '@type': 'Organization', name: 'Bitcoinvestments', sameAs: SITE_URL },
    offers: {
      '@type': 'Offer',
      price: 0,
      priceCurrency: 'USD',
      category: 'Free',
      availability: 'https://schema.org/InStock',
    },
    hasCourseInstance: {
      '@type': 'CourseInstance',
      courseMode: 'Online',
      courseWorkload: `PT${Math.round(course.totalDuration / 60)}H`,
    },
    hasPart: course.modules.map((m) => ({
      '@type': 'LearningResource',
      name: `Module ${m.moduleNumber}: ${m.title}`,
      url: `${courseUrl}/${m.id}`,
      timeRequired: `PT${m.duration}M`,
      learningResourceType: 'Lesson',
      position: m.moduleNumber,
    })),
  };

  return (
    <div className="min-h-screen bg-brand-dark">
      <SEO
        title={course.seoTitle}
        description={course.metaDescription}
        keywords={['free crypto course', 'crypto course for beginners', 'learn cryptocurrency', 'bitcoin course']}
        url={courseUrl}
        blufSummary={`${course.title} is a free, ${course.modules.length}-module online course (about ${Math.round(
          course.totalDuration / 60
        )} hours) covering how crypto works, buying and storing it safely, market cycles, investment strategy and avoiding scams.`}
        contentCategory="Education"
        publishedTime={course.datePublished}
        modifiedTime={course.dateModified}
        schema={[
          courseSchema,
          generateBreadcrumbSchema([
            { name: 'Home', url: '/' },
            { name: 'Learn', url: '/learn' },
            { name: course.title, url: `/course/${course.id}` },
          ]),
          generateFAQSchema(course.faqs),
        ]}
      />
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-gray-900 to-brand-dark border-b border-gray-800">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Link
            to="/learn"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-orange-500 transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            Back to Learning Center
          </Link>

          <div className="flex items-start gap-6">
            <div className="text-6xl hidden sm:block" aria-hidden="true">
              {course.icon}
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3 mb-3">
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${difficultyColors[course.difficulty]}`}>
                  {course.difficulty}
                </span>
                <span className="px-3 py-1 text-sm font-medium rounded-full bg-orange-500/20 text-orange-400">Free</span>
                <span className="flex items-center gap-2 text-sm text-gray-400">
                  <Clock className="w-4 h-4" aria-hidden="true" />
                  About {Math.round(course.totalDuration / 60)} hours
                </span>
                <span className="flex items-center gap-2 text-sm text-gray-400">
                  <BookOpen className="w-4 h-4" aria-hidden="true" />
                  {course.modules.length} modules
                </span>
              </div>

              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">{course.title}</h1>

              <p className="text-xl text-gray-300">
                A free, self-paced course in {course.modules.length} short modules that takes you from
                &ldquo;what is Bitcoin?&rdquo; to buying and storing crypto safely, building a plan and
                spotting scams. No account needed.
              </p>

              <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-gray-400 mt-4">
                <CalendarCheck className="w-4 h-4" aria-hidden="true" />
                <span>By {EDITORIAL_AUTHOR}</span>
                <span aria-hidden="true">·</span>
                <span>
                  Updated <time dateTime={course.dateModified}>{formatGuideDate(course.dateModified)}</time>
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* About */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-4">About this course</h2>
          <div className="text-gray-300 leading-relaxed whitespace-pre-line">{course.longDescription}</div>
        </section>

        {/* What You'll Learn */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <Target className="w-6 h-6 text-orange-500" aria-hidden="true" />
            What you&rsquo;ll learn
          </h2>
          <ul className="grid md:grid-cols-2 gap-4">
            {course.outcomes.map((outcome) => (
              <li key={outcome} className="flex items-start gap-3 bg-gray-800/50 rounded-lg p-4">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
                <span className="text-gray-300">{outcome}</span>
              </li>
            ))}
          </ul>
          <p className="text-sm text-gray-400 mt-4">
            Along the way you&rsquo;ll use the site&rsquo;s{' '}
            <Link to="/calculators" className="text-orange-500 hover:text-orange-400 underline">
              DCA calculator
            </Link>
            ,{' '}
            <Link to="/compare" className="text-orange-500 hover:text-orange-400 underline">
              exchange and wallet comparisons
            </Link>{' '}
            and{' '}
            <Link to="/scam-database" className="text-orange-500 hover:text-orange-400 underline">
              scam database
            </Link>
            .
          </p>
        </section>

        {/* Modules */}
        <section className="mb-12">
          <div className="flex flex-wrap items-baseline justify-between gap-2 mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <GraduationCap className="w-6 h-6 text-orange-500" aria-hidden="true" />
              Course modules
            </h2>
            {progress.loaded && doneCount > 0 && (
              <p className="text-sm text-gray-400" aria-live="polite">
                {doneCount} of {course.modules.length} marked complete in this browser
              </p>
            )}
          </div>
          <ol className="space-y-4">
            {course.modules.map((module) => {
              const done = progress.completed.has(module.id);
              return (
                <li key={module.id}>
                  <Link
                    to={`/course/${course.id}/${module.id}`}
                    className="block bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-orange-500/50 transition-all group"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                            done ? 'bg-green-500/20 text-green-500' : 'bg-orange-500/20 text-orange-500'
                          }`}
                        >
                          {done ? (
                            <CheckCircle className="w-6 h-6" aria-label="Completed" />
                          ) : (
                            <span className="font-bold text-lg">{module.moduleNumber}</span>
                          )}
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-white group-hover:text-orange-500 transition-colors">
                            Module {module.moduleNumber}: {module.title}
                          </h3>
                          <p className="text-gray-400 text-sm mt-1">{module.description}</p>
                          <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" aria-hidden="true" />
                              {module.duration} min
                            </span>
                            <span className="flex items-center gap-1">
                              <Target className="w-3 h-3" aria-hidden="true" />
                              {module.objectives.length} objectives
                            </span>
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-6 h-6 text-gray-500 group-hover:text-orange-500 transition-colors flex-shrink-0" aria-hidden="true" />
                    </div>
                  </Link>
                </li>
              );
            })}
          </ol>
        </section>

        {/* Start / continue CTA */}
        {nextModule && (
          <section className="mb-12">
            <div className="bg-gradient-to-r from-orange-500/20 to-yellow-500/20 rounded-xl p-8 border border-orange-500/30 text-center">
              <h2 className="text-2xl font-bold text-white mb-4">
                {allDone ? 'You have completed every module' : 'Ready to start learning?'}
              </h2>
              <p className="text-gray-400 mb-6">
                {allDone
                  ? 'Revisit any module, or carry on with the in-depth guides.'
                  : 'Each module takes 25 to 35 minutes. Mark it complete at the end to track your progress in this browser.'}
              </p>
              <Link
                to={allDone ? '/learn' : `/course/${course.id}/${nextModule.id}`}
                className="inline-flex items-center gap-2 px-8 py-4 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl transition-colors"
              >
                {allDone
                  ? 'Browse the guides'
                  : doneCount > 0
                    ? `Continue with Module ${nextModule.moduleNumber}`
                    : 'Start Module 1'}
                <ChevronRight className="w-5 h-5" aria-hidden="true" />
              </Link>
            </div>
          </section>
        )}

        {/* FAQ */}
        <section className="mb-12" aria-labelledby="course-faq">
          <h2 id="course-faq" className="text-2xl font-bold text-white mb-6">
            Frequently asked questions
          </h2>
          <div className="space-y-6">
            {course.faqs.map((faq) => (
              <div key={faq.question}>
                <h3 className="text-lg font-semibold text-white mb-2">{faq.question}</h3>
                <p className="text-gray-300 leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Newsletter CTA */}
        <section>
          <div className="bg-gray-800 rounded-xl p-8 border border-gray-700">
            <div className="text-center mb-6">
              <BookOpen className="w-12 h-12 text-orange-500 mx-auto mb-4" aria-hidden="true" />
              <h2 className="text-2xl font-bold text-white mb-2">Hear about new courses</h2>
              <p className="text-gray-400">We email when new courses or major updates are published.</p>
            </div>
            <Newsletter source={`course-${course.id}`} variant="inline" />
          </div>
        </section>
      </div>
    </div>
  );
}
