import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { ArrowRight, Check } from 'lucide-react';

const Onboarding: React.FC = () => {
  const { setUserName } = useApp();
  const [inputName, setInputName] = useState('');
  const [greeting, setGreeting] = useState('Good Morning');

  useEffect(() => {
    const hours = new Date().getHours();
    if (hours < 12) setGreeting('Good Morning');
    else if (hours < 18) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputName.trim()) {
      setUserName(inputName.trim());
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-white dark:bg-slate-950 transition-colors duration-500">
      
      {/* Dynamic Background Gradients */}
      <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
        
        {/* Light Mode Blobs */}
        <div className="absolute inset-0 dark:opacity-0 transition-opacity duration-1000">
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-400/20 rounded-full blur-[100px] animate-blob"></div>
            <div className="absolute top-[20%] right-[-10%] w-[40%] h-[40%] bg-purple-400/20 rounded-full blur-[100px] animate-blob" style={{ animationDelay: '2s' }}></div>
            <div className="absolute bottom-[-10%] left-[20%] w-[60%] h-[60%] bg-teal-300/20 rounded-full blur-[100px] animate-blob" style={{ animationDelay: '4s' }}></div>
        </div>

        {/* Dark Mode Gentle Gradient Blobs */}
        <div className="absolute inset-0 opacity-0 dark:opacity-100 transition-opacity duration-1000">
            {/* Using longer animation durations (15s-25s) creates the 'gentle pace' requested */}
            <div 
                className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-indigo-800/20 rounded-full blur-[120px] animate-blob" 
                style={{ animationDuration: '20s' }}
            ></div>
            <div 
                className="absolute bottom-[-20%] right-[-10%] w-[70%] h-[70%] bg-purple-900/20 rounded-full blur-[120px] animate-blob" 
                style={{ animationDuration: '25s', animationDelay: '5s' }}
            ></div>
            <div 
                className="absolute top-[30%] left-[20%] w-[60%] h-[60%] bg-blue-900/10 rounded-full blur-[120px] animate-blob" 
                style={{ animationDuration: '22s', animationDelay: '10s' }}
            ></div>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="relative z-10 w-full max-w-lg px-6">
        <div className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border border-white/20 dark:border-slate-800 shadow-2xl rounded-3xl p-8 md:p-12 overflow-hidden">
          
          {/* Decor element */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-teal-400"></div>

          <div className="flex flex-col items-center text-center space-y-6">
            
            {/* Icon/Logo area */}
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg transform rotate-3 mb-2">
                <Check className="text-white w-8 h-8" strokeWidth={3} />
            </div>

            <div className="space-y-2 animate-fade-in-up">
                <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 tracking-tight">
                    JeetDo
                </h1>
                <p className="text-lg text-gray-500 dark:text-gray-400 font-medium">
                    {greeting}. Ready to focus?
                </p>
            </div>

            <form onSubmit={handleSubmit} className="w-full space-y-6 pt-4 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                <div className="relative group">
                    <input 
                        type="text" 
                        value={inputName}
                        onChange={(e) => setInputName(e.target.value)}
                        className="w-full bg-gray-50 dark:bg-slate-800/50 border-2 border-transparent focus:border-blue-500/50 focus:bg-white dark:focus:bg-slate-800 text-gray-900 dark:text-white text-xl placeholder-gray-400 px-6 py-4 rounded-2xl outline-none transition-all text-center shadow-inner group-hover:bg-white dark:group-hover:bg-slate-800"
                        placeholder="What's your name?"
                        autoFocus
                    />
                </div>

                <button 
                    type="submit"
                    disabled={!inputName.trim()}
                    className="w-full group relative overflow-hidden bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold py-4 rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-xl"
                >
                    <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer" />
                    <span className="flex items-center justify-center gap-2">
                        Get Started <ArrowRight size={20} />
                    </span>
                </button>
            </form>

            <p className="text-xs text-gray-400 dark:text-gray-500 mt-8">
                Press <kbd className="font-sans px-1.5 py-0.5 bg-gray-100 dark:bg-slate-800 rounded border border-gray-200 dark:border-slate-700 text-gray-500 dark:text-gray-400">Enter</kbd> to continue
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;