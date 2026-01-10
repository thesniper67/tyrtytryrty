
import React, { useState, useRef, useEffect } from 'react';
import { AssistantMode, Message, Attachment } from './types';
import { generateRobloxResponse } from './services/gemini';
import { ScriptIcon, BuildIcon, UIIcon, MasterIcon, SendIcon } from './components/Icon';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'neural' | 'assets' | 'docs'>('neural');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<AssistantMode>('scripting');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      const isImage = file.type.startsWith('image/');
      
      reader.onload = (event) => {
        const data = event.target?.result as string;
        setAttachments(prev => [...prev, {
          name: file.name,
          type: file.type,
          data: data,
          isImage: isImage
        }]);
      };

      if (isImage) {
        reader.readAsDataURL(file);
      } else {
        reader.readAsText(file);
      }
    });
    e.target.value = '';
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    if ((!input.trim() && attachments.length === 0) || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      mode,
      timestamp: Date.now(),
      attachments: attachments.length > 0 ? [...attachments] : undefined
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setAttachments([]);
    setIsLoading(true);

    try {
      const { text, sources } = await generateRobloxResponse(input, mode, messages, userMessage.attachments || []);
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: text,
        mode,
        timestamp: Date.now(),
        sources: sources.length > 0 ? sources : undefined
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const getModeColor = (m: AssistantMode) => {
    switch (m) {
      case 'scripting': return 'text-blue-400 border-blue-500 bg-blue-500/10';
      case 'building': return 'text-emerald-400 border-emerald-500 bg-emerald-500/10';
      case 'ui': return 'text-amber-400 border-amber-500 bg-amber-500/10';
      default: return 'text-purple-400 border-purple-500 bg-purple-500/10';
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#0b0e14] overflow-hidden">
      {/* Sidebar Navigation */}
      <aside className="w-20 md:w-64 bg-[#12161f] border-r border-gray-800 flex flex-col z-30">
        <div className="p-6 flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-xl shadow-lg shadow-blue-500/20">
            <MasterIcon className="w-6 h-6 text-white" />
          </div>
          <span className="hidden md:block font-black text-white tracking-tighter uppercase italic text-lg">Mastermind</span>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          <button 
            onClick={() => setActiveTab('neural')}
            className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all ${activeTab === 'neural' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800'}`}
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
            <span className="hidden md:block font-bold text-sm">Neural Chat</span>
          </button>
          <button 
            onClick={() => setActiveTab('assets')}
            className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all ${activeTab === 'assets' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800'}`}
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
            <span className="hidden md:block font-bold text-sm">Project Assets</span>
          </button>
          <button 
            onClick={() => setActiveTab('docs')}
            className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all ${activeTab === 'docs' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800'}`}
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
            <span className="hidden md:block font-bold text-sm">Studio Reference</span>
          </button>
        </nav>

        <div className="p-4 mt-auto">
          <div className="bg-[#1a1f2e] rounded-2xl p-4 border border-gray-800">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Active Session</span>
            </div>
            <p className="text-[10px] text-gray-500 leading-relaxed font-medium">System optimized for high-performance Luau execution.</p>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
        {/* Top Header */}
        <header className="h-16 border-b border-gray-800 bg-[#12161f]/80 backdrop-blur-xl flex items-center justify-between px-8 z-20">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 bg-[#0b0e14] px-3 py-1.5 rounded-lg border border-gray-800">
              <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em]">Mode</span>
              <div className="h-3 w-[1px] bg-gray-700 mx-1"></div>
              <span className="text-xs font-bold text-white uppercase tracking-wider">{mode}</span>
            </div>
            <div className="hidden lg:flex items-center gap-4">
               {(['scripting', 'building', 'ui'] as AssistantMode[]).map((m) => (
                  <button 
                    key={m} 
                    onClick={() => setMode(m)}
                    className={`text-[10px] font-black uppercase tracking-[0.3em] transition-all ${mode === m ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-300'}`}
                  >
                    {m}
                  </button>
               ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
             <button className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all shadow-lg shadow-blue-600/20 uppercase tracking-widest">
                Export to Studio
             </button>
             <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 border border-white/20"></div>
          </div>
        </header>

        {/* Tab Content */}
        <main className="flex-1 overflow-hidden flex flex-col">
          {activeTab === 'neural' ? (
            <>
              {/* Chat View */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-10">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center max-w-2xl mx-auto space-y-8 animate-in fade-in duration-1000 zoom-in-95">
                    <div className="relative">
                      <div className="absolute inset-0 bg-blue-500 blur-[100px] opacity-10"></div>
                      <MasterIcon className="w-20 h-20 text-blue-500 relative" />
                    </div>
                    <div className="space-y-4">
                      <h2 className="text-4xl font-black text-white tracking-tighter uppercase italic">Neural Workspace</h2>
                      <p className="text-gray-400 font-medium leading-relaxed">
                        Welcome to the Mastermind Developer Portal. Upload your Studio assets, screenshots, or scripts to begin technical analysis.
                      </p>
                    </div>
                    <div className="flex flex-wrap justify-center gap-3">
                      {["Script a placement system", "Fix a DataStore bug", "Optimize my lighting", "Analyze UI screenshots"].map((q, i) => (
                        <button 
                          key={i} 
                          onClick={() => setInput(q)}
                          className="px-4 py-2 bg-gray-800/50 hover:bg-gray-800 border border-gray-700 rounded-full text-xs font-bold text-gray-400 hover:text-white transition-all"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-4 duration-500`}>
                      <div className={`max-w-[90%] md:max-w-[75%] rounded-[2rem] p-6 ${msg.role === 'user' ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/10' : 'bg-[#12161f] border border-gray-800 shadow-2xl'}`}>
                        {msg.attachments && (
                          <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                            {msg.attachments.map((att, i) => (
                              <div key={i} className="flex-shrink-0 w-20 h-20 rounded-xl bg-black/40 border border-white/10 flex flex-col items-center justify-center p-2">
                                {att.isImage ? <img src={att.data} className="w-full h-full object-cover rounded-lg" /> : <ScriptIcon className="w-6 h-6 text-blue-400" />}
                                <span className="text-[8px] font-bold text-gray-500 truncate w-full mt-1 text-center">{att.name}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="prose prose-invert max-w-none text-sm md:text-base leading-relaxed">
                          {msg.content.split('```').map((part, i) => {
                            if (i % 2 === 1) {
                              const lang = part.split('\n')[0].trim();
                              const code = part.substring(part.indexOf('\n') + 1);
                              return (
                                <div key={i} className="my-6 rounded-2xl overflow-hidden border border-gray-700/50 bg-black/60 group relative">
                                  <div className="px-4 py-2 bg-gray-900 flex justify-between items-center border-b border-gray-800">
                                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{lang || 'luau'}</span>
                                    <button onClick={() => navigator.clipboard.writeText(code.trim())} className="text-[10px] font-black text-blue-500 hover:text-blue-400 transition-colors uppercase tracking-widest">Copy</button>
                                  </div>
                                  <pre className="p-5 overflow-x-auto code-font text-[13px]"><code>{code.trim()}</code></pre>
                                </div>
                              );
                            }
                            return <p key={i} className="whitespace-pre-wrap">{part}</p>;
                          })}
                        </div>
                        {msg.sources && (
                          <div className="mt-4 pt-4 border-t border-gray-800 flex flex-wrap gap-2">
                            {msg.sources.map((s, si) => (
                              <a key={si} href={s.uri} target="_blank" className="text-[10px] font-bold text-blue-400 hover:underline">[{s.title}]</a>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-[#12161f] border border-gray-800 rounded-2xl p-6 flex items-center gap-4 shadow-2xl">
                      <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-xs font-black text-white uppercase tracking-widest">Synthesizing Luau...</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Input Zone */}
              <div className="p-8 bg-gradient-to-t from-[#0b0e14] via-[#0b0e14] to-transparent">
                <div className="max-w-4xl mx-auto space-y-4">
                   {attachments.length > 0 && (
                      <div className="flex gap-3 overflow-x-auto pb-2">
                        {attachments.map((att, i) => (
                          <div key={i} className="relative group flex-shrink-0">
                            <div className="w-12 h-12 rounded-lg bg-gray-800 border border-gray-700 overflow-hidden flex items-center justify-center">
                              {att.isImage ? <img src={att.data} className="w-full h-full object-cover" /> : <ScriptIcon className="w-5 h-5 text-blue-500" />}
                            </div>
                            <button onClick={() => removeAttachment(i)} className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full p-0.5 hover:scale-110 transition-transform">
                              <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                          </div>
                        ))}
                      </div>
                   )}
                   <div className="flex items-end gap-3 bg-[#12161f] border border-gray-800 p-4 rounded-3xl focus-within:border-blue-500/50 transition-all shadow-2xl">
                      <button onClick={() => fileInputRef.current?.click()} className="p-2 hover:bg-gray-800 rounded-xl transition-all text-gray-500 hover:text-white">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                      </button>
                      <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} multiple accept="image/*,.lua,.txt" />
                      <textarea 
                        rows={1}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                        placeholder={`Start a ${mode} session...`}
                        className="flex-1 bg-transparent border-none focus:ring-0 text-white placeholder-gray-600 py-2 resize-none text-sm font-medium"
                      />
                      <button 
                        onClick={handleSend}
                        disabled={isLoading || (!input.trim() && attachments.length === 0)}
                        className={`p-3 rounded-2xl transition-all ${isLoading || (!input.trim() && attachments.length === 0) ? 'text-gray-700' : 'text-blue-500 hover:text-blue-400'}`}
                      >
                        <SendIcon className="w-6 h-6" />
                      </button>
                   </div>
                </div>
              </div>
            </>
          ) : activeTab === 'assets' ? (
            <div className="p-10 flex flex-col items-center justify-center text-center space-y-6 h-full animate-in fade-in duration-500">
              <BuildIcon className="w-16 h-16 text-gray-800" />
              <h3 className="text-xl font-bold text-white">Project Assets Library</h3>
              <p className="text-gray-500 max-w-sm">Connect your Roblox account or upload a .rbxm file to view and analyze project components here.</p>
              <button className="px-6 py-3 bg-gray-800 border border-gray-700 rounded-xl text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-white transition-all">Link Studio Workspace</button>
            </div>
          ) : (
            <div className="p-10 h-full overflow-y-auto space-y-8 animate-in slide-in-from-right-10 duration-500">
               <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">Studio Reference Hub</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {[
                   { title: "Luau 5.0 Syntax", desc: "Latest strict type checking and buffer API specs.", icon: <ScriptIcon className="w-5 h-5 text-blue-500"/> },
                   { title: "Future Lighting", desc: "Best practices for shadow mapping and volumetrics.", icon: <BuildIcon className="w-5 h-5 text-emerald-500"/> },
                   { title: "Flex Layouts", desc: "Responsive UI hierarchies for mobile and desktop.", icon: <UIIcon className="w-5 h-5 text-amber-500"/> },
                 ].map((ref, i) => (
                   <div key={i} className="p-6 bg-[#12161f] border border-gray-800 rounded-2xl hover:border-blue-500/50 transition-all group">
                     <div className="mb-4">{ref.icon}</div>
                     <h4 className="font-bold text-white mb-2">{ref.title}</h4>
                     <p className="text-xs text-gray-500 leading-relaxed mb-4">{ref.desc}</p>
                     <button className="text-[10px] font-black uppercase text-blue-500 group-hover:underline">Read Docs</button>
                   </div>
                 ))}
               </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default App; print("hel;lo")
