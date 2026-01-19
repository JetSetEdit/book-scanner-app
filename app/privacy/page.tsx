import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export const metadata = {
  title: 'Privacy Policy | Subtext',
  description: 'Privacy Policy for Subtext - Book Content Warnings',
}

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        {/* Header */}
        <div className="mb-12">
          <Link href="/">
            <Button variant="ghost" className="mb-6 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
          <h1 className="font-serif text-4xl md:text-5xl font-medium tracking-tight text-foreground mb-4">
            Privacy Policy
          </h1>
          <p className="text-sm text-muted-foreground italic">
            Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-sm max-w-none space-y-8 text-muted-foreground leading-relaxed">
          <section>
            <h2 className="font-serif text-2xl text-foreground mb-4">1. Introduction</h2>
            <p>
              Subtext ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains 
              how we collect, use, disclose, and safeguard your information when you use our book analysis application 
              ("the Service").
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl text-foreground mb-4">2. Information We Collect</h2>
            
            <h3 className="font-serif text-xl text-foreground mt-6 mb-3">2.1 Information You Provide</h3>
            <p>We may collect information that you voluntarily provide when using the Service, including:</p>
            <ul className="list-disc pl-6 mt-4 space-y-2">
              <li>ISBNs or barcodes you scan or enter</li>
              <li>Community feedback on content warnings (coming soon)</li>
              <li>Reports or corrections about book information (coming soon)</li>
            </ul>

            <h3 className="font-serif text-xl text-foreground mt-6 mb-3">2.2 Automatically Collected Information</h3>
            <p>When you use the Service, we may automatically collect certain information, including:</p>
            <ul className="list-disc pl-6 mt-4 space-y-2">
              <li>Device information (browser type, operating system, device identifiers)</li>
              <li>Usage data (pages visited, features used, time spent)</li>
              <li>IP address and general location information (used for rate limiting and security)</li>
              <li>Cookies and similar tracking technologies</li>
            </ul>
            <p className="mt-4">
              <strong className="text-foreground">Rate Limiting:</strong> We collect and temporarily store IP addresses 
              to enforce rate limits (5 scans per IP per day). IP addresses are stored in memory and reset daily. 
              This helps ensure fair usage and manage API costs.
            </p>

            <h3 className="font-serif text-xl text-foreground mt-6 mb-3">2.3 Local Storage</h3>
            <p>
              The Service uses browser local storage to remember your preferences, such as recently scanned books and 
              user settings. This information is stored locally on your device and is not transmitted to our servers 
              unless you explicitly choose to sync data.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl text-foreground mb-4">3. How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            <ul className="list-disc pl-6 mt-4 space-y-2">
              <li>Provide, maintain, and improve the Service</li>
              <li>Process your book scan requests and generate content warnings</li>
              <li>Remember your preferences and provide a personalized experience</li>
              <li>Analyze usage patterns to improve the Service</li>
              <li>Respond to your feedback and support requests</li>
              <li>Detect, prevent, and address technical issues</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-2xl text-foreground mb-4">4. How We Share Your Information</h2>
            <p>We do not sell your personal information. We may share your information only in the following circumstances:</p>
            
            <h3 className="font-serif text-xl text-foreground mt-6 mb-3">4.1 Service Providers</h3>
            <p>
              We may share information with third-party service providers who perform services on our behalf, such as 
              hosting, analytics, and API providers (e.g., Google Books API, Open Library). These providers are 
              contractually obligated to protect your information and use it only for the purposes we specify.
            </p>

            <h3 className="font-serif text-xl text-foreground mt-6 mb-3">4.2 Legal Requirements</h3>
            <p>
              We may disclose your information if required by law or in response to valid legal requests, such as 
              court orders or subpoenas.
            </p>

            <h3 className="font-serif text-xl text-foreground mt-6 mb-3">4.3 Aggregated Data</h3>
            <p>
              We may share aggregated, anonymized data that does not identify individual users for research, analytics, 
              or improvement purposes.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl text-foreground mb-4">5. Data Storage and Security</h2>
            <p>
              We implement appropriate technical and organizational measures to protect your information. However, no 
              method of transmission over the internet or electronic storage is 100% secure. While we strive to protect 
              your information, we cannot guarantee absolute security.
            </p>
            <p className="mt-4">
              Your data is stored on secure servers and is encrypted in transit. We retain your information only for as 
              long as necessary to provide the Service and comply with legal obligations.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl text-foreground mb-4">6. Third-Party Services</h2>
            <p>
              The Service integrates with third-party services, including:
            </p>
            <ul className="list-disc pl-6 mt-4 space-y-2">
              <li><strong className="text-foreground">Google Books API:</strong> Used to fetch book metadata and descriptions. 
                Your use is subject to <a href="https://developers.google.com/books/terms" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google's Terms of Service</a>.</li>
              <li><strong className="text-foreground">Open Library:</strong> Used as an alternative source for book information.</li>
              <li><strong className="text-foreground">Google Custom Search API:</strong> Used to enrich book descriptions when 
                publicly available descriptions are limited. Subject to <a href="https://developers.google.com/custom-search/terms" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google's Terms of Service</a>.</li>
              <li><strong className="text-foreground">OpenAI API:</strong> Used for LLM processing to generate content warnings.</li>
              <li><strong className="text-foreground">Google Gemini API:</strong> Used for secondary verification of content analysis.</li>
              <li><strong className="text-foreground">Analytics Services:</strong> We may use analytics services (e.g., Vercel Analytics) to understand 
                how the Service is used. These services may collect and process your information according to their own privacy policies.</li>
            </ul>
            <p className="mt-4">
              We are not responsible for the privacy practices of third-party services. We encourage you to review their 
              privacy policies.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl text-foreground mb-4">7. Cookies and Tracking Technologies</h2>
            <p>
              The Service uses cookies and similar tracking technologies to enhance your experience. Cookies are small 
              text files stored on your device that help us remember your preferences and analyze usage patterns.
            </p>
            <p className="mt-4">
              You can control cookies through your browser settings. However, disabling cookies may limit your ability 
              to use certain features of the Service.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl text-foreground mb-4">8. Your Rights and Choices</h2>
            <p>Depending on your location, you may have certain rights regarding your personal information, including:</p>
            <ul className="list-disc pl-6 mt-4 space-y-2">
              <li><strong className="text-foreground">Access:</strong> Request access to your personal information</li>
              <li><strong className="text-foreground">Correction:</strong> Request correction of inaccurate information</li>
              <li><strong className="text-foreground">Deletion:</strong> Request deletion of your personal information</li>
              <li><strong className="text-foreground">Opt-out:</strong> Opt out of certain data collection or processing</li>
              <li><strong className="text-foreground">Data Portability:</strong> Request a copy of your data in a portable format</li>
            </ul>
            <p className="mt-4">
              To exercise these rights, please contact us through the Service or visit our 
              <Link href="/transparency" className="text-primary hover:underline"> transparency page</Link>.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl text-foreground mb-4">9. Children's Privacy</h2>
            <p>
              The Service is not intended for children under the age of 13. We do not knowingly collect personal 
              information from children under 13. If you believe we have collected information from a child under 13, 
              please contact us immediately.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl text-foreground mb-4">10. International Data Transfers</h2>
            <p>
              Your information may be transferred to and processed in countries other than your country of residence. 
              These countries may have different data protection laws. By using the Service, you consent to the transfer 
              of your information to these countries.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl text-foreground mb-4">11. Changes to This Privacy Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any material changes by 
              posting the new Privacy Policy on this page and updating the "Last updated" date. Your continued use of 
              the Service after such changes constitutes acceptance of the new Privacy Policy.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl text-foreground mb-4">12. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy or our privacy practices, please contact us through 
              the Service or visit our <Link href="/transparency" className="text-primary hover:underline">transparency page</Link>.
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-border">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/">
              <Button variant="outline" className="w-full sm:w-auto">
                Back to Home
              </Button>
            </Link>
            <Link href="/terms">
              <Button variant="outline" className="w-full sm:w-auto">
                Terms of Service
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}

