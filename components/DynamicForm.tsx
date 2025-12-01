
import React, { useState, useEffect } from 'react';
import { SchemaField } from '../types';

interface DynamicFormProps {
    fields: SchemaField[];
    initialValues?: Record<string, any>;
    onSubmit: (values: Record<string, any>) => void;
    onCancel: () => void;
}

export const DynamicForm: React.FC<DynamicFormProps> = ({ fields, initialValues = {}, onSubmit, onCancel }) => {
    const [values, setValues] = useState<Record<string, any>>(initialValues);

    // Initialize default values based on field types if not provided
    useEffect(() => {
        const defaults: Record<string, any> = { ...initialValues };
        fields.forEach(field => {
            if (defaults[field.key] === undefined) {
                if (field.type === 'boolean') defaults[field.key] = false;
                else defaults[field.key] = '';
            }
        });
        setValues(defaults);
    }, [fields, initialValues]);

    const handleChange = (key: string, value: any) => {
        setValues(prev => ({ ...prev, [key]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(values);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 p-4 border border-gray-200 rounded-lg bg-gray-50/50">
            {fields.map(field => (
                <div key={field.key}>
                    {field.type === 'boolean' ? (
                        <div className="flex items-center">
                             <input
                                id={field.key}
                                type="checkbox"
                                checked={!!values[field.key]}
                                onChange={(e) => handleChange(field.key, e.target.checked)}
                                className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
                            />
                            <label htmlFor={field.key} className="ml-2 block text-sm font-medium text-gray-700">
                                {field.label}
                            </label>
                        </div>
                    ) : (
                        <div>
                            <label htmlFor={field.key} className="block text-sm font-medium text-gray-700">
                                {field.label}
                            </label>
                            {field.type === 'select' && field.options ? (
                                <select
                                    id={field.key}
                                    value={values[field.key]}
                                    onChange={(e) => handleChange(field.key, e.target.value)}
                                    className="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
                                >
                                    <option value="" disabled>Select an option</option>
                                    {field.options.map(opt => (
                                        <option key={opt} value={opt}>{opt}</option>
                                    ))}
                                </select>
                            ) : (
                                <input
                                    type={field.type === 'number' ? 'number' : 'text'}
                                    id={field.key}
                                    value={values[field.key]}
                                    onChange={(e) => handleChange(field.key, field.type === 'number' ? parseFloat(e.target.value) : e.target.value)}
                                    placeholder={field.placeholder}
                                    className="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
                                />
                            )}
                        </div>
                    )}
                </div>
            ))}
            <div className="flex justify-end space-x-2 pt-2">
                 <button
                    type="button"
                    onClick={onCancel}
                    className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
                >
                    Save Rule
                </button>
            </div>
        </form>
    );
};
