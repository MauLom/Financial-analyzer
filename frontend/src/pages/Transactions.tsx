import React, { useState, useEffect, useRef } from 'react';
import { Plus, Edit, Trash2, Filter, Upload, Download, FileText } from 'lucide-react';
import { transactionApi, analyticsApi } from '../services/api';
import { Transaction } from '../types';
import { formatCurrency, formatDate, getTransactionTypeColor } from '../utils/format';

const Transactions: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [uploadProgress, setUploadProgress] = useState<{
    uploading: boolean;
    message: string;
    errors?: any[];
  }>({ uploading: false, message: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [filter, setFilter] = useState<{
    type: string;
    category: string;
    startDate: string;
    endDate: string;
  }>({
    type: '',
    category: '',
    startDate: '',
    endDate: '',
  });

  const [formData, setFormData] = useState({
    type: 'expense' as 'income' | 'expense' | 'investment',
    amount: '',
    description: '',
    category: '',
    date: new Date().toISOString().split('T')[0],
  });

  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch transactions
        const filterParams = Object.fromEntries(
          Object.entries(filter).filter(([_, value]) => value !== '')
        );
        const transactionsData = await transactionApi.getAll(filterParams);
        setTransactions(transactionsData);
        
        // Fetch categories from settings
        const categoriesData = await analyticsApi.getCategories();
        setCategories(categoriesData);
        
      } catch (err) {
        setError('Failed to load data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const transactionData = {
        ...formData,
        amount: parseFloat(formData.amount),
      };

      if (editingTransaction) {
        const updated = await transactionApi.update(editingTransaction.id, transactionData);
        setTransactions(prev =>
          prev.map(t => (t.id === editingTransaction.id ? updated : t))
        );
      } else {
        const newTransaction = await transactionApi.create(transactionData);
        setTransactions(prev => [newTransaction, ...prev]);
      }

      resetForm();
    } catch (err) {
      setError('Failed to save transaction');
      console.error(err);
    }
  };

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setFormData({
      type: transaction.type,
      amount: transaction.amount.toString(),
      description: transaction.description,
      category: transaction.category || '',
      date: transaction.date,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      try {
        await transactionApi.delete(id);
        setTransactions(prev => prev.filter(t => t.id !== id));
      } catch (err) {
        setError('Failed to delete transaction');
        console.error(err);
      }
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingTransaction(null);
    setFormData({
      type: 'expense',
      amount: '',
      description: '',
      category: '',
      date: new Date().toISOString().split('T')[0],
    });
  };

  const handleDownloadTemplate = async () => {
    try {
      const blob = await transactionApi.downloadTemplate();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'transaction_template.csv';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to download template');
      console.error(err);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      setError('Please select a CSV file');
      return;
    }

    setUploadProgress({ uploading: true, message: 'Uploading and processing CSV...' });
    setError(null);

    try {
      const result = await transactionApi.uploadCSV(file);
      setUploadProgress({
        uploading: false,
        message: `Success: ${result.message}`,
      });
      
      // Refresh transactions list
      const filterParams = Object.fromEntries(
        Object.entries(filter).filter(([_, value]) => value !== '')
      );
      const transactionsData = await transactionApi.getAll(filterParams);
      setTransactions(transactionsData);
      
      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      // Auto-hide success message after 5 seconds
      setTimeout(() => {
        setUploadProgress({ uploading: false, message: '' });
      }, 5000);
      
    } catch (err: any) {
      console.error('Upload error:', err);
      const errorMessage = err.response?.data?.message || err.response?.data?.error || 'Failed to upload CSV';
      const errors = err.response?.data?.errors || [];
      
      setUploadProgress({
        uploading: false,
        message: `Error: ${errorMessage}`,
        errors: errors.length > 0 ? errors : undefined
      });
      
      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const toggleBulkImport = () => {
    setShowBulkImport(!showBulkImport);
    setUploadProgress({ uploading: false, message: '' });
    setError(null);
  };

  if (loading && transactions.length === 0 && categories.length === 0) {
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
            Transactions
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Track your income, expenses, and investments
          </p>
        </div>
        <div className="mt-4 md:mt-0 space-x-2">
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Transaction
          </button>
          <button
            onClick={toggleBulkImport}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <Upload className="h-4 w-4 mr-2" />
            Bulk Import
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}

      {/* Filters */}
      <div className="mt-6 bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            <Filter className="inline h-5 w-5 mr-2" />
            Filters
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Type</label>
              <select
                value={filter.type}
                onChange={(e) => setFilter(prev => ({ ...prev, type: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="">All Types</option>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
                <option value="investment">Investment</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Category</label>
              <input
                type="text"
                value={filter.category}
                onChange={(e) => setFilter(prev => ({ ...prev, category: e.target.value }))}
                placeholder="Filter by category"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Start Date</label>
              <input
                type="date"
                value={filter.startDate}
                onChange={(e) => setFilter(prev => ({ ...prev, startDate: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">End Date</label>
              <input
                type="date"
                value={filter.endDate}
                onChange={(e) => setFilter(prev => ({ ...prev, endDate: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Bulk Import Modal */}
      {showBulkImport && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-120 max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Bulk Import Transactions
              </h3>
              
              <div className="space-y-6">
                {/* Template Download Section */}
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                  <div className="flex items-center">
                    <FileText className="h-5 w-5 text-blue-400 mr-2" />
                    <h4 className="text-sm font-medium text-blue-900">Download Template</h4>
                  </div>
                  <p className="mt-2 text-sm text-blue-700">
                    Download our CSV template to ensure your data is formatted correctly. The template includes sample transactions to guide you.
                  </p>
                  <button
                    onClick={handleDownloadTemplate}
                    className="mt-3 inline-flex items-center px-3 py-2 border border-blue-300 shadow-sm text-sm font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download CSV Template
                  </button>
                </div>

                {/* File Upload Section */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-gray-900">Upload CSV File</h4>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                    <div className="text-center">
                      <Upload className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="mt-4">
                        <label htmlFor="csv-upload" className="cursor-pointer">
                          <span className="mt-2 block text-sm font-medium text-gray-900">
                            Choose CSV file to upload
                          </span>
                          <input
                            ref={fileInputRef}
                            id="csv-upload"
                            name="csv-upload"
                            type="file"
                            accept=".csv"
                            onChange={handleFileUpload}
                            disabled={uploadProgress.uploading}
                            className="sr-only"
                          />
                        </label>
                        <p className="mt-1 text-sm text-gray-500">
                          CSV files up to 5MB
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Upload Progress/Result */}
                  {uploadProgress.message && (
                    <div className={`p-4 rounded-md ${
                      uploadProgress.message.startsWith('Success') 
                        ? 'bg-green-50 border border-green-200' 
                        : uploadProgress.message.startsWith('Error')
                        ? 'bg-red-50 border border-red-200'
                        : 'bg-blue-50 border border-blue-200'
                    }`}>
                      <div className={`text-sm ${
                        uploadProgress.message.startsWith('Success') 
                          ? 'text-green-700' 
                          : uploadProgress.message.startsWith('Error')
                          ? 'text-red-700'
                          : 'text-blue-700'
                      }`}>
                        {uploadProgress.message}
                      </div>
                      
                      {uploadProgress.errors && uploadProgress.errors.length > 0 && (
                        <div className="mt-3">
                          <h5 className="text-sm font-medium text-red-800 mb-2">Validation Errors:</h5>
                          <div className="max-h-40 overflow-y-auto space-y-1">
                            {uploadProgress.errors.slice(0, 10).map((error: any, index: number) => (
                              <div key={index} className="text-xs text-red-600 bg-red-100 p-2 rounded">
                                Row {error.row}: {error.error}
                              </div>
                            ))}
                            {uploadProgress.errors.length > 10 && (
                              <p className="text-xs text-red-600 italic">
                                ... and {uploadProgress.errors.length - 10} more errors
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {uploadProgress.uploading && (
                    <div className="flex items-center justify-center">
                      <div className="loading-spinner mr-2"></div>
                      <span className="text-sm text-gray-600">Processing...</span>
                    </div>
                  )}
                </div>

                {/* Instructions */}
                <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">CSV Format Requirements:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Required columns: type, amount, description, date</li>
                    <li>• Optional column: category</li>
                    <li>• Type must be: income, expense, or investment</li>
                    <li>• Amount must be a positive number</li>
                    <li>• Date format: YYYY-MM-DD (e.g., 2024-01-15)</li>
                    <li>• Maximum 1000 transactions per upload</li>
                  </ul>
                </div>
              </div>

              <div className="flex items-center justify-end mt-6">
                <button
                  type="button"
                  onClick={toggleBulkImport}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md shadow-sm hover:bg-gray-200"
                  disabled={uploadProgress.uploading}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Transaction Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingTransaction ? 'Edit Transaction' : 'Add New Transaction'}
              </h3>
              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Type</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        type: e.target.value as 'income' | 'expense' | 'investment' 
                      }))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      required
                    >
                      <option value="income">Income</option>
                      <option value="expense">Expense</option>
                      <option value="investment">Investment</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Amount</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <input
                      type="text"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Category</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    >
                      <option value="">Select category</option>
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Date</label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      required
                    />
                  </div>
                </div>
                <div className="flex items-center justify-end space-x-4 mt-6">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md shadow-sm hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700"
                  >
                    {editingTransaction ? 'Update' : 'Add'} Transaction
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Transactions List */}
      <div className="mt-6 bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {transactions.map((transaction) => (
            <li key={transaction.id} className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTransactionTypeColor(transaction.type)}`}>
                        {transaction.type}
                      </span>
                      <span className="ml-3 text-sm font-medium text-gray-900">
                        {transaction.description}
                      </span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className={`text-sm font-medium ${
                        transaction.type === 'income' ? 'text-green-600' : 'text-gray-900'
                      }`}>
                        {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                      </span>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEdit(transaction)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(transaction.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="mt-1 flex items-center text-sm text-gray-500">
                    <span>{formatDate(transaction.date)}</span>
                    {transaction.category && (
                      <>
                        <span className="mx-2">•</span>
                        <span>{transaction.category}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
        {transactions.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-sm text-gray-500">No transactions found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Transactions;