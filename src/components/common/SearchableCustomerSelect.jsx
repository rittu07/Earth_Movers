import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, UserPlus, Check } from 'lucide-react';

const SearchableCustomerSelect = ({
  customers = [],
  selectedCustomerId = '',
  onChange,
  onAddNew,
  getCustomerExtra,
  placeholder = "Search or Select Customer",
  className = "",
  inputClassName = "",
  showAddOption = true
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const containerRef = useRef(null);

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);

  // Sync query string with current selection when not actively typing or focused
  useEffect(() => {
    if (!isFocused) {
      if (selectedCustomer) {
        const extra = getCustomerExtra ? getCustomerExtra(selectedCustomer) : '';
        const phoneText = selectedCustomer.phone ? ` (${selectedCustomer.phone})` : '';
        const extraText = extra ? ` — ${extra}` : '';
        setQuery(`${selectedCustomer.name}${phoneText}${extraText}`);
      } else {
        setQuery('');
      }
    }
  }, [selectedCustomerId, selectedCustomer, isFocused, getCustomerExtra]);

  // Handle click outside component
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        setIsFocused(false);
        if (selectedCustomer) {
          const extra = getCustomerExtra ? getCustomerExtra(selectedCustomer) : '';
          const phoneText = selectedCustomer.phone ? ` (${selectedCustomer.phone})` : '';
          const extraText = extra ? ` — ${extra}` : '';
          setQuery(`${selectedCustomer.name}${phoneText}${extraText}`);
        } else {
          setQuery('');
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selectedCustomer, getCustomerExtra]);

  // Filter customers based on search query
  const filteredCustomers = customers.filter((c) => {
    if (!query) return true;
    if (
      selectedCustomer &&
      query ===
        `${selectedCustomer.name}${selectedCustomer.phone ? ` (${selectedCustomer.phone})` : ''}${
          getCustomerExtra ? ` — ${getCustomerExtra(selectedCustomer)}` : ''
        }`
    ) {
      return true;
    }
    const q = query.trim().toLowerCase();
    return (
      (c.name && c.name.toLowerCase().includes(q)) ||
      (c.phone && c.phone.toLowerCase().includes(q))
    );
  });

  const handleSelect = (custId) => {
    if (custId === '__new__') {
      if (onAddNew) onAddNew();
      else if (onChange) onChange('__new__');
    } else {
      if (onChange) onChange(custId);
    }
    setIsOpen(false);
    setIsFocused(false);
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <div className="relative">
        <input
          type="text"
          value={query}
          onFocus={() => {
            setIsFocused(true);
            setIsOpen(true);
          }}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          placeholder={placeholder}
          className={
            inputClassName ||
            "w-full p-2.5 pr-9 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:outline-hidden focus:border-indigo-500 shadow-2xs"
          }
        />
        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center text-slate-400 pointer-events-none">
          <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180 text-indigo-600' : ''}`} />
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1 max-h-60 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-xl animate-in fade-in slide-in-from-top-1 duration-150">
          {showAddOption && (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleSelect('__new__')}
              className="w-full text-left px-3.5 py-2.5 bg-indigo-50/80 hover:bg-indigo-100 text-indigo-700 font-extrabold text-xs border-b border-indigo-100 flex items-center gap-2 cursor-pointer transition-colors"
            >
              <UserPlus className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>+ Add New Customer</span>
            </button>
          )}

          {filteredCustomers.length === 0 ? (
            <div className="px-4 py-3 text-xs text-slate-400 text-center font-bold">
              No matching customers found
            </div>
          ) : (
            filteredCustomers.map((cust) => {
              const isSelected = cust.id === selectedCustomerId;
              const extra = getCustomerExtra ? getCustomerExtra(cust) : '';

              return (
                <div
                  key={cust.id}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleSelect(cust.id)}
                  className={`px-3.5 py-2.5 text-xs flex items-center justify-between cursor-pointer transition-colors border-b border-slate-50 last:border-0 ${
                    isSelected ? 'bg-indigo-50 text-indigo-900 font-extrabold' : 'hover:bg-slate-50 text-slate-800 font-medium'
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-slate-900">{cust.name}</span>
                    <span className="text-[11px] text-slate-500 font-semibold">
                      Phone: {cust.phone || 'N/A'} {extra ? ` • ${extra}` : ''}
                    </span>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-indigo-600 shrink-0" />}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default SearchableCustomerSelect;
