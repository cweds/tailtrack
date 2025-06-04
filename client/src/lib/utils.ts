import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { User, SafeUser } from "@shared/schema"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getDisplayName(user: User | SafeUser): string {
  // If username looks like auto-generated system username, extract name from email
  if (user.username.startsWith('user_') && user.username.includes('_')) {
    const emailPart = user.email.split('@')[0];
    return emailPart;
  }
  return user.username;
}
