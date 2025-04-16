import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
import { Checkbox } from "@/components/ui/checkbox";

interface Column {
  header: string;
  accessorKey: string;
  cell?: (value: any, row: any) => React.ReactNode;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column[];
  showCheckbox?: boolean;
  onRowSelect?: (selectedRows: T[]) => void;
  searchPlaceholder?: string;
  filters?: {
    name: string;
    label: string;
    options: { value: string; label: string }[];
    onFilterChange: (value: string) => void;
  }[];
  actions?: React.ReactNode;
}

export function DataTable<T extends { id: number | string }>({
  data,
  columns,
  showCheckbox = false,
  onRowSelect,
  searchPlaceholder = "Search...",
  filters = [],
  actions,
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState("");
  const [pageIndex, setPageIndex] = useState(0);
  const [selectedRows, setSelectedRows] = useState<Record<string | number, boolean>>({});
  const pageSize = 10;

  const filteredData = React.useMemo(() => {
    return data.filter((item) =>
      Object.values(item).some(
        (value) =>
          value !== null &&
          value !== undefined &&
          value.toString().toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [data, searchTerm]);

  const pageCount = Math.ceil(filteredData.length / pageSize);
  const pageData = filteredData.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize);

  const handlePageChange = (page: number) => {
    setPageIndex(page - 1);
  };

  const handleSelectAll = (checked: boolean) => {
    const newSelectedRows: Record<string | number, boolean> = {};
    
    if (checked) {
      pageData.forEach((row) => {
        newSelectedRows[row.id] = true;
      });
    }
    
    setSelectedRows(newSelectedRows);
    
    if (onRowSelect) {
      const selectedItems = checked ? [...pageData] : [];
      onRowSelect(selectedItems);
    }
  };

  const handleSelectRow = (checked: boolean, row: T) => {
    const newSelectedRows = { ...selectedRows, [row.id]: checked };
    setSelectedRows(newSelectedRows);
    
    if (onRowSelect) {
      const selectedItems = data.filter((item) => newSelectedRows[item.id]);
      onRowSelect(selectedItems);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="w-full sm:w-64 relative">
          <Input 
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
            />
          </svg>
        </div>
        
        <div className="flex flex-wrap gap-3 sm:gap-2">
          {filters.map((filter) => (
            <div key={filter.name} className="w-full sm:w-auto">
              <Select onValueChange={filter.onFilterChange}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder={filter.label} />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {filter.options.map((option) => 
                      // Make sure we never have empty string values in SelectItem
                      (option.value !== undefined && (option.value !== "" || option.label === "All Labels" || option.label === "All Locations" || option.label === "All Statuses" || option.label === "All Time")) ? (
                        <SelectItem key={option.value || `option-${option.label}`} value={option.value || `value-${option.label}`}>
                          {option.label}
                        </SelectItem>
                      ) : null
                    )}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          ))}
          
          {actions}
        </div>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              {showCheckbox && (
                <TableHead className="w-10">
                  <Checkbox 
                    checked={pageData.length > 0 && pageData.every(row => selectedRows[row.id])}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
              )}
              {columns.map((column) => (
                <TableHead key={column.accessorKey}>
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageData.length === 0 ? (
              <TableRow>
                <TableCell 
                  colSpan={showCheckbox ? columns.length + 1 : columns.length} 
                  className="text-center h-32 text-gray-500"
                >
                  No results found
                </TableCell>
              </TableRow>
            ) : (
              pageData.map((row) => (
                <TableRow key={row.id} className="hover:bg-gray-50">
                  {showCheckbox && (
                    <TableCell>
                      <Checkbox 
                        checked={!!selectedRows[row.id]}
                        onCheckedChange={(checked) => handleSelectRow(!!checked, row)}
                      />
                    </TableCell>
                  )}
                  {columns.map((column) => (
                    <TableCell key={`${row.id}-${column.accessorKey}`}>
                      {column.cell
                        ? column.cell(
                            (row as any)[column.accessorKey], 
                            row
                          )
                        : (row as any)[column.accessorKey]}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {pageCount > 1 && (
        <div className="mt-4 flex justify-center">
          <Pagination
            currentPage={pageIndex + 1}
            totalPages={pageCount}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </div>
  );
}
