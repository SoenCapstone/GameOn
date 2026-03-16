"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  ArrowLeftDoubleIcon,
  ArrowRight01Icon,
  ArrowRightDoubleIcon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";

export function UsersPagination({
  page,
  pageSize,
  total,
  onPageChange,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const canGoPrevious = page > 1;
  const canGoNext = page < pageCount;

  return (
    <div className="flex items-center justify-end px-4">
      <div className="flex w-full items-center gap-8 lg:w-fit">
        <div className="flex w-fit items-center justify-center text-sm font-medium">
          Page {page} of {pageCount}
        </div>
        <div className="ml-auto flex items-center gap-2 lg:ml-0">
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex"
            onClick={() => onPageChange(1)}
            disabled={!canGoPrevious}
          >
            <span className="sr-only">Go to first page</span>
            <HugeiconsIcon icon={ArrowLeftDoubleIcon} strokeWidth={2} />
          </Button>
          <Button
            variant="outline"
            className="size-8"
            size="icon-sm"
            onClick={() => onPageChange(page - 1)}
            disabled={!canGoPrevious}
          >
            <span className="sr-only">Go to previous page</span>
            <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} />
          </Button>
          <Button
            variant="outline"
            className="size-8"
            size="icon-sm"
            onClick={() => onPageChange(page + 1)}
            disabled={!canGoNext}
          >
            <span className="sr-only">Go to next page</span>
            <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} />
          </Button>
          <Button
            variant="outline"
            className="hidden size-8 lg:flex"
            size="icon-sm"
            onClick={() => onPageChange(pageCount)}
            disabled={!canGoNext}
          >
            <span className="sr-only">Go to last page</span>
            <HugeiconsIcon icon={ArrowRightDoubleIcon} strokeWidth={2} />
          </Button>
        </div>
      </div>
    </div>
  );
}
