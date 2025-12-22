// Certification Program Service
// Issue verifiable certificates for course completions

import { supabase, db } from '../lib/supabase';

export type CertificateStatus = 'pending' | 'issued' | 'revoked' | 'expired';

export interface Certificate {
  id: string;
  certificateNumber: string;
  userId: string;
  userName: string;
  courseId: string;
  courseName: string;
  instructorName: string;
  issueDate: string;
  expiryDate?: string;
  status: CertificateStatus;
  grade?: string;
  score?: number;
  completionTime: number; // in hours
  skills: string[];
  verificationUrl: string;
  pdfUrl?: string;
  linkedinShareUrl?: string;
  metadata: {
    lessonsCompleted: number;
    quizzesCompleted: number;
    averageQuizScore: number;
  };
}

export interface CertificateTemplate {
  id: string;
  name: string;
  description: string;
  backgroundColor: string;
  borderColor: string;
  logoUrl?: string;
  signatureUrl?: string;
  accentColor: string;
}

export interface VerificationResult {
  isValid: boolean;
  certificate: Certificate | null;
  message: string;
}

// Demo certificates
const DEMO_CERTIFICATES: Certificate[] = [
  {
    id: 'cert-1',
    certificateNumber: 'BTC-2024-001234',
    userId: 'demo-user',
    userName: 'Demo User',
    courseId: 'course-1',
    courseName: 'Bitcoin Fundamentals',
    instructorName: 'Alex Chen',
    issueDate: '2024-11-15',
    status: 'issued',
    grade: 'A',
    score: 92,
    completionTime: 4.5,
    skills: ['Bitcoin Basics', 'Wallet Security', 'Transaction Understanding', 'Blockchain Fundamentals'],
    verificationUrl: 'https://bitcoinvestments.com/verify/BTC-2024-001234',
    linkedinShareUrl: 'https://www.linkedin.com/sharing/share-offsite/?url=https://bitcoinvestments.com/verify/BTC-2024-001234',
    metadata: {
      lessonsCompleted: 12,
      quizzesCompleted: 4,
      averageQuizScore: 92
    }
  },
  {
    id: 'cert-2',
    certificateNumber: 'SEC-2024-001235',
    userId: 'demo-user',
    userName: 'Demo User',
    courseId: 'course-4',
    courseName: 'Crypto Security Essentials',
    instructorName: 'Alex Chen',
    issueDate: '2024-12-01',
    status: 'issued',
    grade: 'A+',
    score: 98,
    completionTime: 3.2,
    skills: ['Hardware Wallets', 'Operational Security', 'Phishing Prevention', 'Backup Strategies'],
    verificationUrl: 'https://bitcoinvestments.com/verify/SEC-2024-001235',
    linkedinShareUrl: 'https://www.linkedin.com/sharing/share-offsite/?url=https://bitcoinvestments.com/verify/SEC-2024-001235',
    metadata: {
      lessonsCompleted: 10,
      quizzesCompleted: 3,
      averageQuizScore: 98
    }
  }
];

const CERTIFICATE_TEMPLATES: CertificateTemplate[] = [
  {
    id: 'template-1',
    name: 'Classic',
    description: 'Traditional certificate design with gold accents',
    backgroundColor: '#FFFEF7',
    borderColor: '#D4AF37',
    accentColor: '#D4AF37'
  },
  {
    id: 'template-2',
    name: 'Modern',
    description: 'Clean modern design with gradient accents',
    backgroundColor: '#FFFFFF',
    borderColor: '#F97316',
    accentColor: '#F97316'
  },
  {
    id: 'template-3',
    name: 'Dark',
    description: 'Professional dark theme certificate',
    backgroundColor: '#1F2937',
    borderColor: '#60A5FA',
    accentColor: '#60A5FA'
  }
];

// Generate unique certificate number
function generateCertificateNumber(coursePrefix: string): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 900000) + 100000;
  return `${coursePrefix}-${year}-${random}`;
}

// Get grade from score
function getGrade(score: number): string {
  if (score >= 97) return 'A+';
  if (score >= 93) return 'A';
  if (score >= 90) return 'A-';
  if (score >= 87) return 'B+';
  if (score >= 83) return 'B';
  if (score >= 80) return 'B-';
  if (score >= 77) return 'C+';
  if (score >= 73) return 'C';
  if (score >= 70) return 'C-';
  return 'D';
}

// Issue a certificate for course completion
export async function issueCertificate(
  userId: string,
  courseId: string,
  enrollmentId: string
): Promise<{ certificate: Certificate | null; error: string | null }> {
  try {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      // Demo certificate
      const newCert: Certificate = {
        id: `cert-${Date.now()}`,
        certificateNumber: generateCertificateNumber('DEMO'),
        userId,
        userName: 'Demo User',
        courseId,
        courseName: 'Demo Course',
        instructorName: 'Demo Instructor',
        issueDate: new Date().toISOString().split('T')[0],
        status: 'issued',
        grade: 'A',
        score: 90,
        completionTime: 5,
        skills: ['Cryptocurrency', 'Blockchain'],
        verificationUrl: `https://bitcoinvestments.com/verify/${generateCertificateNumber('DEMO')}`,
        metadata: {
          lessonsCompleted: 10,
          quizzesCompleted: 3,
          averageQuizScore: 90
        }
      };
      return { certificate: newCert, error: null };
    }

    // Get user info
    const { data: user } = await supabase.auth.getUser();

    // Get course and enrollment info
    const { data: enrollment, error: enrollmentError } = await db
      .from('course_enrollments')
      .select(`
        *,
        course:courses(
          *,
          instructor:instructors(name)
        )
      `)
      .eq('id', enrollmentId)
      .eq('user_id', userId)
      .single();

    if (enrollmentError || !enrollment) {
      throw new Error('Enrollment not found');
    }

    const enrollmentData = enrollment as { completed_at?: string; course: { category: string; title: string; instructor?: { name: string }; estimated_hours: number; learning_outcomes?: string[] } };
    if (!enrollmentData.completed_at) {
      return { certificate: null, error: 'Course not completed yet' };
    }

    // Check if certificate already exists
    const { data: existingCert } = await db
      .from('certificates')
      .select('*')
      .eq('enrollment_id', enrollmentId)
      .single();

    if (existingCert) {
      return { certificate: existingCert as Certificate, error: null };
    }

    // Get quiz scores
    const { data: quizAttempts } = await db
      .from('quiz_attempts')
      .select('score')
      .eq('enrollment_id', enrollmentId)
      .eq('passed', true);

    const attempts = quizAttempts as { score: number }[] | null;
    const averageScore = attempts && attempts.length > 0
      ? Math.round(attempts.reduce((sum: number, a: { score: number }) => sum + a.score, 0) / attempts.length)
      : 85;

    // Get lesson count
    const { count: lessonsCompleted } = await db
      .from('lesson_progress')
      .select('*', { count: 'exact' })
      .eq('enrollment_id', enrollmentId)
      .eq('is_completed', true);
    void lessonsCompleted; // Used for future completion tracking

    // Generate certificate number
    const coursePrefix = enrollmentData.course.category.toUpperCase().slice(0, 3);
    const certificateNumber = generateCertificateNumber(coursePrefix);

    // Create certificate
    const { data: certificate, error } = await db
      .from('certificates')
      .insert({
        certificate_number: certificateNumber,
        user_id: userId,
        user_name: user?.user?.user_metadata?.full_name || user?.user?.email?.split('@')[0] || 'Student',
        enrollment_id: enrollmentId,
        course_id: courseId,
        course_name: enrollmentData.course.title,
        instructor_name: enrollmentData.course.instructor?.name || 'Unknown',
        issue_date: new Date().toISOString(),
        status: 'issued',
        grade: getGrade(averageScore),
        score: averageScore,
        completion_time: enrollmentData.course.estimated_hours,
        skills: enrollmentData.course.learning_outcomes || [],
        verification_url: `https://bitcoinvestments.com/verify/${certificateNumber}`,
        metadata: {
          lessonsCompleted: lessonsCompleted || 0,
          quizzesCompleted: quizAttempts?.length || 0,
          averageQuizScore: averageScore
        }
      })
      .select()
      .single();

    if (error) throw error;

    return { certificate: certificate as Certificate, error: null };
  } catch (err: any) {
    console.error('Error issuing certificate:', err);
    return { certificate: null, error: err.message || 'Failed to issue certificate' };
  }
}

// Get user's certificates
export async function getUserCertificates(userId: string): Promise<{
  certificates: Certificate[];
  error: string | null;
}> {
  try {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return { certificates: DEMO_CERTIFICATES, error: null };
    }

    const { data, error } = await db
      .from('certificates')
      .select('*')
      .eq('user_id', userId)
      .order('issue_date', { ascending: false });

    if (error) throw error;

    return { certificates: (data as Certificate[]) || [], error: null };
  } catch (err) {
    console.error('Error fetching certificates:', err);
    return { certificates: DEMO_CERTIFICATES, error: null };
  }
}

// Verify a certificate
export async function verifyCertificate(certificateNumber: string): Promise<VerificationResult> {
  try {
    // Check demo certificates
    const demoCert = DEMO_CERTIFICATES.find(c => c.certificateNumber === certificateNumber);
    if (demoCert) {
      return {
        isValid: true,
        certificate: demoCert,
        message: 'Certificate verified successfully'
      };
    }

    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return {
        isValid: false,
        certificate: null,
        message: 'Certificate not found'
      };
    }

    const { data, error } = await db
      .from('certificates')
      .select('*')
      .eq('certificate_number', certificateNumber)
      .single();

    if (error || !data) {
      return {
        isValid: false,
        certificate: null,
        message: 'Certificate not found or invalid'
      };
    }

    const cert = data as Certificate;
    if (cert.status === 'revoked') {
      return {
        isValid: false,
        certificate: cert,
        message: 'This certificate has been revoked'
      };
    }

    if (cert.status === 'expired') {
      return {
        isValid: false,
        certificate: cert,
        message: 'This certificate has expired'
      };
    }

    return {
      isValid: true,
      certificate: cert,
      message: 'Certificate verified successfully'
    };
  } catch (err) {
    console.error('Error verifying certificate:', err);
    return {
      isValid: false,
      certificate: null,
      message: 'Verification failed'
    };
  }
}

// Get certificate templates
export function getCertificateTemplates(): CertificateTemplate[] {
  return CERTIFICATE_TEMPLATES;
}

// Generate certificate PDF (placeholder - would use a PDF library in production)
export async function generateCertificatePDF(certificateId: string): Promise<{
  url: string | null;
  error: string | null;
}> {
  // In production, this would generate an actual PDF using a library like pdfkit or puppeteer
  return {
    url: `/certificates/${certificateId}.pdf`,
    error: null
  };
}

// Share to LinkedIn
export function getLinkedInShareUrl(certificate: Certificate): string {
  const title = encodeURIComponent(`${certificate.courseName} Certificate`);
  const summary = encodeURIComponent(
    `I completed the ${certificate.courseName} course with a grade of ${certificate.grade}!`
  );
  const url = encodeURIComponent(certificate.verificationUrl);

  return `https://www.linkedin.com/shareArticle?mini=true&url=${url}&title=${title}&summary=${summary}`;
}

// Get shareable certificate URL
export function getShareableUrl(certificate: Certificate): string {
  return certificate.verificationUrl;
}

// Export skill badges for certificate
export function getCertificateSkillBadges(certificate: Certificate): string[] {
  return certificate.skills;
}
