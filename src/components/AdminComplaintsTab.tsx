import React, { useState } from 'react';
import {
  AlertTriangle,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  MessageSquare,
  Phone,
  Mail,
  ExternalLink,
  ShieldAlert,
  FileText,
  Send,
  Trash2,
  ChevronRight,
  Package,
  Calendar,
  AlertCircle,
  X,
  Sparkles,
  Info,
  CheckCircle,
  Download,
} from 'lucide-react';
import { Complaint, ComplaintStatus, ComplaintPriority, ComplaintCategory, Order } from '../types';
import { FormatCurrency, Modal } from './CommonUI';

interface AdminComplaintsTabProps {
  complaints: Complaint[];
  orders: Order[];
  updateComplaintStatus: (id: string, status: ComplaintStatus, adminResponse?: string) => void;
  deleteComplaint?: (id: string) => void;
}

const CATEGORY_COLORS: Record<ComplaintCategory, string> = {
  'Delayed Delivery': 'bg-amber-50 text-amber-800 border-amber-200',
  'Damaged / Broken Item': 'bg-red-50 text-red-800 border-red-200',
  'Wrong Item Model': 'bg-purple-50 text-purple-800 border-purple-200',
  'Missing Accessories': 'bg-blue-50 text-blue-800 border-blue-200',
  'Payment / Refund Issue': 'bg-emerald-50 text-emerald-800 border-emerald-200',
  'Courier / Rider Issue': 'bg-orange-50 text-orange-800 border-orange-200',
  'Quality Discrepancy': 'bg-rose-50 text-rose-800 border-rose-200',
  'Other': 'bg-gray-50 text-gray-800 border-gray-200',
};

const PRIORITY_BADGES: Record<ComplaintPriority, { label: string; color: string; dot: string }> = {
  Urgent: { label: 'Urgent', color: 'bg-red-100 text-red-800 border-red-300', dot: 'bg-red-600 animate-pulse' },
  High: { label: 'High', color: 'bg-amber-100 text-amber-800 border-amber-300', dot: 'bg-amber-500' },
  Medium: { label: 'Medium', color: 'bg-blue-100 text-blue-800 border-blue-300', dot: 'bg-blue-500' },
  Low: { label: 'Low', color: 'bg-gray-100 text-gray-700 border-gray-300', dot: 'bg-gray-400' },
};

const STATUS_BADGES: Record<ComplaintStatus, { label: string; color: string }> = {
  Open: { label: 'Open', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  'Under Review': { label: 'Under Review', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  'In Progress': { label: 'In Progress', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  Resolved: { label: 'Resolved', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  Closed: { label: 'Closed', color: 'bg-gray-100 text-gray-600 border-gray-200' },
};

const QUICK_RESOLUTIONS = [
  'Parcel cleared customs at Entebbe airport. Rider dispatched for express delivery today with tracking update.',
  'We sincerely apologize for the mixup. Sourced replacement unit from UK London stock; exchange will be arranged at Thobani Center.',
  'Full refund credited to customer mobile money account for missing accessory. Thank you for your patience.',
  'UK Retail purchase receipt verified with Harrods London. Item is 100% genuine sealed stock with manufacturer guarantee.',
  'Delivery fee waived and UGX 50,000 UK2UG store voucher applied to your profile for the transit delay inconvenience.',
];

export const AdminComplaintsTab: React.FC<AdminComplaintsTabProps> = ({
  complaints,
  orders,
  updateComplaintStatus,
  deleteComplaint,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);

  // Resolution modal form state
  const [responseStatus, setResponseStatus] = useState<ComplaintStatus>('In Progress');
  const [responseText, setResponseText] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Open inspection modal
  const handleOpenInspection = (complaint: Complaint) => {
    setSelectedComplaint(complaint);
    setResponseStatus(complaint.status);
    setResponseText(complaint.adminResponse || '');
  };

  // Submit resolution
  const handleSaveResolution = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaint) return;

    updateComplaintStatus(selectedComplaint.id, responseStatus, responseText);
    showToast(`Complaint ${selectedComplaint.id} updated to "${responseStatus}"!`);

    setSelectedComplaint((prev) =>
      prev
        ? {
            ...prev,
            status: responseStatus,
            adminResponse: responseText,
            updatedAt: new Date().toISOString(),
          }
        : null
    );
  };

  // Filter complaints
  const filteredComplaints = complaints.filter((c) => {
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || c.priority === priorityFilter;
    const matchesCategory = categoryFilter === 'all' || c.category === categoryFilter;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      c.id.toLowerCase().includes(q) ||
      c.customerName.toLowerCase().includes(q) ||
      c.customerEmail.toLowerCase().includes(q) ||
      c.customerPhone.toLowerCase().includes(q) ||
      (c.orderId && c.orderId.toLowerCase().includes(q)) ||
      c.subject.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q);

    return matchesStatus && matchesPriority && matchesCategory && matchesSearch;
  });

  // Telemetry KPIs
  const totalComplaints = complaints.length;
  const openOrReviewCount = complaints.filter((c) => c.status === 'Open' || c.status === 'Under Review').length;
  const inProgressCount = complaints.filter((c) => c.status === 'In Progress').length;
  const resolvedCount = complaints.filter((c) => c.status === 'Resolved' || c.status === 'Closed').length;
  const urgentCount = complaints.filter((c) => (c.priority === 'Urgent' || c.priority === 'High') && c.status !== 'Resolved' && c.status !== 'Closed').length;
  const resolutionRate = totalComplaints > 0 ? Math.round((resolvedCount / totalComplaints) * 100) : 100;

  // Find matching order for selected complaint
  const linkedOrder = selectedComplaint?.orderId
    ? orders.find((o) => o.id.toLowerCase() === selectedComplaint.orderId?.toLowerCase())
    : null;

  return (
    <div className="space-y-6 text-left" id="admin-complaints-panel">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 text-xs font-semibold animate-fade-in border border-gray-700">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header Card */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <AlertTriangle className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-gray-900">Customer Complaints & Dispute Desk</h2>
          </div>
          <p className="text-xs text-gray-500 mt-1 max-w-2xl">
            Monitor, investigate, and resolve customer grievances, delivery delays, missing items, package damage, and payment verification disputes.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => {
              const headers = ['Complaint ID', 'Customer Name', 'Customer Email', 'Customer Phone', 'Order ID', 'Category', 'Priority', 'Status', 'Subject', 'Description', 'Date'];
              const rows = complaints.map((c) => [
                c.id,
                `"${(c.customerName || '').replace(/"/g, '""')}"`,
                `"${(c.customerEmail || '').replace(/"/g, '""')}"`,
                `"${(c.customerPhone || '').replace(/"/g, '""')}"`,
                c.orderId || '',
                `"${(c.category || '').replace(/"/g, '""')}"`,
                c.priority || 'Medium',
                c.status || 'Open',
                `"${(c.subject || '').replace(/"/g, '""')}"`,
                `"${(c.description || '').replace(/"/g, '""')}"`,
                c.createdAt || '',
              ]);
              const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
              const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.setAttribute('href', url);
              link.setAttribute('download', `uk2ug_complaints_${new Date().toISOString().split('T')[0]}.csv`);
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
            className="px-3.5 py-1.5 bg-orange-50 hover:bg-orange-100 text-[#ea580c] border border-orange-200 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title="Export complaints as CSV"
            id="export-complaints-csv-btn"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
          <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl text-xs font-bold flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4" /> {resolutionRate}% Resolution Rate
          </span>
        </div>
      </div>

      {/* Telemetry KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total Complaints</p>
          <p className="text-2xl font-black text-gray-900 mt-1">{totalComplaints}</p>
          <p className="text-[10px] text-gray-500 mt-0.5">Logged customer tickets</p>
        </div>

        <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
          <p className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">Needs Attention</p>
          <p className="text-2xl font-black text-amber-700 mt-1">{openOrReviewCount}</p>
          <p className="text-[10px] text-gray-500 mt-0.5">Open & Under Review</p>
        </div>

        <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
          <p className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">In Progress</p>
          <p className="text-2xl font-black text-blue-700 mt-1">{inProgressCount}</p>
          <p className="text-[10px] text-gray-500 mt-0.5">Under investigation</p>
        </div>

        <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
          <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Resolved</p>
          <p className="text-2xl font-black text-emerald-700 mt-1">{resolvedCount}</p>
          <p className="text-[10px] text-gray-500 mt-0.5">Closed & settled</p>
        </div>

        <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm col-span-2 lg:col-span-1">
          <p className="text-[11px] font-bold text-red-600 uppercase tracking-wider">Urgent & High</p>
          <p className="text-2xl font-black text-red-700 mt-1">{urgentCount}</p>
          <p className="text-[10px] text-gray-500 mt-0.5">Pending urgent action</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search */}
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search ticket ID, customer name, email, order ID, keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:border-[#ea580c] transition-colors"
            />
          </div>

          {/* Quick Status Filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
            {['all', 'Open', 'Under Review', 'In Progress', 'Resolved', 'Closed'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
                  statusFilter === st
                    ? 'bg-[#ea580c] text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {st === 'all' ? 'All Status' : st}
                {st !== 'all' && (
                  <span className="ml-1 text-[10px] opacity-75">
                    ({complaints.filter((c) => c.status === st).length})
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Secondary filters: Priority and Category */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-gray-100 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-gray-400 font-semibold uppercase text-[10px]">Priority:</span>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1 text-xs outline-none focus:border-[#ea580c]"
            >
              <option value="all">All Priorities</option>
              <option value="Urgent">Urgent</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-gray-400 font-semibold uppercase text-[10px]">Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1 text-xs outline-none focus:border-[#ea580c]"
            >
              <option value="all">All Categories</option>
              <option value="Delayed Delivery">Delayed Delivery</option>
              <option value="Damaged / Broken Item">Damaged / Broken Item</option>
              <option value="Wrong Item Model">Wrong Item Model</option>
              <option value="Missing Accessories">Missing Accessories</option>
              <option value="Payment / Refund Issue">Payment / Refund Issue</option>
              <option value="Courier / Rider Issue">Courier / Rider Issue</option>
              <option value="Quality Discrepancy">Quality Discrepancy</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {(statusFilter !== 'all' || priorityFilter !== 'all' || categoryFilter !== 'all' || searchQuery) && (
            <button
              onClick={() => {
                setStatusFilter('all');
                setPriorityFilter('all');
                setCategoryFilter('all');
                setSearchQuery('');
              }}
              className="text-orange-700 hover:underline text-xs font-bold cursor-pointer ml-auto"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Complaints List / Table */}
      {filteredComplaints.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-2xl p-12 text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">No Complaints Matching Your Criteria</h3>
            <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
              {complaints.length === 0
                ? 'Great news! There are currently no customer complaints filed.'
                : 'No complaints match the selected status, category, or search keywords.'}
            </p>
          </div>
          {(statusFilter !== 'all' || priorityFilter !== 'all' || categoryFilter !== 'all' || searchQuery) && (
            <button
              onClick={() => {
                setStatusFilter('all');
                setPriorityFilter('all');
                setCategoryFilter('all');
                setSearchQuery('');
              }}
              className="px-4 py-2 bg-gray-100 text-gray-800 rounded-xl text-xs font-bold hover:bg-gray-200 cursor-pointer"
            >
              Clear All Filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredComplaints.map((complaint) => {
            const priorityInfo = PRIORITY_BADGES[complaint.priority] || PRIORITY_BADGES.Medium;
            const statusInfo = STATUS_BADGES[complaint.status] || STATUS_BADGES.Open;
            const categoryClass = CATEGORY_COLORS[complaint.category] || CATEGORY_COLORS.Other;

            return (
              <div
                key={complaint.id}
                className={`bg-white border rounded-2xl p-5 shadow-sm transition-all hover:shadow-md ${
                  complaint.priority === 'Urgent' && complaint.status !== 'Resolved' && complaint.status !== 'Closed'
                    ? 'border-red-200 bg-red-50/20'
                    : 'border-gray-100'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  {/* Left: Ticket Header & Info */}
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-gray-900 bg-gray-100 px-2.5 py-0.5 rounded-md border border-gray-200">
                        {complaint.id}
                      </span>

                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${categoryClass}`}>
                        {complaint.category}
                      </span>

                      <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${priorityInfo.color}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${priorityInfo.dot}`} />
                        {priorityInfo.label} Priority
                      </span>

                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>

                      {complaint.orderId && (
                        <span className="text-[10px] font-mono text-orange-700 bg-orange-50 px-2 py-0.5 rounded border border-orange-100">
                          Order: {complaint.orderId}
                        </span>
                      )}
                    </div>

                    <h3 className="font-bold text-gray-900 text-sm">{complaint.subject}</h3>

                    <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">
                      {complaint.description}
                    </p>

                    {/* Customer Info line */}
                    <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 pt-1">
                      <span className="font-semibold text-gray-800">{complaint.customerName}</span>

                      <a
                        href={`mailto:${complaint.customerEmail}`}
                        className="flex items-center gap-1 text-orange-700 hover:underline"
                        title="Send Email"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        <span>{complaint.customerEmail}</span>
                      </a>

                      <a
                        href={`tel:${complaint.customerPhone}`}
                        className="flex items-center gap-1 text-orange-700 hover:underline"
                        title="Call Customer"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>{complaint.customerPhone}</span>
                      </a>

                      <span className="flex items-center gap-1 text-gray-400">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{new Date(complaint.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                      </span>
                    </div>

                    {/* Admin Response Snippet if present */}
                    {complaint.adminResponse && (
                      <div className="mt-2 p-3 bg-orange-50/60 border border-orange-100 rounded-xl text-xs space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-orange-800 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-orange-600" />
                          Official Admin Response ({complaint.status}):
                        </span>
                        <p className="text-gray-700 italic">{complaint.adminResponse}</p>
                      </div>
                    )}
                  </div>

                  {/* Right: Action Button */}
                  <div className="flex items-center gap-2 shrink-0 self-end lg:self-center">
                    <button
                      onClick={() => handleOpenInspection(complaint)}
                      className="px-4 py-2.5 bg-[#ea580c] hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <span>Review & Resolve</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>

                    {deleteComplaint && (
                      <button
                        onClick={() => {
                          if (confirm(`Are you sure you want to delete complaint ticket ${complaint.id}?`)) {
                            deleteComplaint(complaint.id);
                            showToast(`Deleted ticket ${complaint.id}`);
                          }
                        }}
                        className="p-2 bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-xl border border-gray-200 transition-colors cursor-pointer"
                        title="Delete Ticket"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* COMPLAINT INSPECTION & RESOLUTION MODAL */}
      {selectedComplaint && (
        <Modal
          isOpen={!!selectedComplaint}
          onClose={() => setSelectedComplaint(null)}
          title={`Ticket ${selectedComplaint.id}: ${selectedComplaint.subject}`}
          maxWidth="2xl"
        >
          <div className="space-y-5 text-left text-xs">
            {/* Meta bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-gray-50 rounded-xl border border-gray-100">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${CATEGORY_COLORS[selectedComplaint.category]}`}>
                  {selectedComplaint.category}
                </span>

                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${PRIORITY_BADGES[selectedComplaint.priority]?.color}`}>
                  {selectedComplaint.priority} Priority
                </span>

                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${STATUS_BADGES[selectedComplaint.status]?.color}`}>
                  Current: {selectedComplaint.status}
                </span>
              </div>

              <span className="text-gray-400 text-[11px]">
                Filed: {new Date(selectedComplaint.createdAt).toLocaleString()}
              </span>
            </div>

            {/* Customer Details Box */}
            <div className="p-4 bg-white border border-gray-200 rounded-xl space-y-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Customer Profile</span>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-bold text-sm text-gray-900">{selectedComplaint.customerName}</p>
                  <p className="text-gray-500">{selectedComplaint.customerEmail} • {selectedComplaint.customerPhone}</p>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={`tel:${selectedComplaint.customerPhone}`}
                    className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5" /> Call
                  </a>
                  <a
                    href={`https://wa.me/${selectedComplaint.customerPhone.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg font-bold flex items-center gap-1.5 transition-colors"
                  >
                    WhatsApp
                  </a>
                  <a
                    href={`mailto:${selectedComplaint.customerEmail}?subject=Regarding your UK2UG Complaint ${selectedComplaint.id}`}
                    className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <Mail className="w-3.5 h-3.5" /> Email
                  </a>
                </div>
              </div>
            </div>

            {/* Linked Order Snapshot (if available) */}
            {linkedOrder && (
              <div className="p-4 bg-orange-50/40 border border-orange-100 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-orange-800 uppercase tracking-wider flex items-center gap-1">
                    <Package className="w-3.5 h-3.5" /> Associated Order: {linkedOrder.id}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white text-orange-800 border border-orange-200">
                    Order Status: {linkedOrder.status}
                  </span>
                </div>
                <div className="text-[11px] text-gray-600 space-y-1">
                  <p><strong>Total:</strong> UGX {new Intl.NumberFormat('en-UG').format(linkedOrder.totalAmount)} ({linkedOrder.items.length} items)</p>
                  <p><strong>Items:</strong> {linkedOrder.items.map((i) => `${i.title} (x${i.quantity})`).join(', ')}</p>
                  <p><strong>Fulfillment:</strong> {linkedOrder.deliveryPath === 'pickup' ? 'Thobani Center Pickup Desk' : `Doorstep Delivery to ${linkedOrder.deliveryDetails?.district || 'Kampala'}`}</p>
                </div>
              </div>
            )}

            {/* Complaint Narrative */}
            <div className="p-4 bg-gray-50 border border-gray-100 rounded-xl space-y-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Customer Grievance Statement</span>
              <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-line font-medium">
                {selectedComplaint.description}
              </p>
            </div>

            {/* Resolution Form */}
            <form onSubmit={handleSaveResolution} className="space-y-4 pt-2 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#ea580c]" /> Admin Resolution & Official Response
                </span>
                <span className="text-[10px] text-gray-400">Response will be saved and visible to customer</span>
              </div>

              {/* Status Selector */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Update Ticket Status *</label>
                <select
                  value={responseStatus}
                  onChange={(e) => setResponseStatus(e.target.value as ComplaintStatus)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-bold outline-none focus:border-[#ea580c]"
                >
                  <option value="Open">Open (Pending Investigation)</option>
                  <option value="Under Review">Under Review (Checking with Clearing/Courier)</option>
                  <option value="In Progress">In Progress (Action being taken)</option>
                  <option value="Resolved">Resolved (Customer dispute settled)</option>
                  <option value="Closed">Closed (Archived)</option>
                </select>
              </div>

              {/* Quick Canned Responses */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Quick Canned Resolution Templates:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_RESOLUTIONS.map((qr, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setResponseText(qr)}
                      className="px-2.5 py-1 bg-gray-100 hover:bg-orange-50 hover:text-orange-800 text-gray-600 rounded-lg text-[10px] font-medium transition-colors text-left"
                    >
                      {qr.substring(0, 45)}...
                    </button>
                  ))}
                </div>
              </div>

              {/* Resolution Textarea */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Official Admin Response & Findings *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Explain actions taken (e.g. airport customs status verified, replacement item procured, discount code or refund provided)..."
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3.5 text-xs outline-none focus:border-[#ea580c]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedComplaint(null)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#ea580c] hover:bg-orange-700 text-white rounded-xl font-bold transition-colors cursor-pointer shadow flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" /> Save Resolution & Update Status
                </button>
              </div>
            </form>
          </div>
        </Modal>
      )}
    </div>
  );
};
