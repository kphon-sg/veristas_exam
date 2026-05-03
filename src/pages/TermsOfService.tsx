import React from 'react';
import { InfoPageLayout } from '../components/layout/InfoPageLayout';
import { FileText, Users, Scale, AlertTriangle, ShieldAlert, Ban, Info } from 'lucide-react';

const TermsOfService: React.FC = () => {
  return (
    <InfoPageLayout 
      title="Terms of Service" 
      subtitle="The rules and guidelines for using the VeritasExam platform."
    >
      <div className="space-y-12">
        <section>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-teal-50 rounded-lg flex items-center justify-center border border-teal-100">
              <Scale className="w-5 h-5 text-veritas-indigo" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 m-0">1. Acceptance of Terms</h2>
          </div>
          <p>
            By accessing or using VeritasExam, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this site.
          </p>
        </section>

        <section>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-teal-50 rounded-lg flex items-center justify-center border border-teal-100">
              <Users className="w-5 h-5 text-veritas-indigo" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 m-0">2. User Responsibilities</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 mb-3">For Students</h3>
              <ul className="text-sm space-y-2 mb-0">
                <li>Maintain a stable internet connection during exams.</li>
                <li>Ensure a well-lit environment and functional webcam.</li>
                <li>Follow all specific instructions provided by the instructor.</li>
                <li>Report technical issues immediately.</li>
              </ul>
            </div>
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 mb-3">For Teachers</h3>
              <ul className="text-sm space-y-2 mb-0">
                <li>Clearly communicate exam rules and deadlines.</li>
                <li>Review monitoring logs fairly and objectively.</li>
                <li>Protect the privacy of student data.</li>
                <li>Provide support for legitimate technical failures.</li>
              </ul>
            </div>
          </div>
        </section>

        <section>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-teal-50 rounded-lg flex items-center justify-center border border-teal-100">
              <ShieldAlert className="w-5 h-5 text-veritas-indigo" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 m-0">3. Academic Integrity</h2>
          </div>
          <p>
            VeritasExam is designed to uphold academic honesty. The following actions are strictly prohibited during a monitored exam:
          </p>
          <ul className="grid md:grid-cols-2 gap-x-8">
            <li>Using unauthorized external materials or devices.</li>
            <li>Communicating with other individuals.</li>
            <li>Leaving the webcam frame without authorization.</li>
            <li>Switching browser tabs or applications.</li>
            <li>Attempting to disable or bypass monitoring software.</li>
            <li>Impersonating another student.</li>
          </ul>
        </section>

        <section>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-teal-50 rounded-lg flex items-center justify-center border border-teal-100">
              <AlertTriangle className="w-5 h-5 text-veritas-indigo" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 m-0">4. Consequences of Violations</h2>
          </div>
          <p>
            Detected violations are logged and reported to the instructor. Consequences may include:
          </p>
          <ul>
            <li>Automatic flagging of the exam submission for manual review.</li>
            <li>Immediate termination of the active exam session.</li>
            <li>Zero grade for the specific assessment.</li>
            <li>Institutional disciplinary action as per your school's code of conduct.</li>
          </ul>
        </section>

        <section>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-teal-50 rounded-lg flex items-center justify-center border border-teal-100">
              <Ban className="w-5 h-5 text-veritas-indigo" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 m-0">5. Account Termination</h2>
          </div>
          <p>
            We reserve the right to suspend or terminate access to VeritasExam for users who repeatedly violate these terms or engage in fraudulent activity. Institutional administrators also have the authority to manage account access.
          </p>
        </section>

        <section className="bg-slate-50 p-8 rounded-2xl border border-slate-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-slate-200">
              <Info className="w-5 h-5 text-veritas-indigo" />
            </div>
            <h2 className="text-xl font-black text-slate-900 m-0">Disclaimer</h2>
          </div>
          <p className="text-sm text-slate-600 mb-0 italic">
            VeritasExam is provided "as is". While we strive for 100% accuracy in our AI monitoring, the system may occasionally produce false positives. All flags are subject to final human review by the course instructor.
          </p>
        </section>
      </div>
    </InfoPageLayout>
  );
};

export default TermsOfService;
