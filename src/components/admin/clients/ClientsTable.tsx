'use client';

import { useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  ColumnDef,
  flexRender,
  SortingState,
  RowSelectionState,
  VisibilityState,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  MoreHorizontal,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Eye,
  Archive,
  Trash2,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Client } from '@/lib/clients/schema';
import { BrandBadge } from './BrandBadge';
import { cn } from '@/lib/utils';

export interface ClientsTableProps {
  data: Client[];
  sorting: SortingState;
  onSortingChange: (sorting: SortingState) => void;
  rowSelection: RowSelectionState;
  onRowSelectionChange: (selection: RowSelectionState) => void;
  columnVisibility: VisibilityState;
  onColumnVisibilityChange: (visibility: VisibilityState) => void;
  onViewClient?: (client: Client) => void;
  onEditClient?: (client: Client) => void;
  onArchiveClient?: (client: Client) => void;
  onDeleteClient?: (client: Client) => void;
  isLoading?: boolean;
  virtualizeThreshold?: number;
}

const ROW_HEIGHT = 56; // pixels

export function ClientsTable({
  data,
  sorting,
  onSortingChange,
  rowSelection,
  onRowSelectionChange,
  columnVisibility,
  onColumnVisibilityChange,
  onViewClient,
  onEditClient,
  onArchiveClient,
  onDeleteClient,
  isLoading = false,
  virtualizeThreshold = 200,
}: ClientsTableProps) {

  // Memoized columns definition
  const columns = useMemo<ColumnDef<Client>[]>(() => [
    // Selection column
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
          className="translate-y-[2px]"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
          className="translate-y-[2px]"
        />
      ),
      size: 36,
      enableSorting: false,
      enableHiding: false,
    },
    // Name column
    {
      accessorKey: 'name',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-auto p-0 font-semibold hover:bg-transparent"
        >
          Name
          <SortIcon isSorted={column.getIsSorted()} />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="font-medium text-gray-900">
          {row.getValue('name')}
        </div>
      ),
      size: 200,
    },
    // Email column
    {
      accessorKey: 'email',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-auto p-0 font-semibold hover:bg-transparent"
        >
          Email
          <SortIcon isSorted={column.getIsSorted()} />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="text-gray-600">
          {row.getValue('email')}
        </div>
      ),
      size: 250,
    },
    // Phone column
    {
      accessorKey: 'phone',
      header: 'Phone',
      cell: ({ row }) => (
        <div className="text-gray-600 font-mono text-sm">
          {row.getValue('phone') || '-'}
        </div>
      ),
      size: 150,
    },
    // Last Booking column
    {
      accessorKey: 'lastBookingDate',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-auto p-0 font-semibold hover:bg-transparent"
        >
          Last Booking
          <SortIcon isSorted={column.getIsSorted()} />
        </Button>
      ),
      cell: ({ row }) => {
        const timestamp = row.getValue('lastBookingDate') as Client['lastBookingDate'];
        if (!timestamp) {
          return <span className="text-gray-400">Never</span>;
        }

        const date = new Date(timestamp.seconds * 1000);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - date.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        return (
          <div className="text-sm">
            <div className="font-medium">
              {date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </div>
            <div className="text-gray-500 text-xs">
              {diffDays === 1 ? '1 day ago' : `${diffDays} days ago`}
            </div>
          </div>
        );
      },
      size: 140,
      sortingFn: (rowA, rowB) => {
        const a = rowA.getValue('lastBookingDate') as Client['lastBookingDate'];
        const b = rowB.getValue('lastBookingDate') as Client['lastBookingDate'];

        if (!a && !b) return 0;
        if (!a) return 1;
        if (!b) return -1;

        return a.seconds - b.seconds;
      },
    },
    // Brand column
    {
      accessorKey: 'brand',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-auto p-0 font-semibold hover:bg-transparent"
        >
          Brand
          <SortIcon isSorted={column.getIsSorted()} />
        </Button>
      ),
      cell: ({ row }) => (
        <BrandBadge brand={row.getValue('brand')} />
      ),
      size: 120,
    },
    // Socials column
    {
      id: 'socials',
      header: 'Socials',
      cell: ({ row }) => {
        const s = (row.original as any).socials || {};
        const parts = [] as string[];
        if (s.instagram) parts.push('IG');
        if (s.facebook) parts.push('FB');
        if (s.twitter) parts.push('X');
        return parts.length ? (
          <div className="text-xs text-gray-600">{parts.join(' · ')}</div>
        ) : (
          <span className="text-gray-400">-</span>
        );
      },
      size: 140,
    },

    // Registration Date column (hidden by default)
    {
      accessorKey: 'registrationDate',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-auto p-0 font-semibold hover:bg-transparent"
        >
          Registered
          <SortIcon isSorted={column.getIsSorted()} />
        </Button>
      ),
      cell: ({ row }) => {
        const timestamp = row.getValue('registrationDate') as Client['registrationDate'];
        if (!timestamp) return '-';

        const date = new Date(timestamp.seconds * 1000);
        return date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        });
      },
      size: 120,
    },
    // Actions column
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const client = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-8 w-8 p-0"
                aria-label="Open menu"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onViewClient && (
                <DropdownMenuItem onClick={() => onViewClient(client)}>
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </DropdownMenuItem>
              )}
              {onEditClient && (
                <DropdownMenuItem onClick={() => onEditClient(client)}>
                  <Archive className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
              )}
              {onArchiveClient && (
                <DropdownMenuItem onClick={() => onArchiveClient(client)}>
                  <Archive className="mr-2 h-4 w-4" />
                  Archive
                </DropdownMenuItem>
              )}
              {onDeleteClient && (
                <DropdownMenuItem
                  onClick={() => onDeleteClient(client)}
                  className="text-red-600 focus:text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
      size: 56,
      enableSorting: false,
      enableHiding: false,
    },
  ], [onViewClient, onEditClient, onArchiveClient, onDeleteClient]);

  // Table instance
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange,
    onRowSelectionChange,
    onColumnVisibilityChange,
    state: {
      sorting,
      rowSelection,
      columnVisibility,
    },
    enableRowSelection: true,
    enableColumnResizing: false,
    getRowId: (row) => row.id, // CRITICAL FIX: Use actual client ID, not array index
  });

  // Virtualization setup
  const shouldVirtualize = data.length > virtualizeThreshold;
  const { rows } = table.getRowModel();

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => document.getElementById('clients-table-container'),
    estimateSize: () => ROW_HEIGHT,
    overscan: 10,
  });

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-14 bg-gray-200 rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        No clients found
      </div>
    );
  }

  return (
    <div className="relative">
      <div
        id="clients-table-container"
        className="h-[600px] overflow-auto"
        style={{ contain: 'strict' }}
      >
        <Table>
          <TableHeader className="sticky top-0 bg-white z-10 shadow-sm">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={cn(
                      'font-semibold text-gray-900 bg-white',
                      header.column.id === 'select' && 'sticky left-0 z-20 bg-white',
                      header.column.id === 'actions' && 'sticky right-0 z-20 bg-white'
                    )}
                    style={{ width: header.getSize() }}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {shouldVirtualize ? (
              // Virtualized rows
              rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const row = rows[virtualRow.index];
                return (
                  <TableRow
                    key={row.id}
                    className="hover:bg-gray-50"
                    style={{
                      height: `${virtualRow.size}px`,
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        className={cn(
                          cell.column.id === 'select' && 'sticky left-0 z-10 bg-white',
                          cell.column.id === 'actions' && 'sticky right-0 z-10 bg-white'
                        )}
                        style={{ width: cell.column.getSize() }}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })
            ) : (
              // Regular rows
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className="hover:bg-gray-50">
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={cn(
                        cell.column.id === 'select' && 'sticky left-0 z-10 bg-white',
                        cell.column.id === 'actions' && 'sticky right-0 z-10 bg-white'
                      )}
                      style={{ width: cell.column.getSize() }}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// Sort icon component
function SortIcon({ isSorted }: { isSorted: false | 'asc' | 'desc' }) {
  if (!isSorted) return <ArrowUpDown className="ml-2 h-4 w-4" />;
  return isSorted === 'asc'
    ? <ArrowUp className="ml-2 h-4 w-4" />
    : <ArrowDown className="ml-2 h-4 w-4" />;
}
