import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  siblingCount?: number;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  siblingCount = 1,
}: PaginationProps) {
  // Generate range of page numbers to display
  const range = (start: number, end: number) => {
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  const generatePagination = () => {
    // Direct display if total pages is small
    if (totalPages <= 7) {
      return range(1, totalPages);
    }

    // Calculate sibling range
    const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
    const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

    // Display dots when needed
    const shouldShowLeftDots = leftSiblingIndex > 2;
    const shouldShowRightDots = rightSiblingIndex < totalPages - 1;

    // Add first and last page always
    if (shouldShowLeftDots && shouldShowRightDots) {
      const middleRange = range(leftSiblingIndex, rightSiblingIndex);
      return [1, '...', ...middleRange, '...', totalPages];
    } 
    
    // Show dots only on the right
    if (!shouldShowLeftDots && shouldShowRightDots) {
      const leftRange = range(1, Math.min(5, totalPages - 2));
      return [...leftRange, '...', totalPages];
    }
    
    // Show dots only on the left
    if (shouldShowLeftDots && !shouldShowRightDots) {
      const rightRange = range(Math.max(totalPages - 4, 2), totalPages);
      return [1, '...', ...rightRange];
    }
    
    // Fallback
    return range(1, totalPages);
  };

  const pages = generatePagination();

  return (
    <nav className="flex items-center space-x-1">
      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className="hidden sm:flex"
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="sr-only">Previous Page</span>
      </Button>

      {pages.map((page, i) => {
        if (page === '...') {
          return (
            <span key={`ellipsis-${i}`} className="px-4 py-2 text-sm text-gray-500">
              ...
            </span>
          );
        }

        return (
          <Button
            key={`page-${page}`}
            variant={currentPage === page ? "default" : "outline"}
            size="icon"
            onClick={() => onPageChange(page as number)}
            className={`${
              currentPage === page ? 'text-white' : 'text-gray-700'
            } h-9 w-9`}
          >
            {page}
          </Button>
        );
      })}

      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className="hidden sm:flex"
      >
        <ChevronRight className="h-4 w-4" />
        <span className="sr-only">Next Page</span>
      </Button>
      
      <div className="flex sm:hidden space-x-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
        >
          Next
        </Button>
      </div>
    </nav>
  );
}
