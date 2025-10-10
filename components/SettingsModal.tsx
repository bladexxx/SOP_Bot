import React, { useState, useEffect } from 'react';
import { AppSettings, GeminiModel } from '../types';
import { XCircleIcon } from './Icons';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSettings: AppSettings;
  onSave: (newSettings: AppSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, currentSettings, onSave }) => {
  const [settings, setSettings] = useState<AppSettings>(currentSettings);

  useEffect(() => {
    // Reset local state if the modal is reopened with new props
    if (isOpen) {
      setSettings(currentSettings);
    }
  }, [isOpen, currentSettings]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(settings);
  };

  const handleChange = (field: keyof AppSettings, value: string) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const commonInputClass = "mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 text-gray-800 focus:outline-none focus:ring-teal-600 focus:border-teal-600 sm:text-sm";
  const geminiModelOptions: GeminiModel[] = ['gemini-2.0-flash', 'gemini-2.5-flash', 'gemini-2.5-pro'];

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4" 
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-auto flex flex-col relative border border-gray-200"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex justify-between items-center p-4 border-b border-gray-200">
          <h2 id="settings-title" className="text-lg font-bold text-gray-900">Application Settings</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 transition-colors" aria-label="Close settings dialog">
            <XCircleIcon className="h-7 w-7" />
          </button>
        </header>

        <main className="p-6 text-gray-700 space-y-6">
            <section>
                <h3 className="font-semibold text-gray-800">NiFi REST API Configuration</h3>
                <p className="text-sm text-gray-500 mb-3">Parameters for triggering NiFi dataflows.</p>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="nifiUrl" className="block text-sm font-medium text-gray-700">NiFi Instance URL</label>
                        <input 
                            type="text" 
                            id="nifiUrl"
                            value={settings.nifiUrl}
                            onChange={(e) => handleChange('nifiUrl', e.target.value)}
                            className={commonInputClass}
                            placeholder="e.g., http://your-nifi-instance:8080"
                        />
                    </div>
                     <div>
                        <label htmlFor="nifiEndpoint" className="block text-sm font-medium text-gray-700">REST Endpoint Path</label>
                        <input 
                            type="text" 
                            id="nifiEndpoint"
                            value={settings.nifiEndpoint}
                            onChange={(e) => handleChange('nifiEndpoint', e.target.value)}
                            className={commonInputClass}
                            placeholder="e.g., /nifi-api/processors/your-id/run"
                        />
                    </div>
                </div>
            </section>
            <section>
                <h3 className="font-semibold text-gray-800">AI Model Configuration</h3>
                <p className="text-sm text-gray-500 mb-3">Settings for the Direct Gemini AI Provider.</p>
                <div>
                    <label htmlFor="geminiModel" className="block text-sm font-medium text-gray-700">Gemini Model Selection</label>
                     <select
                        id="geminiModel"
                        value={settings.geminiModel}
                        onChange={(e) => handleChange('geminiModel', e.target.value)}
                        className={commonInputClass}
                    >
                        {geminiModelOptions.map(model => (
                            <option key={model} value={model}>{model}</option>
                        ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">This selection overrides any model specified in environment variables for direct Gemini calls.</p>
                </div>
            </section>
        </main>
        <footer className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end items-center space-x-3">
            <button onClick={onClose} className="px-4 py-2 text-sm font-semibold rounded-md transition-colors duration-200 bg-transparent hover:bg-gray-200 text-gray-700">
                Cancel
            </button>
            <button onClick={handleSave} className="px-4 py-2 text-sm font-semibold rounded-md transition-colors duration-200 bg-teal-900 hover:bg-teal-800 text-white">
                Save Settings
            </button>
        </footer>
      </div>
    </div>
  );
};
