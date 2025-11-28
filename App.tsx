import React, { useState } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import ResultDisplay from './components/ResultDisplay';
import { generateScenario } from './services/geminiService';
import { ModelType, GenerationState } from './types';

const App: React.FC = () => {
  const [topic, setTopic] = useState<string>('');
  const [model, setModel] = useState<ModelType>(ModelType.FLASH);
  const [state, setState] = useState<GenerationState>({
    isLoading: false,
    error: null,
    result: null,
  });

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setState({ isLoading: true, error: null, result: null });

    try {
      const result = await generateScenario(topic, model);
      setState({ isLoading: false, error: null, result });
    } catch (err: unknown) {
      let errorMessage = "یک خطای ناشناخته رخ داده است.";
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      setState({ isLoading: false, error: errorMessage, result: null });
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Header />
      
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Main Content Area */}
        <main className="flex-1 p-4 md:p-8 order-2 md:order-1">
          <div className="max-w-4xl mx-auto space-y-8">
            
            {/* Input Section */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-xl font-bold text-slate-800 mb-2">موضوع اپیزود جدید</h2>
              <p className="text-slate-500 mb-6 text-sm">موضوع را وارد کنید تا سناریوی کامل، پرامپت‌های تصویر/ویدیو و جزئیات فنی تولید شود.</p>
              
              <form onSubmit={handleGenerate} className="space-y-4">
                <div>
                  <label htmlFor="topic" className="sr-only">موضوع</label>
                  <input
                    id="topic"
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="مثال: آب‌بازی در حیاط، سفر به پاریس، خرید بستنی..."
                    className="w-full text-lg p-4 rounded-lg border border-slate-300 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none placeholder:text-slate-400"
                    disabled={state.isLoading}
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={state.isLoading || !topic.trim()}
                  className={`w-full py-4 rounded-lg text-white font-bold text-lg shadow-md transition-all flex justify-center items-center gap-2 ${
                    state.isLoading || !topic.trim()
                      ? 'bg-slate-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-primary to-secondary hover:shadow-lg hover:scale-[1.01]'
                  }`}
                >
                  {state.isLoading ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>در حال نوشتن سناریو...</span>
                    </>
                  ) : (
                    <>
                      <span>✨</span>
                      <span>تولید سناریو</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Error Display */}
            {state.error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg flex items-center gap-3">
                <span>⚠️</span>
                <p>{state.error}</p>
              </div>
            )}

            {/* Result Display */}
            {state.result && (
              <ResultDisplay content={state.result} />
            )}
            
          </div>
        </main>

        {/* Sidebar */}
        <div className="order-1 md:order-2">
            <Sidebar selectedModel={model} onModelChange={setModel} />
        </div>
      </div>
    </div>
  );
};

export default App;
