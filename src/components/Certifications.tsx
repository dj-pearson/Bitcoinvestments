import { useState, useEffect } from 'react';
import {
  getUserCertificates,
  verifyCertificate,
  getLinkedInShareUrl,
  getShareableUrl,
} from '../services/certifications';
import type {
  Certificate,
  VerificationResult
} from '../services/certifications';

// Icons
const CertificateIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
  </svg>
);

const DownloadIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
);

const ShareIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
  </svg>
);

const LinkedInIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
  </svg>
);

const CheckIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
  </svg>
);

const XIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
  </svg>
);

const CopyIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
);

const SearchIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

type Tab = 'my-certificates' | 'verify';

interface CertificationsProps {
  userId?: string;
}

export default function Certifications({ userId }: CertificationsProps) {
  const [activeTab, setActiveTab] = useState<Tab>('my-certificates');
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [verificationInput, setVerificationInput] = useState('');
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (userId) {
      loadCertificates();
    } else {
      setLoading(false);
    }
  }, [userId]);

  async function loadCertificates() {
    setLoading(true);
    const { certificates: data } = await getUserCertificates(userId!);
    setCertificates(data);
    setLoading(false);
  }

  async function handleVerify() {
    if (!verificationInput.trim()) return;

    setVerifying(true);
    const result = await verifyCertificate(verificationInput.trim());
    setVerificationResult(result);
    setVerifying(false);
  }

  function handleCopyLink(cert: Certificate) {
    navigator.clipboard.writeText(getShareableUrl(cert));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleShareLinkedIn(cert: Certificate) {
    window.open(getLinkedInShareUrl(cert), '_blank');
  }

  function getGradeColor(grade: string): string {
    if (grade.startsWith('A')) return 'text-green-600 bg-green-100';
    if (grade.startsWith('B')) return 'text-blue-600 bg-blue-100';
    if (grade.startsWith('C')) return 'text-yellow-600 bg-yellow-100';
    return 'text-gray-600 bg-gray-100';
  }

  function renderCertificateCard(cert: Certificate) {
    return (
      <div
        key={cert.id}
        className="bg-white border-2 border-orange-200 rounded-xl overflow-hidden hover:shadow-lg transition cursor-pointer"
        onClick={() => setSelectedCertificate(cert)}
      >
        {/* Certificate Preview */}
        <div className="relative bg-gradient-to-br from-orange-50 to-orange-100 p-6 border-b-4 border-orange-500">
          <div className="absolute top-4 right-4">
            <span className={`px-2 py-1 rounded text-sm font-bold ${getGradeColor(cert.grade || 'A')}`}>
              {cert.grade}
            </span>
          </div>

          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-orange-500 text-white rounded-full mb-3">
              <CertificateIcon />
            </div>
            <h3 className="font-bold text-gray-900">{cert.courseName}</h3>
            <p className="text-sm text-gray-600 mt-1">Certificate of Completion</p>
          </div>
        </div>

        {/* Details */}
        <div className="p-4">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
            <span>Issued: {new Date(cert.issueDate).toLocaleDateString()}</span>
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
              cert.status === 'issued' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
            }`}>
              {cert.status.charAt(0).toUpperCase() + cert.status.slice(1)}
            </span>
          </div>

          <div className="text-xs text-gray-500 mb-3">
            Certificate ID: {cert.certificateNumber}
          </div>

          <div className="flex gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleCopyLink(cert);
              }}
              className="flex-1 flex items-center justify-center gap-1 px-3 py-2 border rounded-lg hover:bg-gray-50 text-sm"
            >
              {copied ? <CheckIcon /> : <CopyIcon />}
              {copied ? 'Copied!' : 'Copy Link'}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleShareLinkedIn(cert);
              }}
              className="flex items-center justify-center px-3 py-2 bg-[#0077B5] text-white rounded-lg hover:bg-[#006699]"
            >
              <LinkedInIcon />
            </button>
          </div>
        </div>
      </div>
    );
  }

  function renderCertificateModal() {
    if (!selectedCertificate) return null;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
          {/* Certificate Display */}
          <div className="relative bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 p-12 border-b-8 border-orange-500">
            {/* Decorative Border */}
            <div className="absolute inset-4 border-4 border-orange-300 rounded-lg pointer-events-none" />
            <div className="absolute inset-6 border-2 border-orange-200 rounded-lg pointer-events-none" />

            {/* Close Button */}
            <button
              onClick={() => setSelectedCertificate(null)}
              className="absolute top-6 right-6 p-2 text-gray-500 hover:text-gray-700 z-10"
            >
              <XIcon />
            </button>

            <div className="relative text-center">
              {/* Header */}
              <div className="mb-6">
                <div className="text-orange-600 font-semibold tracking-wider uppercase text-sm">
                  Certificate of Completion
                </div>
                <div className="text-4xl font-serif text-gray-800 mt-2">
                  BitcoinVestments
                </div>
              </div>

              {/* Award Text */}
              <div className="mb-6">
                <p className="text-gray-600">This is to certify that</p>
                <p className="text-3xl font-bold text-gray-900 my-3">{selectedCertificate.userName}</p>
                <p className="text-gray-600">has successfully completed</p>
              </div>

              {/* Course Name */}
              <div className="mb-6">
                <p className="text-2xl font-bold text-orange-600">{selectedCertificate.courseName}</p>
                <p className="text-gray-600 mt-2">
                  with a grade of <span className="font-bold">{selectedCertificate.grade}</span> ({selectedCertificate.score}%)
                </p>
              </div>

              {/* Skills */}
              <div className="mb-6">
                <p className="text-sm text-gray-600 mb-2">Demonstrated proficiency in:</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {selectedCertificate.skills.map((skill, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Date and Signature */}
              <div className="flex justify-between items-end mt-8 pt-6 border-t border-orange-200">
                <div className="text-left">
                  <p className="text-gray-600 text-sm">Date Issued</p>
                  <p className="font-semibold">{new Date(selectedCertificate.issueDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}</p>
                </div>
                <div className="text-center">
                  <div className="w-32 border-t border-gray-400 pt-2">
                    <p className="font-script text-lg">{selectedCertificate.instructorName}</p>
                    <p className="text-xs text-gray-500">Instructor</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-gray-600 text-sm">Certificate ID</p>
                  <p className="font-mono text-sm">{selectedCertificate.certificateNumber}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="p-6 bg-gray-50">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <button
                onClick={() => handleCopyLink(selectedCertificate)}
                className="flex items-center justify-center gap-2 px-4 py-3 border rounded-lg hover:bg-white transition"
              >
                {copied ? <CheckIcon /> : <CopyIcon />}
                <span>{copied ? 'Copied!' : 'Copy Link'}</span>
              </button>
              <button
                onClick={() => handleShareLinkedIn(selectedCertificate)}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-[#0077B5] text-white rounded-lg hover:bg-[#006699] transition"
              >
                <LinkedInIcon />
                <span>LinkedIn</span>
              </button>
              <button className="flex items-center justify-center gap-2 px-4 py-3 border rounded-lg hover:bg-white transition">
                <ShareIcon />
                <span>Share</span>
              </button>
              <button className="flex items-center justify-center gap-2 px-4 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition">
                <DownloadIcon />
                <span>Download PDF</span>
              </button>
            </div>

            {/* Certificate Details */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="p-3 bg-white rounded-lg">
                <div className="text-2xl font-bold text-orange-500">{selectedCertificate.metadata.lessonsCompleted}</div>
                <div className="text-sm text-gray-600">Lessons</div>
              </div>
              <div className="p-3 bg-white rounded-lg">
                <div className="text-2xl font-bold text-orange-500">{selectedCertificate.metadata.quizzesCompleted}</div>
                <div className="text-sm text-gray-600">Quizzes</div>
              </div>
              <div className="p-3 bg-white rounded-lg">
                <div className="text-2xl font-bold text-orange-500">{selectedCertificate.completionTime}h</div>
                <div className="text-sm text-gray-600">Hours</div>
              </div>
              <div className="p-3 bg-white rounded-lg">
                <div className="text-2xl font-bold text-orange-500">{selectedCertificate.metadata.averageQuizScore}%</div>
                <div className="text-sm text-gray-600">Avg Score</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  function renderMyCertificates() {
    if (loading) {
      return (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
        </div>
      );
    }

    if (certificates.length === 0) {
      return (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-200 text-gray-400 rounded-full mb-4">
            <CertificateIcon />
          </div>
          <h3 className="text-lg font-medium text-gray-900">No certificates yet</h3>
          <p className="text-gray-600 mt-2">Complete a course to earn your first certificate</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {certificates.map(cert => renderCertificateCard(cert))}
      </div>
    );
  }

  function renderVerify() {
    return (
      <div className="max-w-xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 text-orange-500 rounded-full mb-4">
            <SearchIcon />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Verify a Certificate</h2>
          <p className="text-gray-600 mt-2">
            Enter a certificate ID to verify its authenticity
          </p>
        </div>

        <div className="flex gap-2 mb-8">
          <input
            type="text"
            value={verificationInput}
            onChange={e => setVerificationInput(e.target.value)}
            placeholder="e.g., BTC-2024-001234"
            className="flex-1 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            onKeyPress={e => e.key === 'Enter' && handleVerify()}
          />
          <button
            onClick={handleVerify}
            disabled={verifying || !verificationInput.trim()}
            className="px-6 py-3 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {verifying ? 'Verifying...' : 'Verify'}
          </button>
        </div>

        {verificationResult && (
          <div className={`p-6 rounded-xl ${
            verificationResult.isValid
              ? 'bg-green-50 border-2 border-green-200'
              : 'bg-red-50 border-2 border-red-200'
          }`}>
            <div className="flex items-center gap-3 mb-4">
              {verificationResult.isValid ? (
                <>
                  <div className="w-10 h-10 bg-green-500 text-white rounded-full flex items-center justify-center">
                    <CheckIcon />
                  </div>
                  <div>
                    <h3 className="font-semibold text-green-800">Certificate Verified</h3>
                    <p className="text-green-600 text-sm">{verificationResult.message}</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-10 h-10 bg-red-500 text-white rounded-full flex items-center justify-center">
                    <XIcon />
                  </div>
                  <div>
                    <h3 className="font-semibold text-red-800">Verification Failed</h3>
                    <p className="text-red-600 text-sm">{verificationResult.message}</p>
                  </div>
                </>
              )}
            </div>

            {verificationResult.certificate && (
              <div className="border-t border-gray-200 pt-4 mt-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Recipient:</span>
                    <p className="font-medium">{verificationResult.certificate.userName}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Course:</span>
                    <p className="font-medium">{verificationResult.certificate.courseName}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Issue Date:</span>
                    <p className="font-medium">{new Date(verificationResult.certificate.issueDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Grade:</span>
                    <p className="font-medium">{verificationResult.certificate.grade} ({verificationResult.certificate.score}%)</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Sample Certificate IDs */}
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600 mb-2">Try these sample certificate IDs:</p>
          <div className="flex flex-wrap gap-2">
            {['BTC-2024-001234', 'SEC-2024-001235'].map(id => (
              <button
                key={id}
                onClick={() => setVerificationInput(id)}
                className="px-3 py-1 bg-white border rounded text-sm hover:bg-gray-100"
              >
                {id}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Certificates</h1>
        <p className="text-gray-600 mt-2">
          Earn verifiable certificates for completing courses
        </p>
      </div>

      {/* Tabs */}
      <div className="flex justify-center gap-4 mb-8">
        <button
          onClick={() => setActiveTab('my-certificates')}
          className={`px-6 py-3 rounded-lg font-medium transition ${
            activeTab === 'my-certificates'
              ? 'bg-orange-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          My Certificates
        </button>
        <button
          onClick={() => setActiveTab('verify')}
          className={`px-6 py-3 rounded-lg font-medium transition ${
            activeTab === 'verify'
              ? 'bg-orange-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Verify Certificate
        </button>
      </div>

      {/* Content */}
      {activeTab === 'my-certificates' && renderMyCertificates()}
      {activeTab === 'verify' && renderVerify()}

      {/* Certificate Modal */}
      {renderCertificateModal()}
    </div>
  );
}
