import { useState, useEffect, useCallback } from 'react';
import { Star, ChevronLeft, ChevronRight, Quote } from 'lucide-react';
import { cn } from '../lib/utils';

interface Testimonial {
  name: string;
  role: string;
  content: string;
  rating: number;
  avatar: string;
}

const testimonials: Testimonial[] = [
  {
    name: 'Sarah K.',
    role: 'Beginner Investor',
    content: 'I was completely lost trying to understand crypto. The guides here broke everything down into simple terms. I started DCA-ing into Bitcoin using the calculator and feel so much more confident now.',
    rating: 5,
    avatar: 'SK',
  },
  {
    name: 'Marcus T.',
    role: 'Software Developer',
    content: 'The exchange comparison tool saved me hundreds in fees. I was using the wrong platform for my trading volume. Switched to a cheaper option and the savings add up fast.',
    rating: 5,
    avatar: 'MT',
  },
  {
    name: 'Jennifer L.',
    role: 'Financial Planner',
    content: 'I recommend Bitcoinvestments to all my clients who ask about crypto. The educational content is accurate, unbiased, and doesn\'t push any specific investment. Exactly what beginners need.',
    rating: 5,
    avatar: 'JL',
  },
  {
    name: 'David R.',
    role: 'Retail Investor',
    content: 'The scam database is incredibly valuable. I almost fell for a phishing site that looked identical to a real exchange. Found it listed here with warnings. This site literally saved my money.',
    rating: 5,
    avatar: 'DR',
  },
  {
    name: 'Priya M.',
    role: 'Graduate Student',
    content: 'As a student on a budget, I love that everything is free. The staking calculator helped me figure out the best place to earn passive income on my small holdings. Clear and no BS.',
    rating: 4,
    avatar: 'PM',
  },
  {
    name: 'Alex W.',
    role: 'Day Trader',
    content: 'The market dashboard gives me a quick snapshot every morning. Fear & Greed index, trending coins, and price data all in one place. It\'s become part of my daily routine.',
    rating: 5,
    avatar: 'AW',
  },
];

const avatarColors = [
  'bg-blue-500/20 text-blue-400',
  'bg-green-500/20 text-green-400',
  'bg-purple-500/20 text-purple-400',
  'bg-orange-500/20 text-orange-400',
  'bg-pink-500/20 text-pink-400',
  'bg-cyan-500/20 text-cyan-400',
];

export function Testimonials() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const itemsPerView = 3;
  const maxIndex = Math.max(0, testimonials.length - itemsPerView);

  const goNext = useCallback(() => {
    setActiveIndex(i => (i >= maxIndex ? 0 : i + 1));
  }, [maxIndex]);

  const goPrev = useCallback(() => {
    setActiveIndex(i => (i <= 0 ? maxIndex : i - 1));
  }, [maxIndex]);

  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(goNext, 5000);
    return () => clearInterval(interval);
  }, [isAutoPlaying, goNext]);

  return (
    <section className="py-24 relative">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            What Our <span className="text-gradient">Community</span> Says
          </h2>
          <p className="text-gray-400 text-lg">
            Join thousands of investors who trust Bitcoinvestments for crypto education and tools.
          </p>
        </div>

        {/* Testimonial Cards */}
        <div
          className="relative overflow-hidden"
          onMouseEnter={() => setIsAutoPlaying(false)}
          onMouseLeave={() => setIsAutoPlaying(true)}
        >
          <div
            className="flex transition-transform duration-500 ease-in-out gap-6"
            style={{ transform: `translateX(-${activeIndex * (100 / itemsPerView + 2)}%)` }}
          >
            {testimonials.map((testimonial, i) => (
              <div
                key={i}
                className="glass-card p-6 flex-shrink-0 w-full md:w-[calc(33.333%-16px)] flex flex-col"
              >
                <Quote className="w-8 h-8 text-brand-primary/30 mb-4" />
                <p className="text-gray-300 text-sm leading-relaxed flex-grow mb-6">
                  "{testimonial.content}"
                </p>
                <div className="flex items-center gap-3 pt-4 border-t border-white/5">
                  <div className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm',
                    avatarColors[i % avatarColors.length]
                  )}>
                    {testimonial.avatar}
                  </div>
                  <div className="flex-grow">
                    <p className="text-white font-medium text-sm">{testimonial.name}</p>
                    <p className="text-gray-400 text-xs">{testimonial.role}</p>
                  </div>
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, s) => (
                      <Star
                        key={s}
                        className={cn(
                          'w-3 h-3',
                          s < testimonial.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'
                        )}
                      />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-center gap-4 mt-8">
          <button
            onClick={goPrev}
            className="p-2 rounded-full glass hover:bg-white/10 transition-colors"
            aria-label="Previous testimonial"
          >
            <ChevronLeft className="w-5 h-5 text-gray-400" />
          </button>

          <div className="flex gap-2">
            {[...Array(maxIndex + 1)].map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveIndex(i)}
                className={cn(
                  'w-2 h-2 rounded-full transition-all',
                  i === activeIndex ? 'bg-brand-primary w-6' : 'bg-white/20 hover:bg-white/40'
                )}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>

          <button
            onClick={goNext}
            className="p-2 rounded-full glass hover:bg-white/10 transition-colors"
            aria-label="Next testimonial"
          >
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Stats Bar */}
        <div className="mt-16 glass-card p-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <p className="text-3xl md:text-4xl font-bold text-white">15K+</p>
              <p className="text-gray-400 text-sm mt-1">Active Users</p>
            </div>
            <div>
              <p className="text-3xl md:text-4xl font-bold text-white">50+</p>
              <p className="text-gray-400 text-sm mt-1">Educational Guides</p>
            </div>
            <div>
              <p className="text-3xl md:text-4xl font-bold text-white">120+</p>
              <p className="text-gray-400 text-sm mt-1">Countries Reached</p>
            </div>
            <div>
              <p className="text-3xl md:text-4xl font-bold text-white">4.8</p>
              <div className="flex items-center justify-center gap-1 mt-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={cn('w-3 h-3', i < 5 ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600')} />
                ))}
                <span className="text-gray-400 text-sm ml-1">Rating</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
