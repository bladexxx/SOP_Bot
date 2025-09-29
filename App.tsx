import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Message, Actor, CardType, ActionType, Configuration, BenchmarkDataset, ConfigTemplate, Flashcard } from './types';
import { CardRenderer } from './components/CardRenderer';
import { BotIcon, UserIcon, SendIcon, PaperclipIcon, LoadingSpinner, SearchIcon, SparklesIcon, GeminiIcon, PlayCircleIcon, XIcon, XCircleIcon, InformationCircleIcon } from './components/Icons';
import { FlashcardModal } from './components/FlashcardModal';
import { DemoGuideModal } from './components/DemoGuideModal';
import { generateContentFromPrompt, generateFlashcardsFromText } from './services/aiService';
import { triggerNiFiFlow } from './services/nifiService';
import { sopDefinitions } from './components/SopTimeline';

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
        className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md mx-auto flex flex-col relative border border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex justify-between items-center p-4 border-b border-gray-700">
          <h2 id="about-title" className="text-lg font-bold text-white">About {name}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors" aria-label="Close about dialog">
            <XCircleIcon className="h-7 w-7" />
          </button>
        </header>

        <main className="p-6 text-gray-300 space-y-4">
            <p className="text-center text-sm">Version <span className="font-mono bg-gray-700 px-2 py-1 rounded">{version}</span></p>
            <p>{description}</p>
            <p className="text-xs text-gray-500 text-center pt-4">© {new Date().getFullYear()} FlowX. All rights reserved.</p>
        </main>
      </div>
    </div>
  );
};

const APP_VERSION = '1.2';

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
    const [appMetadata, setAppMetadata] = useState<{name: string, description: string} | null>(null);
    const [knowledgeBase, setKnowledgeBase] = useState<string>('');
    const [generatedFlashcards, setGeneratedFlashcards] = useState<Flashcard[]>([]);
    const [panelWidth, setPanelWidth] = useState(448); // 28rem = 448px
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLDivElement>(null);
    const knowledgeFileInputRef = useRef<HTMLInputElement>(null);
    const initialized = useRef(false);

    const [configs, setConfigs] = useState<Configuration[]>(mockConfigsData);
    const [templates, setTemplates] = useState<ConfigTemplate[]>(mockTemplatesData);
    const [benchmarks, setBenchmarks] = useState<BenchmarkDataset[]>(mockBenchmarkDatasets);
    
    // Using a ref for handleCardAction to prevent stale closures in triggerSopStep
    // FIX: Initialize useRef with null and update the type to allow null to fix the TypeScript error.
    const handleCardActionRef = useRef<((action: ActionType, payload?: any) => Promise<void>) | null>(null);

    // Fetch app metadata from JSON file on component mount
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

     // Handle clicks outside of search to close results
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowSearchResults(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Handle search filtering
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
                        payload: newPayload
                    }
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
                // This is a terminal step with no action, SOP is complete.
                showCompletionMessage();
            }
        } else {
            // This means the SOP is finished.
            showCompletionMessage();
        }
    }, [addMessage]);

    const handleBotResponse = useCallback(async (userInput: string) => {
        setIsLoading(true);

        const lowerInput = userInput.toLowerCase().trim();

        // Handle specific commands first
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
                CONVERSATION HISTORY (last 10): ${messages.slice(-10).map(m => `${m.actor === Actor.BOT ? 'BOT' : 'USER'}: ${m.content || '(Interactive Card)'}`).join('\n')}
                ${knowledgeBase ? `--- \nUSER-PROVIDED KNOWLEDGE BASE:\n${knowledgeBase}` : ''}
            `;

            const prompt = `
                SYSTEM INSTRUCTION: You are an expert AI assistant for the FlowX SOP Bot. Your role is to help users understand their data and activities. Use the provided context, ESPECIALLY THE USER-PROVIDED KNOWLEDGE BASE, to answer questions about configurations, business rules, benchmark data, test results, and conversation history. Prioritize information from the knowledge base. Be concise and helpful.
                ---
                CONTEXT:
                ${context}
                ---
                USER QUESTION:
                ${userInput}
            `;
            
            const geminiText = await generateContentFromPrompt(prompt);
            addMessage({ actor: Actor.BOT, content: geminiText, isGemini: true });

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
            console.error("Error calling AI Service:", error);
            addMessage({ actor: Actor.BOT, content: `Sorry, I had trouble connecting to the AI assistant. Please check the console and your environment variables. Error: ${errorMessage}`, isGemini: true });
        } finally {
            setIsLoading(false);
        }
    };

    const updateFlashcardsFromKnowledgeBase = useCallback(async (newKnowledge: string) => {
        addMessage({
            actor: Actor.BOT,
            content: "Analyzing document to generate new tips..."
        });
        
        try {
            const newCardsData = await generateFlashcardsFromText(newKnowledge);
            const validNewCards = newCardsData.filter(card => card.question && card.answer);
            
            if (validNewCards.length > 0) {
                const newFlashcardsWithIds = validNewCards.map((card, index) => ({
                    ...card,
                    id: 100 + Date.now() + index 
                }));
                
                setGeneratedFlashcards(newFlashcardsWithIds);

                addMessage({
                    actor: Actor.BOT,
                    content: `I've analyzed the document and generated ${newFlashcardsWithIds.length} new flashcards for you. You can view them by clicking 'Tips' or typing 'tips'.`
                });
            } else {
                 addMessage({
                    actor: Actor.BOT,
                    content: "I analyzed the document, but couldn't find any new key concepts to create flashcards from."
                });
                 setGeneratedFlashcards([]); // Clear any old ones
            }
        } catch (error) {
            console.error("Failed to update flashcards:", error);
            addMessage({
                actor: Actor.BOT,
                content: "Sorry, I had trouble generating new tips from that document. The default tips are still available."
            });
        }
    }, [addMessage]);

    const handleKnowledgeFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (file.type !== 'text/markdown' && !file.name.endsWith('.md')) {
            addMessage({
                actor: Actor.BOT,
                content: "Sorry, I can only accept Markdown (.md) files for the knowledge base at this time."
            });
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result as string;
            if (text) {
                const newKnowledgeContent = '\n\n--- KNOWLEDGE DOCUMENT: ' + file.name + ' ---\n\n' + text;
                const fullKnowledgeBase = knowledgeBase + newKnowledgeContent;
                setKnowledgeBase(fullKnowledgeBase);

                addMessage({
                    actor: Actor.BOT,
                    content: `Successfully added "${file.name}" to the knowledge base. The AI will now use this context.`
                });

                updateFlashcardsFromKnowledgeBase(fullKnowledgeBase);
            }
        };
        reader.onerror = () => {
             addMessage({
                actor: Actor.BOT,
                content: `There was an error reading the file "${file.name}". Please try again.`
            });
        };
        reader.readAsText(file);

        // Reset file input to allow uploading the same file again
        if (event.target) {
            event.target.value = '';
        }
    };


    const handleCardAction = useCallback(async (action: ActionType, payload?: any) => {
        setIsLoading(true);
        
        const checkAndAdvanceSop = (currentSopContext: any, additionalPayload: object = {}) => {
            if (currentSopContext) {
                const nextStepContext = { ...currentSopContext, currentStep: currentSopContext.currentStep + 1 };
                // Pass along any data gathered from the current step, like a selected config
                const mergedPayload = { ...payload, ...additionalPayload };
                triggerSopStep(nextStepContext, mergedPayload);
            }
        };

        switch(action) {
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

                // 1. Create a new Configuration object
                const newConfig: Configuration = {
                    projectName: 'Imported Project', // Default name
                    level: 'Project', // Default level
                    status: 'Active',
                    lastModified: new Date().toISOString().split('T')[0],
                    createdBy: 'importer@example.com',
                    settings: settings
                };
                
                // 2. Dynamically generate a new ConfigTemplate
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
                    // Store any data gathered so far
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
                // This action is overloaded: it can be called to show the starter card, or to actually run the test
                if (payload.path) { // A path means we are running the test
                    addMessage({ actor: Actor.USER, content: `Start batch test from: ${payload.path}` });
                    addMessage({ actor: Actor.BOT, content: `Test submitted to NiFi. The automated flow is running and may take a moment. I will post the results here once the asynchronous job is complete.` });
                    
                    // Simulate communication with NiFi UI to highlight the processor
                    if (window.parent !== window) {
                        console.log(`[BOT->NIFI] Posting message to highlight flow for: ${payload.config.projectName}`);
                        window.parent.postMessage({
                            action: 'highlight-flow',
                            configName: payload.config.projectName,
                            vendorId: payload.config.vendorId,
                        }, '*'); // In production, use a specific target origin
                    }
                    
                    try {
                        const result = await triggerNiFiFlow({
                            path: payload.path,
                            benchmarkId: payload.benchmarkId,
                            config: payload.config
                        });

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
                } else { // No path means we need to show the starter card
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
                
                 // Simulate communication with NiFi UI to highlight the processor
                if (window.parent !== window) {
                    console.log(`[BOT->NIFI] Posting message to highlight flow for: ${payload.config.projectName}`);
                    window.parent.postMessage({
                        action: 'highlight-flow',
                        configName: payload.config.projectName,
                        vendorId: payload.config.vendorId,
                    }, '*'); // In production, use a specific target origin
                }

                try {
                    const result = await triggerNiFiFlow({
                        file: payload.file,
                        benchmarkId: payload.benchmarkId,
                        config: payload.config
                    });
            
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
                    await new Promise(res => setTimeout(res, 2000)); // Simulate upload
                    updateCardInMessage(payload.messageId, { status: 'processing' });
                    await new Promise(res => setTimeout(res, 3000)); // Simulate processing
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
    }, [addMessage, updateCardInMessage, triggerSopStep, messages, configs, benchmarks, templates, setIsFlashcardModalOpen, updateFlashcardsFromKnowledgeBase, knowledgeBase]);
    
    const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        e.preventDefault();
        
        const startWidth = panelWidth;
        const startX = e.clientX;

        const handleMouseMove = (moveEvent: MouseEvent) => {
            const currentX = moveEvent.clientX;
            const dx = currentX - startX;
            const newWidth = startWidth - dx;

            const minWidth = 384; // 24rem
            const maxWidth = 896; // 56rem
            
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
                className={`fixed top-4 right-5 z-50 p-3 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-gray-900 transition-all duration-300 ${isPanelOpen ? 'opacity-0 scale-0' : 'opacity-100 scale-100'}`}
                aria-label="Open FlowX SOP Bot"
            >
                <BotIcon />
            </button>

            <div 
                className={`fixed top-0 right-0 h-screen bg-gray-900 text-white flex flex-col font-sans shadow-2xl border-l border-gray-700 transition-transform duration-300 ease-in-out ${isPanelOpen ? 'translate-x-0' : 'translate-x-full'}`}
                style={{ width: `${panelWidth}px` }}
            >
                <div
                    className="absolute top-0 -left-1 w-2 h-full cursor-col-resize group z-30"
                    onMouseDown={handleMouseDown}
                    aria-label="Resize panel"
                    role="separator"
                    aria-orientation="vertical"
                >
                    <div className="w-0.5 h-full bg-transparent group-hover:bg-indigo-500 transition-colors duration-200 mx-auto"></div>
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
                {appMetadata && (
                    <AboutModal
                        isOpen={isAboutModalOpen}
                        onClose={() => setIsAboutModalOpen(false)}
                        version={APP_VERSION}
                        name={appMetadata.name}
                        description={appMetadata.description}
                    />
                )}
                <header className="bg-gray-800 p-3 shadow-md z-20 flex justify-between items-center shrink-0">
                    <h1 className="text-lg font-semibold">{appMetadata?.name || 'FlowX SOP Bot'} <span className="text-xs font-mono text-gray-500 ml-1">v{APP_VERSION}</span></h1>
                    <button 
                        onClick={() => setIsPanelOpen(false)}
                        className="text-gray-400 hover:text-white transition-colors"
                        aria-label="Close panel"
                    >
                        <XIcon />
                    </button>
                </header>
                
                <div className="bg-gray-800/50 p-3 border-b border-t border-gray-700 shrink-0">
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
                            className="w-full bg-gray-700 text-white placeholder-gray-400 border border-gray-600 rounded-md py-2 pl-10 pr-20 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-1">
                            <button
                                onClick={() => setIsDemoModalOpen(true)}
                                className="p-1 text-gray-400 hover:text-white transition-colors"
                                aria-label="Show demo guide"
                                title="Show demo guide"
                            >
                                <PlayCircleIcon />
                            </button>
                            <button
                                onClick={() => setIsFlashcardModalOpen(true)}
                                className="p-1 text-gray-400 hover:text-white transition-colors"
                                aria-label="Show tips and commands"
                                title="Show tips and commands"
                            >
                                <SparklesIcon />
                            </button>
                             <button
                                onClick={() => setIsAboutModalOpen(true)}
                                className="p-1 text-gray-400 hover:text-white transition-colors"
                                aria-label="Show about information"
                                title="Show about information"
                            >
                                <InformationCircleIcon className="h-6 w-6" />
                            </button>
                        </div>

                        {showSearchResults && (
                            <div className="absolute mt-2 w-full bg-gray-700 border border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto z-30">
                                <ul>
                                    {searchResults.length > 0 ? (
                                        searchResults.map(config => (
                                            <li
                                                key={`${config.projectName}-${config.vendorId || 'project'}`}
                                                className="px-4 py-2 hover:bg-indigo-600 cursor-pointer"
                                                onClick={() => handleSearchResultClick(config)}
                                            >
                                                <div className="font-semibold">{config.projectName} <span className={`text-xs font-bold ${config.level === 'Project' ? 'text-indigo-400' : 'text-teal-400'}`}>({config.level})</span></div>
                                                <div className="text-sm text-gray-400">{config.vendorId || 'Applies to all vendors'}</div>
                                            </li>
                                        ))
                                    ) : (
                                        <li className="px-4 py-2 text-gray-400">No results found</li>
                                    )}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>

                <main className="flex-1 overflow-y-auto p-4">
                    <div className="space-y-6">
                        {messages.map((msg) => (
                            <div key={msg.id} className={`flex items-start gap-4 ${msg.actor === Actor.USER ? 'justify-end' : ''}`}>
                                {msg.actor === Actor.BOT && <BotIcon />}
                                <div className={`flex flex-col ${msg.actor === Actor.USER ? 'items-end' : 'items-start'}`}>
                                    <div className={`flex items-center space-x-2 ${msg.actor === Actor.USER ? 'flex-row-reverse space-x-reverse' : ''}`}>
                                        {msg.isGemini && <GeminiIcon className="h-4 w-4 text-purple-400" />}
                                        <span className="font-bold text-sm">{msg.actor === Actor.BOT ? (msg.isGemini ? 'FlowX SOP Bot (AI)' : 'FlowX SOP Bot') : 'You'}</span>
                                        <span className="text-xs text-gray-500">{msg.timestamp}</span>
                                    </div>
                                    <div className={`mt-1 max-w-lg w-full ${msg.actor === Actor.USER ? 'text-right' : ''}`}>
                                        {msg.content && <div className={`px-4 py-2 rounded-lg inline-block whitespace-pre-wrap ${msg.isGemini ? 'bg-purple-900/50 border border-purple-700' : (msg.actor === Actor.BOT ? 'bg-gray-700' : 'bg-indigo-600')}`}>{msg.content}</div>}
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
                                        <span className="font-bold text-sm">FlowX SOP Bot</span>
                                    </div>
                                    <div className="mt-2 flex items-center space-x-2 px-4 py-2 bg-gray-700 rounded-lg">
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-75"></div>
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-150"></div>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                </main>
                <footer className="bg-gray-800 p-4 border-t border-gray-700 z-10 shrink-0">
                    <div className="w-full">
                        <div className="flex items-center bg-gray-700 rounded-lg p-2">
                            <input
                                type="file"
                                ref={knowledgeFileInputRef}
                                onChange={handleKnowledgeFileChange}
                                className="hidden"
                                accept=".md,text/markdown"
                            />
                            <button 
                                className="p-2 text-gray-400 hover:text-white transition-colors"
                                onClick={() => knowledgeFileInputRef.current?.click()}
                                title="Upload Knowledge Document (.md)"
                                aria-label="Upload Knowledge Document"
                            >
                                <PaperclipIcon />
                            </button>
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSendMessage()}
                                placeholder="Type a message to the bot, or ask the AI..."
                                className="flex-1 bg-transparent px-2 text-white placeholder-gray-500 focus:outline-none"
                                disabled={isLoading}
                            />
                            <button
                                onClick={handleAskGemini}
                                disabled={isLoading || input.trim() === ''}
                                className="p-2 text-purple-400 rounded-md disabled:text-gray-600 disabled:cursor-not-allowed hover:text-purple-300 transition-colors"
                                aria-label="Ask Gemini AI"
                                title="Ask Gemini AI"
                            >
                                <SparklesIcon />
                            </button>
                            <button 
                                onClick={handleSendMessage} 
                                disabled={isLoading || input.trim() === ''}
                                className="p-2 ml-2 bg-indigo-600 rounded-md text-white disabled:bg-gray-600 disabled:cursor-not-allowed hover:bg-indigo-700 transition-colors"
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