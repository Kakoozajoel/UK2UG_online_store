import React, { useState } from 'react';
import {
  AlertTriangle,
  Search,
  CheckCircle2,
  Clock,
  MessageSquare,
  ChevronRight,
  Phone,
  Mail,
  ExternalLink,
  Trash2,
  Filter,
  Check,
  Send,
  User,
  ShoppingBag,
  Paperclip,
  Image as ImageIcon,
  AlertCircle,
  ShieldAlert,
  Calendar,
  X
} from 'lucide-react';
import { Complaint, ComplaintStatus, ComplaintPriority, ComplaintCategory, Order } from '../types';
import { Modal } from './CommonUI';

interface AdminComplaintsProps {
  complaints: Complaint[];
  orders?: Order[];
  updateComplaintStatus?: (id: string, status: ComplaintStatus, adminResponse?: string) => void;
  deleteComplaint?: (id: string) => void;
  sendMessage?: (msg: any) => void;
}

const STATUS_CONFIG: Record<ComplaintStatus, { bg: string; text: string; border: string; icon: any }> = {
  Open: {
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
    icon: Clock
  },
  'Under Review': {
    bg: 'bg-blue-50',
    text: 'text-blue-800',
    border: 'border-blue-200',
    icon: Search
  },
  'In Progress': {
    bg: 'bg-purple-50',
    text: 'text-purple-800',
    border: 'border-purple-200',
    icon: AlertCircle
  },
  Resolved: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-800',
    border: 'border-emerald-200',
    icon: CheckCircle2
  },
  Closed: {
    bg: 'bg-gray-100',
    text: 'text-gray-700',
    border: 'border-gray-300',
    icon: Check
  }
};

const PRIORITY_BADGES: Record<ComplaintPriority, { bg: string; text: string }> = {
  Urgent: { bg: 'bg-red-100 text-red-800 border-red-200', text: 'URGENT' },
  High: { bg: 'bg-orange-100 text-orange-800 border-orange-200', text: 'HIGH' },
  Medium: { bg: 'bg-yellow-50 text-yellow-800 border-yellow-200', text: 'MEDIUM' },
  Low: { bg: 'bg-gray-100 text-gray-700 border-gray-200', text: 'LOW' }
};

export const AdminComplaints: React.FC<AdminComplaintsProps> = ({
  complaints,
  orders = [],
  updateComplaintStatus,
  deleteComplaint,
  sendMessage
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  // Selected ticket for modal inspection
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [adminReplyText, setAdminReplyText] = useState('');
  const [newStatus, setNewStatus] = useState<ComplaintStatus>('Under Review');
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // In-app deletion modals (completely safe in iframes)
  const [ticketToDelete, setTicketToDelete] = useState<Complaint | null>(null);
  const [showDeleteAllResolvedModal, setShowDeleteAllResolvedModal] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4500);
  };

  // Filtered complaints
  const filteredComplaints = complaints.filter((c) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      c.id.toLowerCase().includes(q) ||
      c.customerName.toLowerCase().includes(q) ||
      c.customerEmail.toLowerCase().includes(q) ||
      (c.customerPhone && c.customerPhone.toLowerCase().includes(q)) ||
      (c.orderId && c.orderId.toLowerCase().includes(q)) ||
      c.subject.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q);

    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || c.category === categoryFilter;
    const matchesPriority = priorityFilter === 'all' || c.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesCategory && matchesPriority;
  });

  // Analytics
  const openCount = complaints.filter((c) => c.status === 'Open').length;
  const underReviewCount = complaints.filter((c) => c.status === 'Under Review' || c.status === 'In Progress').length;
  const resolvedCount = complaints.filter((c) => c.status === 'Resolved' || c.status === 'Closed').length;
  const urgentCount = complaints.filter((c) => c.priority === 'Urgent' && c.status !== 'Resolved' && c.status !== 'Closed').length;

  const handleOpenInspect = (c: Complaint) => {
    setSelectedComplaint(c);
    setNewStatus(c.status);
    setAdminReplyText(c.adminResponse || '');
  };

  const handleSaveResolution = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaint) return;

    if (updateComplaintStatus) {
      updateComplaintStatus(selectedComplaint.id, newStatus, adminReplyText);
    }

    // If there's sendMessage available and customerEmail exists, we can log a message
    if (sendMessage && adminReplyText && selectedComplaint.customerEmail) {
      sendMessage({
        sender: 'admin',
        userEmail: selectedComplaint.customerEmail,
        userName: 'UK2UG Support Desk',
        text: `[Complaint Ticket ${selectedComplaint.id} Status: ${newStatus}] ${adminReplyText}`,
      });
    }

    setSelectedComplaint(null);
  };

  const handleConfirmDeleteTicket = () => {
    if (!ticketToDelete) return;
    const ticketId = ticketToDelete.id;
    if (deleteComplaint) {
      deleteComplaint(ticketId);
    }
    if (selectedComplaint?.id === ticketId) {
      setSelectedComplaint(null);
    }
    showToast(`Complaint ticket #${ticketId} has been permanently deleted.`);
    setTicketToDelete(null);
  };

  const handleConfirmDeleteAllResolved = () => {
    const resolvedList = complaints.filter((c) => c.status === 'Resolved' || c.status === 'Closed');
    if (resolvedList.length === 0) return;

    resolvedList.forEach((c) => {
      if (deleteComplaint) deleteComplaint(c.id);
    });

    if (selectedComplaint && (selectedComplaint.status === 'Resolved' || selectedComplaint.status === 'Closed')) {
      setSelectedComplaint(null);
    }
    showToast(`All ${resolvedList.length} resolved complaint tickets have been permanently deleted.`);
    setShowDeleteAllResolvedModal(false);
  };

  // Find linked order if exists
  const linkedOrder = selectedComplaint?.orderId
    ? orders.find((o) => o.id === selectedComplaint.orderId)
    : null;

  return (
    <div className="space-y-6 text-left" id="admin-complaints-panel">
      {/* Dynamic Toast Alert Banner */}
      {toastMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs font-bold flex items-center justify-between gap-3 shadow-xs animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage('')}
            className="text-emerald-700 hover:text-emerald-950 p-1 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Banner KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Open Tickets</p>
            <h3 className="text-2xl font-black text-amber-600 mt-1">{openCount}</h3>
            <p className="text-xs text-gray-500 mt-1">Pending first inspection</p>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Under Investigation</p>
            <h3 className="text-2xl font-black text-blue-600 mt-1">{underReviewCount}</h3>
            <p className="text-xs text-gray-500 mt-1">Courier or warehouse checking</p>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Search className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Urgent Escalations</p>
            <h3 className="text-2xl font-black text-red-600 mt-1">{urgentCount}</h3>
            <p className="text-xs text-red-500 font-medium mt-1">Needs priority resolution</p>
          </div>
          <div className="p-3 bg-red-50 text-red-600 rounded-xl">
            <ShieldAlert className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Resolved Cases</p>
            <h3 className="text-2xl font-black text-emerald-600 mt-1">{resolvedCount}</h3>
            <p className="text-xs text-gray-500 mt-1">Total closed successfully</p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by ticket ID, customer name, phone, order #, or keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-none focus:border-[#ea580c] focus:bg-white transition-all"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs font-semibold text-gray-700 outline-none focus:border-[#ea580c]"
          >
            <option value="all">All Statuses ({complaints.length})</option>
            <option value="Open">Open ({complaints.filter((c) => c.status === 'Open').length})</option>
            <option value="Under Review">Under Review ({complaints.filter((c) => c.status === 'Under Review').length})</option>
            <option value="In Progress">In Progress ({complaints.filter((c) => c.status === 'In Progress').length})</option>
            <option value="Resolved">Resolved ({complaints.filter((c) => c.status === 'Resolved').length})</option>
            <option value="Closed">Closed ({complaints.filter((c) => c.status === 'Closed').length})</option>
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs font-semibold text-gray-700 outline-none focus:border-[#ea580c]"
          >
            <option value="all">All Priorities</option>
            <option value="Urgent">Urgent</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs font-semibold text-gray-700 outline-none focus:border-[#ea580c]"
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

          {/* Admin Privilege: Delete Resolved Complaints */}
          {resolvedCount > 0 && (
            <button
              type="button"
              onClick={() => setShowDeleteAllResolvedModal(true)}
              className="px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs shrink-0 cursor-pointer whitespace-nowrap"
              title="Permanently remove all tickets that have been satisfied and marked Resolved"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-600" />
              <span>Delete Resolved ({resolvedCount})</span>
            </button>
          )}
        </div>
      </div>

      {/* Complaints List */}
      {filteredComplaints.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-xl p-12 text-center space-y-3">
          <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
          <h4 className="text-sm font-bold text-gray-800">No Complaints Found</h4>
          <p className="text-xs text-gray-500 max-w-md mx-auto leading-relaxed">
            {complaints.length === 0
              ? 'There are currently no customer complaints logged. When customers report discrepancies or delivery issues, they will appear here.'
              : 'No complaints match your active search and filter settings.'}
          </p>
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Ticket & Priority</th>
                  <th className="px-5 py-3.5">Customer</th>
                  <th className="px-5 py-3.5">Category & Subject</th>
                  <th className="px-5 py-3.5">Order Ref</th>
                  <th className="px-5 py-3.5">Date Logged</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredComplaints.map((c) => {
                  const statusConf = STATUS_CONFIG[c.status] || STATUS_CONFIG.Open;
                  const priorityConf = PRIORITY_BADGES[c.priority] || PRIORITY_BADGES.Medium;
                  const StatusIcon = statusConf.icon;

                  return (
                    <tr key={c.id} className="hover:bg-gray-50/80 transition-colors">
                      {/* Ticket & Priority */}
                      <td className="px-5 py-4">
                        <div className="space-y-1">
                          <span className="font-mono font-bold text-[#ea580c] block text-[11px]">{c.id}</span>
                          <span className={`inline-block px-1.5 py-0.5 text-[9px] font-black rounded border ${priorityConf.bg}`}>
                            {priorityConf.text}
                          </span>
                        </div>
                      </td>

                      {/* Customer */}
                      <td className="px-5 py-4">
                        <div>
                          <p className="font-bold text-gray-900">{c.customerName}</p>
                          <p className="text-[11px] text-gray-500">{c.customerEmail}</p>
                          {c.customerPhone && (
                            <p className="text-[10px] text-orange-700 font-mono flex items-center gap-1 mt-0.5">
                              <Phone className="w-2.5 h-2.5" />
                              {c.customerPhone}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Category & Subject */}
                      <td className="px-5 py-4 max-w-xs">
                        <div>
                          <span className="inline-block text-[10px] font-semibold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                            {c.category}
                          </span>
                          <p className="font-bold text-gray-800 mt-1 truncate">{c.subject}</p>
                          <p className="text-[11px] text-gray-500 line-clamp-1">{c.description}</p>
                          {c.images && c.images.length > 0 && (
                            <span className="text-[10px] text-blue-600 flex items-center gap-1 mt-1 font-medium">
                              <ImageIcon className="w-3 h-3" />
                              {c.images.length} Evidence Photo(s) Attached
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Order Ref */}
                      <td className="px-5 py-4">
                        {c.orderId ? (
                          <span className="font-mono text-xs bg-gray-100 text-gray-800 px-2 py-0.5 rounded border border-gray-200">
                            {c.orderId}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-[11px]">Direct / General</span>
                        )}
                      </td>

                      {/* Date */}
                      <td className="px-5 py-4 text-gray-500 text-[11px] whitespace-nowrap">
                        {new Date(c.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${statusConf.bg} ${statusConf.text} ${statusConf.border}`}
                        >
                          <StatusIcon className="w-3 h-3" />
                          {c.status}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenInspect(c)}
                            className="px-3 py-1.5 bg-[#ea580c] hover:bg-orange-700 text-white rounded-lg font-bold text-xs transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            Inspect & Respond
                          </button>
                          {c.status === 'Resolved' || c.status === 'Closed' ? (
                            <button
                              onClick={() => setTicketToDelete(c)}
                              title="Delete Resolved Complaint Ticket"
                              className="px-2 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-red-600" />
                              <span className="hidden md:inline">Delete Resolved</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => setTicketToDelete(c)}
                              title="Delete Complaint Ticket"
                              className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TICKET INSPECTION & RESOLUTION MODAL */}
      {selectedComplaint && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedComplaint(null)}
          title={`Ticket #${selectedComplaint.id} - ${selectedComplaint.subject}`}
          maxWidth="lg"
        >
          <div className="space-y-5 text-left p-1">
            {/* Header info strip */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-xs font-bold border ${PRIORITY_BADGES[selectedComplaint.priority].bg}`}>
                  {PRIORITY_BADGES[selectedComplaint.priority].text} PRIORITY
                </span>
                <span className="text-xs font-bold text-gray-700 bg-white border border-gray-200 px-2.5 py-0.5 rounded">
                  {selectedComplaint.category}
                </span>
              </div>
              <span className="text-xs text-gray-500">
                Logged on {new Date(selectedComplaint.createdAt).toLocaleString()}
              </span>
            </div>

            {/* Customer Details & Quick Contact */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 border border-gray-150 rounded-xl bg-white">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Customer Details</p>
                <h4 className="font-bold text-sm text-gray-900 mt-1">{selectedComplaint.customerName}</h4>
                <p className="text-xs text-gray-600">{selectedComplaint.customerEmail}</p>
                {selectedComplaint.customerPhone && (
                  <p className="text-xs text-orange-700 font-mono mt-0.5">{selectedComplaint.customerPhone}</p>
                )}
              </div>

              <div className="flex flex-col justify-center gap-2 sm:items-end">
                {selectedComplaint.customerPhone && (
                  <a
                    href={`https://wa.me/${selectedComplaint.customerPhone.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-lg hover:bg-emerald-100 transition-colors"
                  >
                    <MessageSquare className="w-3.5 h-3.5" /> Message on WhatsApp
                  </a>
                )}
                {selectedComplaint.customerEmail && (
                  <a
                    href={`mailto:${selectedComplaint.customerEmail}?subject=Regarding Ticket ${selectedComplaint.id}`}
                    className="inline-flex items-center gap-1.5 text-xs font-bold bg-gray-50 text-gray-700 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <Mail className="w-3.5 h-3.5" /> Email Customer
                  </a>
                )}
              </div>
            </div>

            {/* Order info if linked */}
            {selectedComplaint.orderId && (
              <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-900 flex items-center gap-1">
                    <ShoppingBag className="w-3.5 h-3.5" /> Linked Order Reference: {selectedComplaint.orderId}
                  </span>
                  {linkedOrder && (
                    <span className="font-bold px-2 py-0.5 rounded bg-amber-200 text-amber-900 text-[10px]">
                      Status: {linkedOrder.status}
                    </span>
                  )}
                </div>
                {linkedOrder && (
                  <p className="text-amber-800">
                    Order items: {linkedOrder.items.map((it) => `${it.title || (it as any).product?.title || 'Item'} (x${it.quantity})`).join(', ')}
                  </p>
                )}
              </div>
            )}

            {/* Full Complaint Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                Customer Issue Statement
              </label>
              <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 leading-relaxed whitespace-pre-wrap">
                {selectedComplaint.description}
              </div>
            </div>

            {/* Photo Evidence attachments if any */}
            {selectedComplaint.images && selectedComplaint.images.length > 0 && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wide flex items-center gap-1">
                  <Paperclip className="w-3.5 h-3.5" /> Photo Evidence from Customer ({selectedComplaint.images.length})
                </label>
                <div className="flex items-center gap-3 overflow-x-auto p-1">
                  {selectedComplaint.images.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setPreviewImage(img)}
                      className="w-20 h-20 rounded-lg border border-gray-200 overflow-hidden shrink-0 hover:opacity-80 transition-opacity cursor-pointer relative group"
                    >
                      <img src={img} alt={`Evidence ${idx + 1}`} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-bold transition-opacity">
                        View
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* RESOLUTION FORM */}
            <form onSubmit={handleSaveResolution} className="border-t border-gray-200 pt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700">Update Ticket Status *</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as ComplaintStatus)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs font-bold text-gray-800 outline-none focus:border-[#ea580c]"
                  >
                    <option value="Open">Open (Pending)</option>
                    <option value="Under Review">Under Review (Checking warehouse/courier)</option>
                    <option value="In Progress">In Progress (Resolution underway)</option>
                    <option value="Resolved">Resolved (Customer satisfied / refund issued)</option>
                    <option value="Closed">Closed (Archived)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700">
                  Admin Resolution Response / Customer Note *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Explain the outcome, courier investigation results, warranty replacement, or apology note..."
                  value={adminReplyText}
                  onChange={(e) => setAdminReplyText(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-xs outline-none focus:border-[#ea580c] resize-none"
                />
                <p className="text-[11px] text-gray-400">
                  This note will be logged in the database and visible to the customer when they check their ticket or account.
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                {selectedComplaint.status === 'Resolved' || selectedComplaint.status === 'Closed' ? (
                  <button
                    type="button"
                    onClick={() => setTicketToDelete(selectedComplaint)}
                    className="px-3.5 py-2 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                    title="Delete resolved complaint permanently"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-600" />
                    Delete Resolved Ticket
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setTicketToDelete(selectedComplaint)}
                    className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete Ticket
                  </button>
                )}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedComplaint(null)}
                    className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-xs font-semibold hover:bg-gray-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#ea580c] text-white rounded-lg text-xs font-bold hover:bg-orange-700 transition-colors shadow-sm cursor-pointer"
                  >
                    Save & Update Ticket
                  </button>
                </div>
              </div>
            </form>
          </div>
        </Modal>
      )}

      {/* MODAL: CONFIRM PERMANENT TICKET DELETION */}
      {ticketToDelete && (
        <Modal
          isOpen={true}
          onClose={() => setTicketToDelete(null)}
          title="Permanently Delete Complaint Ticket"
          maxWidth="md"
        >
          <div className="space-y-4 text-left p-1">
            <div className="flex items-start gap-3 p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-900 leading-relaxed">
              <Trash2 className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold">Permanent Removal Warning</strong>
                <p className="mt-0.5 text-red-800">
                  Are you sure you want to permanently delete complaint ticket <strong className="font-mono font-bold text-red-950">#{ticketToDelete.id}</strong>?
                  This action will erase the ticket, customer report, and resolution notes from both the admin desk and cloud database.
                </p>
              </div>
            </div>

            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">Customer:</span>
                <span className="font-bold text-gray-800">{ticketToDelete.customerName} ({ticketToDelete.customerEmail})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Subject:</span>
                <span className="font-medium text-gray-800 truncate max-w-[240px]">{ticketToDelete.subject}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Status:</span>
                <span className="font-bold text-gray-700">{ticketToDelete.status}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setTicketToDelete(null)}
                className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-xs font-semibold hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteTicket}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Yes, Permanently Delete Ticket
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL: CONFIRM BULK DELETE RESOLVED COMPLAINTS */}
      {showDeleteAllResolvedModal && (
        <Modal
          isOpen={true}
          onClose={() => setShowDeleteAllResolvedModal(false)}
          title="Delete All Resolved Complaints"
          maxWidth="md"
        >
          <div className="space-y-4 text-left p-1">
            <div className="flex items-start gap-3 p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-900 leading-relaxed">
              <Trash2 className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold">Bulk Cleanup Confirmation</strong>
                <p className="mt-0.5 text-red-800">
                  Are you sure you want to permanently delete all <strong className="font-bold text-red-950">{resolvedCount}</strong> resolved/closed complaint tickets?
                  This cleans up satisfied support cases and permanently purges them from the database.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setShowDeleteAllResolvedModal(false)}
                className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-xs font-semibold hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteAllResolved}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Permanently Delete All {resolvedCount} Resolved
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* IMAGE PREVIEW LIGHTBOX */}
      {previewImage && (
        <Modal
          isOpen={true}
          onClose={() => setPreviewImage(null)}
          title="Evidence Photo Preview"
          maxWidth="lg"
        >
          <div className="p-2 text-center">
            <img src={previewImage} alt="Preview" className="max-h-[70vh] mx-auto rounded-lg object-contain shadow-md" />
            <button
              onClick={() => setPreviewImage(null)}
              className="mt-4 px-4 py-1.5 bg-gray-800 text-white text-xs font-bold rounded-lg cursor-pointer"
            >
              Close Preview
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};
