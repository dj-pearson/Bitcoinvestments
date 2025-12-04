import { Link, useLocation } from 'react-router-dom';

export function Terms() {
  const location = useLocation();
  const isDisclaimer = location.pathname === '/disclaimer';

  if (isDisclaimer) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-white mb-8">Disclaimer</h1>

        <div className="prose prose-invert max-w-none space-y-8">
          <p className="text-gray-400 text-lg">
            Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>

          <section>
            <h2>Not Financial Advice</h2>
            <p>
              The information provided on Bitcoinvestments is for general educational and
              informational purposes only. It should not be considered as financial advice,
              investment advice, trading advice, or any other type of advice.
            </p>
            <p>
              <strong>We are not financial advisors.</strong> The content on this website does
              not constitute a recommendation or solicitation to buy, sell, or hold any
              cryptocurrency or other investment.
            </p>
          </section>

          <section>
            <h2>Investment Risks</h2>
            <p>
              Cryptocurrency investments are highly volatile and risky. You should be aware
              that:
            </p>
            <ul>
              <li>Cryptocurrency prices can fluctuate significantly in short periods</li>
              <li>You could lose some or all of your investment</li>
              <li>Past performance is not indicative of future results</li>
              <li>Cryptocurrency markets operate 24/7 and are largely unregulated</li>
              <li>Tax implications vary by jurisdiction and can be complex</li>
            </ul>
          </section>

          <section>
            <h2>Do Your Own Research</h2>
            <p>
              Before making any investment decisions, you should:
            </p>
            <ul>
              <li>Conduct your own research and due diligence</li>
              <li>Consider your financial situation and risk tolerance</li>
              <li>Consult with qualified financial, legal, and tax professionals</li>
              <li>Never invest more than you can afford to lose</li>
              <li>Understand the specific risks of each cryptocurrency</li>
            </ul>
          </section>

          <section>
            <h2>Third-Party Information</h2>
            <p>
              Our website may contain links to third-party websites, price data from external
              APIs, and information from other sources. We do not:
            </p>
            <ul>
              <li>Guarantee the accuracy of third-party information</li>
              <li>Endorse any third-party products or services</li>
              <li>Accept responsibility for third-party content</li>
              <li>Guarantee real-time accuracy of price data</li>
            </ul>
          </section>

          <section>
            <h2>Affiliate Disclosure</h2>
            <p>
              Some links on our website may be affiliate links. This means we may earn a
              commission if you sign up or make a purchase through these links, at no
              additional cost to you. This helps support our free educational content.
            </p>
            <p>
              Our recommendations are based on our genuine assessment of the products and
              services. We only recommend platforms we believe provide value to our readers.
            </p>
          </section>

          <section>
            <h2>No Guarantees</h2>
            <p>
              We make no representations or warranties about:
            </p>
            <ul>
              <li>The completeness or accuracy of any information</li>
              <li>The suitability of any information for your purposes</li>
              <li>The results you may achieve from using our tools or following our guides</li>
              <li>The availability or uptime of our website</li>
            </ul>
          </section>

          <section>
            <h2>Limitation of Liability</h2>
            <p>
              To the fullest extent permitted by law, Bitcoinvestments and its owners,
              operators, and contributors shall not be liable for any direct, indirect,
              incidental, consequential, or punitive damages arising from your use of this
              website or reliance on any information provided.
            </p>
          </section>

          <section>
            <h2>Contact</h2>
            <p>
              If you have questions about this disclaimer, please contact us at{' '}
              <a href="mailto:legal@bitcoinvestments.com">legal@bitcoinvestments.com</a>.
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

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold text-white mb-8">Terms of Service</h1>

      <div className="prose prose-invert max-w-none space-y-8">
        <p className="text-gray-400 text-lg">
          Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </p>

        <section>
          <h2>Agreement to Terms</h2>
          <p>
            By accessing or using Bitcoinvestments ("the Website"), you agree to be bound by
            these Terms of Service and all applicable laws and regulations. If you do not
            agree with any of these terms, you are prohibited from using this site.
          </p>
        </section>

        <section>
          <h2>Use License</h2>
          <p>
            Permission is granted to temporarily access the materials on Bitcoinvestments
            for personal, non-commercial use only. This is the grant of a license, not a
            transfer of title, and under this license you may not:
          </p>
          <ul>
            <li>Modify or copy the materials</li>
            <li>Use the materials for any commercial purpose</li>
            <li>Attempt to decompile or reverse engineer any software</li>
            <li>Remove any copyright or proprietary notations</li>
            <li>Transfer the materials to another person or mirror on any other server</li>
          </ul>
        </section>

        <section>
          <h2>Account Registration</h2>
          <p>
            To access certain features, you may need to create an account. You agree to:
          </p>
          <ul>
            <li>Provide accurate and complete registration information</li>
            <li>Maintain the security of your account credentials</li>
            <li>Accept responsibility for all activities under your account</li>
            <li>Notify us immediately of any unauthorized use</li>
          </ul>
          <p>
            We reserve the right to suspend or terminate accounts that violate these terms.
          </p>
        </section>

        <section>
          <h2>Educational Content</h2>
          <p>
            The educational content, guides, and tools provided on this website are for
            informational purposes only. They do not constitute financial advice. Please
            read our <Link to="/disclaimer" className="text-orange-500 hover:text-orange-400">Disclaimer</Link> for
            more information.
          </p>
        </section>

        <section>
          <h2>User Conduct</h2>
          <p>When using our website, you agree not to:</p>
          <ul>
            <li>Violate any applicable laws or regulations</li>
            <li>Infringe on intellectual property rights</li>
            <li>Transmit harmful code or malware</li>
            <li>Attempt to gain unauthorized access to our systems</li>
            <li>Interfere with other users' enjoyment of the website</li>
            <li>Use automated systems to scrape or collect data</li>
            <li>Engage in any activity that could damage our reputation</li>
          </ul>
        </section>

        <section>
          <h2>Third-Party Links</h2>
          <p>
            Our website contains links to third-party websites, including cryptocurrency
            exchanges and wallet providers. These links are provided for convenience and
            do not signify endorsement. We are not responsible for the content, privacy
            policies, or practices of third-party sites.
          </p>
        </section>

        <section>
          <h2>Intellectual Property</h2>
          <p>
            All content on this website, including text, graphics, logos, and software,
            is the property of Bitcoinvestments or its content suppliers and is protected
            by copyright and intellectual property laws.
          </p>
        </section>

        <section>
          <h2>Limitation of Liability</h2>
          <p>
            Bitcoinvestments shall not be liable for any damages arising from the use or
            inability to use the materials on this website, even if we have been notified
            of the possibility of such damages. This includes but is not limited to:
          </p>
          <ul>
            <li>Investment losses</li>
            <li>Data loss or corruption</li>
            <li>Business interruption</li>
            <li>Personal injury or property damage</li>
          </ul>
        </section>

        <section>
          <h2>Indemnification</h2>
          <p>
            You agree to indemnify and hold harmless Bitcoinvestments and its affiliates
            from any claims, damages, or expenses arising from your use of the website
            or violation of these terms.
          </p>
        </section>

        <section>
          <h2>Modifications</h2>
          <p>
            We may revise these Terms of Service at any time without notice. By continuing
            to use the website after changes are posted, you agree to be bound by the
            revised terms.
          </p>
        </section>

        <section>
          <h2>Governing Law</h2>
          <p>
            These terms shall be governed by and construed in accordance with applicable
            laws, without regard to conflict of law principles.
          </p>
        </section>

        <section>
          <h2>Contact Information</h2>
          <p>
            For questions about these Terms of Service, please contact us at{' '}
            <a href="mailto:legal@bitcoinvestments.com">legal@bitcoinvestments.com</a>.
          </p>
        </section>

        <div className="mt-12 pt-8 border-t border-gray-700 flex gap-4">
          <Link to="/" className="text-orange-500 hover:text-orange-400">
            &larr; Back to Home
          </Link>
          <span className="text-gray-600">|</span>
          <Link to="/privacy" className="text-orange-500 hover:text-orange-400">
            Privacy Policy
          </Link>
          <span className="text-gray-600">|</span>
          <Link to="/disclaimer" className="text-orange-500 hover:text-orange-400">
            Disclaimer
          </Link>
        </div>
      </div>
    </div>
  );
}
