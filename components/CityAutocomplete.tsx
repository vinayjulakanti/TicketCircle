
"use client";

import { useEffect, useRef, useState } from "react";

const CITIES = [
  "Agra",
  "Ahmedabad",
  "Ajmer",
  "Amaravati",
  "Amritsar",
  "Anantapur",
  "Bengaluru",
  "Bhopal",
  "Bhubaneswar",
  "Chandigarh",
  "Chennai",
  "Coimbatore",
  "Delhi",
  "Eluru",
  "Goa",
  "Guntur",
  "Gudur",
  "Guwahati",
  "Gwalior",
  "Hyderabad",
  "Indore",
  "Jaipur",
  "Jammu",
  "Jodhpur",
  "Kadapa",
  "Kakinada",
  "Kannur",
  "Kanpur",
  "Kochi",
  "Kolkata",
  "Kollam",
  "Kota",
  "Kozhikode",
  "Lucknow",
  "Madurai",
  "Mangaluru",
  "Mumbai",
  "Mysuru",
  "Nellore",
  "Noida",
  "Ongole",
  "Patna",
  "Pune",
  "Rajahmundry",
  "Ranchi",
  "Salem",
  "Surat",
  "Tirupati",
  "Tiruppur",
  "Trichy",
  "Trivandrum",
  "Udaipur",
  "Vadodara",
  "Varanasi",
  "Vijayawada",
  "Visakhapatnam",
  "Vizianagaram",
  "Warangal",
];

type Props = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
};

export default function CityAutocomplete({
  id,
  label,
  value,
  onChange,
  placeholder = "Type a city name...",
  required = false,
  className = "",
}: Props) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const suggestions =
    value.trim().length === 0
      ? []
      : CITIES.filter((city) =>
          city.toLowerCase().startsWith(value.trim().toLowerCase())
        ).slice(0, 8);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
        setActiveIndex(-1);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  function chooseCity(city: string) {
    onChange(city);
    setOpen(false);
    setActiveIndex(-1);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || suggestions.length === 0) {
      if (event.key === "ArrowDown" && suggestions.length > 0) {
        setOpen(true);
        setActiveIndex(0);
      }
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((previous) =>
        previous < suggestions.length - 1 ? previous + 1 : 0
      );
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((previous) =>
        previous > 0 ? previous - 1 : suggestions.length - 1
      );
    } else if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();
      chooseCity(suggestions[activeIndex]);
    } else if (event.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
    }
  }

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <label
        htmlFor={id}
        className="mb-2 block text-sm font-semibold text-slate-700"
      >
        {label}
      </label>

      <input
        id={id}
        type="text"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={open && suggestions.length > 0}
        aria-controls={`${id}-suggestions`}
        aria-activedescendant={
          activeIndex >= 0 ? `${id}-option-${activeIndex}` : undefined
        }
        required={required}
        autoComplete="off"
        value={value}
        placeholder={placeholder}
        onFocus={() => setOpen(true)}
        onChange={(event) => {
          onChange(event.target.value);
          setOpen(true);
          setActiveIndex(-1);
        }}
        onKeyDown={handleKeyDown}
        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"
      />

      {open && suggestions.length > 0 && (
        <ul
          id={`${id}-suggestions`}
          role="listbox"
          className="absolute z-50 mt-2 max-h-64 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white py-2 shadow-xl"
        >
          {suggestions.map((city, index) => (
            <li
              key={city}
              id={`${id}-option-${index}`}
              role="option"
              aria-selected={index === activeIndex}
            >
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => chooseCity(city)}
                className={`w-full px-4 py-3 text-left text-sm transition hover:bg-indigo-50 hover:text-indigo-700 ${
                  index === activeIndex
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-slate-700"
                }`}
              >
                <span className="mr-3 text-slate-400">⌕</span>
                {city}
              </button>
            </li>
          ))}
        </ul>
      )}

      {open &&
        value.trim().length > 0 &&
        suggestions.length === 0 && (
          <div className="absolute z-50 mt-2 w-full rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500 shadow-lg">
            No matching city in this suggestion list. You can still enter the
            city name manually.
          </div>
        )}
    </div>
  );
}
