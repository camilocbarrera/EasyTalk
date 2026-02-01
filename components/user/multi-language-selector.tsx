"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  SUPPORTED_LANGUAGES,
  type LanguageCode,
} from "@/lib/constants/languages";
import { LANGUAGE_FLAGS } from "@/components/chat/language-badge";
import { X, Plus, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

interface MultiLanguageSelectorProps {
  value: LanguageCode[];
  onChange: (languages: LanguageCode[]) => void;
  disabled?: boolean;
  maxLanguages?: number;
}

export function MultiLanguageSelector({
  value,
  onChange,
  disabled,
  maxLanguages = 3,
}: MultiLanguageSelectorProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [showAddSelect, setShowAddSelect] = useState(false);

  const handleRemove = (languageToRemove: LanguageCode) => {
    if (value.length <= 1) return;
    onChange(value.filter((lang) => lang !== languageToRemove));
  };

  const handleAdd = (language: LanguageCode) => {
    if (value.includes(language) || value.length >= maxLanguages) return;
    onChange([...value, language]);
    setShowAddSelect(false);
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newValue = [...value];
    const draggedItem = newValue[draggedIndex];
    newValue.splice(draggedIndex, 1);
    newValue.splice(index, 0, draggedItem);
    onChange(newValue);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const availableLanguages = Object.entries(SUPPORTED_LANGUAGES).filter(
    ([code]) => !value.includes(code as LanguageCode)
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {value.map((lang, index) => (
          <div
            key={lang}
            draggable={!disabled && value.length > 1}
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnd={handleDragEnd}
            className={cn(
              "flex items-center gap-1 rounded-full border bg-background px-3 py-1.5 text-sm transition-all",
              draggedIndex === index && "opacity-50",
              !disabled && value.length > 1 && "cursor-grab active:cursor-grabbing"
            )}
          >
            {!disabled && value.length > 1 && (
              <GripVertical className="h-3 w-3 text-muted-foreground" />
            )}
            <span>{LANGUAGE_FLAGS[lang]}</span>
            <span>{SUPPORTED_LANGUAGES[lang]}</span>
            {index === 0 && (
              <span className="text-xs text-muted-foreground ml-1">
                (primary)
              </span>
            )}
            {!disabled && value.length > 1 && (
              <button
                type="button"
                onClick={() => handleRemove(lang)}
                className="ml-1 rounded-full p-0.5 hover:bg-muted transition-colors"
              >
                <X className="h-3 w-3 text-muted-foreground" />
              </button>
            )}
          </div>
        ))}

        {value.length < maxLanguages && !disabled && (
          <>
            {showAddSelect ? (
              <Select
                onValueChange={(v) => handleAdd(v as LanguageCode)}
                open={showAddSelect}
                onOpenChange={setShowAddSelect}
              >
                <SelectTrigger className="h-8 w-[160px] rounded-full border-dashed">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  {availableLanguages.map(([code, name]) => (
                    <SelectItem key={code} value={code}>
                      <span className="flex items-center gap-2">
                        <span>{LANGUAGE_FLAGS[code as LanguageCode]}</span>
                        <span>{name}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowAddSelect(true)}
                className="h-8 rounded-full border-dashed"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add language
              </Button>
            )}
          </>
        )}
      </div>

      {value.length > 1 && !disabled && (
        <p className="text-xs text-muted-foreground">
          Drag to reorder. First language is your primary preference.
        </p>
      )}
    </div>
  );
}
