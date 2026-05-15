"use client"

import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, Download, Search, Paperclip, Briefcase, ShieldCheck } from "lucide-react"
import { Input } from "@/components/ui/input"

const regulations = [
  {
    category: "PERATURAN & KEBIJAKAN",
    icon: ShieldCheck,
    files: [
      "SK KETENTUAN MASUK KERJA.pdf",
      "SK LEMBUR FINAL.pdf",
    ]
  },
  {
    category: "JOB DESCRIPTIONS",
    icon: Briefcase,
    files: [
      "1. SK KADIV PROJECT MATERIAL DAN JASA.docx",
      "2. SK KOORDINATOR LAPANGAN DAN K3.docx",
      "3. SK STAFF K3 AGUNG.docx",
      "4. SK STAFF K3 ANDIKA.docx",
      "5. SK STAFF K3 RYAN.docx",
      "6. SK PENGAWAS LAPANGAN SUHERMAN.docx",
      "7. SK PENGAWAS LAPANGAN SUWANDONO.docx",
      "8. SK PENGAWAS LAPANGAN AGUS WIYANTO.docx",
      "9. SK STAFF PENGADAAN MATERIAL DAN JASA SUPRIYATNA.docx",
      "10. SK STAFF PENGADAAN MATERIAL DAN JASA EDDY JAELANI.docx",
      "11. SK KADIV KEUANGAN DAN ADMINISTRASI FUJIATY.docx",
      "12. SK STAFF SDM IDA.docx",
    ]
  }
]

export default function RegulationsPage() {
  const [search, setSearch] = React.useState("")

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-3">
          <h1 className="text-5xl md:text-6xl font-bold tracking-tighter text-foreground font-serif">HR Regulations</h1>
          <p className="text-muted-foreground text-xl font-medium">Daftar peraturan, kebijakan, dan job description Kowika.</p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground" />
        <Input 
          placeholder="Cari nama dokumen atau peraturan..." 
          className="h-20 pl-16 pr-8 text-xl rounded-3xl bg-card border-border shadow-2xl focus-visible:ring-primary font-medium"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="space-y-16 pb-20">
        {regulations.map((section, idx) => {
          const filteredFiles = section.files.filter(f => f.toLowerCase().includes(search.toLowerCase()));
          if (filteredFiles.length === 0 && search !== "") return null;

          return (
            <div key={idx} className="space-y-8">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-2xl">
                  <section.icon className="h-6 w-6 text-primary" />
                </div>
                <h2 className="text-sm font-bold uppercase tracking-[0.4em] text-primary">{section.category}</h2>
              </div>
              
              <div className="grid gap-4">
                {filteredFiles.map((file, fIdx) => (
                  <Card key={fIdx} className="bg-card border-border hover:border-primary/30 shadow-lg hover:shadow-primary/5 rounded-3xl transition-all group overflow-hidden">
                    <CardContent className="p-0">
                      <div className="flex items-center justify-between p-6 sm:p-8">
                        <div className="flex items-center gap-6 flex-1 min-w-0">
                          <div className="h-14 w-14 flex items-center justify-center bg-accent/30 rounded-2xl group-hover:bg-primary/10 transition-all">
                            <Paperclip className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xl font-bold text-foreground truncate group-hover:text-primary transition-colors">
                              {file}
                            </p>
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1 opacity-60">
                              {file.endsWith('.pdf') ? 'Portable Document Format' : 'Word Document'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Button variant="ghost" className="hidden sm:flex h-14 px-8 rounded-2xl font-bold text-muted-foreground hover:text-foreground hover:bg-accent">
                             Preview
                          </Button>
                          <Button className="h-14 w-14 sm:w-auto sm:px-8 rounded-2xl bg-primary text-primary-foreground hover:opacity-90 transition-all shadow-xl font-bold">
                             <Download className="h-6 w-6 sm:mr-3" />
                             <span className="hidden sm:inline">Download</span>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )
        })}

        {regulations.every(s => s.files.filter(f => f.toLowerCase().includes(search.toLowerCase())).length === 0) && (
          <div className="p-20 text-center space-y-6">
             <div className="inline-flex p-8 bg-accent/20 rounded-full italic"><Search className="h-12 w-12 text-muted-foreground" /></div>
             <p className="text-xl text-muted-foreground font-medium">Tidak ada dokumen yang cocok dengan "{search}"</p>
          </div>
        )}
      </div>
    </div>
  )
}
