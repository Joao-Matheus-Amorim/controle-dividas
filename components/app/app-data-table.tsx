"use client";

import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { Search } from "lucide-react";
import { useState } from "react";

import { AppEmptyState } from "@/components/app/app-empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface AppDataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchPlaceholder?: string;
  emptyTitle?: string;
  emptyDescription?: string;
}

export function AppDataTable<TData, TValue>({
  columns,
  data,
  searchPlaceholder = "Buscar...",
  emptyTitle = "Nenhum registro encontrado",
  emptyDescription = "Quando houver dados cadastrados, eles aparecerão aqui.",
}: AppDataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      globalFilter,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
        <Input
          value={globalFilter ?? ""}
          onChange={(event) => setGlobalFilter(event.target.value)}
          placeholder={searchPlaceholder}
          className="pl-11"
        />
      </div>

      <div className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#080810]/50">
        <div className="max-w-full overflow-hidden">
          <table className="w-full table-fixed text-sm">
            <thead className="bg-white/[0.04] text-left text-[11px] uppercase tracking-[0.18em] text-white/35">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th key={header.id} className="truncate px-3 py-3 font-bold">
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-white/10">
              {table.getRowModel().rows.length ? (
                table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="transition hover:bg-white/[0.035]">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="truncate px-3 py-3 text-white/70">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length} className="p-4">
                    <AppEmptyState
                      icon={Search}
                      title={emptyTitle}
                      description={emptyDescription}
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 text-xs text-white/35">
        <span>
          {table.getFilteredRowModel().rows.length} registro(s)
        </span>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-xl border-white/10 bg-transparent text-white/60 hover:bg-white/10 hover:text-white"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Anterior
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-xl border-white/10 bg-transparent text-white/60 hover:bg-white/10 hover:text-white"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Próxima
          </Button>
        </div>
      </div>
    </div>
  );
}
