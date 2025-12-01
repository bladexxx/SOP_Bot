






import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Message, Actor, CardType, ActionType, Configuration, BenchmarkDataset, ConfigTemplate, Flashcard, AppSettings, GeminiModel, KnowledgeFile, BusinessRule, RuleSchema } from './types';
import { CardRenderer } from './components/CardRenderer';
import { BotIcon, UserIcon, SendIcon, PaperclipIcon, LoadingSpinner, SearchIcon, SparklesIcon, GeminiIcon, PlayCircleIcon, XIcon, XCircleIcon, InformationCircleIcon, SettingsIcon, LightBulbIcon } from './components/Icons';
import { FlashcardModal } from './components/FlashcardModal';
import { DemoGuideModal } from './components/DemoGuideModal';
import { SettingsModal } from './components/SettingsModal';
import { generateContentFromPrompt, generateFlashcardsFromText, generateRuleSchema } from './services/aiService';
import { triggerNiFiFlow } from './services/nifiService';
import { sopDefinitions } from './components/SopTimeline';
import { Card } from './types'; // Import Card from types

const mockConfigsData: Configuration[] = [
  {
    projectName: 'Auto-billing',
    level: 'Project',
    status: 'Active',
    lastModified: '2023-10-20',
    createdBy: 'admin@example.com',
    settings: { threshold: 100, autoApprove: true }
  },
  {
    projectName: 'Auto-billing',
    vendorId: 'VEN-12345',
    level: 'Vendor',
    status: 'Active',
    lastModified: '2023-10-26',
    createdBy: 'user@example.com',
    settings: { threshold: 50, autoApprove: false }
  },
  {
    projectName: 'AutoVouch',
    level: 'Project',
    status: 'Active',
    lastModified: '2023-10-25',
    createdBy: 'user@example.com',
    settings: { threshold: 250, autoApprove: false }
  },
  {
    projectName: 'AutoVouch-DELL-TDS',
    vendorId: 'DELL',
    level: 'Vendor',
    status: 'Active',
    lastModified: '2024-01-15',
    createdBy: 'user@example.com',
    settings: {
        bizCategory: "TDS",
        countryCode: "US",
        regionNo: "100",
        transCode: "810",
        fileType: "X12",
        partnerName: "DELL",
        vouchModel: "",
        hasSAPOrder: "N",
        skipAPVendors: "",
        vouchVendors: "",
        renewalCheck: "None",
        renewalVendors: "",
        transformation: [
            {
                method: "JOLT",
                specFile: "dell_jolt_spec.json",
                specDir: "/home/nifi/scripts/autovouch-scripts/jolt"
            }
        ]
    }
  },
  {
    projectName: 'Q-Gen',
    vendorId: 'VEN-ABCDE',
    level: 'Vendor',
    status: 'Paused',
    lastModified: '2023-09-15',
    createdBy: 'admin@example.com',
    settings: { threshold: 500, autoApprove: true }
  }
];

const mockTemplatesData: ConfigTemplate[] = [
    {
        templateName: "Standard Auto-Billing Template",
        projectName: "Auto-billing",
        description: "For standard billing processes with approval rules.",
        settingsSchema: {
            threshold: 'number',
            autoApprove: 'boolean',
        }
    },
    {
        templateName: "TDS AutoVouch Template",
        projectName: "AutoVouch-TDS",
        description: "For TDS X12 file transaction processing with JOLT transformations.",
        settingsSchema: {
            bizCategory: 'string',
            countryCode: 'string',
            regionNo: 'string',
            transCode: 'string',
            fileType: 'string',
            partnerName: 'string',
            vouchModel: 'string',
            hasSAPOrder: 'string',
            skipAPVendors: 'string',
            vouchVendors: 'string',
            renewalCheck: 'string',
            renewalVendors: 'string',
            transformation: 'json',
        },
        defaultValues: {
            bizCategory: "TDS",
            countryCode: "US",
            regionNo: "100",
            fileType: "X12",
            hasSAPOrder: "N",
            renewalCheck: "None",
            transformation: [
                {
                    method: "JOLT",
                    specFile: "your_spec_file.json",
                    specDir: "/home/nifi/scripts/autovouch-scripts/jolt"
                }
            ]
        }
    },
     {
        templateName: "Employee Expense Reports",
        projectName: "Expense-Reports",
        description: "Template for T&E reports with daily limits and receipt rules.",
        settingsSchema: {
            dailyLimit: 'number',
            requiresReceipt: 'boolean',
            departmentCode: 'string',
        }
    }
];

const mockBenchmarkDatasets: BenchmarkDataset[] = [
    {
        id: 'BM-AB-01',
        projectName: 'Auto-billing',
        description: 'Primary benchmark covering high-volume vendors and common invoice types.',
        dataVolume: 50000,
        vendorCount: 150,
        timeliness: 'Last 3 Months',
        coveredVendors: ['VEN-12345', 'VEN-67890', 'VEN-54321']
    },
    {
        id: 'BM-AB-02',
        projectName: 'Auto-billing',
        description: 'Supplementary dataset for Q4 2023, focusing on seasonal and international vendors.',
        dataVolume: 12000,
        vendorCount: 45,
        timeliness: 'Last 1 Month',
        coveredVendors: ['VEN-INTL-A', 'VEN-SEASON-B', 'VEN-12345']
    },
    {
        id: 'BM-AV-01',
        projectName: 'AutoVouch',
        description: 'Comprehensive benchmark for all active AutoVouch vendors.',
        dataVolume: 125000,
        vendorCount: 88,
        timeliness: 'Last 6 Months',
        coveredVendors: ['VEN-AV-101', 'VEN-AV-102']
    }
];

const mockFlashcards: Flashcard[] = [
    {
        id: 1,
        question: "How do I start a guided workflow?",
        answer: "Click the 'Start a Guided SOP' button on the welcome card, or type 'start sop'. This will walk you through common processes step-by-step."
    },
    {
        id: 2,
        question: "How can I create a new configuration?",
        answer: "Type 'new config' or 'create config'. The bot will then ask if you want to use a template or clone an existing configuration."
    },
    {
        id: 3,
        question: "What are configuration templates?",
        answer: "Templates provide a pre-defined structure for a project's configuration, tailored to its specific business logic. Using a template ensures all necessary settings are included right from the start."
    },
    {
        id: 4,
        question: "How do I run a test for an existing project?",
        answer: "Type 'run test for [Project Name]', for example, 'run test for Auto-billing'. The bot will then ask you to select the specific configuration and provide test data."
    },
    {
        id: 5,
        question: "How can I see the benchmark datasets for a project?",
        answer: "Type 'show benchmarks for [Project Name]', e.g., 'show benchmarks for AutoVouch'. The bot will display cards with details for each available benchmark."
    },
    {
        id: 6,
        question: "How do I find a specific configuration?",
        answer: "Use the search bar at the top of the screen, or type a query like 'find VEN-12345' or 'check config for Auto-billing'."
    }
];

const mockBusinessRules: BusinessRule[] = [
    {
        id: 'RULE-101',
        domain: 'Billing',
        payload: {
            ruleName: 'High Value Transaction',
            minAmount: 10000,
            approverRole: 'Senior Manager'
        }
    }
];

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
  version: string;
  name: string;
  description: string;
}

const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose, version, name, description }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4" 
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="about-title"
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-auto flex flex-col relative border border-gray-200"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex justify-between items-center p-4 border-b border-gray-200">
          <h2 id="about-title" className="text-lg font-bold text-gray-900">About {name}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 transition-colors" aria-label="Close about dialog">
            <XCircleIcon className="h-7 w-7" />
          </button>
        </header>

        <main className="p-6 text-gray-700 space-y-4">
            <p className="text-center text-sm">Version <span className="font-mono bg-gray-100 text-gray-800 px-2 py-1 rounded">{version}</span></p>
            <p>{description}</p>
            <p className="text-xs text-gray-400 text-center pt-4">© {new Date().getFullYear()} FlowX. All rights reserved.</p>
        </main>
      </div>
    </div>
  );
};

const APP_VERSION = '1.6';
const SETTINGS_STORAGE_KEY = 'flowx-sop-bot-settings';
const KNOWLEDGE_FILES_STORAGE_KEY = 'flowx-sop-bot-knowledge-files';
const GENERATED_FLASHCARDS_STORAGE_KEY = 'flowx-sop-bot-generated-flashcards';

const markdownComponents = {
  table: ({node, ...props}: any) => <div className="overflow-x-auto my-2 border border-gray-200 rounded-lg"><table className="min-w-full text-sm" {...props} /></div>,
  thead: ({node, ...props}: any) => <thead className="bg-gray-100" {...props} />,
  th: ({node, ...props}: any) => <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider" {...props} />,
  tbody: ({node, ...props}: any) => <tbody className="bg-white divide-y divide-gray-200" {...props} />,
  tr: ({node, ...props}: any) => <tr className="hover:bg-teal-50/30" {...props} />,
  td: ({node, ...props}: any) => <td className="px-3 py-1.5 text-sm text-gray-800 align-top" {...props} />,
  p: ({node, ...props}: any) => <p className="mb-2 last:mb-0" {...props} />,
  ul: ({node, ...props}: any) => <ul className="list-disc list-inside space-y-1 my-2 text-sm" {...props} />,
  ol: ({node, ...props}: any) => <ol className="list-decimal list-inside space-y-1 my-2 text-sm" {...props} />,
  li: ({node, ...props}: any) => <li className="pl-2" {...props} />,
  code: ({node, inline, className, children, ...props}: any) => {
    return !inline ? (
      <pre className="p-3 my-2 bg-gray-800 text-white rounded-md overflow-x-auto text-xs font-mono">
        <code className={className} {...props}>
          {children}
        </code>
      </pre>
    ) : (
      <code className="px-1 py-0.5 bg-gray-200 text-red-600 rounded-sm font-mono text-xs" {...props}>
        {children}
      </code>
    )
  },
  a: ({node, ...props}: any) => <a className="text-teal-600 hover:underline" target="_blank" rel="noopener noreferrer" {...props} />,
  h1: ({node, ...props}: any) => <h1 className="text-lg font-bold mt-3 mb-1" {...props} />,
  h2: ({node, ...props}: any) => <h2 className="text-base font-bold mt-2 mb-1" {...props} />,
  h3: ({node, ...props}: any) => <h3 className="text-sm font-bold mt-1 mb-1" {...props} />,
  blockquote: ({node, ...props}: any) => <blockquote className="pl-3 border-l-4 border-gray-300 italic my-2 text-sm" {...props} />,
  strong: ({node, ...props}: any) => <strong className="font-semibold text-gray-900" {...props} />,
};

const App: React.FC = () => {
    const [isPanelOpen, setIsPanelOpen] = useState(true);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Configuration[]>([]);
    const [showSearchResults, setShowSearchResults] = useState(false);
    const [isFlashcardModalOpen, setIsFlashcardModalOpen] = useState(false);
    const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
    const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [appMetadata, setAppMetadata] = useState<{name: string, description: string} | null>(null);
    const [panelWidth, setPanelWidth] = useState(448); // 28rem = 448px
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLDivElement>(null);
    const knowledgeFileInputRef = useRef<HTMLInputElement>(null);
    const initialized = useRef(false);

    const [configs, setConfigs] = useState<Configuration[]>(mockConfigsData);
    const [templates, setTemplates] = useState<ConfigTemplate[]>(mockTemplatesData);
    const [benchmarks, setBenchmarks] = useState<BenchmarkDataset[]>(mockBenchmarkDatasets);
    const [businessRules, setBusinessRules] = useState<BusinessRule[]>(mockBusinessRules);


    const [knowledgeFiles, setKnowledgeFiles] = useState<KnowledgeFile[]>(() => {
        try {
            const savedFiles = localStorage.getItem(KNOWLEDGE_FILES_STORAGE_KEY);
            return savedFiles ? JSON.parse(savedFiles) : [];
        } catch (error) {
            console.error("Failed to parse knowledge files from localStorage:", error);
            return [];
        }
    });

    const [generatedFlashcards, setGeneratedFlashcards] = useState<Flashcard[]>(() => {
        try {
            const savedCards = localStorage.getItem(GENERATED_FLASHCARDS_STORAGE_KEY);
            return savedCards ? JSON.parse(savedCards) : [];
        } catch (error) {
            console.error("Failed to parse generated flashcards from localStorage:", error);
            return [];
        }
    });

    const [appSettings, setAppSettings] = useState<AppSettings>(() => {
        try {
            const savedSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);
            return savedSettings ? JSON.parse(savedSettings) : {
                nifiUrl: 'http://localhost:8080',
                nifiEndpoint: '/nifi-api/processors/your-processor-id/run',
                geminiModel: 'gemini-2.5-flash',
            };
        } catch (error) {
            console.error("Failed to parse settings from localStorage:", error);
            return {
                nifiUrl: 'http://localhost:8080',
                nifiEndpoint: '/nifi-api/processors/your-processor-id/run',
                geminiModel: 'gemini-2.5-flash',
            };
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(appSettings));
        } catch (error) {
            console.error("Failed to save settings to localStorage:", error);
        }
    }, [appSettings]);
    
    useEffect(() => {
        try {
            localStorage.setItem(KNOWLEDGE_FILES_STORAGE_KEY, JSON.stringify(knowledgeFiles));
        } catch (error) {
            console.error("Failed to save knowledge files to localStorage:", error);
        }
    }, [knowledgeFiles]);

    useEffect(() => {
        try {
            localStorage.setItem(GENERATED_FLASHCARDS_STORAGE_KEY, JSON.stringify(generatedFlashcards));
        } catch (error) {
            console.error("Failed to save generated flashcards to localStorage:", error);
        }
    }, [generatedFlashcards]);
    
    const handleCardActionRef = useRef<((action: ActionType, payload?: any) => Promise<void>) | null>(null);

    const knowledgeBaseText = useMemo(() => {
        if (knowledgeFiles.length === 0) return '';
        // Add headers to give context to the AI about where each piece of information came from.
        return knowledgeFiles.map(file => `--- Knowledge from ${file.name} ---\n${file.content}`).join('\n\n');
    }, [knowledgeFiles]);

    useEffect(() => {
        fetch('./metadata.json')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => setAppMetadata(data))
            .catch(error => console.error("Could not load app metadata:", error));
    }, []);


    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowSearchResults(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (searchQuery.trim() !== '') {
            const lowerQuery = searchQuery.toLowerCase();
            const filtered = configs.filter(config => 
                config.projectName.toLowerCase().includes(lowerQuery) ||
                (config.vendorId && config.vendorId.toLowerCase().includes(lowerQuery))
            );
            setSearchResults(filtered);
            setShowSearchResults(true);
        } else {
            setSearchResults([]);
            setShowSearchResults(false);
        }
    }, [searchQuery, configs]);
    
    const addMessage = useCallback((message: Omit<Message, 'id' | 'timestamp'>) => {
        const newMessage = { 
            id: Date.now(), 
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), 
            ...message 
        };
        setMessages(prev => [...prev, newMessage]);
        return newMessage;
    }, []);
    
    const updateCardInMessage = useCallback((messageId: number, newPayload: any) => {
        setMessages(prev => prev.map(msg => {
            if (msg.id === messageId && msg.card) {
                return {
                    ...msg,
                    card: {
                        ...msg.card,
                        payload: {
                            ...msg.card.payload,
                            ...newPayload
                        }
                    } as Card
                };
            }
            return msg;
        }));
    }, []);

    const triggerSopStep = useCallback((sopContext: any, additionalPayload: any = {}) => {
        const { sopType, currentStep } = sopContext;
        const sop = sopDefinitions[sopType];
        if (!sop) {
            console.error("SOP definition not found for type:", sopType);
            return;
        }

        const currentStepIndex = currentStep - 1;

        const showCompletionMessage = () => {
            addMessage({
                actor: Actor.BOT,
                content: `You have successfully completed the "${sop.title}" SOP. You can start a new task or type a command.`,
            });
        };
        
        if (currentStepIndex < sop.steps.length) {
            const step = sop.steps[currentStepIndex];
            if (step.action) {
                if (handleCardActionRef.current) {
                     handleCardActionRef.current(step.action, {
                        ...additionalPayload,
                        sopContext: sopContext,
                    });
                }
            } else {
                showCompletionMessage();
            }
        } else {
            showCompletionMessage();
        }
    }, [addMessage]);

    const handleBotResponse = useCallback(async (userInput: string) => {
        setIsLoading(true);

        const lowerInput = userInput.toLowerCase().trim();

        if (lowerInput === 'help') {
            addMessage({
                actor: Actor.BOT,
                content: `Here are the available commands:

• help: Show this help message.
• welcome: Display the welcome card.
• clean / clear: Clear the chat and refresh the app.
• tips: Show helpful tips and common commands.
• new config: Start the configuration creation wizard.
• run test: Start the test execution flow.
• show benchmarks for [Project Name]: List benchmark datasets.
• find [Query]: Search for a configuration.`
            });
            setIsLoading(false);
            return;
        }

        if (lowerInput === 'welcome') {
            addMessage({ actor: Actor.BOT, card: { type: CardType.WELCOME } });
            setIsLoading(false);
            return;
        }
        
        if (lowerInput === 'clean' || lowerInput === 'clear') {
            window.location.reload();
            return;
        }
        
        if (lowerInput === 'tips') {
            addMessage({ actor: Actor.BOT, content: "Opening helpful tips..." });
            setIsFlashcardModalOpen(true);
            setIsLoading(false);
            return;
        }
        
        await new Promise(res => setTimeout(res, 1000));

        const words = lowerInput.replace(/[,.]/g, '').split(' ');

        if (lowerInput.includes('benchmark') || lowerInput.includes('golden')) {
            const potentialProject = words.find(word => benchmarks.some(b => b.projectName.toLowerCase() === word));
            const potentialVendor = words.find(word => word.toUpperCase().startsWith('VEN-'));

            if (potentialProject && potentialVendor) {
                const projectBenchmarks = benchmarks.filter(b => b.projectName.toLowerCase() === potentialProject);
                let isCovered = false;
                for (const benchmark of projectBenchmarks) {
                    if (benchmark.coveredVendors.some(v => v.toLowerCase() === potentialVendor)) {
                        isCovered = true;
                        break;
                    }
                }
                addMessage({ actor: Actor.BOT, content: `Checking coverage for vendor ${potentialVendor.toUpperCase()} in ${potentialProject}...` });
                addMessage({ actor: Actor.BOT, content: isCovered ? `Yes, vendor ${potentialVendor.toUpperCase()} is covered by at least one benchmark dataset for this project.` : `No, vendor ${potentialVendor.toUpperCase()} is not found in any benchmark datasets for this project.` });

            } else if (potentialProject) {
                const projectBenchmarks = benchmarks.filter(b => b.projectName.toLowerCase() === potentialProject);
                if (projectBenchmarks.length > 0) {
                    addMessage({ actor: Actor.BOT, content: `Found ${projectBenchmarks.length} golden benchmark dataset(s) for project ${potentialProject}:` });
                    projectBenchmarks.forEach(benchmark => {
                        addMessage({ actor: Actor.BOT, card: { type: CardType.BENCHMARK_LIST, payload: benchmark } });
                    });
                } else {
                    addMessage({ actor: Actor.BOT, content: `I couldn't find any benchmark datasets for project ${potentialProject}.` });
                }
            } else {
                addMessage({ actor: Actor.BOT, content: "Which project's benchmark datasets would you like to see? For example, 'show benchmarks for Auto-billing'." });
            }
        } else if (lowerInput.includes('test')) {
             addMessage({ actor: Actor.BOT, content: "Sure, which configuration do you want to run a test for?" });
             addMessage({ actor: Actor.BOT, card: { type: CardType.CONFIG_SELECTOR, payload: { source: 'quickAction' } } });
        } else if (lowerInput.includes('config') || lowerInput.includes('add') || lowerInput.includes('new')) {
             addMessage({ 
                actor: Actor.BOT,
                card: {
                    type: CardType.CONFIG_CREATOR_CHOOSER,
                    payload: { }
                }
             });
        } else if (lowerInput.includes('pause') || lowerInput.includes('stop') || lowerInput.includes('disable')) {
             addMessage({
                actor: Actor.BOT,
                card: {
                    type: CardType.CONFIRMATION,
                    payload: { action: 'PAUSE', project: 'Auto-billing' }
                }
             });
        } else if (lowerInput.includes('query') || lowerInput.includes('find') || lowerInput.includes('check')) {
            const potentialProject = words.find(word => configs.some(c => c.projectName.toLowerCase() === word));
            const potentialVendor = words.find(word => configs.some(c => c.vendorId?.toLowerCase() === word));

            const matches = configs.filter(config => {
                const projectMatch = potentialProject && config.projectName.toLowerCase() === potentialProject;
                const vendorMatch = potentialVendor && config.vendorId?.toLowerCase() === potentialVendor;

                if (potentialProject && potentialVendor) {
                    return projectMatch && vendorMatch;
                }
                if (potentialProject) {
                    return projectMatch;
                }
                 if (potentialVendor) {
                    return vendorMatch;
                }
                return false;
            });

            if (matches.length > 0) {
                addMessage({
                    actor: Actor.BOT,
                    content: `Found ${matches.length} matching configuration(s):`
                });
                matches.forEach(config => {
                    addMessage({
                        actor: Actor.BOT,
                        card: {
                            type: CardType.CONFIG_DETAILS,
                            payload: config
                        }
                    });
                });
            } else {
                addMessage({ actor: Actor.BOT, content: "I couldn't find a configuration matching your query. Try 'check config for Auto-billing' or 'find VEN-12345'." });
            }
        } else {
             addMessage({ actor: Actor.BOT, content: `I'm not sure how to handle "${userInput}". Try "new config", "test AutoVouch", or "show benchmarks".` });
        }

        setIsLoading(false);
    }, [addMessage, configs, benchmarks, setIsFlashcardModalOpen]);

    useEffect(() => {
        if (!initialized.current) {
            initialized.current = true;
            const initialBotMessage = () => {
                setIsLoading(true);
                setTimeout(() => {
                    addMessage({
                        actor: Actor.BOT,
                        card: { type: CardType.WELCOME }
                    });
                    setIsLoading(false);
                }, 1000);
            };
            initialBotMessage();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleSendMessage = () => {
        if (input.trim() === '') return;
        addMessage({ actor: Actor.USER, content: input });
        handleBotResponse(input);
        setInput('');
    };
    
    const handleAskGemini = async () => {
        if (input.trim() === '') return;
        
        const userInput = input;
        addMessage({ actor: Actor.USER, content: userInput });
        setInput('');
        setIsLoading(true);

        try {
            const context = `
                AVAILABLE CONFIGURATIONS: ${JSON.stringify(configs, null, 2)}
                AVAILABLE BENCHMARKS: ${JSON.stringify(benchmarks, null, 2)}
                BUSINESS RULES: ${JSON.stringify(businessRules, null, 2)}
                CONVERSATION HISTORY (last 10): ${messages.slice(-10).map(m => `${m.actor === Actor.BOT ? 'BOT' : 'USER'}: ${m.content || '(Interactive Card)'}`).join('\n')}
                ${knowledgeBaseText ? `--- \nUSER-PROVIDED KNOWLEDGE BASE:\n${knowledgeBaseText}` : ''}
            `;

            const prompt = `
                SYSTEM INSTRUCTION: You are an expert AI assistant for the FlowX SOP Bot. Your role is to help users understand their data and activities. Use the provided context, ESPECIALLY THE USER-PROVIDED KNOWLEDGE BASE, to answer questions about configurations, business rules, benchmark data, test results, and conversation history. Prioritize information from the knowledge base. Be concise and helpful. Format your output using Markdown, especially for tables, lists, or code blocks.
                ---
                CONTEXT:
                ${context}
                ---
                USER QUESTION:
                ${userInput}
            `;
            
            console.log('[App] Sending the following prompt to AI Service:', { prompt });
            const geminiText = await generateContentFromPrompt(prompt, appSettings.geminiModel);
            addMessage({ actor: Actor.BOT, content: geminiText, isGemini: true });

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
            console.error("[App] A detailed error occurred while asking Gemini:", error);
            addMessage({ actor: Actor.BOT, content: `Sorry, I had trouble connecting to the AI assistant. Please check the console and your environment variables. Error: ${errorMessage}`, isGemini: true });
        } finally {
            setIsLoading(false);
        }
    };

    const addFlashcardsFromKnowledgeChunk = useCallback(async (newKnowledgeChunk: string, sourceFileId: string, sourceFileName: string) => {
        addMessage({
            actor: Actor.BOT,
            content: `Analyzing "${sourceFileName}" to generate new tips...`
        });
        
        try {
            console.log(`[App] Generating flashcards from ${sourceFileName}.`);
            const newCardsData = await generateFlashcardsFromText(newKnowledgeChunk, appSettings.geminiModel);
            const validNewCards = newCardsData.filter(card => card.question && card.answer);
            
            if (validNewCards.length > 0) {
                const newFlashcardsWithIds = validNewCards.map((card, index) => ({
                    ...card,
                    id: 100 + Date.now() + index,
                    sourceFileId: sourceFileId
                }));
                
                setGeneratedFlashcards(prev => [...prev, ...newFlashcardsWithIds]);

                addMessage({
                    actor: Actor.BOT,
                    content: `I've analyzed the content from "${sourceFileName}" and added ${newFlashcardsWithIds.length} new flashcards. You can view all tips by clicking 'Tips' or typing 'tips'.`
                });
            } else {
                 addMessage({
                    actor: Actor.BOT,
                    content: `I analyzed "${sourceFileName}", but couldn't find any key concepts to create new flashcards from.`
                });
            }
        } catch (error) {
            console.error(`[App] A detailed error occurred while generating flashcards from ${sourceFileName}:`, error);
            addMessage({
                actor: Actor.BOT,
                content: "Sorry, I had trouble generating new tips from that document. The existing tips are still available."
            });
        }
    }, [addMessage, appSettings.geminiModel]);

    const handleKnowledgeFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;

        // FIX: Explicitly type `file` as `File` to resolve TypeScript errors where it was inferred as `unknown`.
        const fileReadPromises = Array.from(files).map((file: File) => {
            return new Promise<{ file: File, content: string } | { file: File, error: string }>((resolve) => {
                if (!file.type.startsWith('text/') && !file.name.endsWith('.md')) {
                    resolve({ file, error: `Skipping "${file.name}": Only Markdown (.md) or text files are accepted.` });
                    return;
                }
                const reader = new FileReader();
                reader.onload = (e) => resolve({ file, content: e.target?.result as string });
                reader.onerror = () => resolve({ file, error: `Error reading "${file.name}".` });
                reader.readAsText(file);
            });
        });

        const results = await Promise.all(fileReadPromises);

        const newFiles: KnowledgeFile[] = [];
        const newKnowledgeChunks: { content: string, fileId: string, fileName: string }[] = [];

        results.forEach(result => {
            if ('error' in result) {
                addMessage({ actor: Actor.BOT, content: result.error });
            } else if (result.content) {
                const fileId = `${result.file.name}-${Date.now()}`;
                newFiles.push({ id: fileId, name: result.file.name, content: result.content });
                newKnowledgeChunks.push({ content: result.content, fileId: fileId, fileName: result.file.name });
            }
        });

        if (newFiles.length > 0) {
            setKnowledgeFiles(prev => [...prev, ...newFiles]);
            addMessage({ actor: Actor.BOT, content: `Successfully loaded content from ${newFiles.length} file(s) into the knowledge base.` });
            
            newKnowledgeChunks.forEach(chunk => {
                addFlashcardsFromKnowledgeChunk(chunk.content, chunk.fileId, chunk.fileName);
            });
        }

        if (event.target) {
            event.target.value = '';
        }
    };

    const handleClearKnowledgeBase = () => {
        setKnowledgeFiles([]);
        setGeneratedFlashcards([]);
        addMessage({
            actor: Actor.BOT,
            content: "The custom knowledge base and its generated tips have been cleared."
        });
    };

    const handleDeleteKnowledgeFile = (fileIdToDelete: string) => {
        const fileToDelete = knowledgeFiles.find(f => f.id === fileIdToDelete);
        if (!fileToDelete) return;

        setKnowledgeFiles(prev => prev.filter(f => f.id !== fileIdToDelete));
        setGeneratedFlashcards(prev => prev.filter(card => card.sourceFileId !== fileIdToDelete));
        
        addMessage({
            actor: Actor.BOT,
            content: `Knowledge file "${fileToDelete.name}" and its associated tips have been removed.`
        });
    };


    const handleCardAction = useCallback(async (action: ActionType, payload?: any) => {
        setIsLoading(true);
        
        const checkAndAdvanceSop = (currentSopContext: any, additionalPayload: object = {}) => {
            if (currentSopContext) {
                const nextStepContext = { ...currentSopContext, currentStep: currentSopContext.currentStep + 1 };
                const mergedPayload = { ...payload, ...additionalPayload };
                triggerSopStep(nextStepContext, mergedPayload);
            }
        };

        switch(action) {
            case ActionType.SHOW_BIZ_RULES:
                addMessage({ actor: Actor.USER, content: "Manage Business Rules" });
                addMessage({ actor: Actor.BOT, card: { type: CardType.BIZ_RULES_DOMAIN_SELECTOR } });
                break;
            case ActionType.SELECT_BIZ_RULE_DOMAIN:
                 addMessage({ actor: Actor.USER, content: `Select Domain: ${payload.domain}` });
                 
                 let cardType = CardType.GENERATIVE_BIZ_RULES_MANAGER;
                 if (payload.domain === 'Part Catalog(MDT)') {
                     cardType = CardType.PART_CATALOG_RULES_MANAGER;
                 }

                 addMessage({ 
                     actor: Actor.BOT, 
                     card: { 
                         type: cardType, 
                         payload: { 
                             domain: payload.domain,
                             rules: businessRules
                         } 
                    } 
                });
                break;
            case ActionType.GENERATE_RULE_SCHEMA:
                 try {
                     const schema: RuleSchema = await generateRuleSchema(payload.domain, payload.intentText, appSettings.geminiModel);
                     updateCardInMessage(payload.messageId, { schema: schema });
                 } catch (e) {
                     addMessage({ actor: Actor.BOT, content: "Sorry, I encountered an error generating the UI. Please try again." });
                 }
                 break;
            case ActionType.SAVE_BIZ_RULE:
                const savedRule = payload.rule as BusinessRule;
                setBusinessRules(prev => [...prev, savedRule]);
                // Update existing card to show new rule in list
                 updateCardInMessage(payload.messageId, {
                    rules: [...businessRules, savedRule] 
                });
                addMessage({ actor: Actor.BOT, content: `Rule saved successfully.` });
                break;
            case ActionType.DELETE_BIZ_RULE:
                const ruleIdToDelete = payload.ruleId;
                const newRules = businessRules.filter(r => r.id !== ruleIdToDelete);
                setBusinessRules(newRules);
                updateCardInMessage(payload.messageId, { rules: newRules });
                addMessage({ actor: Actor.BOT, content: "Business rule deleted." });
                break;
            case ActionType.SHOW_BENCHMARK_WIZARD:
                addMessage({ actor: Actor.USER, content: "Add new Golden Benchmark" });
                addMessage({ actor: Actor.BOT, card: { type: CardType.BENCHMARK_WIZARD, payload: { projectName: payload?.projectName } } });
                break;
            case ActionType.SUBMIT_BENCHMARK_WIZARD: {
                addMessage({ actor: Actor.USER, content: `Save benchmark: ${payload.benchmark.id}` });
                const newBenchmark = payload.benchmark as BenchmarkDataset;
                
                let isUpdate = false;
                setBenchmarks(prev => {
                    const existingIndex = prev.findIndex(b => b.id === newBenchmark.id);
                    if (existingIndex !== -1) {
                        isUpdate = true;
                        const updatedBenchmarks = [...prev];
                        updatedBenchmarks[existingIndex] = newBenchmark;
                        return updatedBenchmarks;
                    }
                    return [...prev, newBenchmark];
                });

                updateCardInMessage(payload.messageId, {
                    isSaved: true,
                    benchmark: newBenchmark,
                    projectName: newBenchmark.projectName,
                });

                if (isUpdate) {
                    addMessage({ actor: Actor.BOT, content: `Benchmark "${newBenchmark.id}" updated successfully.` });
                } else {
                    addMessage({ actor: Actor.BOT, content: `Benchmark "${newBenchmark.id}" saved successfully.` });
                    addMessage({ actor: Actor.BOT, card: { type: CardType.BENCHMARK_LIST, payload: newBenchmark } });
                }
                break;
            }
            case ActionType.SHOW_JSON_IMPORTER:
                 addMessage({ actor: Actor.USER, content: "Import Config from JSON" });
                 addMessage({ actor: Actor.BOT, card: { type: CardType.JSON_IMPORTER, payload } });
                 break;
            case ActionType.IMPORT_JSON_CONFIG:
                addMessage({ actor: Actor.USER, content: "Imported JSON Configuration" });
                updateCardInMessage(payload.messageId, { status: 'imported' });
                // eslint-disable-next-line no-case-declarations
                const settings = JSON.parse(payload.jsonString);

                const newConfig: Configuration = {
                    projectName: 'Imported Project',
                    level: 'Project',
                    status: 'Active',
                    lastModified: new Date().toISOString().split('T')[0],
                    createdBy: 'importer@example.com',
                    settings: settings
                };
                
                const settingsSchema: ConfigTemplate['settingsSchema'] = {};
                for (const [key, value] of Object.entries(settings)) {
                    if (typeof value === 'boolean') {
                        settingsSchema[key] = 'boolean';
                    } else if (typeof value === 'number') {
                        settingsSchema[key] = 'number';
                    } else if (typeof value === 'object' && value !== null) {
                        settingsSchema[key] = 'json';
                    } else {
                        settingsSchema[key] = 'string';
                    }
                }
                
                const newTemplate: ConfigTemplate = {
                    templateName: 'Generated Template for Imported Project',
                    projectName: 'Imported Project',
                    description: 'Auto-generated from imported JSON data.',
                    settingsSchema: settingsSchema
                };

                addMessage({ actor: Actor.BOT, content: "Successfully imported configuration and generated a template. Please review and save." });
                addMessage({ actor: Actor.BOT, card: { type: CardType.CONFIG_DETAILS, payload: newConfig } });
                addMessage({ actor: Actor.BOT, card: { type: CardType.TEMPLATE_EDITOR, payload: { template: newTemplate } } });
                break;
            case ActionType.SAVE_GENERATED_TEMPLATE:
                addMessage({ actor: Actor.USER, content: `Save Template: ${payload.template.templateName}` });
                setTemplates(prev => [...prev, payload.template]);
                updateCardInMessage(payload.messageId, { template: payload.template, isSaved: true });
                addMessage({ actor: Actor.BOT, content: `Template "${payload.template.templateName}" has been saved to the library.` });
                break;
            case ActionType.REWIND_SOP_STEP:
                 addMessage({ actor: Actor.USER, content: "Go back to the previous step" });
                 const { sopContext } = payload;
                 if (sopContext && sopContext.currentStep > 1) {
                     const prevStepContext = { ...sopContext, currentStep: sopContext.currentStep - 1 };
                     triggerSopStep(prevStepContext);
                 }
                break;
            case ActionType.SHOW_FLASHCARDS:
                setIsFlashcardModalOpen(true);
                break;
            case ActionType.SHOW_SOP_CHOOSER:
                addMessage({ actor: Actor.USER, content: "Start a Guided SOP" });
                addMessage({ actor: Actor.BOT, card: { type: CardType.SOP_CHOOSER } });
                break;
            case ActionType.START_SOP:
                addMessage({ actor: Actor.USER, content: `Selected SOP: ${payload.sopTitle}`});
                const newSopContext = {
                    guideId: Date.now(),
                    sopType: payload.sopType,
                    sopTitle: payload.sopTitle,
                    currentStep: 1,
                    data: {}
                };
                triggerSopStep(newSopContext);
                break;
            case ActionType.SHOW_CONFIG_SELECTOR:
                addMessage({ actor: Actor.USER, content: "Select Existing Configuration" });
                addMessage({
                    actor: Actor.BOT,
                    card: {
                        type: CardType.CONFIG_SELECTOR,
                        payload: payload
                    }
                });
                break;
            case ActionType.SELECT_CONFIG:
                 addMessage({ actor: Actor.USER, content: `Selected config: ${payload.selectedConfig.projectName} ${payload.selectedConfig.vendorId || ''}` });
                 updateCardInMessage(payload.messageId, { status: 'selected' });
                 
                 if (payload.sopContext) {
                    checkAndAdvanceSop(payload.sopContext, { selectedConfig: payload.selectedConfig });
                 } else if (payload.source === 'clone') {
                    addMessage({ actor: Actor.BOT, content: "Starting wizard with cloned data..." });
                    addMessage({ actor: Actor.BOT, card: { type: CardType.CONFIG_WIZARD, payload: { step: 1, data: { clonedData: payload.selectedConfig, sopContext: payload.sopContext } } } });
                 } else if (payload.source === 'quickAction') {
                    addMessage({ actor: Actor.BOT, content: "Great. Now, how do you want to provide the test data?" });
                    addMessage({ actor: Actor.BOT, card: { type: CardType.TEST_STARTER, payload: { config: payload.selectedConfig } } });
                 }
                break;
            case ActionType.START_CONFIG:
                addMessage({ actor: Actor.USER, content: "Start: Create Configuration" });
                addMessage({ 
                    actor: Actor.BOT,
                    card: {
                        type: CardType.CONFIG_CREATOR_CHOOSER,
                        payload: payload
                    }
                 });
                break;
            case ActionType.START_FROM_TEMPLATE:
                addMessage({ actor: Actor.USER, content: "Create config from template" });
                addMessage({ actor: Actor.BOT, card: { type: CardType.TEMPLATE_SELECTOR, payload: payload } });
                break;
            case ActionType.START_CLONE:
                addMessage({ actor: Actor.USER, content: "Clone existing config" });
                addMessage({ actor: Actor.BOT, card: { type: CardType.CONFIG_SELECTOR, payload: { source: 'clone', sopContext: payload.sopContext } } });
                break;
            case ActionType.SELECT_TEMPLATE:
                addMessage({ actor: Actor.USER, content: `Selected template: ${payload.selectedTemplate.templateName}` });
                updateCardInMessage(payload.messageId, { status: 'selected' });
                addMessage({ actor: Actor.BOT, content: "Starting wizard with the selected template..." });
                addMessage({
                    actor: Actor.BOT,
                    card: {
                        type: CardType.CONFIG_WIZARD,
                        payload: { step: 1, data: { template: payload.selectedTemplate, sopContext: payload.sopContext } }
                    }
                });
                break;
            case ActionType.SUBMIT_CONFIG_STEP:
                const { step: currentStep, data, messageId } = payload;
                const totalSteps = data.level === 'Vendor' ? 4 : 3;
                
                if (currentStep === 1) {
                    updateCardInMessage(messageId, { step: 2, data });
                } else if (currentStep === 2) {
                    const nextStep = data.level === 'Vendor' ? 3 : totalSteps;
                    updateCardInMessage(messageId, { step: nextStep, data });
                } else if (currentStep === 3 && data.level === 'Vendor') {
                    updateCardInMessage(messageId, { step: 4, data });
                } else if (currentStep === totalSteps) {
                    updateCardInMessage(messageId, { status: 'complete', data });
                    const newConfig: Configuration = {
                        projectName: data.projectName,
                        vendorId: data.vendorId,
                        level: data.level,
                        status: 'Active',
                        lastModified: new Date().toISOString().split('T')[0],
                        createdBy: 'user@example.com',
                        settings: data.settings
                    };
                    addMessage({ actor: Actor.BOT, content: `Configuration for ${data.projectName} ${data.vendorId ? `(${data.vendorId})` : ''} submitted successfully!`});
                    
                    if (data.sopContext) {
                        checkAndAdvanceSop(data.sopContext, { selectedConfig: newConfig });
                    }
                }
                break;
            case ActionType.UPDATE_CONFIG:
                const { originalConfig, updatedConfig } = payload;
                setConfigs(prev => prev.map(c => 
                     (c.projectName === originalConfig.projectName && c.vendorId === originalConfig.vendorId)
                        ? updatedConfig
                        : c
                ));
                updateCardInMessage(payload.messageId, updatedConfig);
                addMessage({
                    actor: Actor.BOT,
                    content: `Configuration for "${updatedConfig.projectName}" has been successfully updated.`
                });
                break;
            case ActionType.START_TEST:
                 addMessage({ actor: Actor.USER, content: `Run Test` });
                 addMessage({ actor: Actor.BOT, content: "Sure, which configuration do you want to run a test for?" });
                 addMessage({ actor: Actor.BOT, card: { type: CardType.CONFIG_SELECTOR, payload: { source: 'quickAction' } } });
                break;
            case ActionType.START_BATCH_TEST:
                if (payload.path) {
                    addMessage({ actor: Actor.USER, content: `Start batch test from: ${payload.path}` });
                    addMessage({ actor: Actor.BOT, content: `Test submitted to NiFi. The automated flow is running and may take a moment. I will post the results here once the asynchronous job is complete.` });
                    
                    if (window.parent !== window) {
                        console.log(`[BOT->NIFI] Posting message to highlight flow for: ${payload.config.projectName}`);
                        window.parent.postMessage({
                            action: 'highlight-flow',
                            configName: payload.config.projectName,
                            vendorId: payload.config.vendorId,
                        }, '*');
                    }
                    
                    try {
                        const result = await triggerNiFiFlow({
                            path: payload.path,
                            benchmarkId: payload.benchmarkId,
                            config: payload.config
                        }, { nifiUrl: appSettings.nifiUrl, nifiEndpoint: appSettings.nifiEndpoint });

                        addMessage({
                            actor: Actor.BOT,
                            content: "NiFi flow complete. Here are the results:",
                            card: {
                                type: CardType.TEST_RESULTS_SUMMARY,
                                payload: { project: payload.config.projectName, matched: result.matched, mismatched: result.mismatched, testId: `TID-NIFI-${Date.now()}`, sopContext: payload.sopContext, benchmarkId: payload.benchmarkId }
                            }
                        });
                        checkAndAdvanceSop(payload.sopContext);
                    } catch (error) {
                        console.error("NiFi Flow Error:", error);
                        addMessage({ actor: Actor.BOT, content: `❌ Error: The NiFi job failed. Reason: ${error}` });
                    }
                } else {
                    addMessage({ actor: Actor.USER, content: "Run Verification Test" });
                    const config = payload.selectedConfig;
                    if (config) {
                         addMessage({
                            actor: Actor.BOT,
                            content: "Please provide the data for the test.",
                            card: {
                                type: CardType.TEST_STARTER,
                                payload: { sopContext: payload.sopContext, config: config }
                            }
                        });
                    } else {
                         addMessage({ actor: Actor.BOT, content: "Error: No configuration was selected or created in the previous step." });
                    }
                }
                break;
            case ActionType.RUN_TEST_WITH_FILE:
                addMessage({ actor: Actor.USER, content: `Run test with file: ${payload.file.name}` });
                updateCardInMessage(payload.messageId, { status: 'submitted' });
                addMessage({ actor: Actor.BOT, content: `File uploaded. Test submitted to NiFi. The automated flow is running and may take a moment. I will post the results here once the asynchronous job is complete.` });
                
                if (window.parent !== window) {
                    console.log(`[BOT->NIFI] Posting message to highlight flow for: ${payload.config.projectName}`);
                    window.parent.postMessage({
                        action: 'highlight-flow',
                        configName: payload.config.projectName,
                        vendorId: payload.config.vendorId,
                    }, '*');
                }

                try {
                    const result = await triggerNiFiFlow({
                        file: payload.file,
                        benchmarkId: payload.benchmarkId,
                        config: payload.config
                    }, { nifiUrl: appSettings.nifiUrl, nifiEndpoint: appSettings.nifiEndpoint });
            
                    addMessage({
                        actor: Actor.BOT,
                        content: "NiFi flow complete. Here are the results:",
                        card: {
                            type: CardType.TEST_RESULTS_SUMMARY,
                            payload: { project: payload.config.projectName, matched: result.matched, mismatched: result.mismatched, testId: `TID-NIFI-${Date.now()}`, sopContext: payload.sopContext, benchmarkId: payload.benchmarkId }
                        }
                    });
                    checkAndAdvanceSop(payload.sopContext);
                } catch (error) {
                    console.error("NiFi Flow Error:", error);
                    addMessage({ actor: Actor.BOT, content: `❌ Error: The NiFi job failed. Reason: ${error}` });
                }
                break;
             case ActionType.DOWNLOAD_REPORT:
                addMessage({ actor: Actor.USER, content: "Download Report" });
                addMessage({ actor: Actor.BOT, content: "Your report is being generated... Here is the link: detailed_report.xlsx" });
                break;
             case ActionType.TRIGGER_ANALYSIS:
                addMessage({ actor: Actor.USER, content: "Analyze Discrepancies" });
                addMessage({ actor: Actor.BOT, content: "Running analysis on test results..." });
                await new Promise(res => setTimeout(res, 2000));
                addMessage({
                    actor: Actor.BOT,
                    card: {
                        type: CardType.ANALYSIS_RESULTS,
                        payload: { dataQuality: 12, logic: 3, testId: payload.testId, sopContext: payload.sopContext }
                    }
                });
                checkAndAdvanceSop(payload.sopContext);
                break;
            case ActionType.ANALYSIS_FEEDBACK:
                addMessage({ actor: Actor.USER, content: `Feedback on analysis: ${payload.isGood ? 'Helpful' : 'Not helpful'}` });
                // eslint-disable-next-line no-case-declarations
                const analysisMessage = messages.find(m => m.id === payload.messageId);
                if (analysisMessage) {
                    updateCardInMessage(payload.messageId, { ...analysisMessage.card?.payload, feedbackGiven: true });
                }
                addMessage({ actor: Actor.BOT, content: "Thanks for your feedback! It helps me improve." });
                break;
            case ActionType.VIEW_METABASE_REPORT:
                addMessage({ actor: Actor.USER, content: "View on Metabase" });
                addMessage({ actor: Actor.BOT, content: "Here is the link to the detailed report on Metabase: [metabase.example.com/d/12345](https://metabase.example.com/d/12345)" });
                break;
            case ActionType.INVESTIGATE_ROOT_CAUSE:
                addMessage({ actor: Actor.USER, content: "Find Root Cause & Suggestions" });
                addMessage({ actor: Actor.BOT, content: "Investigating discrepancies... this may take a moment." });
                await new Promise(res => setTimeout(res, 2500));
                addMessage({
                    actor: Actor.BOT,
                    card: {
                        type: CardType.ROOT_CAUSE_ANALYSIS,
                        payload: {
                            cause: "Analysis suggests a high probability of misaligned master data for vendor IDs in the 'VEN-6xxxx' range.",
                            suggestedActions: [
                                { title: "Refresh Vendor Master Data & Rerun Test", action: "REFRESH_DATA" },
                                { title: "Adjust Config Threshold for this Vendor", action: "ADJUST_CONFIG" },
                                { title: "Escalate to Data Stewardship Team", action: "ESCALATE" }
                            ],
                             sopContext: payload.sopContext
                        }
                    }
                });
                 checkAndAdvanceSop(payload.sopContext);
                break;
             case ActionType.ROOT_CAUSE_FEEDBACK:
                addMessage({ actor: Actor.USER, content: `Feedback on root cause: ${payload.isGood ? 'Helpful' : 'Not helpful'}` });
                // eslint-disable-next-line no-case-declarations
                const rootCauseMessage = messages.find(m => m.id === payload.messageId);
                if (rootCauseMessage) {
                    updateCardInMessage(payload.messageId, { ...rootCauseMessage.card?.payload, feedbackGiven: true });
                }
                addMessage({ actor: Actor.BOT, content: "Thanks for your feedback! It helps me improve." });
                break;
             case ActionType.SUGGESTED_ACTION:
                addMessage({ actor: Actor.USER, content: `Perform action: ${payload.title}` });
                addMessage({ actor: Actor.BOT, content: `Acknowledged. I have initiated the action: "${payload.title}".`});
                break;
            case ActionType.TRIGGER_DIAGNOSTIC:
                 addMessage({ actor: Actor.USER, content: `Diagnose record ${payload?.recordId}` });
                 addMessage({ actor: Actor.BOT, content: "Fetching details for diagnostic..." });
                 await new Promise(res => setTimeout(res, 1500));
                 addMessage({
                    actor: Actor.BOT,
                    card: {
                        type: CardType.INTERACTIVE_DIAGNOSTIC,
                        payload: { 
                            recordId: payload?.recordId || 'CM-123', 
                            data: { 'invoice_amount': 100.50, 'system_amount': 95.50, 'rule_applied': 'RULE-005' }, 
                            status: 'new',
                            sopContext: payload.sopContext
                        }
                    }
                 });
                break;
            case ActionType.RERUN_DIAGNOSTIC:
                updateCardInMessage(payload.messageId, { ...payload, status: 'running' });
                await new Promise(res => setTimeout(res, 2500));
                updateCardInMessage(payload.messageId, { ...payload, status: 'resolved' });
                break;
            case ActionType.CONFIRM_PAUSE_PRODUCTION:
                addMessage({ actor: Actor.USER, content: "Confirm PAUSE Production" });
                addMessage({ actor: Actor.BOT, content: `Acknowledged. Production process for ${payload?.project} is now paused.` });
                break;
            case ActionType.CANCEL_ACTION:
                addMessage({ actor: Actor.USER, content: "Cancel Action" });
                addMessage({ actor: Actor.BOT, content: "Action cancelled." });
                break;
            case ActionType.UPLOAD_FILE:
                 if (payload && payload.file) {
                    updateCardInMessage(payload.messageId, { status: 'uploading', fileName: payload.file.name });
                    await new Promise(res => setTimeout(res, 2000));
                    updateCardInMessage(payload.messageId, { status: 'processing' });
                    await new Promise(res => setTimeout(res, 3000));
                    updateCardInMessage(payload.messageId, { status: 'complete', result: 'File processed. Standardized 56 rows.' });
                    checkAndAdvanceSop(payload.sopContext);
                 } else {
                    addMessage({ actor: Actor.USER, content: "Upload Data File" });
                    addMessage({ actor: Actor.BOT, card: { type: CardType.FILE_UPLOAD, payload: { status: 'idle', sopContext: payload.sopContext } } });
                 }
                 break;
            case ActionType.VIEW_BENCHMARK_DETAILS:
                addMessage({ actor: Actor.USER, content: `Show details for benchmark ${payload.benchmarkId}` });
                const benchmark = benchmarks.find(b => b.id === payload.benchmarkId);
                if (benchmark) {
                    addMessage({ 
                        actor: Actor.BOT, 
                        content: `Here are the details for benchmark dataset ${payload.benchmarkId}:`,
                        card: { type: CardType.BENCHMARK_LIST, payload: benchmark }
                    });
                } else {
                    addMessage({ actor: Actor.BOT, content: `Sorry, I couldn't find details for benchmark ${payload.benchmarkId}.` });
                }
                break;
            case ActionType.VIEW_BENCHMARK_ON_METABASE:
                addMessage({ actor: Actor.USER, content: `View benchmark ${payload.benchmarkId} on Metabase` });
                addMessage({ actor: Actor.BOT, content: `Here is the link to the detailed dashboard for this benchmark: [metabase.example.com/d/benchmark-${payload.benchmarkId}](https://metabase.example.com/d/benchmark-${payload.benchmarkId})` });
                break;
        }

        setIsLoading(false);
    }, [addMessage, updateCardInMessage, triggerSopStep, messages, configs, benchmarks, templates, setIsFlashcardModalOpen, appSettings, businessRules]);
    
    const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        e.preventDefault();
        
        const startWidth = panelWidth;
        const startX = e.clientX;

        const handleMouseMove = (moveEvent: MouseEvent) => {
            const currentX = moveEvent.clientX;
            const dx = currentX - startX;
            const newWidth = startWidth - dx;

            const minWidth = 384;
            const maxWidth = 896;
            
            if (newWidth >= minWidth && newWidth <= maxWidth) {
                setPanelWidth(newWidth);
            }
        };

        const handleMouseUp = () => {
            document.body.style.cursor = 'default';
            document.body.style.userSelect = 'auto';
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };

        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    }, [panelWidth]);
    
    useEffect(() => {
        handleCardActionRef.current = handleCardAction;
    }, [handleCardAction]);

    const handleSearchResultClick = (config: Configuration) => {
        addMessage({
            actor: Actor.BOT,
            content: `Displaying details for configuration: ${config.projectName}`,
            card: {
                type: CardType.CONFIG_DETAILS,
                payload: config,
            }
        });
        setSearchQuery('');
        setShowSearchResults(false);
    };

    return (
        <>
            <button
                onClick={() => setIsPanelOpen(true)}
                className={`fixed top-4 right-5 z-50 p-3 bg-teal-900 text-white rounded-full shadow-lg hover:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-600 focus:ring-offset-gray-100 transition-all duration-300 ${isPanelOpen ? 'opacity-0 scale-0' : 'opacity-100 scale-100'}`}
                aria-label="Open FlowX SOP Bot"
            >
                <BotIcon />
            </button>

            <div 
                className={`fixed top-0 right-0 h-screen bg-white text-gray-800 flex flex-col font-sans shadow-2xl border-l border-gray-200 transition-transform duration-300 ease-in-out ${isPanelOpen ? 'translate-x-0' : 'translate-x-full'}`}
                style={{ width: `${panelWidth}px` }}
            >
                <div
                    className="absolute top-0 -left-1 w-2 h-full cursor-col-resize group z-30"
                    onMouseDown={handleMouseDown}
                    aria-label="Resize panel"
                    role="separator"
                    aria-orientation="vertical"
                >
                    <div className="w-0.5 h-full bg-transparent group-hover:bg-teal-600 transition-colors duration-200 mx-auto"></div>
                </div>
                
                <FlashcardModal 
                    isOpen={isFlashcardModalOpen} 
                    onClose={() => setIsFlashcardModalOpen(false)}
                    cards={[...mockFlashcards, ...generatedFlashcards]}
                />
                <DemoGuideModal 
                    isOpen={isDemoModalOpen}
                    onClose={() => setIsDemoModalOpen(false)}
                />
                 <SettingsModal
                    isOpen={isSettingsModalOpen}
                    onClose={() => setIsSettingsModalOpen(false)}
                    currentSettings={appSettings}
                    onSave={(newSettings) => {
                        setAppSettings(newSettings);
                        setIsSettingsModalOpen(false);
                        addMessage({ actor: Actor.BOT, content: "Settings have been updated." });
                    }}
                    knowledgeFiles={knowledgeFiles}
                    onDeleteKnowledgeFile={handleDeleteKnowledgeFile}
                />
                {appMetadata && (
                    <AboutModal
                        isOpen={isAboutModalOpen}
                        onClose={() => setIsAboutModalOpen(false)}
                        version={APP_VERSION}
                        name={appMetadata.name}
                        description={appMetadata.description}
                    />
                )}
                <header className="bg-gray-50 p-3 shadow-sm z-20 flex justify-between items-center shrink-0 border-b border-gray-200">
                    <h1 className="text-lg font-semibold text-gray-800">{appMetadata?.name || 'FlowX SOP Bot'} <span className="text-xs font-mono text-gray-400 ml-1">v{APP_VERSION}</span></h1>
                    <button 
                        onClick={() => setIsPanelOpen(false)}
                        className="text-gray-500 hover:text-gray-800 transition-colors"
                        aria-label="Close panel"
                    >
                        <XIcon />
                    </button>
                </header>
                
                <div className="p-3 border-b border-t border-gray-200 shrink-0">
                    <div className="relative" ref={searchRef}>
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                            <SearchIcon />
                        </span>
                        <input
                            type="text"
                            placeholder="Search configs..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onFocus={() => searchQuery && setShowSearchResults(true)}
                            className="w-full bg-gray-100 text-gray-800 placeholder-gray-500 border border-gray-300 rounded-md py-2 pl-10 pr-20 focus:outline-none focus:ring-2 focus:ring-teal-600"
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-1">
                             <button
                                onClick={() => setIsSettingsModalOpen(true)}
                                className="p-1 text-gray-500 hover:text-gray-800 transition-colors"
                                aria-label="Open settings"
                                title="Open settings"
                            >
                                <SettingsIcon className="h-6 w-6" />
                            </button>
                            <button
                                onClick={() => setIsDemoModalOpen(true)}
                                className="p-1 text-gray-500 hover:text-gray-800 transition-colors"
                                aria-label="Show demo guide"
                                title="Show demo guide"
                            >
                                <PlayCircleIcon />
                            </button>
                            <button
                                onClick={() => setIsFlashcardModalOpen(true)}
                                className="p-1 text-gray-500 hover:text-gray-800 transition-colors"
                                aria-label="Show tips and commands"
                                title="Show tips and commands"
                            >
                                <LightBulbIcon className="h-6 w-6" />
                            </button>
                             <button
                                onClick={() => setIsAboutModalOpen(true)}
                                className="p-1 text-gray-500 hover:text-gray-800 transition-colors"
                                aria-label="Show about information"
                                title="Show about information"
                            >
                                <InformationCircleIcon className="h-6 w-6" />
                            </button>
                        </div>

                        {showSearchResults && (
                            <div className="absolute mt-2 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto z-30">
                                <ul>
                                    {searchResults.length > 0 ? (
                                        searchResults.map(config => (
                                            <li
                                                key={`${config.projectName}-${config.vendorId || 'project'}`}
                                                className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                                                onClick={() => handleSearchResultClick(config)}
                                            >
                                                <div className="font-semibold">{config.projectName} <span className={`text-xs font-bold ${config.level === 'Project' ? 'text-teal-800' : 'text-green-700'}`}>({config.level})</span></div>
                                                <div className="text-sm text-gray-500">{config.vendorId || 'Applies to all vendors'}</div>
                                            </li>
                                        ))
                                    ) : (
                                        <li className="px-4 py-2 text-gray-500">No results found</li>
                                    )}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>

                <main className="flex-1 overflow-y-auto p-4 bg-gray-50">
                    <div className="space-y-6">
                        {messages.map((msg) => (
                            <div key={msg.id} className={`flex items-start gap-4 ${msg.actor === Actor.USER ? 'justify-end' : ''}`}>
                                {msg.actor === Actor.BOT && <BotIcon />}
                                <div className={`flex flex-col ${msg.actor === Actor.USER ? 'items-end' : 'items-start'}`}>
                                    <div className={`flex items-center space-x-2 ${msg.actor === Actor.USER ? 'flex-row-reverse space-x-reverse' : ''}`}>
                                        {msg.isGemini && <GeminiIcon className="h-4 w-4 text-teal-700" />}
                                        <span className="font-bold text-sm text-gray-800">{msg.actor === Actor.BOT ? (msg.isGemini ? 'FlowX SOP Bot (AI)' : 'FlowX SOP Bot') : 'You'}</span>
                                        <span className="text-xs text-gray-500">{msg.timestamp}</span>
                                    </div>
                                    <div className={`mt-1 max-w-lg w-full ${msg.actor === Actor.USER ? 'text-right' : ''}`}>
                                        {msg.content && (
                                            msg.isGemini ? (
                                                // FIX: The `className` prop on ReactMarkdown was causing a type error.
                                                // Moved the padding class (`p-4`) to the parent `div` to correctly style the container.
                                                <div className="bg-teal-50 border border-teal-200 rounded-lg text-gray-800 text-left p-4">
                                                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                                                        {msg.content}
                                                    </ReactMarkdown>
                                                </div>
                                            ) : (
                                                <div className={`px-4 py-2 rounded-lg inline-block whitespace-pre-wrap ${msg.actor === Actor.BOT ? 'bg-gray-200' : 'bg-teal-900 text-white'}`}>
                                                    {msg.content}
                                                </div>
                                            )
                                        )}
                                        {msg.card && <CardRenderer card={msg.card} onAction={handleCardAction} messageId={msg.id} allConfigs={configs} allTemplates={templates} allBenchmarks={benchmarks} />}
                                    </div>
                                </div>
                                {msg.actor === Actor.USER && <UserIcon />}
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex items-start gap-4">
                                <BotIcon />
                                <div className="flex flex-col items-start">
                                    <div className="flex items-center space-x-2">
                                        <span className="font-bold text-sm text-gray-800">FlowX SOP Bot</span>
                                    </div>
                                    <div className="mt-2 flex items-center space-x-2 px-4 py-2 bg-gray-200 rounded-lg">
                                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse"></div>
                                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse delay-75"></div>
                                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse delay-150"></div>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                </main>
                <footer className="bg-gray-100 p-4 border-t border-gray-200 z-10 shrink-0">
                    <div className="w-full">
                        <div className="flex items-center bg-white border border-gray-300 rounded-lg p-1">
                            <input
                                type="file"
                                ref={knowledgeFileInputRef}
                                onChange={handleKnowledgeFileChange}
                                className="hidden"
                                accept=".md,text/markdown"
                                multiple
                            />
                            <button 
                                className="p-2 text-gray-500 hover:text-gray-800 transition-colors"
                                onClick={() => knowledgeFileInputRef.current?.click()}
                                title="Upload Knowledge Document(s) (.md)"
                                aria-label="Upload Knowledge Document(s)"
                            >
                                <PaperclipIcon />
                            </button>
                            {knowledgeFiles.length > 0 && (
                                <button
                                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                                    onClick={handleClearKnowledgeBase}
                                    title="Clear all loaded knowledge files"
                                    aria-label="Clear all loaded knowledge files"
                                >
                                    <XCircleIcon className="h-4 w-4" />
                                </button>
                            )}
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSendMessage()}
                                placeholder="Type a message to the bot, or ask the AI..."
                                className="flex-1 bg-transparent px-2 text-gray-800 placeholder-gray-500 focus:outline-none"
                                disabled={isLoading}
                            />
                            <button
                                onClick={handleAskGemini}
                                disabled={isLoading || input.trim() === ''}
                                className="p-2 text-teal-800 rounded-md disabled:text-gray-400 disabled:cursor-not-allowed hover:text-teal-700 transition-colors"
                                aria-label="Ask Gemini AI"
                                title="Ask Gemini AI"
                            >
                                <SparklesIcon />
                            </button>
                            <button 
                                onClick={handleSendMessage} 
                                disabled={isLoading || input.trim() === ''}
                                className="p-2 ml-2 bg-teal-900 rounded-md text-white disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-teal-800 transition-colors"
                                aria-label="Send to bot"
                                title="Send to bot"
                            >
                                {isLoading ? <LoadingSpinner /> : <SendIcon />}
                            </button>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
};

export default App;
