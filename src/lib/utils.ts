import type { TaskPriority, TaskStatus } from '../types';

export function getStatusBadge(status: TaskStatus) {
  switch (status) {
    case 'to_do':
      return {
        label: 'To Do',
        color: 'bg-slate-100 text-slate-700 border-slate-200'
      };
    case 'in_progress':
      return {
        label: 'In Progress',
        color: 'bg-blue-50 text-blue-700 border-blue-200'
      };
    case 'on_hold':
      return {
        label: 'On Hold',
        color: 'bg-amber-50 text-amber-700 border-amber-200'
      };
    case 'completed':
      return {
        label: 'Completed',
        color: 'bg-emerald-50 text-emerald-700 border-emerald-200'
      };
    case 'cancelled':
      return {
        label: 'Cancelled',
        color: 'bg-rose-50 text-rose-700 border-rose-200'
      };
  }
}

export function getPriorityBadge(priority: TaskPriority) {
  switch (priority) {
    case 'high':
      return {
        label: 'High',
        badge: 'bg-red-100 text-red-700 border-red-200'
      };
    case 'medium':
      return {
        label: 'Medium',
        badge: 'bg-amber-100 text-amber-800 border-amber-200'
      };
    case 'low':
      return {
        label: 'Low',
        badge: 'bg-slate-100 text-slate-600 border-slate-200'
      };
  }
}

export function formatDate(isoString?: string | null): string {
  if (!isoString) return '-';
  try {
    const d = new Date(isoString);
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).format(d);
  } catch {
    return isoString;
  }
}

export function isOverdue(deadline?: string | null, status?: TaskStatus): boolean {
  if (!deadline || status === 'completed' || status === 'cancelled') return false;
  return new Date(deadline).getTime() < Date.now();
}
