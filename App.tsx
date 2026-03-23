import type React from 'react';
import { useState, useEffect } from 'react';
import type { MouseEvent } from 'react';
import { Terminal, LayoutGrid, Shield, Zap, Cpu, Minus, X, Play, Square, Plus, Activity } from 'lucide-react';
import { motion } from 'motion/react';

interface Tab {
  id: string;
  name: string;
  content: string;
}

interface Script {
  id: string;
  name: string;
  category: string;
  code: string;
  description: string;
}

interface SidebarItemProps {
  icon: React.ComponentType<{ size?: number }>;
  label: string;
  active: boolean;
  onClick: () => void;
}

interface EngineStatus {
  connected: boolean;
  dll: boolean;
  injector: boolean;
}

// Extend Window interface for Electron API
declare global {
  interface Window {
    electronAPI?: {
      minimizeWindow: () => void;
      maximizeWindow: () => void;
      closeWindow: () => void;
      getEngineStatus: () => Promise<EngineStatus>;
      injectEngine: () => Promise<{ success: boolean; message?: string; error?: string }>;
      connectEngine: () => Promise<{ success: boolean; error?: string }>;
      executeScript: (script: string) => Promise<{ success: boolean; output?: string; error?: string }>;
      onEngineMessage: (callback: (message: string) => void) => void;
    };
  }
}

const NinjaLogo = (): React.ReactElement => (
  <div className="flex items-center gap-2 mb-8">
    <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center">
      <span className="text-white font-bold text-sm">N</span>
    </div>
    <span className="text-white font-bold text-lg">NINJA</span>
  </div>
);

const SidebarItem = ({ icon: Icon, label, active, onClick }: SidebarItemProps): React.ReactElement => (
  <motion.button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
      active 
        ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
    }`}
    whileHover={{ x: 4 }}
    whileTap={{ scale: 0.98 }}
  >
    <Icon size={18} />
    <span className="text-sm font-medium">{label}</span>
  </motion.button>
);

type ViewType = 'executor' | 'scripts';
type AccentColor = 'emerald' | 'blue' | 'rose' | 'amber';

export default function App(): React.ReactElement {
  const [currentView, setCurrentView] = useState<ViewType>('executor');
  const [activeCategory, setActiveCategory] = useState<string>('Combat');
  const [tabs, setTabs] = useState<Tab[]>([
    { id: '1', name: 'Script 1', content: '-- Your Lua script here\nprint("Hello, Roblox!")' }
  ]);
  const [activeTabId, setActiveTabId] = useState<string>('1');
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [accentColor, setAccentColor] = useState<AccentColor>('emerald');
  const [engineStatus, setEngineStatus] = useState<EngineStatus>({ connected: false, dll: false, injector: false });
  const [isInjecting, setIsInjecting] = useState<boolean>(false);

  // Check engine status on mount
  useEffect(() => {
    checkEngineStatus();
    
    // Listen for engine messages
    if (window.electronAPI) {
      window.electronAPI.onEngineMessage((message) => {
        addLog(`Engine: ${message}`);
      });
    }
  }, []);

  const checkEngineStatus = async () => {
    if (window.electronAPI) {
      try {
        const status = await window.electronAPI.getEngineStatus();
        setEngineStatus(status);
      } catch (error) {
        console.error('Failed to get engine status:', error);
      }
    }
  };

  const handleInject = async () => {
    if (!window.electronAPI) {
      addLog('Error: Not running in Electron environment');
      return;
    }

    setIsInjecting(true);
    addLog('Injecting C++ engine into Roblox...');

    try {
      const result = await window.electronAPI.injectEngine();
      if (result.success) {
        addLog(result.message || 'Engine injected successfully!');
        setEngineStatus(prev => ({ ...prev, connected: true }));
      } else {
        addLog(`Injection failed: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      addLog(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsInjecting(false);
    }
  };

  type AccentColors = 'emerald' | 'blue' | 'rose' | 'amber';
  type AccentClasses = Record<AccentColors, { bg: string; text: string; border: string }>;

  const accentClasses: AccentClasses = {
    emerald: { bg: 'bg-emerald-500', text: 'text-emerald-400', border: 'border-emerald-500' },
    blue: { bg: 'bg-blue-500', text: 'text-blue-400', border: 'border-blue-500' },
    rose: { bg: 'bg-rose-500', text: 'text-rose-400', border: 'border-rose-500' },
    amber: { bg: 'bg-amber-500', text: 'text-amber-400', border: 'border-amber-500' },
  };

  const currentAccent = accentClasses[accentColor];
  const accentBg = currentAccent.bg;
  const accentText = currentAccent.text;

  const accentColorMap: Record<string, string> = {
    emerald: 'hover:border-emerald-500/30',
    blue: 'hover:border-blue-500/30', 
    rose: 'hover:border-rose-500/30',
    amber: 'hover:border-amber-500/30'
  };

  const scripts: Script[] = [
    {
      id: '1',
      name: 'Aimbot',
      category: 'Combat',
      code: '-- Aimbot Script\nlocal Players = game:GetService("Players")\nlocal LocalPlayer = Players.LocalPlayer\n-- Add aimbot logic here',
      description: 'Advanced aiming assistance'
    },
    {
      id: '2',
      name: 'ESP',
      category: 'Combat',
      code: '-- ESP Script\nlocal Players = game:GetService("Players")\n-- Add ESP logic here',
      description: 'See players through walls'
    },
    {
      id: '3',
      name: 'Speed Boost',
      category: 'Universal',
      code: '-- Speed Script\nlocal Players = game:GetService("Players")\nlocal LocalPlayer = Players.LocalPlayer\nLocalPlayer.Character.Humanoid.WalkSpeed = 50',
      description: 'Increase movement speed'
    },
    {
      id: '4',
      name: 'Fly',
      category: 'Universal',
      code: '-- Fly Script\nlocal Players = game:GetService("Players")\nlocal LocalPlayer = Players.LocalPlayer\n-- Add fly logic here',
      description: 'Fly around map'
    },
    {
      id: '5',
      name: 'Admin Commands',
      category: 'Utility',
      code: '-- Admin Commands\nlocal prefix = "/"\n-- Add admin command logic here',
      description: 'Powerful admin commands'
    }
  ];

  const filteredScripts: Script[] = scripts.filter((script: Script) => 
    currentView === 'scripts' && script.category === activeCategory
  );

  const addLog = (message: string): void => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev: string[]) => [...prev, `[${timestamp}] ${message}`]);
  };

  const executeScript = async (): Promise<void> => {
    const currentTab = tabs.find((t: Tab) => t.id === activeTabId);
    if (!currentTab) return;

    setIsExecuting(true);
    addLog('Executing script...');

    if (window.electronAPI && engineStatus.connected) {
      // Execute through C++ engine
      try {
        const result = await window.electronAPI.executeScript(currentTab.content);
        if (result.success) {
          addLog(result.output || 'Script executed successfully!');
        } else {
          addLog(`Error: ${result.error || 'Execution failed'}`);
        }
      } catch (error) {
        addLog(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    } else {
      // Simulation mode
      setTimeout(() => {
        addLog('Script executed (Simulation mode - engine not connected)');
        setIsExecuting(false);
      }, 2000);
      return;
    }

    setIsExecuting(false);
  };

  const stopExecution = (): void => {
    setIsExecuting(false);
    addLog('Script execution stopped');
  };

  const addTab = (): void => {
    const newTab: Tab = {
      id: Date.now().toString(),
      name: `Script ${tabs.length + 1}`,
      content: '-- Your Lua script here'
    };
    setTabs([...tabs, newTab]);
    setActiveTabId(newTab.id);
  };

  const closeTab = (id: string, e: MouseEvent<HTMLButtonElement>): void => {
    e.preventDefault();
    e.stopPropagation();
    if (tabs.length === 1) return;
    const newTabs = tabs.filter((t: Tab) => t.id !== id);
    setTabs(newTabs);
    if (activeTabId === id) setActiveTabId(newTabs[0].id);
  };

  const updateTabContent = (content: string): void => {
    setTabs(tabs.map((t: Tab) => t.id === activeTabId ? { ...t, content } : t));
  };

  // Window controls
  const minimizeWindow = () => window.electronAPI?.minimizeWindow();
  const maximizeWindow = () => window.electronAPI?.maximizeWindow();
  const closeWindow = () => window.electronAPI?.closeWindow();

  return (
    <div className={`min-h-screen bg-[#09090b] text-zinc-100 font-sans selection:${accentBg}/30 flex flex-col`}>
      {/* Electron Titlebar (Draggable) */}
      <div className="h-8 bg-zinc-950/80 border-b border-zinc-900 flex items-center justify-between px-4 select-none" style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-rose-500 rounded-full opacity-50" />
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">NINJA Executor - Desktop</span>
          {/* Engine Status Indicator */}
          <div className="flex items-center gap-2 ml-4">
            <Activity size={12} className={engineStatus.connected ? 'text-emerald-400' : 'text-zinc-600'} />
            <span className={`text-[10px] ${engineStatus.connected ? 'text-emerald-400' : 'text-zinc-600'}`}>
              {engineStatus.connected ? 'Engine Connected' : 'Engine Offline'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
          <button onClick={minimizeWindow} className="text-zinc-600 hover:text-zinc-400 transition-colors">
            <Minus size={14} />
          </button>
          <button onClick={maximizeWindow} className="text-zinc-600 hover:text-zinc-400 transition-colors">
            <Square size={12} />
          </button>
          <button onClick={closeWindow} className="text-zinc-600 hover:text-rose-500 transition-colors">
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className={`absolute top-[-10%] left-[-10%] w-[40%] h-[40%] ${accentBg}/20 blur-[120px] rounded-full`} />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full" />
      </div>

      <div className="relative flex h-screen overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 border-r border-zinc-800 bg-zinc-950/50 backdrop-blur-xl flex flex-col p-6">
          <NinjaLogo />

          <nav className="flex-1 space-y-2">
            <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-4 px-2">Navigation</p>
            <SidebarItem icon={Terminal} label="Executor" active={currentView === 'executor'} onClick={() => setCurrentView('executor')} />
            <SidebarItem icon={LayoutGrid} label="Script Hub" active={currentView === 'scripts'} onClick={() => setCurrentView('scripts')} />
            
            <div className="pt-4">
              <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-4 px-2">Categories</p>
              <SidebarItem icon={Shield} label="Combat" active={currentView === 'scripts' && activeCategory === 'Combat'} onClick={() => { setCurrentView('scripts'); setActiveCategory('Combat'); }} />
              <SidebarItem icon={Zap} label="Universal" active={currentView === 'scripts' && activeCategory === 'Universal'} onClick={() => { setCurrentView('scripts'); setActiveCategory('Universal'); }} />
              <SidebarItem icon={Cpu} label="Utility" active={currentView === 'scripts' && activeCategory === 'Utility'} onClick={() => { setCurrentView('scripts'); setActiveCategory('Utility'); }} />
            </div>
          </nav>

          {/* Engine Control */}
          <div className="mt-4 pt-4 border-t border-zinc-800 space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-500">Engine:</span>
              <button
                onClick={handleInject}
                disabled={isInjecting || engineStatus.connected}
                className={`px-2 py-1 text-xs rounded transition-all ${
                  engineStatus.connected 
                    ? 'bg-emerald-500/20 text-emerald-400' 
                    : isInjecting
                      ? 'bg-zinc-700 text-zinc-400 cursor-wait'
                      : 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
                }`}
              >
                {isInjecting ? 'Injecting...' : engineStatus.connected ? 'Connected' : 'Inject'}
              </button>
            </div>
          </div>

          <div className="mt-auto pt-6 border-t border-zinc-800 space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-500">Accent:</span>
              <div className="flex gap-1">
                {(['emerald', 'blue', 'rose', 'amber'] as const).map((color: AccentColor) => (
                  <button
                    key={color}
                    onClick={() => setAccentColor(color)}
                    className={`w-4 h-4 rounded-full bg-${color}-500 ${accentColor === color ? 'ring-2 ring-offset-2 ring-offset-zinc-900 ring-zinc-400' : ''}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {currentView === 'executor' ? (
            <>
              {/* Toolbar */}
              <div className="h-12 bg-zinc-900/50 border-b border-zinc-800 flex items-center justify-between px-4">
                <div className="flex items-center gap-2">
                  <button
                    onClick={addTab}
                    className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 rounded text-sm flex items-center gap-2 transition-colors"
                  >
                    <Plus size={14} />
                    New Tab
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={executeScript}
                    disabled={isExecuting}
                    className={`px-4 py-1 rounded text-sm flex items-center gap-2 transition-all ${
                      isExecuting 
                        ? 'bg-zinc-700 text-zinc-400 cursor-not-allowed' 
                        : `${accentBg} text-white hover:opacity-90`
                    }`}
                  >
                    <Play size={14} />
                    {isExecuting ? 'Executing...' : 'Execute'}
                  </button>
                  <button
                    onClick={stopExecution}
                    disabled={!isExecuting}
                    className={`px-4 py-1 rounded text-sm flex items-center gap-2 transition-all ${
                      !isExecuting 
                        ? 'bg-zinc-700 text-zinc-400 cursor-not-allowed' 
                        : 'bg-red-500 text-white hover:bg-red-600'
                    }`}
                  >
                    <Square size={14} />
                    Stop
                  </button>
                </div>
              </div>

              <div className="flex-1 flex overflow-hidden">
                {/* Code Editor Area */}
                <div className="flex-1 flex flex-col">
                  {/* Tabs */}
                  <div className="flex bg-zinc-900/50 border-b border-zinc-800">
                    {tabs.map((tab: Tab) => (
                      <div
                        key={tab.id}
                        className={`flex items-center gap-2 px-4 py-2 border-r border-zinc-800 cursor-pointer transition-colors ${
                          activeTabId === tab.id 
                            ? 'bg-zinc-800 text-white' 
                            : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                        }`}
                        onClick={() => setActiveTabId(tab.id)}
                      >
                        <span className="text-sm">{tab.name}</span>
                        <button
                          onClick={(e: MouseEvent<HTMLButtonElement>) => closeTab(tab.id, e)}
                          className="text-zinc-500 hover:text-zinc-200"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Code Editor */}
                  <div className="flex-1 p-4 bg-zinc-950/50">
                    <textarea
                      value={tabs.find((t: Tab) => t.id === activeTabId)?.content || ''}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateTabContent(e.target.value)}
                      className="w-full h-full bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 text-sm font-mono text-zinc-100 resize-none focus:outline-none focus:border-blue-500/50 transition-colors"
                      placeholder="// Your Lua script here..."
                      spellCheck={false}
                    />
                  </div>
                </div>

                {/* Console/Output */}
                <div className="w-80 bg-zinc-900/50 border-l border-zinc-800 flex flex-col">
                  <div className="h-10 bg-zinc-800/50 border-b border-zinc-800 flex items-center px-4">
                    <span className="text-sm font-medium text-zinc-300">Console</span>
                  </div>
                  <div className="flex-1 p-4 overflow-y-auto">
                    <div className="space-y-1">
                      {logs.length === 0 ? (
                        <div className="text-zinc-500 text-sm">Console output will appear here...</div>
                      ) : (
                        logs.map((log: string, index: number) => (
                          <div key={index} className="text-sm font-mono">
                            <span className="text-zinc-500">{log.split(']')[0]}]</span>
                            <span className="text-zinc-300 ml-2">{log.split(']')[1]}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* Script Hub */
            <div className="flex-1 p-6 overflow-y-auto">
              <div className="max-w-6xl mx-auto">
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-white mb-2">Script Hub</h2>
                  <p className="text-zinc-400">Browse and import pre-made scripts</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredScripts.map((script: Script) => (
                    <motion.div
                      key={script.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      whileHover={{ y: -4 }}
                      className={`bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 hover:border-zinc-700 transition-all ${accentColorMap[script.category.toLowerCase()] || ''}`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-semibold text-white">{script.name}</h3>
                        <span className={`px-2 py-1 text-xs rounded-full ${accentBg}/20 ${accentText}`}>
                          {script.category}
                        </span>
                      </div>
                      <p className="text-zinc-400 text-sm mb-4">{script.description}</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            const newTab: Tab = {
                              id: Date.now().toString(),
                              name: script.name,
                              content: script.code
                            };
                            setTabs([...tabs, newTab]);
                            setActiveTabId(newTab.id);
                            setCurrentView('executor');
                          }}
                          className={`px-3 py-1 rounded text-sm ${accentBg} text-white hover:opacity-90 transition-opacity`}
                        >
                          Import
                        </button>
                        <button className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 rounded text-sm text-zinc-300 transition-colors">
                          Preview
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
