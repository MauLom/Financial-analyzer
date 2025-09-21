import React, { useState, useEffect } from 'react';
import { Save, Settings as SettingsIcon } from 'lucide-react';
import { analyticsApi } from '../services/api';
import { Settings as SettingsType } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

const Settings: React.FC = () => {
  const [settings, setSettings] = useState<SettingsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const { t } = useLanguage();

  const [formData, setFormData] = useState({
    inflation_rate: '',
    cost_of_living_increase: '',
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const data = await analyticsApi.getSettings();
      setSettings(data);
      setFormData({
        inflation_rate: data.inflation_rate,
        cost_of_living_increase: data.cost_of_living_increase,
      });
    } catch (err) {
      setError('Failed to load settings');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const updatedSettings = await analyticsApi.updateSettings(formData);
      setSettings(updatedSettings);
      setSuccess('Settings updated successfully');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err) {
      setError('Failed to update settings');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const resetToDefaults = () => {
    setFormData({
      inflation_rate: '3.5',
      cost_of_living_increase: '2.8',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            <SettingsIcon className="inline h-8 w-8 mr-2" />
            {t('settings.title')}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            {t('settings.subtitle')}
          </p>
        </div>
      </div>

      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}

      {success && (
        <div className="mt-4 bg-green-50 border border-green-200 rounded-md p-4">
          <div className="text-sm text-green-700">{success}</div>
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Economic Parameters */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Economic Parameters</h3>
            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                <div>
                  <label htmlFor="inflation_rate" className="block text-sm font-medium text-gray-700">
                    {t('settings.inflationRate')} (%)
                  </label>
                  <div className="mt-1">
                    <input
                      type="number"
                      step="0.1"
                      id="inflation_rate"
                      value={formData.inflation_rate}
                      onChange={(e) => handleInputChange('inflation_rate', e.target.value)}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      required
                    />
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    Used to calculate real (inflation-adjusted) values in growth simulations and analytics.
                  </p>
                </div>

                <div>
                  <label htmlFor="cost_of_living_increase" className="block text-sm font-medium text-gray-700">
                    {t('settings.costOfLivingIncrease')} (%)
                  </label>
                  <div className="mt-1">
                    <input
                      type="number"
                      step="0.1"
                      id="cost_of_living_increase"
                      value={formData.cost_of_living_increase}
                      onChange={(e) => handleInputChange('cost_of_living_increase', e.target.value)}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      required
                    />
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    {t('settings.costOfLivingDesc')}
                  </p>
                </div>

                <div className="flex items-center justify-between space-x-4">
                  <button
                    type="button"
                    onClick={resetToDefaults}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    {t('settings.resetToDefaults')}
                  </button>
                  
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {saving ? (
                      <div className="loading-spinner w-4 h-4 mr-2"></div>
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    {saving ? t('settings.saving') : t('settings.saveSettings')}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Information Panel */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">{t('settings.aboutSettings')}</h3>
            
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-900">{t('settings.inflationRate')}</h4>
                <p className="mt-1 text-sm text-gray-600">
                  {t('settings.inflationRateDesc')}
                </p>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-900">{t('settings.costOfLivingIncrease')}</h4>
                <p className="mt-1 text-sm text-gray-600">
                  This parameter helps estimate how your expenses might grow over time. It can be 
                  different from general inflation as it reflects changes in your personal cost of 
                  living, including housing, healthcare, and other specific expenses.
                </p>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-900">Impact on Analysis</h4>
                <p className="mt-1 text-sm text-gray-600">
                  These settings affect:
                </p>
                <ul className="mt-2 text-sm text-gray-600 list-disc list-inside space-y-1">
                  <li>Growth simulation real value calculations</li>
                  <li>Long-term investment return analysis</li>
                  <li>Future value projections</li>
                  <li>Retirement and goal planning recommendations</li>
                </ul>
              </div>
            </div>

            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <SettingsIcon className="h-5 w-5 text-blue-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">
                    Tip: Regular Updates
                  </h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <p>
                      Consider reviewing and updating these values annually or when 
                      economic conditions change significantly. This ensures your 
                      financial projections remain accurate and realistic.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Current Settings Display */}
      {settings && (
        <div className="mt-6 bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Current Settings</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm font-medium text-gray-500">{t('settings.inflationRate')}</div>
                <div className="mt-1 text-2xl font-semibold text-gray-900">{settings.inflation_rate}%</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm font-medium text-gray-500">{t('settings.costOfLivingIncrease')}</div>
                <div className="mt-1 text-2xl font-semibold text-gray-900">{settings.cost_of_living_increase}%</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;