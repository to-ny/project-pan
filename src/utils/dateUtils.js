import { format, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

export function formatDate(date) {
  if (!date) return '';
  return format(new Date(date), 'd MMMM yyyy', { locale: fr });
}

export function formatShortDate(date) {
  if (!date) return '';
  return format(new Date(date), 'd MMM yyyy', { locale: fr });
}

export function formatMonthYear(date) {
  if (!date) return '';
  return format(new Date(date), 'MMMM yyyy', { locale: fr });
}

export function formatRelative(date) {
  if (!date) return '';
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: fr });
}

export function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

export function getCurrentMonthInfo() {
  const now = new Date();
  return {
    year: now.getFullYear(),
    month: now.getMonth(),
    daysInMonth: getDaysInMonth(now.getFullYear(), now.getMonth()),
  };
}

export function daysBetween(date1, date2) {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2 - d1);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}
