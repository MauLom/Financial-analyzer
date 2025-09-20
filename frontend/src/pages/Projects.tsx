import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, DollarSign, TrendingUp, Calendar } from 'lucide-react';
import { projectApi } from '../services/api';
import { Project } from '../types';
import { formatCurrency, formatPercentage, getRiskLevelColor, getStatusColor } from '../utils/format';

const Projects: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showReturnForm, setShowReturnForm] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const [projectFormData, setProjectFormData] = useState({
    name: '',
    description: '',
    initial_investment: '',
    expected_return: '',
    risk_level: 'medium' as 'low' | 'medium' | 'high',
    duration_months: '',
    status: 'active' as 'active' | 'completed' | 'cancelled',
  });

  const [returnFormData, setReturnFormData] = useState({
    return_amount: '',
    return_date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const data = await projectApi.getAll();
      setProjects(data);
    } catch (err) {
      setError('Failed to load projects');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleProjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const projectData = {
        ...projectFormData,
        initial_investment: parseFloat(projectFormData.initial_investment),
        expected_return: parseFloat(projectFormData.expected_return),
        duration_months: projectFormData.duration_months ? parseInt(projectFormData.duration_months) : undefined,
      };

      if (editingProject) {
        const updated = await projectApi.update(editingProject.id, projectData);
        setProjects(prev =>
          prev.map(p => (p.id === editingProject.id ? updated : p))
        );
      } else {
        const newProject = await projectApi.create(projectData);
        setProjects(prev => [newProject, ...prev]);
      }

      resetProjectForm();
    } catch (err) {
      setError('Failed to save project');
      console.error(err);
    }
  };

  const handleReturnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;

    try {
      const returnData = {
        return_amount: parseFloat(returnFormData.return_amount),
        return_date: returnFormData.return_date,
        notes: returnFormData.notes || undefined,
      };

      await projectApi.addReturn(selectedProject.id, returnData);
      
      // Refresh the project to get updated returns
      const updated = await projectApi.getById(selectedProject.id);
      setProjects(prev =>
        prev.map(p => (p.id === selectedProject.id ? updated : p))
      );

      resetReturnForm();
    } catch (err) {
      setError('Failed to add return');
      console.error(err);
    }
  };

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    setProjectFormData({
      name: project.name,
      description: project.description || '',
      initial_investment: project.initial_investment.toString(),
      expected_return: project.expected_return.toString(),
      risk_level: project.risk_level || 'medium',
      duration_months: project.duration_months?.toString() || '',
      status: project.status,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      try {
        await projectApi.delete(id);
        setProjects(prev => prev.filter(p => p.id !== id));
      } catch (err) {
        setError('Failed to delete project');
        console.error(err);
      }
    }
  };

  const handleAddReturn = async (project: Project) => {
    // Fetch full project details including returns
    try {
      const fullProject = await projectApi.getById(project.id);
      setSelectedProject(fullProject);
      setShowReturnForm(true);
    } catch (err) {
      setError('Failed to load project details');
      console.error(err);
    }
  };

  const resetProjectForm = () => {
    setShowForm(false);
    setEditingProject(null);
    setProjectFormData({
      name: '',
      description: '',
      initial_investment: '',
      expected_return: '',
      risk_level: 'medium',
      duration_months: '',
      status: 'active',
    });
  };

  const resetReturnForm = () => {
    setShowReturnForm(false);
    setSelectedProject(null);
    setReturnFormData({
      return_amount: '',
      return_date: new Date().toISOString().split('T')[0],
      notes: '',
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
            Investment Projects
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Track and manage your investment projects
          </p>
        </div>
        <div className="mt-4 md:mt-0">
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Project
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}

      {/* Project Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingProject ? 'Edit Project' : 'Add New Project'}
              </h3>
              <form onSubmit={handleProjectSubmit}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Name</label>
                    <input
                      type="text"
                      value={projectFormData.name}
                      onChange={(e) => setProjectFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea
                      value={projectFormData.description}
                      onChange={(e) => setProjectFormData(prev => ({ ...prev, description: e.target.value }))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      rows={2}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Initial Investment</label>
                    <input
                      type="number"
                      step="0.01"
                      value={projectFormData.initial_investment}
                      onChange={(e) => setProjectFormData(prev => ({ ...prev, initial_investment: e.target.value }))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Expected Return (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={projectFormData.expected_return}
                      onChange={(e) => setProjectFormData(prev => ({ ...prev, expected_return: e.target.value }))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Risk Level</label>
                    <select
                      value={projectFormData.risk_level}
                      onChange={(e) => setProjectFormData(prev => ({ 
                        ...prev, 
                        risk_level: e.target.value as 'low' | 'medium' | 'high' 
                      }))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Duration (months)</label>
                    <input
                      type="number"
                      value={projectFormData.duration_months}
                      onChange={(e) => setProjectFormData(prev => ({ ...prev, duration_months: e.target.value }))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <select
                      value={projectFormData.status}
                      onChange={(e) => setProjectFormData(prev => ({ 
                        ...prev, 
                        status: e.target.value as 'active' | 'completed' | 'cancelled' 
                      }))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    >
                      <option value="active">Active</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
                <div className="flex items-center justify-end space-x-4 mt-6">
                  <button
                    type="button"
                    onClick={resetProjectForm}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md shadow-sm hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700"
                  >
                    {editingProject ? 'Update' : 'Add'} Project
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Return Form Modal */}
      {showReturnForm && selectedProject && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Add Return for {selectedProject.name}
              </h3>
              <form onSubmit={handleReturnSubmit}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Return Amount</label>
                    <input
                      type="number"
                      step="0.01"
                      value={returnFormData.return_amount}
                      onChange={(e) => setReturnFormData(prev => ({ ...prev, return_amount: e.target.value }))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Return Date</label>
                    <input
                      type="date"
                      value={returnFormData.return_date}
                      onChange={(e) => setReturnFormData(prev => ({ ...prev, return_date: e.target.value }))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Notes</label>
                    <textarea
                      value={returnFormData.notes}
                      onChange={(e) => setReturnFormData(prev => ({ ...prev, notes: e.target.value }))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      rows={2}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-end space-x-4 mt-6">
                  <button
                    type="button"
                    onClick={resetReturnForm}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md shadow-sm hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700"
                  >
                    Add Return
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Projects Grid */}
      <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <div key={project.id} className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900 truncate">
                  {project.name}
                </h3>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleEdit(project)}
                    className="text-indigo-600 hover:text-indigo-900"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(project.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              {project.description && (
                <p className="mt-1 text-sm text-gray-500">{project.description}</p>
              )}
              
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="flex items-center text-sm text-gray-500">
                    <DollarSign className="h-4 w-4 mr-1" />
                    Initial Investment
                  </span>
                  <span className="text-sm font-medium text-gray-900">
                    {formatCurrency(project.initial_investment)}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="flex items-center text-sm text-gray-500">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    Expected Return
                  </span>
                  <span className="text-sm font-medium text-gray-900">
                    {formatPercentage(project.expected_return)}
                  </span>
                </div>
                
                {project.total_returns !== undefined && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Actual Returns</span>
                    <span className="text-sm font-medium text-green-600">
                      {formatCurrency(project.total_returns)}
                    </span>
                  </div>
                )}
                
                {project.actual_return_rate && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Actual Rate</span>
                    <span className="text-sm font-medium text-green-600">
                      {formatPercentage(parseFloat(project.actual_return_rate))}
                    </span>
                  </div>
                )}
              </div>
              
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {project.risk_level && (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRiskLevelColor(project.risk_level)}`}>
                      {project.risk_level} risk
                    </span>
                  )}
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                    {project.status}
                  </span>
                </div>
                
                {project.duration_months && (
                  <span className="flex items-center text-xs text-gray-500">
                    <Calendar className="h-3 w-3 mr-1" />
                    {project.duration_months}m
                  </span>
                )}
              </div>
              
              <div className="mt-4">
                <button
                  onClick={() => handleAddReturn(project)}
                  className="w-full inline-flex justify-center items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
                >
                  Add Return
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {projects.length === 0 && (
        <div className="text-center py-12">
          <p className="text-sm text-gray-500">No projects found. Add your first investment project!</p>
        </div>
      )}
    </div>
  );
};

export default Projects;