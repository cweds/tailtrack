import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";

interface BackButtonProps {
  href?: string;
  text?: string;
  className?: string;
}

export function BackButton({ href = "/", text = "Back", className = "" }: BackButtonProps) {
  return (
    <Link 
      href={href} 
      className={`inline-flex items-center text-gray-600 hover:text-gray-900 border border-gray-200 hover:border-gray-300 px-2 py-1 rounded-md transition-all text-sm ${className}`}
    >
      <ArrowLeft className="w-4 h-4 mr-1" />
      {text}
    </Link>
  );
}