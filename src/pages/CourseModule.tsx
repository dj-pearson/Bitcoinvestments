import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Clock, Target, CheckCircle, BookOpen, Circle, HelpCircle } from 'lucide-react';
import { getCourse, getCourseModule, getModuleBody } from '../data/courses';
import { formatGuideDate, EDITORIAL_AUTHOR } from '../data/guides';
import { Newsletter } from '../components/Newsletter';
import { MarkdownContent } from '../components/MarkdownContent';
import { ShareButton } from '../components/ShareButton';
import { NotFound } from './NotFound';
import { useCourseProgress } from '../hooks/useCourseProgress';
import { SEO, generateBreadcrumbSchema } from '../components/SEO';

const SITE_URL = 'https://bitcoinvestments.net';
const SUFFIX_BUDGET = 41; // <title> budget before " | Bitcoinvestments"

export function CourseModule() {
  const { courseId, moduleId } = useParams<{ courseId: string; moduleId: string }>();
  const course = courseId ? getCourse(courseId) : undefined;
  const module = course && moduleId ? getCourseModule(course.id, moduleId) : undefined;
  const progress = useCourseProgress(course?.id ?? '__none__');

  if (!course || !module) {
    return <NotFound />;
  }

  const currentIndex = course.modules.findIndex((m) => m.id === module.id);
  const prevModule = currentIndex > 0 ? course.modules[currentIndex - 1] : null;
  const nextModule = currentIndex < course.modules.length - 1 ? course.modules[currentIndex + 1] : null;

  const isDone = progress.completed.has(module.id);
  const doneCount = course.modules.filter((m) => progress.completed.has(m.id)).length;
  const allDone = progress.loaded && doneCount === course.modules.length;
  const percent = Math.round((doneCount / course.modules.length) * 100);

  const courseUrl = `${SITE_URL}/course/${course.id}`;
  const moduleUrl = `${courseUrl}/${module.id}`;
  const longTitle = `${module.title} (Module ${module.moduleNumber})`;
  const seoTitle = longTitle.length <= SUFFIX_BUDGET ? longTitle : module.title;

  const lessonSchema = {
    '@context': 'https://schema.org',
    '@type': 'LearningResource',
    name: `Module ${module.moduleNumber}: ${module.title}`,
    description: module.metaDescription,
    url: moduleUrl,
    learningResourceType: 'Lesson',
    educationalLevel: course.difficulty,
    inLanguage: 'en',
    isAccessibleForFree: true,
    timeRequired: `PT${module.duration}M`,
    teaches: module.objectives,
    position: module.moduleNumber,
    datePublished: course.datePublished,
    dateModified: course.dateModified,
    author: { '@type': 'Organization', name: 'Bitcoinvestments editorial team' },
    isPartOf: { '@type': 'Course', name: course.title, url: courseUrl },
  };

  return (
    <div className="min-h-screen bg-brand-dark">
      <SEO
        title={seoTitle}
        description={module.metaDescription}
        keywords={['crypto course', 'cryptocurrency lesson', module.title]}
        type="article"
        url={moduleUrl}
        section={course.title}
        publishedTime={course.datePublished}
        modifiedTime={course.dateModified}
        blufSummary={module.summary}
        contentCategory="Education"
        schema={[
          lessonSchema,
          generateBreadcrumbSchema([
            { name: 'Home', url: '/' },
            { name: 'Learn', url: '/learn' },
            { name: course.title, url: `/course/${course.id}` },
            { name: module.title, url: `/course/${course.id}/${module.id}` },
          ]),
        ]}
      />

      {/* Hero Section */}
      <div className="bg-gradient-to-b from-gray-900 to-brand-dark border-b border-gray-800">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Link
            to={`/course/${course.id}`}
            className="inline-flex items-center gap-2 text-gray-400 hover:text-orange-500 transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            {course.title}
          </Link>

          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 bg-orange-500/20 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-orange-500 font-bold text-xl">{module.moduleNumber}</span>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-3 mb-1">
                <span className="text-sm text-orange-500 font-medium">
                  Module {module.moduleNumber} of {course.modules.length}
                </span>
                <span className="flex items-center gap-2 text-sm text-gray-400">
                  <Clock className="w-4 h-4" aria-hidden="true" />
                  {module.duration} min
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-white">{module.title}</h1>
            </div>
          </div>

          {/* Answer-first summary */}
          <p className="text-lg text-gray-300 mb-4">{module.summary}</p>

          <p className="text-sm text-gray-400 mb-6">
            By {EDITORIAL_AUTHOR} · Updated{' '}
            <time dateTime={course.dateModified}>{formatGuideDate(course.dateModified)}</time> ·
            Educational content, not financial advice.
          </p>

          <ShareButton title={`${course.title}: ${module.title}`} />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Learning Objectives */}
        <div className="bg-gray-800/50 rounded-xl p-6 mb-8 border border-gray-700">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-orange-500" aria-hidden="true" />
            Learning objectives
          </h2>
          <ul className="grid gap-3">
            {module.objectives.map((objective) => (
              <li key={objective} className="flex items-start gap-3">
                <Target className="w-4 h-4 text-orange-400 flex-shrink-0 mt-1" aria-hidden="true" />
                <span className="text-gray-300">{objective}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Module Content */}
        <article className="max-w-none">
          <MarkdownContent content={getModuleBody(module)} />
        </article>

        {/* Quiz with answers (in the DOM, collapsed visually) */}
        {module.quiz.length > 0 && (
          <section className="mt-12" aria-labelledby="module-quiz">
            <h2 id="module-quiz" className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
              <HelpCircle className="w-6 h-6 text-orange-500" aria-hidden="true" />
              Check your understanding
            </h2>
            <p className="text-gray-400 mb-6">Try to answer each question before opening it.</p>
            <div className="space-y-3">
              {module.quiz.map((q, i) => (
                <details key={q.question} className="bg-gray-800 rounded-xl border border-gray-700 group">
                  <summary className="cursor-pointer list-none px-5 py-4 text-white font-medium flex items-start gap-3">
                    <span className="text-orange-500 font-semibold">{i + 1}.</span>
                    <span className="flex-1">{q.question}</span>
                    <span className="text-xs text-gray-400 group-open:hidden">Show answer</span>
                    <span className="text-xs text-gray-400 hidden group-open:inline">Hide</span>
                  </summary>
                  <p className="px-5 pb-4 text-gray-300 leading-relaxed">{q.answer}</p>
                </details>
              ))}
            </div>
          </section>
        )}

        {/* Mark complete */}
        <div className="mt-12 bg-gray-800/50 rounded-xl p-6 border border-gray-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-white font-semibold">
              {isDone ? 'You marked this module complete.' : 'Finished this module?'}
            </p>
            <p className="text-sm text-gray-400">
              Progress is saved in this browser only
              {progress.loaded && !progress.persistent ? ' (your browser is blocking storage, so it will reset when you leave)' : ''}.
            </p>
          </div>
          <button
            type="button"
            aria-pressed={isDone}
            disabled={!progress.loaded}
            onClick={() => progress.setComplete(module.id, !isDone)}
            className={`inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 ${
              isDone ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' : 'bg-orange-500 text-white hover:bg-orange-600'
            }`}
          >
            {isDone ? <CheckCircle className="w-5 h-5" aria-hidden="true" /> : <Circle className="w-5 h-5" aria-hidden="true" />}
            {isDone ? 'Completed' : 'Mark as complete'}
          </button>
        </div>

        {/* Module Navigation */}
        <nav className="mt-8 pt-8 border-t border-gray-800" aria-label="Module navigation">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            {prevModule ? (
              <Link
                to={`/course/${course.id}/${prevModule.id}`}
                className="flex items-center gap-3 bg-gray-800 rounded-xl p-4 border border-gray-700 hover:border-orange-500/50 transition-colors group flex-1"
              >
                <ArrowLeft className="w-5 h-5 text-gray-500 group-hover:text-orange-500 transition-colors" aria-hidden="true" />
                <div>
                  <span className="text-xs text-gray-500 block">Previous module</span>
                  <span className="text-white group-hover:text-orange-500 transition-colors font-medium">
                    {prevModule.title}
                  </span>
                </div>
              </Link>
            ) : (
              <div className="flex-1" />
            )}

            {nextModule ? (
              <Link
                to={`/course/${course.id}/${nextModule.id}`}
                className="flex items-center justify-end gap-3 bg-orange-500 hover:bg-orange-600 rounded-xl p-4 transition-colors flex-1 text-right"
              >
                <div>
                  <span className="text-xs text-orange-100 block">Next module</span>
                  <span className="text-white font-medium">{nextModule.title}</span>
                </div>
                <ArrowRight className="w-5 h-5 text-white" aria-hidden="true" />
              </Link>
            ) : (
              <Link
                to={`/course/${course.id}`}
                className="flex items-center justify-end gap-3 bg-gray-800 hover:border-orange-500/50 border border-gray-700 rounded-xl p-4 transition-colors flex-1 text-right"
              >
                <div>
                  <span className="text-xs text-gray-400 block">Last module</span>
                  <span className="text-white font-medium">Back to course overview</span>
                </div>
                <BookOpen className="w-5 h-5 text-orange-500" aria-hidden="true" />
              </Link>
            )}
          </div>
        </nav>

        {/* Course Progress (real, from this browser) */}
        <section className="mt-8 bg-gray-800/50 rounded-xl p-6 border border-gray-700" aria-labelledby="course-progress">
          <div className="flex items-baseline justify-between gap-2 mb-2">
            <h2 id="course-progress" className="text-lg font-semibold text-white">
              Your progress
            </h2>
            <span className="text-sm text-gray-400">
              {progress.loaded ? `${doneCount} of ${course.modules.length} complete` : ' '}
            </span>
          </div>
          <div
            className="h-2 bg-gray-700 rounded-full overflow-hidden mb-4"
            role="progressbar"
            aria-label="Course progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress.loaded ? percent : 0}
          >
            <div className="h-full bg-orange-500 transition-all duration-300" style={{ width: `${progress.loaded ? percent : 0}%` }} />
          </div>
          <ol className="space-y-2">
            {course.modules.map((m) => {
              const done = progress.completed.has(m.id);
              const current = m.id === module.id;
              return (
                <li key={m.id}>
                  <Link
                    to={`/course/${course.id}/${m.id}`}
                    aria-current={current ? 'page' : undefined}
                    className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                      current ? 'bg-orange-500/20 border border-orange-500/50' : 'hover:bg-gray-700/50'
                    }`}
                  >
                    <span
                      className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        done
                          ? 'bg-green-500/20 text-green-500'
                          : current
                            ? 'bg-orange-500 text-white'
                            : 'bg-gray-700 text-gray-400'
                      }`}
                    >
                      {done ? (
                        <CheckCircle className="w-4 h-4" aria-label="Completed" />
                      ) : (
                        <span className="text-sm font-medium">{m.moduleNumber}</span>
                      )}
                    </span>
                    <span className={`flex-1 min-w-0 truncate ${current ? 'text-white font-medium' : 'text-gray-400'}`}>
                      {m.title}
                    </span>
                    <span className="text-xs text-gray-500">{m.duration} min</span>
                  </Link>
                </li>
              );
            })}
          </ol>
        </section>

        {/* Completion (only when every module is actually marked complete) */}
        {allDone ? (
          <div className="mt-12 p-8 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-xl border border-green-500/20">
            <div className="text-center mb-6">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" aria-hidden="true" />
              <h2 className="text-2xl font-bold text-white mb-2">You&rsquo;ve completed the course</h2>
              <p className="text-gray-400">
                Keep going with the{' '}
                <Link to="/learn" className="text-orange-500 hover:text-orange-400 underline">
                  in-depth guides
                </Link>
                , or get an email when new courses are published.
              </p>
            </div>
            <Newsletter source={`course-complete-${course.id}`} variant="inline" />
          </div>
        ) : (
          !nextModule && (
            <div className="mt-12 p-8 bg-gray-800 rounded-xl border border-gray-700">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-white mb-2">Hear about new courses</h2>
                <p className="text-gray-400">We email when new courses or major updates are published.</p>
              </div>
              <Newsletter source={`course-${course.id}`} variant="inline" />
            </div>
          )
        )}
      </div>
    </div>
  );
}
