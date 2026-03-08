import { Link } from 'react-router-dom';
import { Clock, ArrowLeft, BookOpen, Calculator, ArrowLeftRight, BarChart3 } from 'lucide-react';

export function ComingSoon() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="max-w-2xl w-full text-center">
        <div className="w-20 h-20 rounded-2xl bg-brand-primary/10 flex items-center justify-center mx-auto mb-8">
          <Clock className="w-10 h-10 text-brand-primary" />
        </div>

        <h1 className="text-4xl font-bold text-white mb-4">
          Coming Soon
        </h1>

        <p className="text-lg text-gray-400 mb-8 max-w-md mx-auto">
          We're building something great. This feature is currently under development
          and will be available soon.
        </p>

        <div className="glass-card p-6 rounded-2xl border border-white/10 mb-8">
          <p className="text-sm text-gray-400 mb-4">
            In the meantime, explore what's available now:
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Link
              to="/learn"
              className="flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-white/5 transition-colors group"
            >
              <BookOpen className="w-6 h-6 text-gray-400 group-hover:text-brand-accent transition-colors" />
              <span className="text-sm text-gray-300 group-hover:text-white transition-colors">Learn</span>
            </Link>
            <Link
              to="/calculators"
              className="flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-white/5 transition-colors group"
            >
              <Calculator className="w-6 h-6 text-gray-400 group-hover:text-brand-accent transition-colors" />
              <span className="text-sm text-gray-300 group-hover:text-white transition-colors">Calculators</span>
            </Link>
            <Link
              to="/compare"
              className="flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-white/5 transition-colors group"
            >
              <ArrowLeftRight className="w-6 h-6 text-gray-400 group-hover:text-brand-accent transition-colors" />
              <span className="text-sm text-gray-300 group-hover:text-white transition-colors">Compare</span>
            </Link>
            <Link
              to="/dashboard"
              className="flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-white/5 transition-colors group"
            >
              <BarChart3 className="w-6 h-6 text-gray-400 group-hover:text-brand-accent transition-colors" />
              <span className="text-sm text-gray-300 group-hover:text-white transition-colors">Prices</span>
            </Link>
          </div>
        </div>

        <Link
          to="/"
          className="inline-flex items-center gap-2 text-brand-accent hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
      </div>
    </div>
  );
}

export default ComingSoon;
