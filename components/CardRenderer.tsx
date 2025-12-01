import React, { useState, ChangeEvent, useRef, useMemo, useEffect } from 'react';
import { Card, CardType, ActionType, Configuration, BenchmarkDataset, ConfigTemplate, BusinessRule, RuleSchema, BizRuleDomain } from '../types';
import { CheckCircleIcon, ExclamationCircleIcon, XCircleIcon, LoadingSpinner, BookOpenIcon, HierarchyIcon, PaperclipIcon, FolderIcon, ExternalLinkIcon, LightBulbIcon, ClipboardListIcon, SearchIcon, DatabaseIcon, TemplateIcon, DuplicateIcon, CodeIcon, ThumbsUpIcon, ThumbsDownIcon, ImportIcon, AddDatabaseIcon, UploadIcon, PencilIcon, TrashIcon, MagicWandIcon, SparklesIcon } from './Icons';
import { SopTimeline } from './SopTimeline';
import { DynamicForm } from './DynamicForm';
import { PartCatalogRulesCard } from './PartCatalogRules';

interface CardRendererProps {
  card: Card;
  onAction: (action: ActionType, payload?: any) => void;
  messageId: number;
  allConfigs?: Configuration[];
  allTemplates?: ConfigTemplate[];
  allBenchmarks?: BenchmarkDataset[];
}

const CardButton: React.FC<{ onClick: () => void, children: React.ReactNode, className?: string, disabled?: boolean }> = ({ onClick, children, className = 'bg-teal-900 hover:bg-teal-800 text-white', disabled = false }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors duration-200 flex items-center justify-center ${className} ${disabled ? 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-70' : ''}`}
    >
        {children}
    </button>
);

const formatTitle = (key: string) => key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());

const EditableJsonTable: React.FC<{
    value: any[];
    onChange: (newValue: any[]) => void;
}> = ({ value, onChange }) => {
    const headers = value && value.length > 0 ? Object.keys(value[0]) : [];

    const handleCellChange = (rowIndex: number, key: string, cellValue: string) => {
        const newValue = [...value];
        newValue[rowIndex] = { ...newValue[rowIndex], [key]: cellValue };
        onChange(newValue);
    };

    const handleAddRow = () => {
        const newRow = headers.reduce((acc, header) => ({ ...acc, [header]: '' }), {});
        onChange([...value, newRow]);
    };

    const handleDeleteRow = (rowIndex: number) => {
        const newValue = value.filter((_, index) => index !== rowIndex);
        onChange(newValue);
    };

    if (headers.length === 0) {
        return (
             <div>
                <p className="text-sm text-gray-500 mb-2">This setting is empty. Add the first item to define its structure.</p>
                <CardButton onClick={() => {
                    onChange([{ method: '', specFile: '', specDir: '' }]);
                }} className="bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 text-xs py-1 px-3">Add Item</CardButton>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto border border-gray-300 rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-slate-200">
                    <tr>
                        {headers.map(header => (
                            <th key={header} scope="col" className="px-2 py-1.5 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                                {formatTitle(header)}
                            </th>
                        ))}
                        <th scope="col" className="relative px-4 py-2 w-12">
                            <span className="sr-only">Delete</span>
                        </th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {value.map((row, rowIndex) => (
                        <tr key={rowIndex}>
                            {headers.map(header => (
                                <td key={`${rowIndex}-${header}`} className="px-1 py-0.5 whitespace-nowrap">
                                    <input
                                        type="text"
                                        value={row[header] || ''}
                                        onChange={(e) => handleCellChange(rowIndex, header, e.target.value)}
                                        className="w-full bg-white border border-gray-300 rounded-md shadow-sm py-1 px-1.5 text-gray-800 focus:outline-none focus:ring-1 focus:ring-teal-600 sm:text-xs"
                                    />
                                </td>
                            ))}
                            <td className="px-2 py-1 whitespace-nowrap text-center text-sm font-medium">
                                <button onClick={() => handleDeleteRow(rowIndex)} className="text-red-600 hover:text-red-500" title="Delete row">
                                    <XCircleIcon className="w-5 h-5" />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <div className="p-2 bg-gray-100 text-right">
                <CardButton onClick={handleAddRow} className="bg-teal-900 hover:bg-teal-800 text-white text-xs py-1 px-3">
                    Add Row
                </CardButton>
            </div>
        </div>
    );
};


const WelcomeCard: React.FC<{ onAction: CardRendererProps['onAction'] }> = ({ onAction }) => {
    const [showQuickActions, setShowQuickActions] = useState(false);

    return (
        <div>
            <h3 className="font-bold text-lg text-gray-900">Welcome to the FlowX SOP Bot!</h3>
            <p className="text-gray-600 mt-1">This self-service SOP bot helps you perform end-to-end validation, functional, regression, performance, and stress testing for your TDS automation workflows.</p>
            <div className="mt-4">
                 <CardButton onClick={() => onAction(ActionType.SHOW_SOP_CHOOSER)} className="w-full bg-teal-900 hover:bg-teal-800 text-white">
                    Start a Guided SOP
                </CardButton>
            </div>
            <details className="mt-3" onToggle={(e) => setShowQuickActions((e.target as HTMLDetailsElement).open)}>
                <summary className="text-sm font-medium text-gray-500 hover:text-gray-800 cursor-pointer">
                   {showQuickActions ? 'Hide' : 'Show'} Quick Actions
                </summary>
                <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-gray-200">
                    <CardButton onClick={() => onAction(ActionType.START_CONFIG)} className="bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-300 shadow-sm text-xs">New Config</CardButton>
                    <CardButton onClick={() => onAction(ActionType.START_TEST)} className="bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-300 shadow-sm text-xs">Run Test</CardButton>
                    <CardButton onClick={() => onAction(ActionType.SHOW_BENCHMARK_WIZARD)} className="bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-300 shadow-sm text-xs">Add Golden Benchmark</CardButton>
                    <CardButton onClick={() => onAction(ActionType.SHOW_BIZ_RULES)} className="bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-300 shadow-sm text-xs">Biz Rule Settings</CardButton>
                </div>
            </details>
        </div>
    );
};

const BizRuleDomainSelector: React.FC<{ onAction: CardRendererProps['onAction'], messageId: number }> = ({ onAction, messageId }) => {
    const domains: BizRuleDomain[] = ['Part Catalog(MDT)', 'ETA(EMT)', 'Billing', 'POCV', 'Vouch'];

    return (
        <div>
            <h3 className="font-bold text-lg text-gray-900 flex items-center mb-3">
                <HierarchyIcon />
                <span className="ml-2">Select Business Domain</span>
            </h3>
            <p className="text-gray-600 mb-3 text-sm">Choose the domain to manage its business rules.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {domains.map(domain => (
                    <button
                        key={domain}
                        onClick={() => onAction(ActionType.SELECT_BIZ_RULE_DOMAIN, { messageId, domain })}
                        className="p-3 bg-white border border-gray-200 rounded-lg hover:bg-teal-50 hover:border-teal-400 transition-all text-left shadow-sm flex items-center"
                    >
                        <div className="bg-teal-100 p-2 rounded-full mr-3 text-teal-800">
                             <FolderIcon />
                        </div>
                        <span className="font-semibold text-gray-800">{domain}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}

const GenerativeBizRulesCard: React.FC<{ payload: any, onAction: CardRendererProps['onAction'], messageId: number }> = ({ payload, onAction, messageId }) => {
    const { domain, rules = [], schema: initialSchema } = payload;
    
    // States
    const [mode, setMode] = useState<'INTENT' | 'MANAGE' | 'CREATE'>('INTENT');
    const [intentText, setIntentText] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [schema, setSchema] = useState<RuleSchema | null>(initialSchema || null);
    
    // Filter rules for this domain
    const domainRules = useMemo(() => {
        return rules.filter((r: BusinessRule) => r.domain === domain);
    }, [rules, domain]);

    // If schema provided in payload, jump to MANAGE mode
    useEffect(() => {
        if (initialSchema) {
            setSchema(initialSchema);
            setMode('MANAGE');
        }
    }, [initialSchema]);

    const handleGenerateSchema = () => {
        if (!intentText) return;
        setIsGenerating(true);
        // Dispatch action to App to call AI service
        onAction(ActionType.GENERATE_RULE_SCHEMA, { messageId, domain, intentText });
        // NOTE: The App component should update the card payload with the new schema, triggering the useEffect above.
    };

    const handleCreateRule = (values: Record<string, any>) => {
        const newRule: BusinessRule = {
            id: `RULE-${Date.now()}`,
            domain: domain,
            payload: values
        };
        onAction(ActionType.SAVE_BIZ_RULE, { messageId, rule: newRule });
        setMode('MANAGE');
    };

    const handleDeleteRule = (ruleId: string) => {
        if(confirm('Are you sure you want to delete this rule?')) {
            onAction(ActionType.DELETE_BIZ_RULE, { messageId, ruleId });
        }
    };

    if (isGenerating) {
        return (
            <div className="p-8 flex flex-col items-center justify-center text-center">
                <SparklesIcon className="h-10 w-10 text-teal-600 animate-pulse mb-4"/>
                <h3 className="font-bold text-lg text-gray-900">Designing UI...</h3>
                <p className="text-gray-500 mt-2">The AI is generating a custom interface for your rules.</p>
            </div>
        )
    }

    if (mode === 'INTENT') {
        return (
            <div>
                 <h3 className="font-bold text-lg text-gray-900 flex items-center mb-2">
                    <MagicWandIcon />
                    <span className="ml-2">Configure {domain} Rules</span>
                </h3>
                <p className="text-gray-600 mb-4 text-sm">
                    Describe the kind of rules you want to manage for <strong>{domain}</strong>. The AI will generate a custom form for you.
                </p>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Describe Rule Requirements</label>
                    <textarea 
                        className="w-full border border-gray-300 rounded-md p-2 focus:ring-teal-500 focus:border-teal-500" 
                        rows={3} 
                        placeholder="e.g. I need to validate invoice amounts based on currency and vendor tier."
                        value={intentText}
                        onChange={(e) => setIntentText(e.target.value)}
                    />
                    <div className="flex justify-end mt-3">
                         <CardButton onClick={handleGenerateSchema} disabled={!intentText}>
                            <SparklesIcon className="h-4 w-4 mr-2"/>
                            Generate UI
                        </CardButton>
                    </div>
                </div>
            </div>
        );
    }

    if (mode === 'CREATE' && schema) {
        return (
            <div>
                 <h3 className="font-bold text-lg text-gray-900 mb-3">Add New {domain} Rule</h3>
                 <DynamicForm 
                    fields={schema.fields} 
                    onSubmit={handleCreateRule} 
                    onCancel={() => setMode('MANAGE')} 
                />
            </div>
        );
    }

    // MANAGE Mode
    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                 <h3 className="font-bold text-lg text-gray-900 flex items-center">
                    <ClipboardListIcon />
                    <span className="ml-2">{domain} Rules</span>
                </h3>
                <button onClick={() => setMode('INTENT')} className="text-xs text-teal-600 hover:text-teal-800 underline">Redesign UI</button>
            </div>

            {domainRules.length === 0 ? (
                <div className="text-center p-6 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 mb-4">
                    No rules found for {domain}.
                </div>
            ) : (
                <div className="overflow-x-auto border border-gray-200 rounded-lg mb-4">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                {schema?.fields.slice(0, 3).map(field => (
                                     <th key={field.key} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{field.label}</th>
                                ))}
                                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {domainRules.map((rule: BusinessRule) => (
                                <tr key={rule.id}>
                                    {schema?.fields.slice(0, 3).map(field => (
                                        <td key={`${rule.id}-${field.key}`} className="px-3 py-2 whitespace-nowrap text-sm text-gray-800">
                                            {String(rule.payload[field.key] || '-')}
                                        </td>
                                    ))}
                                    <td className="px-3 py-2 whitespace-nowrap text-right text-sm font-medium">
                                        <button onClick={() => handleDeleteRule(rule.id)} className="text-red-600 hover:text-red-900"><TrashIcon className="h-4 w-4" /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
             <div className="flex justify-end">
                <CardButton onClick={() => setMode('CREATE')}>Add New Rule</CardButton>
            </div>
        </div>
    );
};


const SopChooserCard: React.FC<{ onAction: CardRendererProps['onAction'] }> = ({ onAction }) => {
    const sopCategories = [
        {
            persona: 'For Business Users',
            icon: <HierarchyIcon />,
            color: 'text-sky-600',
            sops: [
                { type: 'EXISTING_CONFIG_BATCH', title: 'End-to-End Business Validation', description: 'Validate a business process using an existing configuration and a large dataset.' },
            ]
        },
        {
            persona: 'For IT Developers',
            icon: <CodeIcon />,
            color: 'text-teal-600',
            sops: [
                { type: 'NEW_CONFIG_SINGLE', title: 'Unit & Functional Testing', description: 'Create a new config and run a quick test with a single file to validate logic.' },
                { type: 'EXISTING_CONFIG_SINGLE', title: 'Regression Testing', description: 'Select an existing config and run a quick test with a single file to verify changes.' },
            ]
        },
        {
            persona: 'For IT QC / QA',
            icon: <ClipboardListIcon />,
            color: 'text-teal-700',
            sops: [
                { type: 'NEW_CONFIG_BATCH', title: 'Full Regression & Performance Test', description: 'Run a comprehensive test on a configuration using a full benchmark dataset.' },
            ]
        }
    ];

    return (
        <div>
            <h3 className="font-bold text-lg text-gray-900 flex items-center"><BookOpenIcon /><span className="ml-2">Choose a Guided SOP</span></h3>
            <p className="text-gray-600 mt-1">Select a workflow based on your role and objective.</p>
            <div className="mt-4 space-y-5">
                {sopCategories.map(category => (
                    <div key={category.persona}>
                        <h4 className={`font-semibold flex items-center ${category.color}`}>
                            {React.cloneElement(category.icon, { className: `h-5 w-5 ${category.color}` })}
                            <span className="ml-2">{category.persona}</span>
                        </h4>
                        <div className="mt-2 space-y-2 border-l-2 border-gray-200 pl-4">
                            {category.sops.map(sop => (
                                <button
                                    key={sop.type}
                                    onClick={() => onAction(ActionType.START_SOP, { sopType: sop.type, sopTitle: sop.title })}
                                    className="w-full p-3 bg-gray-50 hover:bg-teal-50 border border-gray-200 hover:border-teal-400 rounded-lg text-left transition-all"
                                >
                                    <p className="font-semibold text-gray-800">{sop.title}</p>
                                    <p className="text-sm text-gray-500 mt-1">{sop.description}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const ConfigCreatorChooserCard: React.FC<{ payload: any, onAction: CardRendererProps['onAction'] }> = ({ payload, onAction }) => (
    <div>
        <h3 className="font-bold text-lg text-gray-900">Create New Configuration</h3>
        <p className="text-gray-600 mt-1">How would you like to start?</p>
        <div className="mt-4 grid grid-cols-1 gap-3">
            <button
                onClick={() => onAction(ActionType.START_FROM_TEMPLATE, { sopContext: payload?.sopContext })}
                className="w-full p-3 bg-gray-50 hover:bg-teal-50 border border-gray-200 hover:border-teal-400 rounded-lg text-left transition-all"
            >
                <div className="flex items-center">
                    <TemplateIcon />
                    <p className="ml-2 font-semibold text-gray-800">Start from a Project Template</p>
                </div>
                <p className="text-sm text-gray-500 mt-1">Use a pre-defined schema for a specific project.</p>
            </button>
            <button
                onClick={() => onAction(ActionType.START_CLONE, { sopContext: payload?.sopContext })}
                className="w-full p-3 bg-gray-50 hover:bg-teal-50 border border-gray-200 hover:border-teal-400 rounded-lg text-left transition-all"
            >
                <div className="flex items-center">
                    <DuplicateIcon />
                    <p className="ml-2 font-semibold text-gray-800">Clone an Existing Configuration</p>
                </div>
                <p className="text-sm text-gray-500 mt-1">Copy and modify an existing configuration.</p>
            </button>
            <button
                onClick={() => onAction(ActionType.SHOW_JSON_IMPORTER, { sopContext: payload?.sopContext })}
                className="w-full p-3 bg-gray-50 hover:bg-teal-50 border border-gray-200 hover:border-teal-400 rounded-lg text-left transition-all"
            >
                <div className="flex items-center">
                    <ImportIcon />
                    <p className="ml-2 font-semibold text-gray-800">Import from JSON</p>
                </div>
                <p className="text-sm text-gray-500 mt-1">Create a config and template from raw JSON data.</p>
            </button>
        </div>
    </div>
);

const TemplateSelectorCard: React.FC<{ payload: any, onAction: CardRendererProps['onAction'], allTemplates: ConfigTemplate[], messageId: number }> = ({ payload, onAction, allTemplates, messageId }) => {
    return (
        <div>
            <h3 className="font-bold text-lg text-gray-900 flex items-center"><TemplateIcon /><span className="ml-2">Select a Template</span></h3>
            <p className="text-gray-600 mt-1">Choose a template to base your new configuration on.</p>
            <div className="mt-4 space-y-3">
                {allTemplates.map(template => (
                     <button 
                        key={template.templateName}
                        onClick={() => onAction(ActionType.SELECT_TEMPLATE, { ...payload, messageId, selectedTemplate: template })}
                        className="w-full p-3 bg-gray-50 hover:bg-teal-50 border border-gray-200 hover:border-teal-400 rounded-lg text-left transition-all"
                    >
                        <p className="font-semibold text-gray-800">{template.templateName}</p>
                        <p className="text-sm text-gray-500 mt-1">{template.description}</p>
                    </button>
                ))}
            </div>
        </div>
    );
};


const ConfigSelectorCard: React.FC<{ payload: any, onAction: CardRendererProps['onAction'], allConfigs: Configuration[], messageId: number }> = ({ payload, onAction, allConfigs, messageId }) => {
    const [query, setQuery] = useState('');
    const action = payload.source === 'clone' ? ActionType.SELECT_CONFIG : ActionType.SELECT_CONFIG;
    
    const filteredConfigs = useMemo(() => {
        if (!query) return allConfigs;
        const lowerQuery = query.toLowerCase();
        return allConfigs.filter(c => 
            c.projectName.toLowerCase().includes(lowerQuery) ||
            c.vendorId?.toLowerCase().includes(lowerQuery)
        );
    }, [query, allConfigs]);

    return (
        <div>
            <h3 className="font-bold text-lg text-gray-900 flex items-center">
                {payload.source === 'clone' ? <DuplicateIcon /> : <ClipboardListIcon />}
                <span className="ml-2">{payload.source === 'clone' ? 'Select Configuration to Clone' : 'Select a Configuration'}</span>
            </h3>
            <div className="relative mt-3">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                    <SearchIcon />
                </span>
                <input
                    type="text"
                    placeholder="Search by project or vendor..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full bg-white text-gray-800 placeholder-gray-400 border border-gray-300 rounded-md py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
            </div>
            <div className="mt-3 max-h-60 overflow-y-auto space-y-2 pr-2">
                {filteredConfigs.map(config => (
                    <button 
                        key={`${config.projectName}-${config.vendorId || 'project'}`}
                        onClick={() => onAction(action, { ...payload, messageId, selectedConfig: config })}
                        className="w-full p-3 bg-gray-50 hover:bg-teal-50 border border-gray-200 hover:border-teal-400 rounded-lg text-left transition-all"
                    >
                        <div className="font-semibold text-gray-800">{config.projectName} <span className={`text-xs font-bold ${config.level === 'Project' ? 'text-teal-800' : 'text-green-700'}`}>({config.level})</span></div>
                        <div className="text-sm text-gray-500">{config.vendorId || 'Applies to all vendors'}</div>
                    </button>
                ))}
            </div>
        </div>
    );
};


const ConfigWizardCard: React.FC<{ payload: any, onAction: CardRendererProps['onAction'], messageId: number }> = ({ payload, onAction, messageId }) => {
    const { step = 1, status, data = {} } = payload;
    const { level, template, clonedData, sopContext } = data;
    const isComplete = status === 'complete';
    const isClone = !!clonedData;
    
    const schema = template?.settingsSchema || clonedData?.settings || {};
    const totalSteps = level === 'Vendor' ? 4 : 3;

    // Local state for form inputs
    const [localData, setLocalData] = useState<any>(data);
    const [settings, setSettings] = useState<any>(data.settings || template?.defaultValues || clonedData?.settings || {});

    const handleChange = (field: string, value: any) => {
        setLocalData((prev: any) => ({ ...prev, [field]: value }));
    };
    
    const handleSettingsChange = (key: string, value: any) => {
        setSettings((prev: any) => ({ ...prev, [key]: value }));
    };

    const submitStep = () => {
        const payloadData = { ...localData, settings };
        onAction(ActionType.SUBMIT_CONFIG_STEP, { step, data: payloadData, messageId });
    };

    if (isComplete) {
        return (
            <div className="bg-green-50 p-4 rounded-lg border border-green-200 text-center">
                <CheckCircleIcon className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <h3 className="text-lg font-bold text-green-800">Configuration Created!</h3>
                <p className="text-green-700 mt-1">
                    {data.projectName} {data.vendorId ? `(${data.vendorId})` : ''} has been successfully configured.
                </p>
                <div className="mt-4 flex justify-center space-x-3">
                    <CardButton onClick={() => onAction(ActionType.START_TEST, { selectedConfig: data, sopContext })} className="bg-green-700 hover:bg-green-600">Run Verification Test</CardButton>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg text-gray-900">
                    {isClone ? 'Clone Configuration' : 'New Configuration'}
                </h3>
                <span className="text-sm font-medium text-gray-500">Step {step} of {totalSteps}</span>
            </div>

            {/* Step 1: Basic Info */}
            {step === 1 && (
                <div className="space-y-4">
                     <div>
                        <label className="block text-sm font-medium text-gray-700">Configuration Level</label>
                        <div className="mt-1 flex space-x-4">
                            <label className="inline-flex items-center">
                                <input type="radio" className="form-radio text-teal-600" name="level" value="Project" checked={localData.level === 'Project'} onChange={() => handleChange('level', 'Project')} />
                                <span className="ml-2">Project Default</span>
                            </label>
                            <label className="inline-flex items-center">
                                <input type="radio" className="form-radio text-teal-600" name="level" value="Vendor" checked={localData.level === 'Vendor'} onChange={() => handleChange('level', 'Vendor')} />
                                <span className="ml-2">Vendor Specific</span>
                            </label>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Project Name</label>
                        <input 
                            type="text" 
                            className="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
                            value={localData.projectName || ''}
                            onChange={(e) => handleChange('projectName', e.target.value)}
                            placeholder="e.g., Auto-billing"
                        />
                    </div>
                    {localData.level === 'Vendor' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Vendor ID</label>
                            <input 
                                type="text" 
                                className="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
                                value={localData.vendorId || ''}
                                onChange={(e) => handleChange('vendorId', e.target.value)}
                                placeholder="e.g., VEN-12345"
                            />
                        </div>
                    )}
                </div>
            )}

            {/* Step 2: Settings (Dynamic based on Schema) */}
            {step === 2 && (
                <div className="space-y-4">
                    <p className="text-sm text-gray-500">Configure the business rules and settings for this project.</p>
                    {Object.entries(schema).map(([key, type]) => (
                        <div key={key}>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{formatTitle(key)}</label>
                            {type === 'boolean' ? (
                                <div className="flex items-center">
                                    <input 
                                        type="checkbox" 
                                        checked={!!settings[key]} 
                                        onChange={(e) => handleSettingsChange(key, e.target.checked)}
                                        className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
                                    />
                                    <span className="ml-2 text-sm text-gray-600">{settings[key] ? 'Enabled' : 'Disabled'}</span>
                                </div>
                            ) : type === 'json' ? (
                                <EditableJsonTable 
                                    value={Array.isArray(settings[key]) ? settings[key] : []} 
                                    onChange={(val) => handleSettingsChange(key, val)}
                                />
                            ) : (
                                <input 
                                    type={type === 'number' ? 'number' : 'text'}
                                    className="block w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
                                    value={settings[key] || ''}
                                    onChange={(e) => handleSettingsChange(key, type === 'number' ? parseFloat(e.target.value) : e.target.value)}
                                />
                            )}
                        </div>
                    ))}
                </div>
            )}

             {/* Step 3: Review */}
            {step === (localData.level === 'Vendor' ? 4 : 3) && (
                <div className="space-y-3">
                     <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
                        <h4 className="font-bold text-sm text-gray-700 border-b border-gray-200 pb-1 mb-2">Summary</h4>
                        <p className="text-sm"><span className="font-medium">Project:</span> {localData.projectName}</p>
                        <p className="text-sm"><span className="font-medium">Level:</span> {localData.level}</p>
                        {localData.vendorId && <p className="text-sm"><span className="font-medium">Vendor ID:</span> {localData.vendorId}</p>}
                        <div className="mt-2 pt-2 border-t border-gray-200">
                             <p className="text-sm font-medium mb-1">Settings Configured:</p>
                             <ul className="text-xs text-gray-600 list-disc pl-4">
                                {Object.keys(settings).slice(0, 5).map(k => (
                                    <li key={k}>{formatTitle(k)}: {typeof settings[k] === 'object' ? '[Complex Data]' : String(settings[k])}</li>
                                ))}
                                {Object.keys(settings).length > 5 && <li>...and {Object.keys(settings).length - 5} more</li>}
                             </ul>
                        </div>
                    </div>
                </div>
            )}
            
            <div className="mt-6 flex justify-between">
                {step > 1 && (
                    <button 
                        onClick={() => onAction(ActionType.SUBMIT_CONFIG_STEP, { step: step - 1, data: { ...localData, settings }, messageId })}
                        className="text-gray-600 hover:text-gray-900 font-medium text-sm"
                    >
                        Back
                    </button>
                )}
                <div className="ml-auto">
                    <CardButton onClick={submitStep}>
                        {step === (localData.level === 'Vendor' ? 4 : 3) ? 'Create Configuration' : 'Next Step'}
                    </CardButton>
                </div>
            </div>
        </div>
    );
};

const ConfigDetailsCard: React.FC<{ payload: any }> = ({ payload }) => (
    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
        <h3 className="font-bold text-lg text-teal-900 mb-2">{payload.projectName}</h3>
        <div className="grid grid-cols-2 gap-4 text-sm mb-4">
            <div>
                <span className="block text-gray-500 text-xs">Level</span>
                <span className="font-medium">{payload.level}</span>
            </div>
            <div>
                 <span className="block text-gray-500 text-xs">Status</span>
                 <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${payload.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {payload.status}
                </span>
            </div>
            {payload.vendorId && (
                <div>
                    <span className="block text-gray-500 text-xs">Vendor ID</span>
                    <span className="font-medium">{payload.vendorId}</span>
                </div>
            )}
            <div>
                 <span className="block text-gray-500 text-xs">Last Modified</span>
                 <span className="font-medium">{payload.lastModified}</span>
            </div>
        </div>
        <div className="border-t border-gray-100 pt-3">
            <p className="text-xs font-semibold text-gray-500 mb-2">Settings Preview</p>
            <div className="bg-gray-50 p-2 rounded text-xs font-mono text-gray-700 overflow-x-auto">
                {JSON.stringify(payload.settings, null, 2)}
            </div>
        </div>
    </div>
);

const JsonImporterCard: React.FC<{ payload: any, onAction: CardRendererProps['onAction'], messageId: number }> = ({ payload, onAction, messageId }) => {
    const [jsonText, setJsonText] = useState('');
    const [error, setError] = useState('');

    const handleImport = () => {
        try {
            JSON.parse(jsonText);
            setError('');
            onAction(ActionType.IMPORT_JSON_CONFIG, { jsonString: jsonText, messageId, sopContext: payload?.sopContext });
        } catch (e) {
            setError('Invalid JSON format. Please check your input.');
        }
    };

    if (payload.status === 'imported') {
         return <div className="p-4 bg-green-50 text-green-800 rounded-lg">JSON imported successfully.</div>;
    }

    return (
        <div>
            <h3 className="font-bold text-gray-900 mb-2">Import JSON Configuration</h3>
            <p className="text-sm text-gray-600 mb-3">Paste your configuration JSON below. This will automatically generate a config and a reusable template.</p>
            <textarea
                className="w-full h-40 p-2 border border-gray-300 rounded-md font-mono text-xs focus:ring-teal-500 focus:border-teal-500"
                placeholder='{ "threshold": 100, "autoApprove": true ... }'
                value={jsonText}
                onChange={(e) => setJsonText(e.target.value)}
            />
            {error && <p className="text-red-600 text-xs mt-1">{error}</p>}
            <div className="mt-3 flex justify-end">
                <CardButton onClick={handleImport} disabled={!jsonText}>Import JSON</CardButton>
            </div>
        </div>
    );
};

const TemplateEditorCard: React.FC<{ payload: any, onAction: CardRendererProps['onAction'], messageId: number }> = ({ payload, onAction, messageId }) => {
    const { template, isSaved } = payload;
    
    if (isSaved) {
         return <div className="p-4 bg-green-50 text-green-800 rounded-lg">Template "{template.templateName}" saved to library.</div>;
    }

    return (
        <div className="mt-4 border-t border-gray-200 pt-4">
             <h3 className="font-bold text-gray-900 mb-2 flex items-center"><MagicWandIcon /><span className="ml-2">Review Generated Template</span></h3>
             <div className="space-y-3">
                 <div>
                     <label className="block text-xs font-medium text-gray-500">Template Name</label>
                     <input type="text" readOnly value={template.templateName} className="w-full bg-gray-100 border border-gray-300 rounded p-1 text-sm text-gray-700"/>
                 </div>
                 <div>
                     <label className="block text-xs font-medium text-gray-500">Detected Schema</label>
                     <div className="bg-gray-50 p-2 rounded border border-gray-200 text-xs font-mono">
                         {JSON.stringify(template.settingsSchema, null, 2)}
                     </div>
                 </div>
             </div>
             <div className="mt-3 flex justify-end">
                 <CardButton onClick={() => onAction(ActionType.SAVE_GENERATED_TEMPLATE, { template, messageId })}>Save Template</CardButton>
             </div>
        </div>
    );
};

const BenchmarkWizardCard: React.FC<{ payload: any, onAction: CardRendererProps['onAction'], messageId: number }> = ({ payload, onAction, messageId }) => {
    const [data, setData] = useState<Partial<BenchmarkDataset>>({
        projectName: payload.projectName || '',
        dataVolume: 0,
        vendorCount: 0,
        timeliness: 'Last 3 Months',
        coveredVendors: []
    });

    if (payload.isSaved) {
        return null; 
    }

    const handleSubmit = () => {
        const newBenchmark: BenchmarkDataset = {
            id: `BM-${Date.now().toString().slice(-4)}`,
            projectName: data.projectName!,
            description: data.description || 'User created benchmark',
            dataVolume: Number(data.dataVolume),
            vendorCount: Number(data.vendorCount),
            timeliness: data.timeliness as any,
            coveredVendors: typeof data.coveredVendors === 'string' ? (data.coveredVendors as string).split(',').map((s: string) => s.trim()) : []
        };
        onAction(ActionType.SUBMIT_BENCHMARK_WIZARD, { benchmark: newBenchmark, messageId });
    };

    return (
        <div className="space-y-3">
            <h3 className="font-bold text-gray-900">Add Golden Benchmark</h3>
            <div>
                <label className="block text-sm font-medium text-gray-700">Project Name</label>
                <input type="text" className="w-full border border-gray-300 rounded p-1.5 text-sm" value={data.projectName} onChange={e => setData({...data, projectName: e.target.value})} />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <input type="text" className="w-full border border-gray-300 rounded p-1.5 text-sm" value={data.description || ''} onChange={e => setData({...data, description: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div>
                     <label className="block text-sm font-medium text-gray-700">Volume</label>
                     <input type="number" className="w-full border border-gray-300 rounded p-1.5 text-sm" value={data.dataVolume} onChange={e => setData({...data, dataVolume: parseInt(e.target.value)})} />
                </div>
                 <div>
                     <label className="block text-sm font-medium text-gray-700">Vendor Count</label>
                     <input type="number" className="w-full border border-gray-300 rounded p-1.5 text-sm" value={data.vendorCount} onChange={e => setData({...data, vendorCount: parseInt(e.target.value)})} />
                </div>
            </div>
            <div className="flex justify-end pt-2">
                <CardButton onClick={handleSubmit}>Save Benchmark</CardButton>
            </div>
        </div>
    );
};

const BenchmarkListCard: React.FC<{ payload: BenchmarkDataset }> = ({ payload }) => (
    <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm mb-2">
        <div className="flex justify-between items-start">
            <div>
                <h4 className="font-bold text-teal-800 text-sm">{payload.id}</h4>
                <p className="text-xs text-gray-500">{payload.projectName}</p>
            </div>
            <div className="bg-blue-50 text-blue-800 text-xs px-2 py-0.5 rounded font-medium">{payload.timeliness}</div>
        </div>
        <p className="text-sm text-gray-700 mt-2">{payload.description}</p>
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-600 bg-gray-50 p-2 rounded">
            <div><span className="font-semibold">Volume:</span> {payload.dataVolume.toLocaleString()}</div>
            <div><span className="font-semibold">Vendors:</span> {payload.vendorCount}</div>
        </div>
    </div>
);

const TestStarterCard: React.FC<{ payload: any, onAction: CardRendererProps['onAction'], messageId: number }> = ({ payload, onAction, messageId }) => {
    const { config, sopContext, status } = payload;
    
    if (status === 'submitted') return <div className="text-gray-600 italic">Test submitted...</div>;

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
             onAction(ActionType.RUN_TEST_WITH_FILE, { file: e.target.files[0], config, messageId, sopContext, benchmarkId: 'BM-DEFAULT' });
        }
    };

    return (
        <div>
             <h3 className="font-bold text-gray-900 mb-2">Run Test for: {config.projectName}</h3>
             <div className="grid grid-cols-1 gap-3">
                 <div className="p-3 border border-dashed border-gray-300 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors text-center cursor-pointer relative">
                    <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleFileUpload} />
                    <UploadIcon />
                    <p className="text-sm font-medium text-gray-700 mt-1">Upload Single File</p>
                    <p className="text-xs text-gray-500">For unit/functional testing</p>
                 </div>
                 <div className="p-3 border border-gray-200 rounded-lg bg-white hover:border-teal-400 transition-colors cursor-pointer" onClick={() => onAction(ActionType.START_BATCH_TEST, { path: '/mnt/data/test_batch_01', config, benchmarkId: 'BM-AV-01', sopContext })}>
                    <div className="flex items-center">
                        <DatabaseIcon />
                        <div className="ml-3">
                            <p className="text-sm font-medium text-gray-700">Run Batch Regression</p>
                            <p className="text-xs text-gray-500">Using dataset: BM-AV-01</p>
                        </div>
                    </div>
                 </div>
             </div>
        </div>
    );
};

const TestResultsSummaryCard: React.FC<{ payload: any, onAction: CardRendererProps['onAction'] }> = ({ payload, onAction }) => {
    const { matched, mismatched, testId, project, sopContext } = payload;
    const total = matched + mismatched;
    const matchRate = total > 0 ? ((matched / total) * 100).toFixed(1) : 0;

    return (
        <div>
            <h3 className="font-bold text-gray-900 mb-3">Test Results: {project}</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-green-50 p-3 rounded-lg border border-green-200 text-center">
                    <p className="text-2xl font-bold text-green-600">{matched}</p>
                    <p className="text-xs text-green-800 font-medium uppercase tracking-wide">Matched</p>
                </div>
                 <div className="bg-red-50 p-3 rounded-lg border border-red-200 text-center">
                    <p className="text-2xl font-bold text-red-600">{mismatched}</p>
                    <p className="text-xs text-red-800 font-medium uppercase tracking-wide">Mismatched</p>
                </div>
            </div>
            <div className="mb-4">
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div className="bg-green-600 h-2.5 rounded-full" style={{ width: `${matchRate}%` }}></div>
                </div>
                <p className="text-right text-xs text-gray-500 mt-1">{matchRate}% Success Rate</p>
            </div>
            <div className="flex space-x-2">
                 <CardButton onClick={() => onAction(ActionType.DOWNLOAD_REPORT, { testId })} className="flex-1 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300">Detailed Report</CardButton>
                 {mismatched > 0 && (
                     <CardButton onClick={() => onAction(ActionType.TRIGGER_ANALYSIS, { testId, sopContext })} className="flex-1">Analyze Failures</CardButton>
                 )}
            </div>
        </div>
    );
};

const AnalysisResultsCard: React.FC<{ payload: any, onAction: CardRendererProps['onAction'], messageId: number }> = ({ payload, onAction, messageId }) => {
    const { feedbackGiven, sopContext } = payload;

    return (
        <div>
             <h3 className="font-bold text-gray-900 flex items-center mb-2"><SparklesIcon /><span className="ml-2">AI Analysis</span></h3>
             <div className="space-y-3 text-sm text-gray-700">
                 <p><span className="font-semibold text-red-600">{payload.dataQuality} records</span> failed due to data quality issues (missing fields).</p>
                 <p><span className="font-semibold text-orange-600">{payload.logic} records</span> failed business logic checks (threshold exceeded).</p>
             </div>
             <div className="mt-4 bg-yellow-50 p-3 rounded-md border border-yellow-200">
                 <p className="text-xs font-bold text-yellow-800 mb-1">Recommendation</p>
                 <p className="text-sm text-yellow-900">Run a root cause analysis to identify specific vendor patterns.</p>
             </div>
             <div className="mt-4 flex justify-between items-center">
                 {!feedbackGiven ? (
                    <div className="flex space-x-2">
                        <button onClick={() => onAction(ActionType.ANALYSIS_FEEDBACK, { messageId, isGood: true })} className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-green-500"><ThumbsUpIcon /></button>
                        <button onClick={() => onAction(ActionType.ANALYSIS_FEEDBACK, { messageId, isGood: false })} className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-red-500"><ThumbsDownIcon /></button>
                    </div>
                 ) : <span className="text-xs text-gray-400">Thanks for feedback</span>}
                 <CardButton onClick={() => onAction(ActionType.INVESTIGATE_ROOT_CAUSE, { sopContext })} className="text-xs">Find Root Cause</CardButton>
             </div>
        </div>
    );
};

const RootCauseAnalysisCard: React.FC<{ payload: any, onAction: CardRendererProps['onAction'], messageId: number }> = ({ payload, onAction, messageId }) => {
    return (
        <div className="space-y-4">
             <h3 className="font-bold text-gray-900 mb-2">Root Cause Investigation</h3>
             <div className="p-3 bg-red-50 border-l-4 border-red-500 rounded-r-md">
                 <h4 className="font-bold text-red-800 text-sm mb-1">Probable Cause Identified</h4>
                 <p className="text-sm text-red-900">{payload.cause}</p>
             </div>
             <div>
                 <h4 className="font-bold text-gray-700 text-sm mb-2">Suggested Actions</h4>
                 <div className="space-y-2">
                     {payload.suggestedActions.map((action: any, idx: number) => (
                         <button key={idx} onClick={() => onAction(ActionType.SUGGESTED_ACTION, action)} className="w-full text-left p-2 bg-white border border-gray-200 hover:border-teal-400 rounded-md text-sm text-gray-700 flex justify-between group">
                             <span>{action.title}</span>
                             <span className="text-teal-600 opacity-0 group-hover:opacity-100 transition-opacity">&rarr;</span>
                         </button>
                     ))}
                 </div>
             </div>
             {!payload.feedbackGiven && (
                 <div className="flex justify-center space-x-4 pt-2 border-t border-gray-100">
                    <button onClick={() => onAction(ActionType.ROOT_CAUSE_FEEDBACK, { messageId, isGood: true })} className="text-xs text-gray-500 hover:text-green-600 flex items-center"><ThumbsUpIcon /> <span className="ml-1">Helpful</span></button>
                    <button onClick={() => onAction(ActionType.ROOT_CAUSE_FEEDBACK, { messageId, isGood: false })} className="text-xs text-gray-500 hover:text-red-600 flex items-center"><ThumbsDownIcon /> <span className="ml-1">Not Helpful</span></button>
                 </div>
             )}
        </div>
    );
};

const InteractiveDiagnosticCard: React.FC<{ payload: any, onAction: CardRendererProps['onAction'], messageId: number }> = ({ payload, onAction, messageId }) => {
    const { status, recordId, data } = payload;
    
    if (status === 'resolved') return <div className="p-3 bg-green-100 text-green-800 rounded-lg text-sm">Diagnostic for {recordId} completed. Issue resolved.</div>;
    if (status === 'running') return <div className="p-3 bg-gray-100 text-gray-600 rounded-lg text-sm flex items-center"><LoadingSpinner /> <span className="ml-2">Running diagnostic logic...</span></div>;

    return (
        <div>
             <h3 className="font-bold text-gray-900 mb-2">Diagnostic: {recordId}</h3>
             <div className="bg-gray-50 p-2 rounded-md font-mono text-xs text-gray-700 mb-3 border border-gray-200">
                 {JSON.stringify(data, null, 2)}
             </div>
             <p className="text-sm text-gray-600 mb-3">Does this data look correct compared to the source system?</p>
             <div className="flex space-x-3">
                 <CardButton onClick={() => onAction(ActionType.RERUN_DIAGNOSTIC, { messageId, recordId })} className="flex-1 bg-white text-gray-700 border border-gray-300 hover:bg-gray-50">No, Re-fetch</CardButton>
                 <CardButton onClick={() => onAction(ActionType.RERUN_DIAGNOSTIC, { messageId, recordId })} className="flex-1">Yes, Run Logic</CardButton>
             </div>
        </div>
    );
};

const ConfirmationCard: React.FC<{ payload: any, onAction: CardRendererProps['onAction'] }> = ({ payload, onAction }) => (
    <div className="text-center">
        <ExclamationCircleIcon />
        <h3 className="font-bold text-gray-900 mt-2 mb-1">Confirm Action</h3>
        <p className="text-sm text-gray-600 mb-4">Are you sure you want to {payload.action} {payload.project}?</p>
        <div className="flex justify-center space-x-3">
            <button onClick={() => onAction(ActionType.CANCEL_ACTION)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-md border border-gray-300">Cancel</button>
            <button onClick={() => onAction(ActionType.CONFIRM_PAUSE_PRODUCTION, payload)} className="px-4 py-2 text-sm text-white bg-red-600 hover:bg-red-700 rounded-md">Confirm</button>
        </div>
    </div>
);

const FileUploadCard: React.FC<{ payload: any, onAction: CardRendererProps['onAction'], messageId: number }> = ({ payload, onAction, messageId }) => {
    const { status, fileName, result, sopContext } = payload;

    if (status === 'complete') {
        return (
            <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                 <p className="text-sm text-green-800 font-medium">Upload Complete</p>
                 <p className="text-xs text-green-700">{result}</p>
            </div>
        );
    }

    if (status === 'uploading' || status === 'processing') {
         return (
             <div className="p-4 text-center">
                 <LoadingSpinner />
                 <p className="text-sm text-gray-600 mt-2">{status === 'uploading' ? `Uploading ${fileName}...` : 'Processing file...'}</p>
             </div>
         );
    }

    return (
        <div className="p-6 border-2 border-dashed border-gray-300 rounded-lg text-center bg-gray-50 hover:bg-gray-100 transition-colors relative">
            <input 
                type="file" 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                onChange={(e) => {
                    if (e.target.files?.[0]) {
                        onAction(ActionType.UPLOAD_FILE, { file: e.target.files[0], messageId, sopContext });
                    }
                }}
            />
            <PaperclipIcon />
            <p className="text-sm font-medium text-gray-700 mt-2">Click or drag file to upload</p>
            <p className="text-xs text-gray-500">Supports .csv, .xlsx, .json</p>
        </div>
    );
};

export const CardRenderer: React.FC<CardRendererProps> = ({ card, onAction, messageId, allConfigs = [], allTemplates = [], allBenchmarks = [] }) => {
    const commonProps = { onAction, messageId };

    if (card.payload?.sopContext) {
        return (
            <div>
                 <SopTimeline 
                    sopType={card.payload.sopContext.sopType}
                    sopTitle={card.payload.sopContext.sopTitle}
                    currentStep={card.payload.sopContext.currentStep}
                    onAction={onAction}
                    sopContext={card.payload.sopContext}
                />
                <div className="mt-4 border-t border-gray-200 pt-4">
                     {renderCardContent(card, commonProps, allConfigs, allTemplates, allBenchmarks)}
                </div>
            </div>
        );
    }

    return renderCardContent(card, commonProps, allConfigs, allTemplates, allBenchmarks);
};

const renderCardContent = (card: Card, commonProps: any, allConfigs: Configuration[], allTemplates: ConfigTemplate[], allBenchmarks: BenchmarkDataset[]) => {
    switch (card.type) {
        case CardType.WELCOME:
            return <WelcomeCard onAction={commonProps.onAction} />;
        case CardType.SOP_CHOOSER:
            return <SopChooserCard onAction={commonProps.onAction} />;
        case CardType.CONFIG_CREATOR_CHOOSER:
            return <ConfigCreatorChooserCard payload={card.payload} onAction={commonProps.onAction} />;
        case CardType.TEMPLATE_SELECTOR:
            return <TemplateSelectorCard payload={card.payload} allTemplates={allTemplates} {...commonProps} />;
        case CardType.CONFIG_SELECTOR:
            return <ConfigSelectorCard payload={card.payload} allConfigs={allConfigs} {...commonProps} />;
        case CardType.CONFIG_WIZARD:
            return <ConfigWizardCard payload={card.payload} {...commonProps} />;
        case CardType.CONFIG_DETAILS:
            return <ConfigDetailsCard payload={card.payload} />;
        case CardType.JSON_IMPORTER:
             return <JsonImporterCard payload={card.payload} {...commonProps} />;
        case CardType.TEMPLATE_EDITOR:
             return <TemplateEditorCard payload={card.payload} {...commonProps} />;
        case CardType.BENCHMARK_WIZARD:
             return <BenchmarkWizardCard payload={card.payload} {...commonProps} />;
        case CardType.BENCHMARK_LIST:
             return <BenchmarkListCard payload={card.payload} />;
        case CardType.TEST_STARTER:
            return <TestStarterCard payload={card.payload} {...commonProps} />;
        case CardType.TEST_RESULTS_SUMMARY:
            return <TestResultsSummaryCard payload={card.payload} onAction={commonProps.onAction} />;
        case CardType.ANALYSIS_RESULTS:
            return <AnalysisResultsCard payload={card.payload} {...commonProps} />;
        case CardType.ROOT_CAUSE_ANALYSIS:
            return <RootCauseAnalysisCard payload={card.payload} {...commonProps} />;
        case CardType.INTERACTIVE_DIAGNOSTIC:
            return <InteractiveDiagnosticCard payload={card.payload} {...commonProps} />;
        case CardType.CONFIRMATION:
            return <ConfirmationCard payload={card.payload} onAction={commonProps.onAction} />;
        case CardType.FILE_UPLOAD:
            return <FileUploadCard payload={card.payload} {...commonProps} />;
        case CardType.BIZ_RULES_DOMAIN_SELECTOR:
            return <BizRuleDomainSelector {...commonProps} />;
        case CardType.GENERATIVE_BIZ_RULES_MANAGER:
            return <GenerativeBizRulesCard payload={card.payload} {...commonProps} />;
        case CardType.PART_CATALOG_RULES_MANAGER:
            return <PartCatalogRulesCard payload={card.payload} {...commonProps} />;
        default:
            return <div className="text-red-500 text-sm">Unknown card type: {card.type}</div>;
    }
};
