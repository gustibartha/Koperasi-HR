"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { getCompanies } from "@/app/actions/company";

interface Company {
  id: string;
  name: string;
  logo: string | null;
  address: string | null;
}

interface CompanyContextType {
  selectedCompany: Company | null;
  setSelectedCompany: (company: Company) => void;
  companies: Company[];
  isLoading: boolean;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export function CompanyProvider({ children }: { children: React.ReactNode }) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompanyState] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function init() {
      const res = await getCompanies();
      if (res.success && res.data) {
        setCompanies(res.data);
        
        // Try to load from localStorage or default to the first one
        const savedId = localStorage.getItem("selectedCompanyId");
        const found = res.data.find(c => c.id === savedId);
        
        if (found) {
          setSelectedCompanyState(found);
        } else if (res.data.length > 0) {
          setSelectedCompanyState(res.data[0]);
          localStorage.setItem("selectedCompanyId", res.data[0].id);
        }
      }
      setIsLoading(false);
    }
    init();
  }, []);

  const setSelectedCompany = (company: Company) => {
    setSelectedCompanyState(company);
    localStorage.setItem("selectedCompanyId", company.id);
  };

  return (
    <CompanyContext.Provider value={{ selectedCompany, setSelectedCompany, companies, isLoading }}>
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompany() {
  const context = useContext(CompanyContext);
  if (context === undefined) {
    throw new Error("useCompany must be used within a CompanyProvider");
  }
  return context;
}
