import { useParams, Link, Navigate } from 'react-router-dom';
import { ArrowLeft, Clock, BookOpen, CheckCircle, GraduationCap, Target, ChevronRight } from 'lucide-react';
import { getCourse } from '../data/courses';
import { Newsletter } from '../components/Newsletter';

export function CourseLanding() {
  const { courseId } = useParams<{ courseId: string }>();

  if (!courseId) {
    return <Navigate to="/learn" replace />;
  }

  const course = getCourse(courseId);

  if (!course) {
    return <Navigate to="/learn" replace />;
  }

  const difficultyColors = {
    Beginner: 'bg-green-500/20 text-green-500',
    Intermediate: 'bg-yellow-500/20 text-yellow-500',
    Advanced: 'bg-red-500/20 text-red-500'
  };

  return (
    <div className="min-h-screen bg-brand-dark">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-gray-900 to-brand-dark border-b border-gray-800">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Back Button */}
          <Link
            to="/learn"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-orange-500 transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Learning Center
          </Link>

          {/* Course Header */}
          <div className="flex items-start gap-6">
            <div className="text-6xl">{course.icon}</div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${difficultyColors[course.difficulty]}`}>
                  {course.difficulty}
                </span>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Clock className="w-4 h-4" />
                  {Math.round(course.totalDuration / 60)} hours
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <BookOpen className="w-4 h-4" />
                  {course.moduleCount} modules
                </div>
              </div>

              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                {course.title}
              </h1>

              <p className="text-xl text-gray-400">
                {course.description}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Course Description */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-4">About This Course</h2>
          <div className="text-gray-300 leading-relaxed whitespace-pre-line">
            {course.longDescription}
          </div>
        </section>

        {/* What You'll Learn */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <Target className="w-6 h-6 text-orange-500" />
            What You'll Learn
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {course.outcomes.map((outcome, index) => (
              <div key={index} className="flex items-start gap-3 bg-gray-800/50 rounded-lg p-4">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-gray-300">{outcome}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Course Modules */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <GraduationCap className="w-6 h-6 text-orange-500" />
            Course Modules
          </h2>
          <div className="space-y-4">
            {course.modules.map((module) => (
              <Link
                key={module.id}
                to={`/course/${course.id}/${module.id}`}
                className="block bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-orange-500/50 transition-all hover:translate-x-1 group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-orange-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-orange-500 font-bold text-lg">{module.moduleNumber}</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white group-hover:text-orange-500 transition-colors">
                        {module.title}
                      </h3>
                      <p className="text-gray-400 text-sm mt-1">{module.description}</p>
                      <div className="flex items-center gap-4 mt-3">
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Clock className="w-3 h-3" />
                          {module.duration} min
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Target className="w-3 h-3" />
                          {module.objectives.length} objectives
                        </div>
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-6 h-6 text-gray-500 group-hover:text-orange-500 transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Start Course CTA */}
        <section className="mb-12">
          <div className="bg-gradient-to-r from-orange-500/20 to-yellow-500/20 rounded-xl p-8 border border-orange-500/30 text-center">
            <h2 className="text-2xl font-bold text-white mb-4">Ready to Start Learning?</h2>
            <p className="text-gray-400 mb-6">
              Begin your journey from crypto curious to confident investor.
            </p>
            <Link
              to={`/course/${course.id}/${course.modules[0]?.id}`}
              className="inline-flex items-center gap-2 px-8 py-4 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl transition-colors"
            >
              Start Module 1
              <ChevronRight className="w-5 h-5" />
            </Link>
          </div>
        </section>

        {/* Newsletter CTA */}
        <section>
          <div className="bg-gray-800 rounded-xl p-8 border border-gray-700">
            <div className="text-center mb-6">
              <BookOpen className="w-12 h-12 text-orange-500 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-white mb-2">
                Stay Updated on New Courses
              </h3>
              <p className="text-gray-400">
                Get notified when we release new courses and educational content.
              </p>
            </div>
            <Newsletter source={`course-${course.id}`} variant="inline" />
          </div>
        </section>
      </div>
    </div>
  );
}
