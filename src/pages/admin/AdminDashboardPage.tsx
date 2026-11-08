import React, { useState } from 'react';
import { useBookings } from '../../context/BookingContext';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { CalendarCheck, Edit2, Trash2, Plus, X, Save } from 'lucide-react';
import { Booking } from '../../types';

export const AdminDashboardPage: React.FC = () => {
  const { bookings, updateBooking, deleteBooking, createBooking } = useBookings();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Booking>>({});

  const startEdit = (book: Booking) => {
    setEditingId(book.id);
    setEditForm(book);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const saveEdit = (id: string) => {
    updateBooking(id, editForm);
    setEditingId(null);
    setEditForm({});
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this booking?')) {
      deleteBooking(id);
    }
  };

  const addNew = () => {
    const newB = createBooking({
      property_id: '',
      user_id: '',
      check_in: new Date().toISOString().split('T')[0],
      check_out: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      total_guests: 1,
      adults: 1,
      children: 0,
      pets: 0,
      nightly_price: 0,
      total_nights: 1,
      cleaning_fee: 0,
      service_fee: 0,
      total_price: 0,
      guest_name: 'New Booking',
      guest_email: '',
      guest_phone: '',
      payment_status: 'unpaid',
      customer_rate: 0,
      customer_payment_date: '',
      customer_payment_status: 'pending',
      owner_rate: 0,
      owner_payment_date: '',
      owner_payment_status: 'pending',
      property_title: 'Property Name'
    });
    startEdit(newB);
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-extrabold text-white">Bookings & Financials Ledger</h1>
          <p className="text-xs text-slate-400 mt-1">
            Maintain guest and owner rates, payment tracking, and exact booking dates.
          </p>
        </div>
        <Button variant="gold" size="sm" className="shadow-gold-glow" onClick={addNew}>
          <Plus className="w-4 h-4 mr-2" />
          Add New Booking
        </Button>
      </div>

      <div className="bg-slate-900 rounded-3xl border border-slate-800 shadow-xl overflow-hidden">
        <div className="p-6 border-b border-slate-800">
          <h3 className="font-serif text-xl font-bold text-white flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-brand-gold" />
            Master Bookings Table
          </h3>
        </div>

        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left text-[11px] sm:text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/50 text-slate-400 font-bold uppercase tracking-wider">
                <th className="py-4 px-4 whitespace-nowrap">Booking / Property</th>
                <th className="py-4 px-4 whitespace-nowrap">Dates (In - Out)</th>
                <th className="py-4 px-4 whitespace-nowrap bg-blue-500/5">Customer (Rate / Pay Date / Status)</th>
                <th className="py-4 px-4 whitespace-nowrap bg-emerald-500/5">Owner (Rate / Pay Date / Status)</th>
                <th className="py-4 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {bookings.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">
                    No bookings found. Click "Add New Booking" to create one.
                  </td>
                </tr>
              ) : (
                bookings.map((book) => {
                  const isEditing = editingId === book.id;

                  return (
                    <tr key={book.id} className="hover:bg-slate-800/30 transition-colors">
                      {/* Booking ID & Property */}
                      <td className="py-4 px-4 align-top">
                        {isEditing ? (
                          <div className="flex flex-col gap-2 min-w-[140px]">
                            <input
                              type="text"
                              value={editForm.property_title || ''}
                              onChange={(e) => setEditForm({ ...editForm, property_title: e.target.value })}
                              className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white"
                              placeholder="Property Name"
                            />
                            <input
                              type="text"
                              value={editForm.guest_name || ''}
                              onChange={(e) => setEditForm({ ...editForm, guest_name: e.target.value })}
                              className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white"
                              placeholder="Guest Name"
                            />
                          </div>
                        ) : (
                          <div>
                            <div className="font-bold text-white truncate max-w-[150px]">{book.property_title || 'N/A'}</div>
                            <div className="text-slate-500">{book.guest_name}</div>
                            <div className="text-[9px] text-brand-gold font-mono mt-1">{book.id}</div>
                          </div>
                        )}
                      </td>

                      {/* Dates */}
                      <td className="py-4 px-4 align-top">
                        {isEditing ? (
                          <div className="flex flex-col gap-2 min-w-[140px]">
                            <input
                              type="date"
                              value={editForm.check_in || ''}
                              onChange={(e) => setEditForm({ ...editForm, check_in: e.target.value })}
                              className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white"
                            />
                            <input
                              type="date"
                              value={editForm.check_out || ''}
                              onChange={(e) => setEditForm({ ...editForm, check_out: e.target.value })}
                              className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white"
                            />
                          </div>
                        ) : (
                          <div className="font-mono text-slate-400">
                            <div>In: <span className="text-white">{book.check_in}</span></div>
                            <div>Out: <span className="text-white">{book.check_out}</span></div>
                          </div>
                        )}
                      </td>

                      {/* Customer Details */}
                      <td className="py-4 px-4 align-top bg-blue-500/5">
                        {isEditing ? (
                          <div className="flex flex-col gap-2 min-w-[140px]">
                            <div className="flex gap-2 items-center">
                              <span className="text-slate-500">₹</span>
                              <input
                                type="number"
                                value={editForm.customer_rate || 0}
                                onChange={(e) => setEditForm({ ...editForm, customer_rate: Number(e.target.value) })}
                                className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white"
                                placeholder="Rate"
                              />
                            </div>
                            <input
                              type="date"
                              value={editForm.customer_payment_date || ''}
                              onChange={(e) => setEditForm({ ...editForm, customer_payment_date: e.target.value })}
                              className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white"
                            />
                            <select
                              value={editForm.customer_payment_status || 'pending'}
                              onChange={(e) => setEditForm({ ...editForm, customer_payment_status: e.target.value as any })}
                              className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white"
                            >
                              <option value="pending">Pending</option>
                              <option value="paid">Paid</option>
                            </select>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <div className="font-bold text-blue-400">₹{(book.customer_rate || 0).toLocaleString()}</div>
                            <div>{book.customer_payment_date || 'No Date'}</div>
                            <div>
                              <Badge variant={book.customer_payment_status === 'paid' ? 'success' : 'warning'}>
                                {book.customer_payment_status || 'Pending'}
                              </Badge>
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Owner Details */}
                      <td className="py-4 px-4 align-top bg-emerald-500/5">
                        {isEditing ? (
                          <div className="flex flex-col gap-2 min-w-[140px]">
                            <div className="flex gap-2 items-center">
                              <span className="text-slate-500">₹</span>
                              <input
                                type="number"
                                value={editForm.owner_rate || 0}
                                onChange={(e) => setEditForm({ ...editForm, owner_rate: Number(e.target.value) })}
                                className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white"
                                placeholder="Rate"
                              />
                            </div>
                            <input
                              type="date"
                              value={editForm.owner_payment_date || ''}
                              onChange={(e) => setEditForm({ ...editForm, owner_payment_date: e.target.value })}
                              className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white"
                            />
                            <select
                              value={editForm.owner_payment_status || 'pending'}
                              onChange={(e) => setEditForm({ ...editForm, owner_payment_status: e.target.value as any })}
                              className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white"
                            >
                              <option value="pending">Pending</option>
                              <option value="paid">Paid</option>
                            </select>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <div className="font-bold text-emerald-400">₹{(book.owner_rate || 0).toLocaleString()}</div>
                            <div>{book.owner_payment_date || 'No Date'}</div>
                            <div>
                              <Badge variant={book.owner_payment_status === 'paid' ? 'success' : 'warning'}>
                                {book.owner_payment_status || 'Pending'}
                              </Badge>
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 align-top text-right whitespace-nowrap">
                        {isEditing ? (
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => saveEdit(book.id)} className="p-2 bg-brand-gold hover:bg-brand-goldHover text-white rounded-lg transition-colors">
                              <Save className="w-4 h-4" />
                            </button>
                            <button onClick={cancelEdit} className="p-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => startEdit(book)} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDelete(book.id)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
