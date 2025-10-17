import React, { useState, useCallback, ChangeEvent, useRef, useEffect } from 'react';
import { View } from './types';
import { generateIceBreakers, generateChatReply } from './services/geminiService';
import { LogoIcon, AnalyzeIcon, IceBreakerIcon, MoreOptionsIcon, BackArrowIcon, CopyIcon, MagicIcon, UploadIcon } from './components/icons';
import TargetCursor from './TargetCursor';

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = (error) => reject(error);
  });
};

// --- Custom Hooks ---

const useProximityGlow = <T extends HTMLElement>() => {
    const ref = useRef<T>(null);

    useEffect(() => {
        const element = ref.current;
        if (!element) return;

        const handleMouseMove = (e: MouseEvent) => {
            const rect = element.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            element.style.setProperty('--mouse-x', `${x}px`);
            element.style.setProperty('--mouse-y', `${y}px`);
        };

        element.addEventListener('mousemove', handleMouseMove);

        return () => {
            element.removeEventListener('mousemove', handleMouseMove);
        };
    }, []);

    return ref;
};

const AnimatedStat = ({ value }: { value: number }) => {
    const countRef = useRef<HTMLSpanElement>(null);
    const animationFrameIdRef = useRef<number | null>(null);

    useEffect(() => {
        const element = countRef.current;
        if (!element) return;

        const start = 0;
        const end = value;
        if (start === end) {
            element.textContent = end.toString();
            return;
        }
        
        const duration = 1000;
        const startTime = Date.now();

        const animate = () => {
            const now = Date.now();
            const progress = Math.min((now - startTime) / duration, 1);
            const nextValue = Math.floor(progress * end);
            
            if (countRef.current) {
                countRef.current.textContent = nextValue.toString();
            }

            if (progress < 1) {
                animationFrameIdRef.current = requestAnimationFrame(animate);
            }
        };
        
        animationFrameIdRef.current = requestAnimationFrame(animate);

        return () => {
            if (animationFrameIdRef.current) {
                cancelAnimationFrame(animationFrameIdRef.current);
            }
        };
    }, [value]);

    return <span ref={countRef}>0</span>;
};


// --- UI Components ---

const LoginView: React.FC<{ onLogin: () => void }> = React.memo(({ onLogin }) => (
  <div className="flex flex-col items-center justify-center h-full text-white p-8 text-center animate-fadeInUp">
    <div className="glass-card p-8 md:p-12 rounded-3xl shadow-2xl text-center">
      <LogoIcon className="w-24 h-24 text-red-400 mx-auto" />
      <h1 className="text-4xl md:text-5xl font-extrabold mt-6">Flechazo AI</h1>
      <p className="text-lg text-gray-300 mt-4 max-w-sm">
        Deja que la IA encienda la chispa. Genera respuestas y frases que de verdad funcionan.
      </p>
      <button
        onClick={onLogin}
        className="mt-12 w-full max-w-xs bg-indigo-600/80 hover:bg-indigo-500/80 text-white font-bold py-4 px-8 rounded-full shadow-lg transition-transform duration-300 transform hover:scale-105 active:scale-100 border border-indigo-400 cursor-target"
      >
        Empezar
      </button>
    </div>
  </div>
));

const Header: React.FC<{ onBack: () => void, title: string }> = React.memo(({ onBack, title }) => (
    <header className="absolute top-0 left-0 w-full p-4 flex items-center z-20">
        <button onClick={onBack} className="p-2 rounded-full text-gray-200 glass-card hover:bg-white/20 transition-all active:scale-95 cursor-target">
            <BackArrowIcon className="w-6 h-6" />
        </button>
        <h2 className="text-xl font-bold ml-4 text-shadow-lg">{title}</h2>
    </header>
));

const Dashboard: React.FC<{ onNavigate: (view: View) => void; stats: { analyzed: number; generated: number }; }> = React.memo(({ onNavigate, stats }) => {
  const iceBreakerRef = useProximityGlow<HTMLButtonElement>();
  const analyzerRef = useProximityGlow<HTMLButtonElement>();
  const moreOptionsRef = useProximityGlow<HTMLButtonElement>();

  return (
    <div className="flex flex-col h-full p-6 text-white overflow-y-auto animate-fadeInUp">
      <header className="text-center pt-8">
        <div className="flex items-center justify-center space-x-3">
          <LogoIcon className="w-12 h-12 text-red-400" />
          <h1 className="text-3xl font-extrabold">Flechazo AI</h1>
        </div>
        <p className="mt-4 text-gray-300 max-w-md mx-auto">
          "El 68% de las personas deja de contestar después de un "hola"." No seas uno de ellos.
        </p>
      </header>

      <div className="my-10 grid grid-cols-2 gap-6 text-center">
        <div className="glass-card p-6 rounded-2xl">
          <p className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-400 to-orange-400"><AnimatedStat value={stats.generated} /></p>
          <p className="text-sm text-gray-300 mt-2">Ice Breakers<br />Generados</p>
        </div>
        <div className="glass-card p-6 rounded-2xl">
          <p className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300"><AnimatedStat value={stats.analyzed} /></p>
          <p className="text-sm text-gray-300 mt-2">Conversaciones<br />Analizadas</p>
        </div>
      </div>

      <div className="space-y-4">
        <button
          ref={iceBreakerRef}
          onClick={() => onNavigate(View.IceBreaker)}
          className="w-full flex items-center p-6 glass-card rounded-2xl shadow-lg transition-all duration-200 hover:bg-white/10 active:scale-[0.98] interactive-glow cursor-target"
        >
          <div className="p-3 bg-gradient-to-br from-red-500 to-orange-500 rounded-lg"><IceBreakerIcon className="w-8 h-8"/></div>
          <span className="text-xl font-bold ml-4">Empieza la Conversación</span>
        </button>
         <button
          ref={analyzerRef}
          onClick={() => onNavigate(View.ChatAnalyzer)}
          className="w-full flex items-center p-6 glass-card rounded-2xl shadow-lg transition-all duration-200 hover:bg-white/10 active:scale-[0.98] interactive-glow cursor-target"
        >
          <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg"><AnalyzeIcon className="w-8 h-8" /></div>
          <span className="text-xl font-bold ml-4">Analizar Conversación</span>
        </button>
        <button
          ref={moreOptionsRef}
          onClick={() => onNavigate(View.MoreOptions)}
          className="w-full flex items-center p-6 glass-card rounded-2xl shadow-lg transition-all duration-200 hover:bg-white/10 active:scale-[0.98] interactive-glow cursor-target"
        >
          <div className="p-3 bg-gray-600 rounded-lg"><MoreOptionsIcon className="w-8 h-8" /></div>
          <span className="text-xl font-bold ml-4">Más Opciones</span>
        </button>
      </div>
    </div>
  );
});

const IceBreakerView: React.FC<{ onBack: () => void; onGenerated: () => void; }> = ({ onBack, onGenerated }) => {
  const [iceBreakers, setIceBreakers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleGenerate = useCallback(async () => {
    setLoading(true);
    setIceBreakers([]);
    const results = await generateIceBreakers();
    setIceBreakers(results);
    setLoading(false);
    if (results.length > 0 && !results[0].startsWith("Lo siento")) {
      onGenerated();
    }
  }, [onGenerated]);

  const handleCopy = (text: string, index: number) => {
      navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="flex flex-col h-full text-white relative">
      <Header onBack={onBack} title="Generador de Flechazos" />
      <div className="flex-grow flex flex-col items-center justify-center p-4 pt-20 overflow-y-auto">
        {loading && <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-400"></div>}
        
        {!loading && iceBreakers.length > 0 && (
          <div className="w-full max-w-md space-y-4">
            {iceBreakers.map((text, index) => (
              <div key={index} className="glass-card p-4 rounded-xl flex items-center justify-between animate-fadeInUp" style={{animationDelay: `${index * 100}ms`}}>
                <p className="flex-grow pr-4">{text}</p>
                <button onClick={() => handleCopy(text, index)} className="p-2 rounded-full bg-indigo-600/80 hover:bg-indigo-500/80 transition-all active:scale-90 flex-shrink-0 cursor-target">
                  {copiedIndex === index ? <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg> : <CopyIcon className="w-5 h-5" />}
                </button>
              </div>
            ))}
          </div>
        )}
        
        {!loading && iceBreakers.length === 0 && (
          <div className="text-center">
            <p className="text-2xl font-bold mb-2">Rompe el hielo con un botón.</p>
            <p className="text-gray-400">Genera frases que nadie podrá ignorar.</p>
          </div>
        )}
      </div>
      <div className="p-4">
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="w-full bg-indigo-600/80 text-white font-bold py-4 px-8 rounded-full shadow-lg border border-indigo-400 hover:bg-indigo-500/80 transition-transform duration-300 transform hover:scale-105 active:scale-100 disabled:opacity-50 flex items-center justify-center space-x-2 cursor-target"
        >
            <MagicIcon className="w-6 h-6"/>
            <span>{loading ? 'Generando...' : 'Generar Flechazos'}</span>
        </button>
      </div>
    </div>
  );
};

const ChatAnalyzerView: React.FC<{ onBack: () => void; onAnalyzed: () => void; }> = ({ onBack, onAnalyzed }) => {
  const [image, setImage] = useState<{ url: string; base64: string; mime: string } | null>(null);
  const [tone, setTone] = useState(50);
  const [reply, setReply] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const base64 = await fileToBase64(file);
      setImage({ url: URL.createObjectURL(file), base64, mime: file.type });
      setReply('');
    }
  };

  const handleGenerate = async () => {
    if (!image) return;
    setLoading(true);
    setReply('');
    const result = await generateChatReply(image.base64, image.mime, tone);
    setReply(result);
    setLoading(false);
    onAnalyzed();
  };
  
  const handleCopyReply = () => {
      if (!reply) return;
      navigator.clipboard.writeText(reply);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
  };

  return (
    <div className="flex flex-col h-full text-white relative">
      <Header onBack={onBack} title="Analizador de Chat" />
      <div className="flex-grow md:grid md:grid-cols-2 md:gap-8 p-4 pt-20 overflow-y-auto">
        <div className="flex flex-col items-center space-y-6">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="w-full max-w-sm glass-card p-3 rounded-2xl shadow-lg cursor-pointer transition-all duration-200 hover:bg-white/10 active:scale-[0.98] cursor-target"
          >
            {image ? (
              <img src={image.url} alt="Chat screenshot" className="w-full rounded-xl object-contain max-h-[60vh] md:max-h-full" />
            ) : (
              <div className="w-full h-64 border-2 border-dashed border-gray-500 rounded-xl flex flex-col items-center justify-center text-center text-gray-400 hover:bg-white/10 transition-colors">
                <UploadIcon className="w-10 h-10 mb-2"/>
                <span className="font-semibold">Sube una captura del chat</span>
                <p className="text-xs mt-1">Tu imagen es privada y no se guarda.</p>
              </div>
            )}
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*"/>
          </div>
        </div>
        
        <div className="flex flex-col items-center md:items-start mt-8 md:mt-0">
          {loading && (
            <div className="w-full text-center py-4">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-400 mx-auto"></div>
                <p className="text-gray-300 mt-2">Creando la respuesta perfecta...</p>
            </div>
          )}

          {!loading && reply && (
            <div className="w-full flex justify-end animate-fadeInUp">
                <div 
                    onClick={handleCopyReply}
                    className="glass-card text-white p-4 rounded-3xl rounded-br-lg max-w-sm relative shadow-md border-indigo-400/50 cursor-pointer transition-all duration-200 hover:bg-white/20 active:scale-95 cursor-target"
                >
                    <p>{reply}</p>
                    <div className={`absolute -top-2 -right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full transition-opacity duration-300 ${copied ? 'opacity-100' : 'opacity-0'}`}>
                        ¡Copiado!
                    </div>
                </div>
            </div>
          )}
        </div>
      </div>

      <footer className="glass-card p-4 m-4 rounded-3xl shadow-lg z-10 overflow-hidden">
        <div className="w-full">
          <input
            type="range"
            min="0"
            max="100"
            value={tone}
            onChange={(e) => setTone(Number(e.target.value))}
            className="cursor-target"
          />
          <div className="flex justify-between text-xs font-semibold text-gray-300 mt-2 px-1">
            <span>+nerd</span>
            <span>+picante</span>
          </div>
        </div>
        <button
          onClick={handleGenerate}
          disabled={!image || loading}
          className="w-full bg-indigo-600/80 text-white font-bold py-3 mt-4 rounded-full shadow-lg border border-indigo-400 hover:bg-indigo-500/80 transition-transform duration-300 transform hover:scale-105 active:scale-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 cursor-target"
        >
          <MagicIcon className="w-5 h-5"/>
          <span>{loading ? 'Analizando...' : 'Generar Respuesta'}</span>
        </button>
      </footer>
    </div>
  );
};

const MoreOptionsView: React.FC<{ onBack: () => void; onResetStats: () => void; }> = ({ onBack, onResetStats }) => {
    const [showConfirm, setShowConfirm] = useState(false);

    const handleReset = () => {
        onResetStats();
        setShowConfirm(false);
    };

    return (
        <div className="flex flex-col h-full text-white relative animate-fadeInUp">
            <Header onBack={onBack} title="Más Opciones" />
            <div className="flex-grow flex flex-col items-center justify-center p-4 pt-20 overflow-y-auto space-y-6">
                <div className="w-full max-w-sm glass-card p-6 rounded-2xl text-center">
                    <h3 className="text-xl font-bold">Créditos</h3>
                    <p className="text-gray-300 mt-2">Hecho con 🧠 y ❤️</p>
                    <p className="text-xs text-gray-400 mt-1">Potenciado por la API de Gemini.</p>
                </div>
                
                <div className="w-full max-w-sm glass-card p-6 rounded-2xl">
                    <h3 className="text-xl font-bold text-center">Ajustes</h3>
                    <div className="mt-4">
                        {!showConfirm ? (
                            <button
                                onClick={() => setShowConfirm(true)}
                                className="w-full bg-red-600/50 hover:bg-red-500/50 text-white font-bold py-3 px-6 rounded-full shadow-lg transition-all duration-300 transform hover:scale-105 active:scale-95 cursor-target"
                            >
                                Reiniciar Estadísticas
                            </button>
                        ) : (
                            <div className="text-center animate-fadeInUp">
                                <p className="font-semibold mb-3">¿Estás seguro?</p>
                                <div className="flex space-x-4">
                                    <button onClick={() => setShowConfirm(false)} className="w-full bg-gray-600/80 hover:bg-gray-500/80 font-bold py-2 rounded-full transition-colors active:scale-95 cursor-target">Cancelar</button>
                                    <button onClick={handleReset} className="w-full bg-red-600 hover:bg-red-500 font-bold py-2 rounded-full transition-colors active:scale-95 cursor-target">Confirmar</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};


// --- Main App Component ---

export default function App() {
  const [view, setView] = useState<View>(View.Login);
  
  const [stats, setStats] = useState(() => {
    try {
      const storedStats = localStorage.getItem('flechazoStats');
      return storedStats ? JSON.parse(storedStats) : { analyzed: 0, generated: 0 };
    } catch (error) {
      console.error("Could not parse stats from localStorage", error);
      return { analyzed: 0, generated: 0 };
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('flechazoStats', JSON.stringify(stats));
    } catch (error) {
      console.error("Could not save stats to localStorage", error);
    }
  }, [stats]);


  const handleNavigate = (newView: View) => {
    setView(newView);
  };

  const handleAnalyzed = useCallback(() => {
    setStats(prev => ({ ...prev, analyzed: prev.analyzed + 1 }));
  },[]);
  
  const handleGenerated = useCallback(() => {
    setStats(prev => ({ ...prev, generated: prev.generated + 1 }));
  },[]);
  
  const handleResetStats = useCallback(() => {
    setStats({ analyzed: 0, generated: 0 });
  }, []);

  const renderView = () => {
    switch (view) {
      case View.Login:
        return <LoginView onLogin={() => setView(View.Dashboard)} />;
      case View.IceBreaker:
        return <IceBreakerView onBack={() => setView(View.Dashboard)} onGenerated={handleGenerated}/>;
      case View.ChatAnalyzer:
        return <ChatAnalyzerView onBack={() => setView(View.Dashboard)} onAnalyzed={handleAnalyzed}/>;
      case View.MoreOptions:
        return <MoreOptionsView onBack={() => setView(View.Dashboard)} onResetStats={handleResetStats} />;
      case View.Dashboard:
      default:
        return <Dashboard onNavigate={handleNavigate} stats={stats} />;
    }
  };

  return (
    <main className="font-sans text-white h-screen overflow-hidden">
      <TargetCursor />
      <div className="max-w-7xl mx-auto h-full">
         <div className="w-full h-full max-w-md mx-auto md:max-w-none relative">
            {renderView()}
         </div>
      </div>
    </main>
  );
}