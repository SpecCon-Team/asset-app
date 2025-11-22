import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '@/lib/api';
import { showSuccessAlert, showErrorAlert, showConfirmDialog } from '@/lib/sweetalert';

interface DepreciationRecord {
  id: string;
  asset: {
    id: string;
    name: string;
    asset_code: string;
    asset_type: string;
    status: string;
  };
  depreciationMethod: string;
  purchasePrice: number;
  salvageValue: number;
  usefulLifeYears: number;
  usefulLifeMonths: number;
  purchaseDate: string;
  depreciationStartDate: string;
  currentBookValue: number;
  accumulatedDepreciation: number;
  annualDepreciationRate: number | null;
  monthlyDepreciationAmount: number | null;
  isActive: boolean;
  notes: string | null;
  lastCalculatedAt: string | null;
  createdBy: {
    name: string;
    email: string;
  };
  createdAt: string;
  schedule: ScheduleEntry[];
}

interface ScheduleEntry {
  id: string;
  periodNumber: number;
  periodStartDate: string;
  periodEndDate: string;
  openingBookValue: number;
  depreciationAmount: number;
  accumulatedDepreciation: number;
  closingBookValue: number;
  isPosted: boolean;
  postedAt: string | null;
  fiscalYear: number;
  fiscalMonth: number;
}

interface Valuation {
  id: string;
  valuationDate: string;
  valuationType: string;
  bookValue: number;
  marketValue: number | null;
  replacementValue: number | null;
  condition: string | null;
  appraisedBy: string | null;
  notes: string | null;
  valuedBy: {
    name: string;
  };
  createdAt: string;
}

const DepreciationDetailPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [record, setRecord] = useState<DepreciationRecord | null>(null);
  const [valuations, setValuations] = useState<Valuation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'schedule' | 'valuations'>('schedule');
  const [showValuationForm, setShowValuationForm] = useState(false);
  const [valuationForm, setValuationForm] = useState({
    valuationDate: new Date().toISOString().split('T')[0],
    valuationType: 'routine',
    bookValue: '',
    marketValue: '',
    replacementValue: '',
    condition: 'good',
    appraisedBy: '',
    notes: ''
  });

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [recordRes, valuationsRes] = await Promise.all([
        api.get(`/api/depreciation/${id}`),
        api.get(`/api/depreciation/valuations/${record?.asset?.id || ''}`)
      ]);

      setRecord(recordRes.data);
      if (recordRes.data.asset?.id) {
        const vals = await api.get(`/api/depreciation/valuations/${recordRes.data.asset.id}`);
        setValuations(vals.data.valuations || []);
      }
    } catch (error: any) {
      console.error('Error loading depreciation:', error);
      showErrorAlert('Failed to load depreciation details');
    } finally {
      setLoading(false);
    }
  };

  const handlePostDepreciation = async (periodId: string) => {
    const confirmed = await showConfirmDialog(
      'Post Depreciation',
      'Are you sure you want to post this depreciation period? This action cannot be undone.'
    );

    if (!confirmed) return;

    try {
      await api.post(`/api/depreciation/${id}/post`, { periodId });
      showSuccessAlert('Depreciation posted successfully');
      loadData();
    } catch (error: any) {
      console.error('Error posting depreciation:', error);
      showErrorAlert(error.response?.data?.message || 'Failed to post depreciation');
    }
  };

  const handleAddValuation = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!record?.asset?.id) {
      showErrorAlert('Asset information is missing');
      return;
    }

    try {
      await api.post('/api/depreciation/valuations', {
        ...valuationForm,
        assetId: record.asset.id,
        bookValue: parseFloat(valuationForm.bookValue) || record.currentBookValue,
        marketValue: valuationForm.marketValue ? parseFloat(valuationForm.marketValue) : null,
        replacementValue: valuationForm.replacementValue ? parseFloat(valuationForm.replacementValue) : null
      });

      showSuccessAlert('Valuation added successfully');
      setShowValuationForm(false);
      setValuationForm({
        valuationDate: new Date().toISOString().split('T')[0],
        valuationType: 'routine',
        bookValue: '',
        marketValue: '',
        replacementValue: '',
        condition: 'good',
        appraisedBy: '',
        notes: ''
      });
      loadData();
    } catch (error: any) {
      console.error('Error adding valuation:', error);
      showErrorAlert(error.response?.data?.message || 'Failed to add valuation');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR'
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatMethod = (method: string) => {
    return method.split('_').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Depreciation record not found</p>
        <Link to="/depreciation" className="text-blue-600 hover:underline mt-4 inline-block">
          Back to Depreciation
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/depreciation')}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-3xl font-bold text-gray-900">{record.asset.name}</h1>
            <span className={`px-3 py-1 text-sm font-medium rounded-full ${
              record.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
            }`}>
              {record.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Asset Code: {record.asset.asset_code}
          </p>
        </div>
        <Link
          to={`/assets/${record.asset.id}`}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          View Asset
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm font-medium text-gray-600">Purchase Price</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            {formatCurrency(record.purchasePrice)}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {formatDate(record.purchaseDate)}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm font-medium text-gray-600">Current Book Value</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            {formatCurrency(record.currentBookValue)}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {((record.currentBookValue / record.purchasePrice) * 100).toFixed(1)}% of original
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm font-medium text-gray-600">Accumulated</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            {formatCurrency(record.accumulatedDepreciation)}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Monthly: {formatCurrency(record.monthlyDepreciationAmount || 0)}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm font-medium text-gray-600">Remaining Life</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            {record.usefulLifeYears}y {record.usefulLifeMonths}m
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {formatMethod(record.depreciationMethod)}
          </p>
        </div>
      </div>

      {/* Depreciation Details */}
      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Depreciation Configuration</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-gray-600">Method</p>
            <p className="text-base font-medium text-gray-900 mt-1">
              {formatMethod(record.depreciationMethod)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Salvage Value</p>
            <p className="text-base font-medium text-gray-900 mt-1">
              {formatCurrency(record.salvageValue)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Start Date</p>
            <p className="text-base font-medium text-gray-900 mt-1">
              {formatDate(record.depreciationStartDate)}
            </p>
          </div>
          {record.annualDepreciationRate && (
            <div>
              <p className="text-sm text-gray-600">Annual Rate</p>
              <p className="text-base font-medium text-gray-900 mt-1">
                {record.annualDepreciationRate}%
              </p>
            </div>
          )}
          <div>
            <p className="text-sm text-gray-600">Created By</p>
            <p className="text-base font-medium text-gray-900 mt-1">
              {record.createdBy.name}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Last Calculated</p>
            <p className="text-base font-medium text-gray-900 mt-1">
              {record.lastCalculatedAt ? formatDate(record.lastCalculatedAt) : 'Never'}
            </p>
          </div>
        </div>
        {record.notes && (
          <div>
            <p className="text-sm text-gray-600">Notes</p>
            <p className="text-base text-gray-900 mt-1">{record.notes}</p>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('schedule')}
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === 'schedule'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Depreciation Schedule ({record.schedule?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('valuations')}
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === 'valuations'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Valuations ({valuations.length})
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'schedule' && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Period</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date Range</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Opening Value</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Depreciation</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Accumulated</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Closing Value</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {record.schedule?.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                        No schedule entries found
                      </td>
                    </tr>
                  ) : (
                    record.schedule?.map((entry) => (
                      <tr key={entry.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">{entry.periodNumber}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {formatDate(entry.periodStartDate)} - {formatDate(entry.periodEndDate)}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-gray-900">
                          {formatCurrency(entry.openingBookValue)}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-red-600">
                          -{formatCurrency(entry.depreciationAmount)}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-gray-900">
                          {formatCurrency(entry.accumulatedDepreciation)}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-gray-900 font-medium">
                          {formatCurrency(entry.closingBookValue)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            entry.isPosted ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {entry.isPosted ? 'Posted' : 'Pending'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {!entry.isPosted && (
                            <button
                              onClick={() => handlePostDepreciation(entry.id)}
                              className="text-blue-600 hover:text-blue-900 text-sm"
                            >
                              Post
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'valuations' && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <button
                  onClick={() => setShowValuationForm(!showValuationForm)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {showValuationForm ? 'Cancel' : 'Add Valuation'}
                </button>
              </div>

              {showValuationForm && (
                <form onSubmit={handleAddValuation} className="bg-gray-50 rounded-lg p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Valuation Date
                      </label>
                      <input
                        type="date"
                        value={valuationForm.valuationDate}
                        onChange={(e) => setValuationForm({ ...valuationForm, valuationDate: e.target.value })}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Valuation Type
                      </label>
                      <select
                        value={valuationForm.valuationType}
                        onChange={(e) => setValuationForm({ ...valuationForm, valuationType: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="routine">Routine</option>
                        <option value="insurance">Insurance</option>
                        <option value="disposal">Disposal</option>
                        <option value="impairment">Impairment</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Market Value
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={valuationForm.marketValue}
                        onChange={(e) => setValuationForm({ ...valuationForm, marketValue: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Replacement Value
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={valuationForm.replacementValue}
                        onChange={(e) => setValuationForm({ ...valuationForm, replacementValue: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Condition
                      </label>
                      <select
                        value={valuationForm.condition}
                        onChange={(e) => setValuationForm({ ...valuationForm, condition: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="excellent">Excellent</option>
                        <option value="good">Good</option>
                        <option value="fair">Fair</option>
                        <option value="poor">Poor</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Appraised By
                      </label>
                      <input
                        type="text"
                        value={valuationForm.appraisedBy}
                        onChange={(e) => setValuationForm({ ...valuationForm, appraisedBy: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Appraiser name"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes
                    </label>
                    <textarea
                      value={valuationForm.notes}
                      onChange={(e) => setValuationForm({ ...valuationForm, notes: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Valuation notes..."
                    />
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Save Valuation
                    </button>
                  </div>
                </form>
              )}

              <div className="space-y-3">
                {valuations.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No valuations recorded</p>
                ) : (
                  valuations.map((valuation) => (
                    <div key={valuation.id} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <span className="text-sm font-medium text-gray-900">
                            {formatDate(valuation.valuationDate)}
                          </span>
                          <span className="ml-2 px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                            {valuation.valuationType}
                          </span>
                        </div>
                        <span className="text-sm text-gray-500">by {valuation.valuedBy.name}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-4 mt-3">
                        {valuation.marketValue && (
                          <div>
                            <p className="text-xs text-gray-600">Market Value</p>
                            <p className="text-sm font-medium text-gray-900">
                              {formatCurrency(valuation.marketValue)}
                            </p>
                          </div>
                        )}
                        {valuation.replacementValue && (
                          <div>
                            <p className="text-xs text-gray-600">Replacement Value</p>
                            <p className="text-sm font-medium text-gray-900">
                              {formatCurrency(valuation.replacementValue)}
                            </p>
                          </div>
                        )}
                        {valuation.condition && (
                          <div>
                            <p className="text-xs text-gray-600">Condition</p>
                            <p className="text-sm font-medium text-gray-900 capitalize">
                              {valuation.condition}
                            </p>
                          </div>
                        )}
                      </div>
                      {valuation.notes && (
                        <p className="text-sm text-gray-600 mt-2">{valuation.notes}</p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DepreciationDetailPage;
