'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'react-toastify';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye, 
  Calendar,
  DollarSign,
  Users,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Booking } from '@/lib/schemas';
import { CreateBookingModal } from '@/components/admin/bookings/CreateBookingModal';
import { ViewBookingModal } from '@/components/admin/bookings/ViewBookingModal';
import { EditBookingModal } from '@/components/admin/bookings/EditBookingModal';
import { useRequireAdmin } from '@/hooks/useAuth';

interface BookingWithClients extends Booking {
  id: string;
  clientNames?: string[];
}

export default function BookingsPage() {
  // Require admin authentication
  const user = useRequireAdmin();

  const [bookings, setBookings] = useState<BookingWithClients[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<BookingWithClients[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<BookingWithClients | null>(null);
  const itemsPerPage = 10;

  // Fetch bookings from Supabase
  const fetchBookings = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);

      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching bookings:', error);
        toast.error('Failed to load bookings');
        return;
      }

      if (data) {
        const formattedBookings: BookingWithClients[] = data.map(booking => {
          // Parse items if it's a JSON string (JSONB from Supabase)
          let parsedItems = [];
          try {
            if (typeof booking.items === 'string') {
              parsedItems = JSON.parse(booking.items);
            } else if (Array.isArray(booking.items)) {
              parsedItems = booking.items;
            } else {
              console.warn('Booking with invalid items structure:', {
                id: booking.id,
                items: booking.items,
                itemsType: typeof booking.items
              });
              parsedItems = [];
            }
          } catch (error) {
            console.error('Error parsing booking items JSON:', {
              id: booking.id,
              items: booking.items,
              error: error.message
            });
            parsedItems = [];
          }

          return {
            id: booking.id,
            clientIds: booking.client_ids || [],
            items: parsedItems,
            totalAmount: booking.total_amount,
            paymentStatus: booking.payment_status,
            paymentMethod: booking.payment_method,
            notes: booking.notes || '',
            source: booking.source || 'dashboard',
            createdAt: new Date(booking.created_at),
            updatedAt: new Date(booking.updated_at),
            clientNames: [] // Will be populated by fetching client names
          };
        });
        setBookings(formattedBookings);
        setFilteredBookings(formattedBookings);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.error('Failed to load bookings');
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  // Add optimistic update for new bookings
  const addOptimisticBooking = useCallback((newBooking: BookingWithClients) => {
    setBookings(prev => [newBooking, ...prev]);
    setFilteredBookings(prev => [newBooking, ...prev]);
  }, []);

  // Remove optimistic booking if creation fails
  const removeOptimisticBooking = useCallback((bookingId: string) => {
    setBookings(prev => prev.filter(b => b.id !== bookingId));
    setFilteredBookings(prev => prev.filter(b => b.id !== bookingId));
  }, []);

  // Filter bookings based on search and status
  useEffect(() => {
    let filtered = bookings;

    if (searchTerm) {
      filtered = filtered.filter(booking => 
        booking.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.notes.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (booking.clientNames && booking.clientNames.some(name => 
          name.toLowerCase().includes(searchTerm.toLowerCase())
        ))
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(booking => booking.paymentStatus === statusFilter);
    }

    setFilteredBookings(filtered);
    setCurrentPage(1);
  }, [bookings, searchTerm, statusFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedBookings = filteredBookings.slice(startIndex, startIndex + itemsPerPage);

  // Load data on component mount and set up real-time subscription
  useEffect(() => {
    fetchBookings();

    // Set up real-time subscription for bookings
    const subscription = supabase
      .channel('bookings-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings'
        },
        (payload) => {
          console.log('Real-time booking change:', payload);

          if (payload.eventType === 'INSERT') {
            // New booking created
            const newBooking: BookingWithClients = {
              id: payload.new.id,
              clientIds: payload.new.client_ids || [],
              items: payload.new.items || [],
              totalAmount: payload.new.total_amount,
              paymentStatus: payload.new.payment_status,
              paymentMethod: payload.new.payment_method,
              notes: payload.new.notes || '',
              source: payload.new.source || 'dashboard',
              createdAt: new Date(payload.new.created_at),
              updatedAt: new Date(payload.new.updated_at),
              clientNames: []
            };

            setBookings(prev => {
              // Check if booking already exists (avoid duplicates)
              if (prev.some(b => b.id === newBooking.id)) return prev;
              return [newBooking, ...prev];
            });

            toast.success('New booking received!', {
              position: 'top-right',
              autoClose: 3000,
            });
          } else if (payload.eventType === 'UPDATE') {
            // Booking updated
            setBookings(prev => prev.map(booking =>
              booking.id === payload.new.id
                ? {
                    ...booking,
                    clientIds: payload.new.client_ids || [],
                    items: payload.new.items || [],
                    totalAmount: payload.new.total_amount,
                    paymentStatus: payload.new.payment_status,
                    paymentMethod: payload.new.payment_method,
                    notes: payload.new.notes || '',
                    updatedAt: new Date(payload.new.updated_at),
                  }
                : booking
            ));
          } else if (payload.eventType === 'DELETE') {
            // Booking deleted
            setBookings(prev => prev.filter(booking => booking.id !== payload.old.id));
            toast.info('Booking was deleted', {
              position: 'top-right',
              autoClose: 3000,
            });
          }
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, [fetchBookings]);

  // Handle booking deletion
  const handleDeleteBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to delete this booking?')) return;

    try {
      const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('id', bookingId);

      if (error) {
        console.error('Error deleting booking:', error);
        toast.error('Failed to delete booking');
        return;
      }

      toast.success('Booking deleted successfully');
      fetchBookings();
    } catch (error) {
      console.error('Error deleting booking:', error);
      toast.error('Failed to delete booking');
    }
  };

  // Handle status update
  const handleStatusUpdate = async (bookingId: string, newStatus: 'pending' | 'confirmed' | 'cancelled') => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({
          payment_status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId);

      if (error) {
        console.error('Error updating booking status:', error);
        toast.error('Failed to update booking status');
        return;
      }

      toast.success(`Booking status updated to ${newStatus}`);
      fetchBookings(); // Refresh the list
    } catch (error) {
      console.error('Error updating booking status:', error);
      toast.error('Failed to update booking status');
    }
  };

  // Get status badge color
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-heiwaOrange-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900" data-testid="bookings-page-title">
            Bookings Management
          </h1>
          <p className="text-gray-600">Manage all room and surf camp bookings</p>
        </div>
        <Button 
          onClick={() => setIsCreateDialogOpen(true)}
          className="bg-heiwaOrange-600 hover:bg-heiwaOrange-700"
          data-testid="create-booking"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Booking
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search bookings..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="search-bookings"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]" data-testid="filter-status">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bookings Table */}
      <Card>
        <CardHeader>
          <CardTitle>Bookings ({filteredBookings.length})</CardTitle>
          <CardDescription>
            View and manage all bookings for rooms and surf camps
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table data-testid="bookings-table">
              <TableHeader>
                <TableRow>
                  <TableHead data-testid="sort-id">Booking ID</TableHead>
                  <TableHead data-testid="sort-date">Date</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead data-testid="sort-amount">Amount</TableHead>
                  <TableHead data-testid="sort-status">Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedBookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell className="font-mono text-sm">
                      {booking.id.slice(0, 8)}...
                    </TableCell>
                    <TableCell>
                      {new Date(booking.createdAt instanceof Date ? booking.createdAt : typeof booking.createdAt === 'string' ? booking.createdAt : booking.createdAt.seconds * 1000).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {Array.isArray(booking.items) ? (
                          booking.items.map((item, index) => (
                            <div key={index} className="text-sm">
                              {item.type} × {item.quantity}
                            </div>
                          ))
                        ) : (
                          <div className="text-sm text-gray-500">
                            Invalid items data
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold">
                      ${booking.totalAmount.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusBadgeColor(booking.paymentStatus)}>
                        {booking.paymentStatus}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedBooking(booking);
                            setIsViewDialogOpen(true);
                          }}
                          data-testid={`view-booking-${booking.id}`}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedBooking(booking);
                            setIsEditDialogOpen(true);
                          }}
                          data-testid={`edit-booking-${booking.id}`}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              data-testid="status-update"
                            >
                              <Filter className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem
                              onClick={() => handleStatusUpdate(booking.id, 'pending')}
                              disabled={booking.paymentStatus === 'pending'}
                            >
                              Mark as Pending
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleStatusUpdate(booking.id, 'confirmed')}
                              disabled={booking.paymentStatus === 'confirmed'}
                            >
                              Mark as Confirmed
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleStatusUpdate(booking.id, 'cancelled')}
                              disabled={booking.paymentStatus === 'cancelled'}
                            >
                              Mark as Cancelled
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteBooking(booking.id)}
                          className="text-red-600 hover:text-red-700"
                          data-testid={`delete-booking-${booking.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-gray-600">
                Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredBookings.length)} of {filteredBookings.length} bookings
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  data-testid="prev-page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  data-testid="next-page"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Booking Modal */}
      <CreateBookingModal
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onSuccess={() => {
          // Real-time subscription will handle the update automatically
          // Just show a success message
          toast.success('Booking created successfully! It will appear in the list momentarily.', {
            position: 'top-right',
            autoClose: 4000,
          });
        }}
      />

      {/* View Booking Modal */}
      <ViewBookingModal
        booking={selectedBooking}
        isOpen={isViewDialogOpen}
        onClose={() => {
          setIsViewDialogOpen(false);
          setSelectedBooking(null);
        }}
      />

      {/* Edit Booking Modal */}
      <EditBookingModal
        booking={selectedBooking}
        isOpen={isEditDialogOpen}
        onClose={() => {
          setIsEditDialogOpen(false);
          setSelectedBooking(null);
        }}
        onSuccess={() => {
          fetchBookings(false);
          toast.success('Booking updated successfully!');
        }}
      />
    </div>
  );
}
