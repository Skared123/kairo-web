"use client";

import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, type KeyboardEvent } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { MAX_SKILL_NAME, MAX_SKILLS, skillKey } from "@/lib/forms/learning-schema";

/**
 * The skills of a learning item, as names (API decision 040). Enter, a comma or leaving the field adds what was typed;
 * a name that matches one of the user's skills takes that skill's spelling, so no near-duplicates are made. Backspace
 * in the empty field removes the last one.
 */
export function SkillsInput({
  id,
  value,
  onChange,
  onBlur,
  suggestions,
  invalid,
}: {
  id: string;
  value: string[];
  onChange: (skills: string[]) => void;
  onBlur?: () => void;
  /** The user's existing skills, by name. */
  suggestions: string[];
  invalid?: boolean;
}) {
  const t = useTranslations("LearningForm.skills");
  const [text, setText] = useState("");
  const chosen = new Set(value.map(skillKey));
  const offered = suggestions.filter((name) => !chosen.has(skillKey(name)));

  function add() {
    const key = skillKey(text);
    setText("");
    if (!key || chosen.has(key) || value.length >= MAX_SKILLS) {
      return;
    }
    const existing = suggestions.find((name) => skillKey(name) === key);
    onChange([...value, existing ?? text.trim().replace(/\s+/g, " ")]);
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === ",") {
      // Enter would submit the form; here it adds the skill.
      event.preventDefault();
      add();
    } else if (event.key === "Backspace" && text === "" && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {value.length > 0 && (
        <ul className="flex flex-wrap gap-1.5" aria-label={t("chosen")}>
          {value.map((name) => (
            <li key={skillKey(name)}>
              <Badge variant="secondary" className="gap-1 pr-1">
                {name}
                <button
                  type="button"
                  onClick={() => onChange(value.filter((other) => other !== name))}
                  aria-label={t("remove", { name })}
                  className="rounded-sm p-0.5 hover:bg-muted-foreground/20"
                >
                  <X className="size-3" aria-hidden />
                </button>
              </Badge>
            </li>
          ))}
        </ul>
      )}
      <Input
        id={id}
        list={`${id}-suggestions`}
        value={text}
        maxLength={MAX_SKILL_NAME}
        onChange={(event) => setText(event.target.value)}
        onKeyDown={onKeyDown}
        onBlur={() => {
          add();
          onBlur?.();
        }}
        placeholder={t("placeholder")}
        autoComplete="off"
        aria-invalid={invalid}
        disabled={value.length >= MAX_SKILLS}
      />
      <datalist id={`${id}-suggestions`}>
        {offered.map((name) => (
          <option key={skillKey(name)} value={name} />
        ))}
      </datalist>
    </div>
  );
}
