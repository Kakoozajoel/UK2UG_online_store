import React, { useState } from 'react';
import {
  AlertTriangle,
  Send,
  CheckCircle2,
  Package,
  Clock,
  ShieldCheck,
  HelpCircle,
  X,
} from 'lucide-react';
import { Complaint, ComplaintCategory, ComplaintPriority, Order } from '../types';
import { Modal } from './CommonUI';

interface CustomerComplaintModalProps {
  isOpen: boolean;
  onClose: () => void;
  addComplaint: (complaint: Omit<Complaint, 'id' | 'createdAt' | 'status'> & { id?: string }) => Complaint;
  orders: Order[];
  currentUser?: { name: string; email: string; phone?: string } | null;
  defaultOrderId?: string;
}

export const CustomerComplaintModal: React.FC<CustomerComplaintModalProps> = ({
  isOpen,
  onClose,
  addComplaint,
  orders,
  currentUser,
  defaultOrderId,
}) => {
  const [name, setName] = useState(currentUser?.name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [orderId, setOrderId] = useState(defaultOrderId || '');
  const [category, setCategory] = useState<ComplaintCategory>('Delayed Delivery');
  const [priority, setPriority] = useState<ComplaintPriority>('Medium');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [submittedTicket, setSubmittedTicket] = useState<Complaint | null>(null);

  // Filter orders belonging to current user if available
  const userOrders = currentUser?.email
    ? orders.filter((o) => o.customerEmail?.toLowerCase() === currentUser.email.toLowerCase())
    : orders;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !phone || !subject || !description) return;

    const newTicket = addComplaint({
      customerName: name,
      customerEmail: email,
      customerPhone: phone,
      orderId: orderId || undefined,
      category,
      priority,
      subject,
      description,
    });

    setSubmittedTicket(newTicket);
  };

  const handleReset = () => {
    setSubmittedTicket(null);
    setSubject('');
    setDescription('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleReset}
      title="Customer Resolution & Support Ticket"
      maxWidth="lg"
    >
      {submittedTicket ? (
        <div className="text-center py-6 space-y-4 text-left">
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-1 text-center">
            <h3 className="text-lg font-bold text-gray-900">Complaint Lodged Successfully</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              Your grievance has been submitted directly to the UK2UG Kampala resolution team and admin desk.
            </p>
          </div>

          <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 text-center space-y-1">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Your Ticket Reference</span>
            <p className="text-xl font-black text-gray-900 font-mono">{submittedTicket.id}</p>
            <p className="text-[11px] text-teal-700 font-semibold">Priority: {submittedTicket.priority} • Status: Open</p>
          </div>

          <div className="bg-teal-50/60 border border-teal-100 rounded-xl p-3.5 text-xs text-teal-900 space-y-1 text-left">
            <div className="flex items-center gap-1.5 font-bold">
              <ShieldCheck className="w-4 h-4 text-teal-700" />
              <span>Our UK2UG Resolution Guarantee</span>
            </div>
            <p className="text-[11px] text-teal-800">
              A member of our logistics desk will contact you at <strong>{submittedTicket.customerPhone}</strong> or via <strong>{submittedTicket.customerEmail}</strong> within 24 hours with an official investigation outcome.
            </p>
          </div>

          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={handleReset}
              className="px-6 py-2.5 bg-[#008080] hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Back to Store
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 text-left text-xs">
          <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-bold text-amber-900 text-xs">Need Help with an Order or Delivery?</p>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                If you experienced an airport cargo delay, package tampering, missing items, or payment issue, submit your ticket below for urgent review.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-gray-700 uppercase tracking-wider text-[10px]">Your Full Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Joel Kakooza"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 outline-none focus:border-[#008080]"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-gray-700 uppercase tracking-wider text-[10px]">Email Address *</label>
              <input
                type="email"
                required
                placeholder="e.g. name@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 outline-none focus:border-[#008080]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-gray-700 uppercase tracking-wider text-[10px]">Uganda Phone / WhatsApp *</label>
              <input
                type="tel"
                required
                placeholder="e.g. +256 700 123 456"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 outline-none focus:border-[#008080]"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-gray-700 uppercase tracking-wider text-[10px]">Associated Order ID (Optional)</label>
              {userOrders.length > 0 ? (
                <select
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-[#008080]"
                >
                  <option value="">-- Select Order or None --</option>
                  {userOrders.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.id} ({o.items.length} items - {o.status})
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  placeholder="e.g. UK2UG-ORD-1234"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 outline-none focus:border-[#008080]"
                />
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-gray-700 uppercase tracking-wider text-[10px]">Issue Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ComplaintCategory)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 font-bold outline-none focus:border-[#008080]"
              >
                <option value="Delayed Delivery">Delayed Delivery</option>
                <option value="Damaged / Broken Item">Damaged / Broken Item</option>
                <option value="Wrong Item Model">Wrong Item Model</option>
                <option value="Missing Accessories">Missing Accessories</option>
                <option value="Payment / Refund Issue">Payment / Refund Issue</option>
                <option value="Courier / Rider Issue">Courier / Rider Issue</option>
                <option value="Quality Discrepancy">Quality Discrepancy</option>
                <option value="Other">Other Inquiry</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-gray-700 uppercase tracking-wider text-[10px]">Severity / Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as ComplaintPriority)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 font-bold outline-none focus:border-[#008080]"
              >
                <option value="Low">Low - General Feedback</option>
                <option value="Medium">Medium - Standard Issue</option>
                <option value="High">High - Significant Transit Delay</option>
                <option value="Urgent">Urgent - Damaged / Incorrect High Value Item</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-bold text-gray-700 uppercase tracking-wider text-[10px]">Subject / Short Summary *</label>
            <input
              type="text"
              required
              placeholder="e.g. Package arrived with torn outer seal / delay beyond estimated date"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 outline-none focus:border-[#008080]"
            />
          </div>

          <div className="space-y-1">
            <label className="font-bold text-gray-700 uppercase tracking-wider text-[10px]">Detailed Description of Complaint *</label>
            <textarea
              rows={3}
              required
              placeholder="Please describe what occurred in detail so our team can immediately verify flight cargo logs and package receipts..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 outline-none focus:border-[#008080]"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#008080] hover:bg-teal-700 text-white rounded-xl font-bold transition-colors cursor-pointer shadow flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" /> Submit Complaint Ticket
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
};
