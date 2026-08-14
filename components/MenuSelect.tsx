"use client";

import { useEffect, useRef, useState, ReactNode } from "react";

export interface MenuOption<T extends string = string> {
  value: T;
  title: string;
  description?: string;
  label?: string;
  icon?: ReactNode;
}

interface MenuSelectProps<T extends string> {
  title?: string;
  value: T;
  options: readonly MenuOption<T>[] | MenuOption<T>[];
  onChange: (value: T) => void;
  renderTrigger?: (selectedOption: MenuOption<T>) => ReactNode;
  renderOptionIcon?: (option: MenuOption<T>) => ReactNode;
  className?: string;
}

export default function MenuSelect<T extends string>({
  title,
  value,
  options,
  onChange,
  renderTrigger,
  renderOptionIcon,
  className = "",
}: MenuSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((item) => item.value === value) ?? options[0];

  return (
    <div ref={wrapperRef} style={{ position: "relative", display: "inline-block" }}>
      <button
        type="button"
        className={`kill-styling ${className} ${isOpen ? "clicked" : ""}`}
        onClick={() => setIsOpen((prev) => !prev)}
      >
        {renderTrigger ? renderTrigger(selectedOption) : (selectedOption.label ?? selectedOption.title)}
      </button>

      <div className={`menu ${className}-options ${isOpen ? "visible" : ""}`}>
        {title && <div className="menu-title">{title}</div>}
        {options.map((item) => (
          <div
            key={item.value}
            onClick={() => {
              onChange(item.value);
              setIsOpen(false);
            }}
            className="menu-option"
          >
            {(renderOptionIcon || item.icon) && (
              <div className="menu-option-icon">
                {renderOptionIcon ? renderOptionIcon(item) : item.icon}
              </div>
            )}
            <div>
              <div className="menu-option-label">{item.title}</div>
              {item.description && <div className="menu-option-desc">{item.description}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}