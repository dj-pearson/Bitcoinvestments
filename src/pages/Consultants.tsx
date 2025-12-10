import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Users,
  Search,
  Star,
  Clock,
  Globe,
  CheckCircle,
  Calendar,
  Video,
  Phone,
  MessageSquare,
  Shield,
  Award,
  DollarSign,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import {
  getApprovedConsultants,
  getFeaturedConsultants,
  getConsultantById,
  getConsultantReviews,
  createBookingCheckout,
  SPECIALIZATIONS,
  type Consultant,
  type ConsultantReview,
} from '../services/consultationMarketplace';

export function Consultants() {
  const { user } = useAuth();
  const { consultantId } = useParams();
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [featuredConsultants, setFeaturedConsultants] = useState<Consultant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialization, setSelectedSpecialization] = useState<string>('all');
  const [maxRate, setMaxRate] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<'rating' | 'price_low' | 'price_high' | 'experience' | 'reviews'>('rating');
  const [selectedConsultant, setSelectedConsultant] = useState<Consultant | null>(null);
  const [reviews, setReviews] = useState<ConsultantReview[]>([]);
  const [booking, setBooking] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    sessionType: 'video' as 'video' | 'audio' | 'chat',
    duration: 60,
    date: '',
    time: '',
    topic: '',
    description: '',
  });

  useEffect(() => {
    loadConsultants();
  }, [selectedSpecialization, maxRate, sortBy]);

  useEffect(() => {
    if (consultantId) {
      loadSingleConsultant(consultantId);
    }
  }, [consultantId]);

  async function loadConsultants() {
    setLoading(true);
    try {
      const [approved, featured] = await Promise.all([
        getApprovedConsultants({
          specialization: selectedSpecialization !== 'all' ? selectedSpecialization : undefined,
          maxHourlyRate: maxRate || undefined,
          sortBy,
          limit: 20,
        }),
        getFeaturedConsultants(4),
      ]);
      setConsultants(approved);
      setFeaturedConsultants(featured);
    } catch (error) {
      console.error('Error loading consultants:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadSingleConsultant(id: string) {
    setLoading(true);
    try {
      const consultant = await getConsultantById(id);
      setSelectedConsultant(consultant);

      if (consultant) {
        const consultantReviews = await getConsultantReviews(consultant.id, 10);
        setReviews(consultantReviews);
      }
    } catch (error) {
      console.error('Error loading consultant:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleBooking() {
    if (!selectedConsultant || !user) {
      window.location.href = `/login?redirect=/consultants/${selectedConsultant?.id}`;
      return;
    }

    if (!bookingForm.date || !bookingForm.time || !bookingForm.topic) {
      alert('Please fill in all required fields');
      return;
    }

    setBooking(true);
    try {
      const scheduledAt = new Date(`${bookingForm.date}T${bookingForm.time}`).toISOString();

      const { url, error } = await createBookingCheckout(
        selectedConsultant.id,
        user.id,
        user.email || '',
        {
          sessionType: bookingForm.sessionType,
          durationMinutes: bookingForm.duration,
          scheduledAt,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          topic: bookingForm.topic,
          description: bookingForm.description,
        }
      );

      if (error) {
        alert(error);
        return;
      }

      if (url) {
        window.location.href = url;
      }
    } finally {
      setBooking(false);
    }
  }

  const filteredConsultants = consultants.filter(
    (consultant) =>
      consultant.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      consultant.bio.toLowerCase().includes(searchQuery.toLowerCase()) ||
      consultant.specializations.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getSessionTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="w-4 h-4" />;
      case 'audio': return <Phone className="w-4 h-4" />;
      case 'chat': return <MessageSquare className="w-4 h-4" />;
      default: return null;
    }
  };

  // Single consultant view
  if (selectedConsultant) {
    const sessionPrice = (selectedConsultant.hourly_rate / 60) * bookingForm.duration;

    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Link
          to="/consultants"
          className="text-orange-500 hover:text-orange-400 mb-6 inline-flex items-center gap-2"
        >
          Back to Consultants
        </Link>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Profile Header */}
            <div className="glass-card p-8 mb-6">
              <div className="flex items-start gap-6">
                {selectedConsultant.avatar_url ? (
                  <img
                    src={selectedConsultant.avatar_url}
                    alt={selectedConsultant.display_name}
                    className="w-24 h-24 rounded-full"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gray-700 flex items-center justify-center">
                    <Users className="w-12 h-12 text-gray-400" />
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h1 className="text-2xl font-bold text-white">
                      {selectedConsultant.display_name}
                    </h1>
                    {selectedConsultant.is_verified && (
                      <span className="flex items-center gap-1 text-green-500">
                        <CheckCircle className="w-5 h-5" />
                      </span>
                    )}
                  </div>
                  {selectedConsultant.title && (
                    <p className="text-orange-500 font-medium mb-2">{selectedConsultant.title}</p>
                  )}
                  <div className="flex items-center gap-4 text-sm text-gray-400 mb-4">
                    <span className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500" />
                      {selectedConsultant.average_rating.toFixed(1)} ({selectedConsultant.reviews_count} reviews)
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {selectedConsultant.total_sessions} sessions
                    </span>
                    <span className="flex items-center gap-1">
                      <Globe className="w-4 h-4" />
                      {selectedConsultant.timezone}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedConsultant.specializations.map((spec) => (
                      <span
                        key={spec}
                        className="px-3 py-1 bg-orange-500/20 text-orange-500 text-sm rounded-full"
                      >
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* About */}
            <div className="glass-card p-8 mb-6">
              <h2 className="text-xl font-bold text-white mb-4">About</h2>
              <p className="text-gray-300 whitespace-pre-line">{selectedConsultant.bio}</p>
            </div>

            {/* Credentials */}
            {selectedConsultant.credentials && selectedConsultant.credentials.length > 0 && (
              <div className="glass-card p-8 mb-6">
                <h2 className="text-xl font-bold text-white mb-4">Credentials</h2>
                <div className="space-y-2">
                  {selectedConsultant.credentials.map((credential, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <Award className="w-5 h-5 text-yellow-500" />
                      <span className="text-gray-300">{credential}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="glass-card p-4 text-center">
                <p className="text-2xl font-bold text-white">{selectedConsultant.experience_years}</p>
                <p className="text-sm text-gray-400">Years Experience</p>
              </div>
              <div className="glass-card p-4 text-center">
                <p className="text-2xl font-bold text-white">{selectedConsultant.total_sessions}</p>
                <p className="text-sm text-gray-400">Sessions Completed</p>
              </div>
              <div className="glass-card p-4 text-center">
                <p className="text-2xl font-bold text-white">{selectedConsultant.repeat_client_rate.toFixed(0)}%</p>
                <p className="text-sm text-gray-400">Repeat Clients</p>
              </div>
              <div className="glass-card p-4 text-center">
                <p className="text-2xl font-bold text-white">{selectedConsultant.response_time_hours}h</p>
                <p className="text-sm text-gray-400">Avg Response</p>
              </div>
            </div>

            {/* Reviews */}
            {reviews.length > 0 && (
              <div className="glass-card p-8">
                <h2 className="text-xl font-bold text-white mb-4">Reviews</h2>
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="border-b border-gray-700 pb-4 last:border-0">
                      <div className="flex items-center gap-2 mb-2">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < review.overall_rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-600'
                            }`}
                          />
                        ))}
                        <span className="text-sm text-gray-500 ml-2">
                          {new Date(review.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      {review.review_text && (
                        <p className="text-gray-300">{review.review_text}</p>
                      )}
                      {review.consultant_response && (
                        <div className="mt-3 pl-4 border-l-2 border-orange-500">
                          <p className="text-sm text-orange-500 font-medium mb-1">Consultant Response:</p>
                          <p className="text-sm text-gray-400">{review.consultant_response}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar - Booking */}
          <div className="lg:col-span-1">
            <div className="glass-card p-6 sticky top-24">
              <div className="text-center mb-6">
                <p className="text-3xl font-bold text-white">${selectedConsultant.hourly_rate}</p>
                <p className="text-gray-400">per hour</p>
              </div>

              {/* Session Type */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-400 mb-2">Session Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {selectedConsultant.session_types.map((type) => (
                    <button
                      key={type}
                      onClick={() => setBookingForm({ ...bookingForm, sessionType: type })}
                      className={`p-3 rounded-lg flex flex-col items-center gap-1 transition-colors ${
                        bookingForm.sessionType === type
                          ? 'bg-orange-500 text-white'
                          : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      {getSessionTypeIcon(type)}
                      <span className="text-xs capitalize">{type}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Duration */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-400 mb-2">Duration</label>
                <select
                  value={bookingForm.duration}
                  onChange={(e) => setBookingForm({ ...bookingForm, duration: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white"
                >
                  {selectedConsultant.session_durations.map((duration) => (
                    <option key={duration} value={duration}>
                      {duration} minutes - ${((selectedConsultant.hourly_rate / 60) * duration).toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Date</label>
                  <input
                    type="date"
                    value={bookingForm.date}
                    onChange={(e) => setBookingForm({ ...bookingForm, date: e.target.value })}
                    min={new Date(Date.now() + selectedConsultant.booking_lead_time_hours * 60 * 60 * 1000).toISOString().split('T')[0]}
                    className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Time</label>
                  <input
                    type="time"
                    value={bookingForm.time}
                    onChange={(e) => setBookingForm({ ...bookingForm, time: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white"
                  />
                </div>
              </div>

              {/* Topic */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-400 mb-2">Topic *</label>
                <input
                  type="text"
                  placeholder="What do you need help with?"
                  value={bookingForm.topic}
                  onChange={(e) => setBookingForm({ ...bookingForm, topic: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500"
                />
              </div>

              {/* Description */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-400 mb-2">Details (optional)</label>
                <textarea
                  placeholder="Provide more context..."
                  value={bookingForm.description}
                  onChange={(e) => setBookingForm({ ...bookingForm, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 resize-none"
                />
              </div>

              {/* Total */}
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-700">
                <span className="text-gray-400">Total</span>
                <span className="text-2xl font-bold text-white">${sessionPrice.toFixed(2)}</span>
              </div>

              {/* Book Button */}
              <button
                onClick={handleBooking}
                disabled={booking}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                <Calendar className="w-4 h-4" />
                {booking ? 'Processing...' : 'Book Session'}
              </button>

              {/* Trust Badges */}
              <div className="mt-6 space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Shield className="w-4 h-4 text-green-500" />
                  Secure payment via Stripe
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Full refund if cancelled 24h+ before
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Consultants listing
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
          Crypto Consultants
        </h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto">
          Book 1:1 sessions with verified crypto experts. Get personalized advice
          for your investment journey.
        </p>
      </div>

      {/* Featured Consultants */}
      {featuredConsultants.length > 0 && (
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <Star className="w-6 h-6 text-yellow-500" />
            Top Rated Consultants
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredConsultants.map((consultant) => (
              <Link
                key={consultant.id}
                to={`/consultants/${consultant.id}`}
                className="glass-card p-6 hover:border-orange-500/50 transition-all group text-center"
              >
                {consultant.avatar_url ? (
                  <img
                    src={consultant.avatar_url}
                    alt={consultant.display_name}
                    className="w-20 h-20 rounded-full mx-auto mb-4"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gray-700 flex items-center justify-center mx-auto mb-4">
                    <Users className="w-10 h-10 text-gray-400" />
                  </div>
                )}
                <div className="flex items-center justify-center gap-1 mb-2">
                  <h3 className="font-semibold text-white group-hover:text-orange-500 transition-colors">
                    {consultant.display_name}
                  </h3>
                  {consultant.is_verified && (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  )}
                </div>
                <p className="text-sm text-gray-400 mb-3">{consultant.title}</p>
                <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mb-3">
                  <Star className="w-4 h-4 text-yellow-500" />
                  {consultant.average_rating.toFixed(1)}
                  <span>({consultant.reviews_count})</span>
                </div>
                <p className="text-lg font-bold text-green-400">${consultant.hourly_rate}/hr</p>
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
            placeholder="Search consultants..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:border-orange-500"
          />
        </div>
        <select
          value={selectedSpecialization}
          onChange={(e) => setSelectedSpecialization(e.target.value)}
          className="px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white"
        >
          <option value="all">All Specializations</option>
          {SPECIALIZATIONS.map((spec) => (
            <option key={spec.id} value={spec.id}>{spec.name}</option>
          ))}
        </select>
        <select
          value={maxRate || ''}
          onChange={(e) => setMaxRate(e.target.value ? parseInt(e.target.value) : null)}
          className="px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white"
        >
          <option value="">Any Price</option>
          <option value="50">Under $50/hr</option>
          <option value="100">Under $100/hr</option>
          <option value="200">Under $200/hr</option>
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          className="px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white"
        >
          <option value="rating">Highest Rated</option>
          <option value="reviews">Most Reviews</option>
          <option value="experience">Most Experienced</option>
          <option value="price_low">Price: Low to High</option>
          <option value="price_high">Price: High to Low</option>
        </select>
      </div>

      {/* Consultants Grid */}
      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="glass-card p-6 animate-pulse">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-full bg-gray-700"></div>
                <div className="flex-1">
                  <div className="h-5 bg-gray-700 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-700 rounded w-1/2"></div>
                </div>
              </div>
              <div className="h-4 bg-gray-700 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-700 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      ) : filteredConsultants.length === 0 ? (
        <div className="text-center py-12">
          <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No consultants found</h3>
          <p className="text-gray-400">
            Try adjusting your search or filter criteria.
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredConsultants.map((consultant) => (
            <Link
              key={consultant.id}
              to={`/consultants/${consultant.id}`}
              className="glass-card p-6 hover:border-orange-500/50 transition-all group"
            >
              <div className="flex items-start gap-4 mb-4">
                {consultant.avatar_url ? (
                  <img
                    src={consultant.avatar_url}
                    alt={consultant.display_name}
                    className="w-16 h-16 rounded-full"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center">
                    <Users className="w-8 h-8 text-gray-400" />
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-white group-hover:text-orange-500 transition-colors">
                      {consultant.display_name}
                    </h3>
                    {consultant.is_verified && (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    )}
                  </div>
                  {consultant.title && (
                    <p className="text-sm text-orange-500">{consultant.title}</p>
                  )}
                  <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500" />
                      {consultant.average_rating.toFixed(1)}
                    </span>
                    <span>{consultant.reviews_count} reviews</span>
                    <span>{consultant.experience_years}y exp</span>
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-400 line-clamp-2 mb-4">{consultant.bio}</p>
              <div className="flex flex-wrap gap-2 mb-4">
                {consultant.specializations.slice(0, 3).map((spec) => (
                  <span
                    key={spec}
                    className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded"
                  >
                    {spec}
                  </span>
                ))}
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  {consultant.session_types.map((type) => (
                    <span key={type} className="flex items-center gap-1">
                      {getSessionTypeIcon(type)}
                    </span>
                  ))}
                </div>
                <span className="text-lg font-bold text-green-400">
                  ${consultant.hourly_rate}/hr
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Become a Consultant CTA */}
      <div className="mt-16 text-center glass-card p-12 bg-gradient-to-r from-green-500/10 to-teal-500/10 border-green-500/30">
        <DollarSign className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-3xl font-bold text-white mb-4">
          Share Your Expertise
        </h2>
        <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
          Are you a crypto expert? Join our consultant network and help others
          while earning 80-85% of every session.
        </p>
        <Link to="/become-consultant" className="btn-primary">
          Apply as Consultant
        </Link>
      </div>
    </div>
  );
}
