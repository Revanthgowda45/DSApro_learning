import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { getTopics, getCompanies } from '../data/dsaDatabase';
import { adminService, NewProblemData } from '../services/adminService';
import { DSAQuestion } from '../data/dsaDatabase';
import { Download, BarChart3, Plus, AlertCircle, CheckCircle, Edit, Trash2, Search, ChevronLeft, ChevronRight, Undo2, RotateCcw } from 'lucide-react';



const Admin: React.FC = () => {
  const { user } = useAuth();
  const [newProblem, setNewProblem] = useState<NewProblemData>({
    topic: '',
    question: '',
    companies: [],
    remarks: '',
    difficulty: 'Easy',
    link: ''
  });
  const [companyInput, setCompanyInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [existingTopics, setExistingTopics] = useState<string[]>([]);
  const [existingCompanies, setExistingCompanies] = useState<string[]>([]);
  const [dbStats, setDbStats] = useState<any>(null);
  const [lastAddedData, setLastAddedData] = useState<any>(null);
  
  // Problem management state
  const [activeTab, setActiveTab] = useState<'add' | 'manage'>('add');
  const [problems, setProblems] = useState<DSAQuestion[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingProblem, setEditingProblem] = useState<DSAQuestion | null>(null);
  const [isLoadingProblems, setIsLoadingProblems] = useState(false);
  
  // Undo functionality state
  const [undoStack, setUndoStack] = useState<Array<{
    type: 'edit' | 'delete' | 'add';
    originalData: DSAQuestion;
    newData?: DSAQuestion;
    timestamp: number;
  }>>([]);
  const [showUndoNotification, setShowUndoNotification] = useState(false);

  // Check if user is admin
  if (!user || !user.is_admin) {
    return <Navigate to="/dashboard" replace />;
  }

  useEffect(() => {
    setExistingTopics(getTopics());
    setExistingCompanies(getCompanies());
    loadDatabaseStats();
    if (activeTab === 'manage') {
      loadProblems();
    }
  }, [activeTab, currentPage]);

  const loadDatabaseStats = async () => {
    try {
      const stats = await adminService.getDatabaseStats();
      setDbStats(stats);
    } catch (error) {
      console.error('Failed to load database stats:', error);
    }
  };

  const loadProblems = async () => {
    setIsLoadingProblems(true);
    try {
      const result = await adminService.getAllProblems(currentPage, 10);
      setProblems(result.problems);
      setTotalPages(result.totalPages);
    } catch (error) {
      console.error('Failed to load problems:', error);
    } finally {
      setIsLoadingProblems(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewProblem(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const addCompany = () => {
    if (companyInput.trim() && !newProblem.companies.includes(companyInput.trim())) {
      setNewProblem(prev => ({
        ...prev,
        companies: [...prev.companies, companyInput.trim()]
      }));
      setCompanyInput('');
    }
  };

  const removeCompany = (company: string) => {
    setNewProblem(prev => ({
      ...prev,
      companies: prev.companies.filter(c => c !== company)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      // Validate the problem data
      const validation = adminService.validateProblemData(newProblem);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }

      // Add the problem using the admin service
      const result = await adminService.addProblem(newProblem);
      
      if (result.success) {
        setMessage({
          type: 'success',
          text: result.message
        });
        
        // Store the updated data for download option
        setLastAddedData(result.updatedData);
        
        // Refresh database stats
        await loadDatabaseStats();
        
        // Reset form
        setNewProblem({
          topic: '',
          question: '',
          companies: [],
          remarks: '',
          difficulty: 'Easy',
          link: ''
        });
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Error adding problem:', error);
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to add problem'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadUpdatedJSON = () => {
    if (lastAddedData) {
      adminService.generateDownloadableJSON(lastAddedData);
    }
  };

  const handleEditProblem = (problem: DSAQuestion) => {
    setEditingProblem(problem);
    setNewProblem({
      topic: problem.topic,
      question: problem.question,
      companies: problem.companies,
      remarks: problem.remarks,
      difficulty: problem.difficulty,
      link: problem.link || ''
    });
    setActiveTab('add');
  };

  const handleDeleteProblem = async (problemId: number) => {
    if (!confirm('Are you sure you want to delete this problem?')) {
      return;
    }

    // Get the problem data before deletion for undo
    const problemToDelete = await adminService.getProblemById(problemId);
    if (!problemToDelete) {
      setMessage({ type: 'error', text: 'Problem not found' });
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await adminService.deleteProblem(problemId);
      
      if (result.success) {
        // Add to undo stack
        setUndoStack(prev => [...prev, {
          type: 'delete',
          originalData: problemToDelete,
          timestamp: Date.now()
        }]);
        
        setMessage({ type: 'success', text: result.message });
        setLastAddedData(result.updatedData);
        await loadDatabaseStats();
        await loadProblems();
        showUndoNotificationTemporary();
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to delete problem'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateProblem = async () => {
    if (!editingProblem) return;

    setIsSubmitting(true);
    try {
      const result = await adminService.editProblem(editingProblem.id, newProblem);
      
      if (result.success) {
        // Add to undo stack
        setUndoStack(prev => [...prev, {
          type: 'edit',
          originalData: editingProblem,
          newData: {
            ...editingProblem,
            topic: newProblem.topic,
            question: newProblem.question,
            companies: newProblem.companies,
            remarks: newProblem.remarks,
            difficulty: newProblem.difficulty,
            link: newProblem.link || undefined
          },
          timestamp: Date.now()
        }]);
        
        setMessage({ type: 'success', text: result.message });
        setLastAddedData(result.updatedData);
        setEditingProblem(null);
        await loadDatabaseStats();
        await loadProblems();
        showUndoNotificationTemporary();
        
        // Reset form
        setNewProblem({
          topic: '',
          question: '',
          companies: [],
          remarks: '',
          difficulty: 'Easy',
          link: ''
        });
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to update problem'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const cancelEdit = () => {
    setEditingProblem(null);
    setNewProblem({
      topic: '',
      question: '',
      companies: [],
      remarks: '',
      difficulty: 'Easy',
      link: ''
    });
  };

  const showUndoNotificationTemporary = () => {
    setShowUndoNotification(true);
    setTimeout(() => setShowUndoNotification(false), 10000); // Hide after 10 seconds
  };

  const handleUndo = async () => {
    if (undoStack.length === 0) return;
    
    const lastAction = undoStack[undoStack.length - 1];
    setIsSubmitting(true);
    
    try {
      let result;
      
      if (lastAction.type === 'delete') {
        // Re-add the deleted problem
        result = await adminService.addProblem({
          topic: lastAction.originalData.topic,
          question: lastAction.originalData.question,
          companies: lastAction.originalData.companies,
          remarks: lastAction.originalData.remarks,
          difficulty: lastAction.originalData.difficulty,
          link: lastAction.originalData.link || ''
        });
      } else if (lastAction.type === 'edit') {
        // Revert to original data
        result = await adminService.editProblem(lastAction.originalData.id, {
          topic: lastAction.originalData.topic,
          question: lastAction.originalData.question,
          companies: lastAction.originalData.companies,
          remarks: lastAction.originalData.remarks,
          difficulty: lastAction.originalData.difficulty,
          link: lastAction.originalData.link || ''
        });
      }
      
      if (result?.success) {
        // Remove the last action from undo stack
        setUndoStack(prev => prev.slice(0, -1));
        setMessage({ type: 'success', text: 'Action undone successfully' });
        setLastAddedData(result.updatedData);
        await loadDatabaseStats();
        await loadProblems();
        setShowUndoNotification(false);
      } else {
        throw new Error(result?.message || 'Failed to undo action');
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to undo action'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const clearUndoStack = () => {
    setUndoStack([]);
    setShowUndoNotification(false);
  };

  const filteredProblems = problems.filter(problem => 
    problem.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    problem.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
    problem.companies.some(company => company.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                👑 Admin Panel
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Add new problems to the DSA database
              </p>
            </div>
            {/* Quick Undo Button */}
            {undoStack.length > 0 && (
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="text-sm text-gray-500 dark:text-gray-400 block">
                    {undoStack.length} action{undoStack.length > 1 ? 's' : ''} to undo
                  </span>
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    Last: {new Date(undoStack[undoStack.length - 1]?.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <button
                  onClick={handleUndo}
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 shadow-sm"
                  title="Undo last action"
                >
                  <RotateCcw className="h-4 w-4" />
                  Undo
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Database Stats */}
        {dbStats && (
          <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Problems</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{dbStats.totalQuestions}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-blue-500" />
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Topics</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{dbStats.totalTopics}</p>
                </div>
                <Plus className="h-8 w-8 text-green-500" />
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Hard Problems</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {(dbStats.difficultyBreakdown?.Hard || 0) + (dbStats.difficultyBreakdown?.['Very Hard'] || 0)}
                  </p>
                </div>
                <AlertCircle className="h-8 w-8 text-red-500" />
              </div>
            </div>
          </div>
        )}

        {/* Undo Notification */}
        {showUndoNotification && undoStack.length > 0 && (
          <div className="mb-6 p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-800 flex items-center gap-3">
            <Undo2 className="h-5 w-5 flex-shrink-0" />
            <div className="flex-1">
              <span className="font-medium">Action completed!</span>
              <span className="ml-2 text-sm opacity-90">
                You can undo the last {undoStack.length} action{undoStack.length > 1 ? 's' : ''}
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleUndo}
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <RotateCcw className="h-4 w-4" />
                Undo Last
              </button>
              <button
                onClick={clearUndoStack}
                className="px-3 py-1 text-blue-600 dark:text-blue-400 text-sm hover:bg-blue-100 dark:hover:bg-blue-800/30 rounded-md transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
        )}

        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
            message.type === 'success' 
              ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-800'
              : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="h-5 w-5 flex-shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
            )}
            <div className="flex-1">
              {message.text}
              {lastAddedData && message.type === 'success' && (
                <button
                  onClick={handleDownloadUpdatedJSON}
                  className="ml-4 inline-flex items-center gap-2 px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors"
                >
                  <Download className="h-4 w-4" />
                  Download Updated JSON
                </button>
              )}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('add')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'add'
                    ? 'border-green-500 text-green-600 dark:text-green-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <Plus className="h-4 w-4 inline mr-2" />
                Add Problem
              </button>
              <button
                onClick={() => setActiveTab('manage')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'manage'
                    ? 'border-green-500 text-green-600 dark:text-green-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <Edit className="h-4 w-4 inline mr-2" />
                Manage Problems
              </button>
            </nav>
          </div>
        </div>

        {/* Add/Edit Problem Form */}
        {activeTab === 'add' && (
          <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {editingProblem ? `Edit Problem (ID: ${editingProblem.id})` : 'Add New Problem'}
              </h2>
              {editingProblem && (
                <button
                  onClick={cancelEdit}
                  className="mt-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                >
                  ← Cancel Edit
                </button>
              )}
            </div>

            <form onSubmit={editingProblem ? (e) => { e.preventDefault(); handleUpdateProblem(); } : handleSubmit} className="p-6 space-y-6">
            {/* Topic */}
            <div>
              <label htmlFor="topic" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Topic *
              </label>
              <input
                type="text"
                id="topic"
                name="topic"
                value={newProblem.topic}
                onChange={handleInputChange}
                list="topics-list"
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                placeholder="e.g., Arrays, Strings, Dynamic Programming"
              />
              <datalist id="topics-list">
                {existingTopics.map(topic => (
                  <option key={topic} value={topic} />
                ))}
              </datalist>
            </div>

            {/* Question */}
            <div>
              <label htmlFor="question" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Question Title *
              </label>
              <input
                type="text"
                id="question"
                name="question"
                value={newProblem.question}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                placeholder="e.g., Two Sum, Maximum Subarray"
              />
            </div>

            {/* Difficulty */}
            <div>
              <label htmlFor="difficulty" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Difficulty
              </label>
              <select
                id="difficulty"
                name="difficulty"
                value={newProblem.difficulty}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
                <option value="Very Hard">Very Hard</option>
              </select>
            </div>

            {/* Link */}
            <div>
              <label htmlFor="link" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Problem Link
              </label>
              <input
                type="url"
                id="link"
                name="link"
                value={newProblem.link}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                placeholder="https://leetcode.com/problems/..."
              />
            </div>

            {/* Companies */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Companies
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={companyInput}
                  onChange={(e) => setCompanyInput(e.target.value)}
                  list="companies-list"
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Add company name"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCompany())}
                />
                <button
                  type="button"
                  onClick={addCompany}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:ring-2 focus:ring-green-500"
                >
                  Add
                </button>
              </div>
              <datalist id="companies-list">
                {existingCompanies.map(company => (
                  <option key={company} value={company} />
                ))}
              </datalist>
              
              {/* Selected Companies */}
              {newProblem.companies.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {newProblem.companies.map(company => (
                    <span
                      key={company}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
                    >
                      {company}
                      <button
                        type="button"
                        onClick={() => removeCompany(company)}
                        className="ml-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Remarks */}
            <div>
              <label htmlFor="remarks" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Remarks
              </label>
              <textarea
                id="remarks"
                name="remarks"
                value={newProblem.remarks}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                placeholder="Additional notes or hints..."
              />
            </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-3">
                {editingProblem && (
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="px-6 py-3 bg-gray-600 text-white font-medium rounded-md hover:bg-gray-700 focus:ring-2 focus:ring-gray-500"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-3 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (editingProblem ? 'Updating...' : 'Adding...') : (editingProblem ? 'Update Problem' : 'Add Problem')}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Manage Problems */}
        {activeTab === 'manage' && (
          <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Manage Problems
                </h2>
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search problems..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
            </div>

            <div className="p-6">
              {isLoadingProblems ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-4 border-gray-300 dark:border-gray-600 border-t-green-500"></div>
                </div>
              ) : filteredProblems.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No problems found
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredProblems.map((problem) => (
                    <div key={problem.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">ID: {problem.id}</span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              problem.difficulty === 'Easy' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                              problem.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                              problem.difficulty === 'Hard' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                              'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
                            }`}>
                              {problem.difficulty}
                            </span>
                            <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 rounded-full text-xs font-medium">
                              {problem.topic}
                            </span>
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                            {problem.question}
                          </h3>
                          {problem.companies.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-2">
                              {problem.companies.map((company, index) => (
                                <span key={index} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs">
                                  {company}
                                </span>
                              ))}
                            </div>
                          )}
                          {problem.remarks && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                              {problem.remarks}
                            </p>
                          )}
                          {problem.link && (
                            <a
                              href={problem.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                            >
                              View Problem →
                            </a>
                          )}
                        </div>
                        <div className="flex space-x-2 ml-4">
                          <button
                            onClick={() => handleEditProblem(problem)}
                            className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
                            title="Edit Problem"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteProblem(problem.id)}
                            className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                            title="Delete Problem"
                            disabled={isSubmitting}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center space-x-4 mt-6">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-200 mb-2">
            📝 Instructions
          </h3>
          <ul className="text-blue-800 dark:text-blue-300 space-y-1 text-sm">
            <li>• Fill in the required fields (Topic and Question Title)</li>
            <li>• Use existing topics when possible for consistency</li>
            <li>• Add multiple companies by typing and clicking "Add"</li>
            <li>• Include problem links for better user experience</li>
            <li>• Currently, problems are logged to console (backend integration needed)</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Admin;
