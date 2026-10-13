import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Search, X, User } from 'lucide-react'
import { EmployeeLite } from '../../types/employee'

interface EmployeeSelectProps {
  value?: EmployeeLite | null
  onChange: (employee: EmployeeLite | null) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

const EmployeeSelect: React.FC<EmployeeSelectProps> = ({
  value,
  onChange,
  placeholder = "ابحث عن الموظف بالاسم",
  disabled = false,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [employees, setEmployees] = useState<EmployeeLite[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<NodeJS.Timeout>()

  // Debounced search function
  const searchEmployees = useCallback(async (query: string) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    debounceRef.current = setTimeout(async () => {
      try {
        setLoading(true)
        const results = await window.electronAPI.searchEmployees(query, 20)
        setEmployees(results)
      } catch (error) {
        console.error('Failed to search employees:', error)
        setEmployees([])
      } finally {
        setLoading(false)
      }
    }, 300)
  }, [])

  // Search when query changes
  useEffect(() => {
    if (isOpen) {
      searchEmployees(searchQuery)
    }
  }, [searchQuery, isOpen, searchEmployees])

  // Handle input focus
  const handleFocus = () => {
    setIsOpen(true)
    setSelectedIndex(-1)
    if (!searchQuery) {
      searchEmployees('')
    }
  }

  // Handle input blur (with delay to allow clicks)
  const handleBlur = () => {
    setTimeout(() => {
      setIsOpen(false)
      setSelectedIndex(-1)
    }, 150)
  }

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value
    setSearchQuery(query)
    setSelectedIndex(-1)
  }

  // Handle employee selection
  const handleSelect = (employee: EmployeeLite) => {
    onChange(employee)
    setSearchQuery('')
    setIsOpen(false)
    setSelectedIndex(-1)
    inputRef.current?.blur()
  }

  // Handle clear selection
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange(null)
    setSearchQuery('')
    setSelectedIndex(-1)
    inputRef.current?.focus()
  }

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev < employees.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1)
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && employees[selectedIndex]) {
          handleSelect(employees[selectedIndex])
        }
        break
      case 'Escape':
        setIsOpen(false)
        setSelectedIndex(-1)
        inputRef.current?.blur()
        break
    }
  }

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSelectedIndex(-1)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className={`relative ${className}`} dir="rtl">
      {/* Selected employee chip or search input */}
      {value ? (
        <div className="flex items-center gap-2 p-3 border border-gray-300 rounded-md bg-white">
          <User className="w-4 h-4 text-gray-500" />
          <div className="flex-1 text-right">
            <div className="font-medium text-gray-900">{value.full_name}</div>
            {value.job_title && (
              <div className="text-sm text-gray-500">{value.job_title}</div>
            )}
          </div>
          {!disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="مسح الاختيار"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          )}
        </div>
      ) : (
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={handleInputChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
            autoComplete="off"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        </div>
      )}

      {/* Dropdown */}
      {isOpen && !value && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto"
        >
          {loading ? (
            <div className="p-3 text-center text-gray-500">
              جاري البحث...
            </div>
          ) : employees.length > 0 ? (
            employees.map((employee, index) => (
              <button
                key={employee.id}
                type="button"
                onClick={() => handleSelect(employee)}
                className={`w-full p-3 text-right hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors ${
                  index === selectedIndex ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">
                      {employee.full_name}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      {employee.employee_no && (
                        <span>#{employee.employee_no}</span>
                      )}
                      {employee.job_title && (
                        <span>{employee.job_title}</span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            ))
          ) : searchQuery ? (
            <div className="p-3 text-center text-gray-500">
              لا توجد نتائج للبحث "{searchQuery}"
            </div>
          ) : (
            <div className="p-3 text-center text-gray-500">
              ابدأ بكتابة اسم الموظف للبحث
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default EmployeeSelect
