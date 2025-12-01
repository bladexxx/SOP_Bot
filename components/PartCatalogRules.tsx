
import React, { useState, useMemo } from 'react';
import { ActionType, BusinessRule } from '../types';
import { TrashIcon, SearchIcon } from './Icons';

// ----------------------------------------------------------------------
// 1. The "Back-end" Configuration (Schema Strategy)
// ----------------------------------------------------------------------

const RULE_SCHEMAS: any = {
    validation: {
        id: 'validation',
        title: 'Data Validation Rules (Validation)',
        icon: '🛡️',
        colorClass: 'border-red-500',
        bgClass: 'bg-red-50',
        textClass: 'text-red-600',
        descriptionTemplate: "Ensure {targetField} {operator} {value} ({severity})",
        fields: [
            {
                name: 'category',
                label: 'Rule Category',
                type: 'select',
                options: ['Header Validation', 'Kickout Rules', 'Field-Level Rules', 'Logistics Constraints'],
                default: 'Field-Level Rules'
            },
            {
                name: 'targetField',
                label: 'Target Field',
                type: 'text',
                placeholder: 'e.g. vend_no',
                required: true
            },
            {
                name: 'severity',
                label: 'Severity',
                type: 'select',
                options: ['Kickout (Immediate Rejection)', 'Warning (Only Alert)', 'Info (Log Only)'],
                default: 'Kickout (Immediate Rejection)'
            },
            {
                name: 'operator',
                label: 'Operator',
                type: 'select',
                options: ['Is Not Empty', 'Equals', 'Not Equals', 'Greater Than', 'Less Than', 'Matches Regex', 'In List'],
                default: 'Is Not Empty'
            },
            {
                name: 'value',
                label: 'Reference Value/Parameter',
                type: 'text',
                placeholder: 'No input required or input specific value',
                condition: (formData: any) => formData.operator !== 'Is Not Empty'
            }
        ]
    },
    transformation: {
        id: 'transformation',
        title: 'Data Transformation & Generation',
        icon: '⚡',
        colorClass: 'border-blue-500',
        bgClass: 'bg-blue-50',
        textClass: 'text-blue-600',
        descriptionTemplate: "Transform {targetField} using {method}",
        fields: [
            {
                name: 'category',
                label: 'Transformation Category',
                type: 'select',
                options: ['Part Number Generation', 'Field Completion', 'Date Normalization', 'Auto-Correction'],
                default: 'Field Completion'
            },
            {
                name: 'targetField',
                label: 'Target Field',
                type: 'text',
                placeholder: 'e.g. part_no',
                required: true
            },
            {
                name: 'method',
                label: 'Processing Method',
                type: 'select',
                options: ['Concatenate', 'Trim Whitespace', 'Format Date', 'Set Default Value', 'Remove Characters'],
                default: 'Concatenate'
            },
            {
                name: 'params',
                label: 'Parameter Configuration',
                type: 'textarea',
                placeholder: 'e.g. {vendor}-{sku}',
                description: 'Use {fieldname} to reference other fields'
            }
        ]
    },
    logic: {
        id: 'logic',
        title: 'Cross-Field Logic (Logic Check)',
        icon: '⚖️',
        colorClass: 'border-purple-500',
        bgClass: 'bg-purple-50',
        textClass: 'text-purple-600',
        descriptionTemplate: "IF {ifCondition} THEN {thenCheck}",
        fields: [
            {
                name: 'category',
                label: 'Category',
                type: 'readonly',
                default: 'Cross-Field Integrity'
            },
            {
                name: 'ifCondition',
                label: 'IF (Condition)',
                type: 'text',
                placeholder: 'e.g. weight > 50',
                required: true
            },
            {
                name: 'thenCheck',
                label: 'THEN (Constraint)',
                type: 'text',
                placeholder: 'e.g. shipping_method == "Freight"',
                required: true
            }
        ]
    },
    mapping: {
        id: 'mapping',
        title: 'Multi-Condition VPC Mapping Rule',
        icon: '🗺️',
        colorClass: 'border-green-500',
        bgClass: 'bg-green-50',
        textClass: 'text-green-600',
        descriptionTemplate: "Map VPC Code based on Part Type ({part_type}) and Business Entity to {mapName}",
        fields: [
            {
                name: 'mapName',
                label: 'Mapping Table Name',
                type: 'text',
                default: 'VPC_Code_Mapping',
                required: true
            },
            {
                name: 'mappingPairs',
                label: 'VPC Mapping Table (Input Condition -> Output Result)',
                type: 'array_objects',
                itemSchema: [
                    { 
                        name: 'part_type', 
                        placeholder: 'Part Type', 
                        width: 'flex-[2]',
                        datalistOptions: ['product', 'service', 'prod-annuity', 'hardware', 'software', 'misc'],
                    },
                    { 
                        name: 'internal_business_entity', 
                        placeholder: 'Internal Business Entity', 
                        width: 'flex-[2]',
                    },
                    { 
                        name: 'vpc_code', 
                        placeholder: 'VPC Code', 
                        width: 'flex-1',
                        color: 'bg-green-100 font-bold'
                    }
                ],
                default: [{ part_type: 'product', internal_business_entity: 'Services TSS_L1', vpc_code: 'TS' }]
            }
        ]
    }
};

const getSchemaForRule = (appType: string) => {
    return RULE_SCHEMAS[appType] || {};
};

// ----------------------------------------------------------------------
// 2. Generic Schema Form Engine
// ----------------------------------------------------------------------

const SchemaForm: React.FC<{ schema: any, onSubmit: (data: any) => void, onCancel: () => void }> = ({ schema, onSubmit, onCancel }) => {
    const [formData, setFormData] = useState<any>(() => {
        const initial: any = {};
        schema.fields.forEach((field: any) => {
            initial[field.name] = field.default !== undefined ? field.default : (field.type === 'array_objects' ? [] : '');
        });
        return initial;
    });
    
    const [jsonInput, setJsonInput] = useState('');
    const [jsonError, setJsonError] = useState<string | null>(null);

    const handleChange = (name: string, value: any) => {
        setFormData((prev: any) => ({ ...prev, [name]: value }));
    };

    const handleArrayChange = (name: string, index: number, subField: string, value: any) => {
        setFormData((prev: any) => {
            const newArray = [...prev[name]];
            if (!newArray[index]) {
                const emptyItem = schema.fields.find((f: any) => f.name === name).itemSchema.reduce((acc: any, f: any) => ({ ...acc, [f.name]: '' }), {});
                newArray[index] = emptyItem;
            }
            newArray[index] = { ...newArray[index], [subField]: value };
            return { ...prev, [name]: newArray };
        });
    };

    const addArrayItem = (name: string, itemSchema: any) => {
        setFormData((prev: any) => {
            const emptyItem = itemSchema.reduce((acc: any, f: any) => ({ ...acc, [f.name]: '' }), {});
            return { ...prev, [name]: [...prev[name], emptyItem] };
        });
    };

    const removeArrayItem = (name: string, index: number) => {
        setFormData((prev: any) => ({
            ...prev,
            [name]: prev[name].filter((_: any, i: number) => i !== index)
        }));
    };
    
    const handleJsonImport = (fieldName: string, itemSchema: any) => {
        setJsonError(null);
        try {
            const newEntries = JSON.parse(jsonInput);
            if (!Array.isArray(newEntries)) {
                throw new Error('JSON must be in array format ([{...}, ...])');
            }

            const requiredKeys = itemSchema.map((i: any) => i.name);
            const isValid = newEntries.every(e => 
                requiredKeys.every((key: string) => Object.prototype.hasOwnProperty.call(e, key))
            );

            if (!isValid) {
                throw new Error(`JSON structure mismatch. Each object must contain: ${requiredKeys.join(', ')}`);
            }

            setFormData((prev: any) => ({
                ...prev,
                [fieldName]: [...prev[fieldName], ...newEntries]
            }));
            setJsonInput('');
            setJsonError('✅ Batch import successful!');
        } catch (e: any) {
            setJsonError('❌ Import failed: ' + e.message);
        }
        setTimeout(() => setJsonError(null), 5000);
    };

    const handleSubmit = () => {
        // Basic validation
        for (let field of schema.fields) {
            if (field.required && !formData[field.name]) {
                alert(`Error: ${field.label} is required`);
                return;
            }
        }

        // Generate description dynamically
        let description = schema.descriptionTemplate;
        const category = formData.category || schema.title;

        Object.keys(formData).forEach(key => {
            if (schema.fields.find((f: any) => f.name === key)?.type === 'array_objects' && Array.isArray(formData[key])) {
                description = description.replace(`{${key}}`, `${formData[key].length} entries`);
            } else {
                description = description.replace(`{${key}}`, formData[key]);
            }
        });
        
        onSubmit({
            appType: schema.id,
            category: category,
            rule: formData,
            description: description
        });
    };

    return (
        <div className={`bg-white p-6 rounded-lg shadow-lg border-l-4 ${schema.colorClass}`}>
            <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                <span className={`${schema.bgClass} ${schema.textClass} p-2 rounded mr-2`}>{schema.icon}</span> 
                {schema.title}
            </h3>

            <div className="space-y-4">
                {schema.fields.map((field: any) => {
                    if (field.condition && !field.condition(formData)) return null;

                    return (
                        <div key={field.name}>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {field.label} {field.required && <span className="text-red-500">*</span>}
                            </label>
                            
                            {field.type === 'select' && (
                                <select 
                                    value={formData[field.name]} 
                                    onChange={e => handleChange(field.name, e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-teal-200 outline-none text-sm bg-white text-gray-900"
                                >
                                    {field.options.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                            )}

                            {field.type === 'text' && (
                                <input 
                                    type="text"
                                    value={formData[field.name]} 
                                    onChange={e => handleChange(field.name, e.target.value)}
                                    placeholder={field.placeholder}
                                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-teal-200 outline-none text-sm bg-white text-gray-900"
                                />
                            )}

                             {field.type === 'readonly' && (
                                <input 
                                    type="text"
                                    value={formData[field.name]} 
                                    readOnly
                                    className="w-full p-2 border border-gray-300 rounded bg-gray-100 text-gray-500 cursor-not-allowed text-sm"
                                />
                            )}

                            {field.type === 'textarea' && (
                                <textarea 
                                    value={formData[field.name]} 
                                    onChange={e => handleChange(field.name, e.target.value)}
                                    placeholder={field.placeholder}
                                    rows={3}
                                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-teal-200 outline-none text-sm bg-white text-gray-900"
                                />
                            )}

                            {field.type === 'array_objects' && (
                                <div className="bg-gray-50 p-3 rounded border border-gray-200">
                                    {schema.id === 'mapping' && (
                                        <div className="mb-4 p-3 bg-white rounded shadow-sm border border-gray-100">
                                            <label className="block text-xs font-bold text-gray-700 mb-2">JSON Bulk Import (Optional)</label>
                                            <textarea
                                                rows={4}
                                                value={jsonInput}
                                                onChange={e => setJsonInput(e.target.value)}
                                                placeholder='Paste JSON array, e.g.: [{"part_type":"product", "internal_business_entity":"Services ASS_L1", "vpc_code":"AS"}, ...]'
                                                className="w-full p-2 border rounded text-xs font-mono focus:ring-2 focus:ring-green-200 outline-none bg-white text-gray-900"
                                            ></textarea>
                                            <div className="flex justify-between items-center mt-2">
                                                <button 
                                                    onClick={() => handleJsonImport(field.name, field.itemSchema)}
                                                    className="px-3 py-1 bg-green-600 text-white text-xs font-medium rounded hover:bg-green-700 transition"
                                                >
                                                    Import
                                                </button>
                                                {jsonError && (
                                                    <span className={`text-xs font-semibold ${jsonError.startsWith('✅') ? 'text-green-600' : 'text-red-600'}`}>
                                                        {jsonError}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex gap-2 mb-2 pb-1 border-b border-gray-300 font-semibold text-gray-500 text-xs uppercase">
                                        {field.itemSchema.map((subField: any) => (
                                            <div key={subField.name} className={`${subField.width || 'flex-1'} truncate`}>
                                                {subField.placeholder}
                                            </div>
                                        ))}
                                        <div className="w-6"></div>
                                    </div>
                                    
                                    {formData[field.name].map((item: any, idx: number) => {
                                        const uniqueId = `${field.name}-${idx}`;

                                        return (
                                            <div key={uniqueId} className="flex gap-2 mb-2 items-center">
                                                {field.itemSchema.map((subField: any) => {
                                                    const datalistId = subField.datalistOptions ? `${uniqueId}-${subField.name}-datalist` : undefined;

                                                    return (
                                                        <div key={subField.name} className={`${subField.width || 'flex-1'}`}>
                                                            <input
                                                                placeholder={subField.placeholder}
                                                                value={item[subField.name] || ''} 
                                                                onChange={e => handleArrayChange(field.name, idx, subField.name, e.target.value)}
                                                                className={`w-full p-2 border border-gray-300 rounded text-xs ${subField.color || ''} focus:ring-teal-200 outline-none bg-white text-gray-900`}
                                                                list={datalistId} 
                                                            />
                                                            {datalistId && (
                                                                <datalist id={datalistId}>
                                                                    {subField.datalistOptions.map((option: string) => (
                                                                        <option key={option} value={option} />
                                                                    ))}
                                                                </datalist>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                                <button 
                                                    onClick={() => removeArrayItem(field.name, idx)} 
                                                    className="text-gray-400 hover:text-red-600 px-1 w-6 transition"
                                                    title="Remove"
                                                >
                                                    <TrashIcon className="h-4 w-4"/>
                                                </button>
                                            </div>
                                        );
                                    })}
                                    <button 
                                        onClick={() => addArrayItem(field.name, field.itemSchema)}
                                        className={`text-xs ${schema.textClass} hover:underline font-medium mt-2`}
                                    >
                                        + Add Mapping Entry
                                    </button>
                                </div>
                            )}

                            {field.description && <p className="text-xs text-gray-400 mt-1">{field.description}</p>}
                        </div>
                    );
                })}
            </div>

            <div className="flex justify-end space-x-3 mt-8 pt-4 border-t border-gray-100">
                <button onClick={onCancel} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded transition border border-gray-300">Cancel</button>
                <button 
                    onClick={handleSubmit} 
                    className={`px-4 py-2 text-sm text-white rounded shadow transition hover:opacity-90 ${schema.bgClass.replace('bg-', 'bg-').replace('50', '600')}`}
                >
                    Save Configuration
                </button>
            </div>
        </div>
    );
};

// ----------------------------------------------------------------------
// 3. YAML Conversion Utility
// ----------------------------------------------------------------------

const jsToYaml = (data: any, indent = 0): string => {
    const space = '  '.repeat(indent);
    
    if (typeof data !== 'object' || data === null) {
        let value = String(data);
        if (typeof data === 'string' && (value.includes(':') || value.includes(' ') || value.includes('- ') || value.includes('"'))) {
            value = `"${value.replace(/"/g, '\\"')}"`;
        }
        return value;
    }

    if (Array.isArray(data)) {
        if (data.length === 0) return '[]';
        return data.map(item => {
            const itemYaml = jsToYaml(item, indent + 1).trimStart();
            return `${space}- ${itemYaml}`;
        }).join('\n');
    }

    const lines = [];
    for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
            const value = data[key];
            const valueYaml = jsToYaml(value, indent + 1);
            
            if (valueYaml.includes('\n') && !Array.isArray(value)) {
                lines.push(`${space}${key}:`);
                lines.push(valueYaml);
            } else if (Array.isArray(value) && value.some(item => typeof item === 'object')) {
                lines.push(`${space}${key}:`);
                lines.push(valueYaml);
            } else {
                lines.push(`${space}${key}: ${valueYaml}`);
            }
        }
    }
    return lines.join('\n');
};

// ----------------------------------------------------------------------
// 4. Main Component
// ----------------------------------------------------------------------

interface PartCatalogRulesCardProps {
    payload: any;
    onAction: (action: ActionType, payload?: any) => void;
    messageId: number;
}

export const PartCatalogRulesCard: React.FC<PartCatalogRulesCardProps> = ({ payload, onAction, messageId }) => {
    const DOMAIN_NAME = 'Part Catalog(MDT)';
    const rules = payload.rules || [];
    const domainRules = useMemo(() => rules.filter((r: BusinessRule) => r.domain === DOMAIN_NAME), [rules]);

    const [input, setInput] = useState('');
    const [activeSchemaId, setActiveSchemaId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const handleDispatcher = () => {
        const text = input.toLowerCase();
        let targetId = 'validation'; 

        if (text.includes('generate') || text.includes('format') || text.includes('transform')) targetId = 'transformation';
        else if (text.includes('if') || text.includes('logic')) targetId = 'logic';
        else if (text.includes('map') || text.includes('vpc')) targetId = 'mapping';
        
        setActiveSchemaId(targetId);
    };

    const handleSaveRule = (ruleData: any) => {
        const newRule: BusinessRule = {
            id: `RULE-${Date.now()}`,
            domain: DOMAIN_NAME,
            payload: ruleData
        };
        onAction(ActionType.SAVE_BIZ_RULE, { messageId, rule: newRule });
        setActiveSchemaId(null);
        setInput('');
    };

    const handleDelete = (id: string) => {
        if (confirm('Are you sure you want to remove this rule node?')) {
            onAction(ActionType.DELETE_BIZ_RULE, { messageId, ruleId: id });
        }
    };

    const handleDownloadYaml = () => {
        if (domainRules.length === 0) return;

        const exportData = domainRules.map((rule: BusinessRule) => ({
            id: rule.id,
            domain: rule.domain,
            appType: rule.payload.appType,
            category: rule.payload.category,
            description: rule.payload.description,
            payload: rule.payload.rule 
        }));
        
        const yamlContent = jsToYaml(exportData);
        const blob = new Blob([yamlContent], { type: 'text/yaml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        
        const timestamp = new Date().toISOString().slice(0, 10);
        link.download = `${DOMAIN_NAME.replace(/\s/g, '_')}_Rules_Export_${timestamp}.yaml`;
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    // Filtering
    const filteredRules = domainRules.filter((rule: BusinessRule) => {
        const term = searchTerm.toLowerCase();
        if (!term) return true;
        const p = rule.payload;
        if (p.description?.toLowerCase().includes(term)) return true;
        if (p.category?.toLowerCase().includes(term)) return true;
        if (p.appType === 'mapping' && p.rule?.mappingPairs) {
            const mappingJson = JSON.stringify(p.rule.mappingPairs).toLowerCase();
            if (mappingJson.includes(term)) return true;
        }
        return false;
    });

    return (
        <div className="font-sans">
            <h3 className="text-xl font-bold text-gray-900 mb-1 flex items-center">
                 <span className="text-2xl mr-2">🏭</span> Part Catalog Rule Configurator
            </h3>
            <p className="text-gray-500 mb-4 text-sm">Domain: <span className="font-semibold text-teal-600">{DOMAIN_NAME}</span></p>

            {/* Intent Dispatcher */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6">
                <label className="block text-sm font-bold text-gray-800 mb-2">Configuration Wizard</label>
                <div className="flex gap-2 relative">
                    <input 
                        className="flex-1 p-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none bg-white text-gray-900"
                        placeholder="e.g., 'Validate Vendor Code' or 'Establish VPC Mapping'"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleDispatcher()}
                    />
                    <button 
                        onClick={handleDispatcher}
                        className="px-4 bg-teal-600 text-white text-sm font-bold rounded-lg hover:bg-teal-700 transition"
                    >
                        Start
                    </button>
                </div>
                
                <div className="mt-3 flex flex-wrap gap-2">
                    {Object.values(RULE_SCHEMAS).map((schema: any) => (
                        <button 
                            key={schema.id}
                            onClick={() => setActiveSchemaId(schema.id)}
                            className={`px-3 py-1 rounded-full text-xs font-medium border transition ${schema.bgClass} ${schema.textClass} ${schema.colorClass} bg-opacity-50`}
                        >
                            {schema.icon} {schema.title.split('(')[0]}
                        </button>
                    ))}
                </div>
            </div>

            {/* Modal for Schema Form */}
            {activeSchemaId && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                        <SchemaForm 
                            schema={RULE_SCHEMAS[activeSchemaId]} 
                            onSubmit={handleSaveRule} 
                            onCancel={() => setActiveSchemaId(null)} 
                        />
                    </div>
                </div>
            )}

            {/* Dashboard */}
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-gray-800">
                    Rule Overview ({domainRules.length})
                </h2>
                <button
                    onClick={handleDownloadYaml}
                    disabled={domainRules.length === 0}
                    className="px-3 py-2 bg-gray-700 text-white text-xs font-medium rounded-lg hover:bg-gray-800 transition disabled:opacity-50"
                >
                    📥 Export YAML
                </button>
            </div>

            <div className="mb-4 relative">
                <input
                    type="text"
                    placeholder="Search rules..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none pl-9 text-sm bg-white text-gray-900"
                />
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                    <SearchIcon />
                </span>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {filteredRules.map((rule: BusinessRule) => {
                    const p = rule.payload;
                    const schema = getSchemaForRule(p.appType);
                    return (
                        <div key={rule.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition">
                            <div className="flex justify-between items-start mb-2">
                                <div className={`p-1.5 rounded-lg ${schema.bgClass || 'bg-gray-100'}`}>
                                    <span className="text-xl">{schema.icon || '📝'}</span>
                                </div>
                                <button 
                                    onClick={() => handleDelete(rule.id)} 
                                    className="text-gray-300 hover:text-red-500 transition"
                                >
                                    <TrashIcon className="h-5 w-5"/>
                                </button>
                            </div>
                            <h4 className="font-bold text-gray-800 text-sm mb-1">{p.category}</h4>
                            <p className="text-gray-600 text-xs mb-3 line-clamp-3">
                                {p.description}
                            </p>
                            <div className="pt-2 border-t border-gray-50 flex justify-between items-center">
                                <span className={`text-[10px] px-2 py-0.5 rounded font-mono ${schema.bgClass} ${schema.textClass}`}>
                                    {p.appType}
                                </span>
                                <span className="text-[10px] text-gray-400">{rule.id}</span>
                            </div>
                        </div>
                    );
                })}
            </div>
            
            {domainRules.length === 0 && (
                <div className="text-center py-8 bg-gray-50 rounded-lg text-gray-500 border border-dashed text-sm">
                    No rules found. Use the wizard above to create one.
                </div>
            )}
        </div>
    );
};
