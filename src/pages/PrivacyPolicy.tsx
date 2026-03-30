import React from 'react';
import { InfoPageLayout } from '../components/layout/InfoPageLayout';
import { Shield, Eye, Lock, Database, UserCheck, Clock, Mail } from 'lucide-react';

const PrivacyPolicy: React.FC = () => {
  return (
    <InfoPageLayout 
      title="Privacy Policy" 
      subtitle="How we collect, use, and protect your personal data at VeritasExam."
    >
      <div className="space-y-12">
        <section>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-teal-50 rounded-lg flex items-center justify-center border border-teal-100">
              <Eye className="w-5 h-5 text-veritas-indigo" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 m-0">1. Information We Collect</h2>
          </div>
          <p>
            VeritasExam collects information necessary to provide a secure and fair examination environment. This includes:
          </p>
          <ul>
            <li><strong>Personal Identity:</strong> Full name, institutional email address, and student/teacher identification numbers.</li>
            <li><strong>Authentication Data:</strong> Login credentials and session tokens.</li>
            <li><strong>Exam Monitoring Data:</strong> Real-time webcam feed (processed locally via Edge AI), browser focus status, tab switching events, and window resizing logs.</li>
            <li><strong>Technical Metadata:</strong> IP address, browser type, operating system, and device identifiers.</li>
            <li><strong>Academic Content:</strong> Quiz responses, submission timestamps, and grading data.</li>
          </ul>
        </section>

        <section>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-teal-50 rounded-lg flex items-center justify-center border border-teal-100">
              <Database className="w-5 h-5 text-veritas-indigo" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 m-0">2. How We Use Your Data</h2>
          </div>
          <p>
            Your data is used strictly for academic and security purposes:
          </p>
          <ul>
            <li>To verify your identity before and during examinations.</li>
            <li>To monitor for prohibited behaviors (e.g., looking away from the screen, multiple people in frame).</li>
            <li>To provide teachers with integrity reports and activity logs for each submission.</li>
            <li>To improve our AI detection models through anonymized behavioral patterns.</li>
            <li>To provide technical support and troubleshoot system issues.</li>
          </ul>
        </section>

        <section>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-teal-50 rounded-lg flex items-center justify-center border border-teal-100">
              <Shield className="w-5 h-5 text-veritas-indigo" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 m-0">3. Data Protection & Security</h2>
          </div>
          <p>
            We implement industry-standard security measures to safeguard your information:
          </p>
          <ul>
            <li><strong>Edge AI Processing:</strong> Most webcam analysis happens locally on your device. We do not stream continuous video to our servers; only snapshots of detected violations are uploaded.</li>
            <li><strong>Encryption:</strong> All data transmitted between your browser and our servers is encrypted using TLS 1.3. Data at rest is encrypted using AES-256.</li>
            <li><strong>Access Control:</strong> Only authorized personnel and your specific course instructors have access to your exam logs.</li>
          </ul>
        </section>

        <section>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-teal-50 rounded-lg flex items-center justify-center border border-teal-100">
              <UserCheck className="w-5 h-5 text-veritas-indigo" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 m-0">4. Your Privacy Rights</h2>
          </div>
          <p>
            Depending on your jurisdiction (e.g., GDPR, CCPA), you have the right to:
          </p>
          <ul>
            <li>Access the personal data we hold about you.</li>
            <li>Request correction of inaccurate data.</li>
            <li>Request deletion of your data (subject to institutional academic record retention policies).</li>
            <li>Withdraw consent for webcam monitoring (note: this may prevent you from taking exams on this platform).</li>
          </ul>
        </section>

        <section>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-teal-50 rounded-lg flex items-center justify-center border border-teal-100">
              <Clock className="w-5 h-5 text-veritas-indigo" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 m-0">5. Data Retention</h2>
          </div>
          <p>
            We retain exam monitoring data (including violation snapshots) for the duration of the academic term plus 6 months, unless a longer period is required for academic integrity investigations or by institutional policy. Basic account information is retained as long as your account is active.
          </p>
        </section>

        <section className="bg-slate-50 p-8 rounded-2xl border border-slate-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-slate-200">
              <Mail className="w-5 h-5 text-veritas-indigo" />
            </div>
            <h2 className="text-xl font-black text-slate-900 m-0">Contact Us</h2>
          </div>
          <p className="text-sm text-slate-600 mb-0">
            If you have any questions about this Privacy Policy or how your data is handled, please contact our Data Protection Officer at:
            <br />
            <span className="font-bold text-veritas-indigo">privacy@veritasexam.com</span>
          </p>
        </section>
      </div>
    </InfoPageLayout>
  );
};

export default PrivacyPolicy;
