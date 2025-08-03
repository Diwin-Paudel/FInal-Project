import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format currency in NPR
export function formatCurrency(amount: number): string {
  return `NPR ${amount.toLocaleString()}`;
}

// Format date
export function formatDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('en-NP', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// Format time
export function formatTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleTimeString('en-NP', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Format rating
export function formatRating(rating: number | null): string {
  if (rating === null) return 'N/A';
  return `${rating.toFixed(1)} ★`;
}

// Get role-specific color
export function getRoleColor(role: 'customer' | 'owner' | 'admin' | 'partner'): string {
  switch (role) {
    case 'customer':
      return 'hsl(var(--customer))';
    case 'owner':
      return 'hsl(var(--owner))';
    case 'admin':
      return 'hsl(var(--admin))';
    case 'partner':
      return 'hsl(var(--partner))';
  }
}

// Truncate text
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
}

// Generate order ID
export function generateOrderId(id: number): string {
  return `#ORD-${String(id).padStart(3, '0')}`;
}

// Calculate time difference in minutes
export function getTimeDifference(date: Date | string): number {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  return Math.floor((now.getTime() - dateObj.getTime()) / (1000 * 60));
}

// Format relative time
export function formatRelativeTime(date: Date | string): string {
  const minutes = getTimeDifference(date);
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days > 1 ? 's' : ''} ago`;
  
  const months = Math.floor(days / 30);
  return `${months} month${months > 1 ? 's' : ''} ago`;
}
