"use client";

import * as React from "react";
import { useCompany } from "@/context/CompanyContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Building2, ChevronRight } from "lucide-react";

export function CompanySelector() {
  const { selectedCompany, setSelectedCompany, companies, isLoading } = useCompany();

  if (isLoading || companies.length === 0) {
    return (
      <div className="h-14 w-full bg-accent/10 rounded-2xl animate-pulse" />
    );
  }

  return (
    <div className="flex flex-col gap-2 w-full px-4 mb-8">
      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] ml-2">Active Entity</p>
      <Select 
        value={selectedCompany?.id} 
        onValueChange={(id) => {
          const found = companies.find(c => c.id === id);
          if (found) setSelectedCompany(found);
        }}
      >
        <SelectTrigger className="h-14 w-full bg-primary/5 border-primary/20 hover:bg-primary/10 transition-all rounded-2xl px-5 flex items-center justify-between group">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Building2 className="h-4 w-4 text-primary" />
            </div>
            <div className="flex flex-col items-start overflow-hidden">
              <span className="text-sm font-bold text-foreground truncate w-full text-left">{selectedCompany?.name}</span>
              <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Tenant Admin</span>
            </div>
          </div>
        </SelectTrigger>
        <SelectContent className="rounded-2xl border-border bg-popover shadow-2xl p-2 min-w-[320px]">
          {companies.map((company) => (
            <SelectItem 
              key={company.id} 
              value={company.id}
              className="rounded-xl py-3 px-4 focus:bg-primary/10 focus:text-primary transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-accent flex items-center justify-center shrink-0">
                  <Building2 className="h-4 w-4" />
                </div>
                <span className="font-bold text-sm whitespace-nowrap">{company.name}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
