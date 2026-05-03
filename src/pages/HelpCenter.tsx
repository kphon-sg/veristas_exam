import React from 'react';
import { InfoPageLayout } from '../components/layout/InfoPageLayout';
import { 
  HelpCircle, 
  LogIn, 
  PlayCircle, 
  Camera, 
  Monitor, 
  MessageSquare,
  ChevronDown,
  Cpu,
  Globe
} from 'lucide-react';

const HelpCenter: React.FC = () => {
  const faqs = [
    {
      question: "How do I log in to my account?",
      answer: "Select your role (Student or Teacher) on the login page, enter your institutional email and password, and click 'Login to Portal'. If you've forgotten your password, use the 'Forgot?' link to reset it.",
      icon: <LogIn className="w-5 h-5" />
    },
    {
      question: "What are the system requirements?",
      answer: "VeritasExam requires a modern web browser (Chrome, Firefox, or Edge recommended), a functional webcam, and a stable internet connection (minimum 2Mbps upload/download).",
      icon: <Monitor className="w-5 h-5" />
    },
    {
      question: "My camera isn't working. What should I do?",
      answer: "Ensure no other applications are using your camera. Check your browser permissions to allow VeritasExam access to the camera. If the issue persists, try refreshing the page or restarting your browser.",
      icon: <Camera className="w-5 h-5" />
    },
    {
      question: "How do I start an exam?",
      answer: "Once logged in, navigate to your course, select the active quiz, and click 'Start Exam'. You will be prompted to perform a quick identity check and camera calibration before the timer begins.",
      icon: <PlayCircle className="w-5 h-5" />
    }
  ];

  return (
    <InfoPageLayout 
      title="Help Center" 
      subtitle="Find answers to common questions and technical support for VeritasExam."
    >
      <div className="space-y-16">
        {/* FAQ Section */}
        <section>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-teal-50 rounded-lg flex items-center justify-center border border-teal-100">
              <HelpCircle className="w-5 h-5 text-veritas-indigo" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 m-0">Frequently Asked Questions</h2>
          </div>
          
          <div className="grid gap-4">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-slate-50 rounded-2xl border border-slate-200 p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-slate-200 shrink-0">
                    {faq.icon}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">{faq.question}</h3>
                    <p className="text-sm text-slate-600 leading-relaxed mb-0">{faq.answer}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Technical Requirements */}
        <section>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-teal-50 rounded-lg flex items-center justify-center border border-teal-100">
              <Cpu className="w-5 h-5 text-veritas-indigo" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 m-0">Technical Requirements</h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-6 bg-white border border-slate-200 rounded-2xl text-center">
              <Globe className="w-8 h-8 text-veritas-indigo mx-auto mb-4" />
              <h4 className="text-xs font-black uppercase tracking-widest text-slate-900 mb-2">Browser</h4>
              <p className="text-xs text-slate-500 mb-0">Chrome 90+, Firefox 88+, or Edge 90+</p>
            </div>
            <div className="p-6 bg-white border border-slate-200 rounded-2xl text-center">
              <Camera className="w-8 h-8 text-veritas-indigo mx-auto mb-4" />
              <h4 className="text-xs font-black uppercase tracking-widest text-slate-900 mb-2">Hardware</h4>
              <p className="text-xs text-slate-500 mb-0">720p Webcam & 4GB RAM minimum</p>
            </div>
            <div className="p-6 bg-white border border-slate-200 rounded-2xl text-center">
              <PlayCircle className="w-8 h-8 text-veritas-indigo mx-auto mb-4" />
              <h4 className="text-xs font-black uppercase tracking-widest text-slate-900 mb-2">Network</h4>
              <p className="text-xs text-slate-500 mb-0">Stable broadband connection (2Mbps+)</p>
            </div>
          </div>
        </section>

        {/* Contact Support */}
        <section className="bg-gradient-to-br from-veritas-deep to-veritas-indigo p-10 rounded-3xl text-white text-center relative overflow-hidden">
          <div className="absolute inset-0 dot-pattern opacity-10" />
          <div className="relative z-10">
            <MessageSquare className="w-12 h-12 mx-auto mb-6 text-teal-300" />
            <h2 className="text-3xl font-black mb-4">Still need help?</h2>
            <p className="text-teal-100/70 mb-8 max-w-lg mx-auto">
              Our technical support team is available 24/7 to assist you with any issues during your examination.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a href="mailto:support@veritasexam.com" className="px-8 py-3 bg-white text-veritas-indigo rounded-xl font-black uppercase tracking-widest text-xs hover:bg-teal-50 transition-all">
                Email Support
              </a>
              <button className="px-8 py-3 bg-white/10 border border-white/20 text-white rounded-xl font-black uppercase tracking-widest text-xs hover:bg-white/20 transition-all">
                Live Chat
              </button>
            </div>
          </div>
        </section>
      </div>
    </InfoPageLayout>
  );
};

export default HelpCenter;
