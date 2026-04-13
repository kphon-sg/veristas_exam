import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PreExamSetup } from '../components/monitoring/PreExamSetup';
import { AlertCircle, Loader2 } from 'lucide-react';

interface ExamSetupPageProps {
  token: string | null;
  onJoin: (quiz: any, stream: MediaStream) => void;
}

export const ExamSetupPage: React.FC<ExamSetupPageProps> = ({ token, onJoin }) => {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModelsLoaded, setIsModelsLoaded] = useState(false);
  const [modelLoadProgress, setModelLoadProgress] = useState(0);

  // Background Model Pre-loading
  useEffect(() => {
    if (quiz && !isModelsLoaded) {
      console.log("[ExamSetupPage] Starting background model pre-loading...");
      // The useFaceDetection hook in PreExamSetup will handle the actual loading
      // when we pass isModelsLoaded={true}. Here we just signal that it's okay to start.
      setIsModelsLoaded(true);
    }
  }, [quiz, isModelsLoaded]);

  useEffect(() => {
    const fetchQuiz = async () => {
      if (!quizId || !token) return;
      
      try {
        setLoading(true);
        const res = await fetch(`/api/quizzes/${quizId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (res.ok) {
          const data = await res.json();
          setQuiz(data);
        } else {
          const errData = await res.json();
          setError(errData.error || 'Failed to fetch quiz details');
        }
      } catch (err) {
        console.error("Error fetching quiz:", err);
        setError('Network error. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [quizId, token]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-slate-900 flex flex-col items-center justify-center text-white">
        <Loader2 className="w-12 h-12 animate-spin text-veritas-indigo mb-4" />
        <p className="text-sm font-bold uppercase tracking-widest opacity-50">Loading Exam Details...</p>
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div className="fixed inset-0 bg-slate-900 flex flex-col items-center justify-center text-white p-6 text-center">
        <div className="w-20 h-20 bg-rose-500/20 rounded-full flex items-center justify-center mb-6 border border-rose-500/50">
          <AlertCircle className="w-10 h-10 text-rose-500" />
        </div>
        <h2 className="text-2xl font-black mb-2 uppercase tracking-tight">Error Loading Exam</h2>
        <p className="text-slate-400 mb-8 max-w-md">{error || 'Quiz not found or inaccessible.'}</p>
        <button 
          onClick={() => navigate('/')}
          className="px-8 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <PreExamSetup 
      quizTitle={quiz.title}
      isModelsLoaded={isModelsLoaded}
      modelLoadProgress={modelLoadProgress}
      onLoadProgress={setModelLoadProgress}
      onJoin={(stream) => onJoin(quiz, stream)}
      onLeave={() => navigate('/')}
    />
  );
};
