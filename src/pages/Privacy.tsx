import { Link } from 'react-router-dom';

export function Privacy() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold text-white mb-8">Privacy Policy</h1>

      <div className="prose prose-invert max-w-none space-y-8">
        <p className="text-gray-400 text-lg">
          Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </p>

        <section>
          <h2>Introduction</h2>
          <p>
            Bitcoinvestments ("we," "our," or "us") is committed to protecting your privacy.
            This Privacy Policy explains how we collect, use, disclose, and safeguard your
            information when you visit our website and use our services.
          </p>
        </section>

        <section>
          <h2>Information We Collect</h2>
          <h3>Personal Information</h3>
          <p>We may collect personal information that you voluntarily provide, including:</p>
          <ul>
            <li>Email address (when you sign up or subscribe to our newsletter)</li>
            <li>Account preferences and settings</li>
            <li>Portfolio data you choose to track</li>
          </ul>

          <h3>Automatically Collected Information</h3>
          <p>When you visit our website, we may automatically collect:</p>
          <ul>
            <li>Browser type and version</li>
            <li>Operating system</li>
            <li>Pages visited and time spent</li>
            <li>Referring website addresses</li>
            <li>IP address (anonymized where possible)</li>
          </ul>
        </section>

        <section>
          <h2>How We Use Your Information</h2>
          <p>We use the information we collect to:</p>
          <ul>
            <li>Provide and maintain our services</li>
            <li>Send you newsletters and updates (with your consent)</li>
            <li>Personalize your experience</li>
            <li>Improve our website and services</li>
            <li>Respond to your inquiries and support requests</li>
            <li>Detect and prevent fraud or abuse</li>
          </ul>
        </section>

        <section>
          <h2>Cookies and Tracking</h2>
          <p>
            We use cookies and similar tracking technologies to enhance your experience.
            You can control cookie preferences through your browser settings. Essential
            cookies are required for the website to function properly.
          </p>
        </section>

        <section>
          <h2>Third-Party Services</h2>
          <p>We may use third-party services that collect information, including:</p>
          <ul>
            <li>Analytics providers (e.g., privacy-focused analytics)</li>
            <li>Payment processors (for premium features)</li>
            <li>Email service providers</li>
            <li>Authentication services (Supabase)</li>
          </ul>
          <p>
            We only work with services that have strong privacy practices and do not
            sell your personal information.
          </p>
        </section>

        <section>
          <h2>Data Security</h2>
          <p>
            We implement appropriate technical and organizational measures to protect
            your personal information. However, no method of transmission over the
            Internet is 100% secure, and we cannot guarantee absolute security.
          </p>
        </section>

        <section>
          <h2>Your Rights</h2>
          <p>Depending on your location, you may have the right to:</p>
          <ul>
            <li>Access the personal information we hold about you</li>
            <li>Request correction of inaccurate information</li>
            <li>Request deletion of your personal information</li>
            <li>Opt out of marketing communications</li>
            <li>Export your data in a portable format</li>
          </ul>
          <p>
            To exercise these rights, please contact us at{' '}
            <a href="mailto:privacy@bitcoinvestments.com">privacy@bitcoinvestments.com</a>.
          </p>
        </section>

        <section>
          <h2>Children's Privacy</h2>
          <p>
            Our services are not intended for individuals under the age of 18. We do
            not knowingly collect personal information from children.
          </p>
        </section>

        <section>
          <h2>Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of
            any changes by posting the new policy on this page and updating the "Last
            updated" date.
          </p>
        </section>

        <section>
          <h2>Contact Us</h2>
          <p>
            If you have questions about this Privacy Policy, please contact us at:{' '}
            <a href="mailto:privacy@bitcoinvestments.com">privacy@bitcoinvestments.com</a>
          </p>
        </section>

        <div className="mt-12 pt-8 border-t border-gray-700">
          <Link to="/" className="text-orange-500 hover:text-orange-400">
            &larr; Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
