/**
 * Composant de recherche d'étudiant avec filtre texte
 * Usage : remplace le Select pour les listes d'étudiants longues
 */

import { useState, useMemo, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, X, User, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Student {
  id: number;
  matricule: string;
  firstName: string;
  lastName: string;
  Group?: { name: string };
}

interface StudentSearchProps {
  students: Student[];
  value: string;
  onChange: (studentId: string) => void;
  placeholder?: string;
  className?: string;
  clearable?: boolean;
}

export function StudentSearch({
  students,
  value,
  onChange,
  placeholder = "Rechercher un étudiant (nom, prénom, matricule)...",
  className,
  clearable = true,
}: StudentSearchProps) {
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Trouver l'étudiant sélectionné
  const selectedStudent = useMemo(() => {
    if (!value) return null;
    return students.find((s) => String(s.id) === value);
  }, [students, value]);

  // Filtrer les étudiants
  const filteredStudents = useMemo(() => {
    if (!search.trim()) return students.slice(0, 50); // Limite initiale pour perf
    const query = search.toLowerCase().trim();
    return students.filter((s) =>
      s.firstName.toLowerCase().includes(query) ||
      s.lastName.toLowerCase().includes(query) ||
      s.matricule.toLowerCase().includes(query) ||
      `${s.firstName} ${s.lastName}`.toLowerCase().includes(query) ||
      `${s.lastName} ${s.firstName}`.toLowerCase().includes(query)
    ).slice(0, 50); // Limite pour éviter lag
  }, [students, search]);

  // Fermer au clic extérieur
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (studentId: string) => {
    onChange(studentId);
    setIsOpen(false);
    setSearch("");
  };

  const handleClear = () => {
    onChange("");
    setSearch("");
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {/* Input de recherche ou affichage sélection */}
      <div className="relative">
        {selectedStudent ? (
          <div className="flex items-center gap-2 p-2 border rounded-md bg-muted/50">
            <div className="flex-1 flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <div className="flex flex-col">
                <span className="font-medium text-sm">
                  {selectedStudent.firstName} {selectedStudent.lastName}
                </span>
                <span className="text-xs text-muted-foreground">
                  {selectedStudent.matricule} • {selectedStudent.Group?.name}
                </span>
              </div>
            </div>
            {clearable && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={handleClear}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        ) : (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
              placeholder={placeholder}
              className="pl-9"
            />
          </div>
        )}
      </div>

      {/* Liste déroulante */}
      {isOpen && !selectedStudent && (
        <div className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg max-h-72 overflow-auto">
          {filteredStudents.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground text-sm">
              Aucun étudiant trouvé
            </div>
          ) : (
            <div className="py-1">
              <div className="px-3 py-2 text-xs text-muted-foreground border-b">
                {filteredStudents.length} résultat(s) • Tapez pour filtrer
              </div>
              {filteredStudents.map((student) => (
                <button
                  key={student.id}
                  className={cn(
                    "w-full px-3 py-2 text-left hover:bg-muted transition-colors flex items-center gap-3",
                    String(student.id) === value && "bg-primary/10"
                  )}
                  onClick={() => handleSelect(String(student.id))}
                >
                  <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">
                      {student.firstName} {student.lastName}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{student.matricule}</span>
                      {student.Group && (
                        <>
                          <span>•</span>
                          <Badge variant="outline" className="text-xs">
                            {student.Group.name}
                          </Badge>
                        </>
                      )}
                    </div>
                  </div>
                  {String(student.id) === value && (
                    <Check className="h-4 w-4 text-primary flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
