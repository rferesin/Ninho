import { HttpErrorResponse } from '@angular/common/http';

export function apiMessage(error: HttpErrorResponse, fallback: string): string {
  const body = error.error as { message?: string } | null;
  return body?.message || fallback;
}
