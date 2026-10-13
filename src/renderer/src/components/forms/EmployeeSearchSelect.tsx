import React, { useState, useEffect, useRef } from 'react'
import { Combobox } from '@headlessui/react'
import { Check, ChevronsUpDown, Search } from 'lucide-react'
import { cn } from '../../lib/utils'

interface Employee {
    id: number
    full_name: string
    name?: string
    employee_no: string | number
    job_title?: string
}

interface EmployeeSearchSelectProps {
    onSelect: (employee: Employee | null) => void
    selectedId?: number | null
    label?: string
    placeholder?: string
    error?: string
    className?: string
}

export function EmployeeSearchSelect({
    onSelect,
    selectedId,
    label = 'الموظف',
    placeholder = 'ابحث بالاسم أو الرقم...',
    error,
    className
}: EmployeeSearchSelectProps) {
    const [query, setQuery] = useState('')
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
    const [options, setOptions] = useState<Employee[]>([])
    const [loading, setLoading] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)

    // Load all employees on mount (so dropdown is usable without typing)
    useEffect(() => {
        const loadAll = async () => {
            try {
                const results = await window.electronAPI.searchEmployees('')
                setOptions(results || [])
            } catch (err) {
                console.error('Initial employee load failed:', err)
            }
        }
        loadAll()
    }, [])

    // Debounced search when user types
    useEffect(() => {
        const timeoutId = setTimeout(async () => {
            setLoading(true)
            try {
                const results = await window.electronAPI.searchEmployees(query)
                setOptions(results || [])
            } catch (err) {
                console.error('Search failed:', err)
                setOptions([])
            } finally {
                setLoading(false)
            }
        }, 300)

        return () => clearTimeout(timeoutId)
    }, [query])

    // Fetch employee when selectedId changes (including when editing different record)
    useEffect(() => {
        if (!selectedId) {
            setSelectedEmployee(null)
            return
        }
        const fetchInitial = async () => {
            try {
                const emp = await window.electronAPI.getEmployee(selectedId)
                if (emp) setSelectedEmployee(emp)
                else setSelectedEmployee(null)
            } catch (e) {
                console.error(e)
                setSelectedEmployee(null)
            }
        }
        fetchInitial()
    }, [selectedId])

    return (
        <div className={cn("w-full relative", className)} dir="rtl">
            {label && (
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    {label}
                </label>
            )}
            <Combobox
                value={selectedEmployee}
                onChange={(emp) => {
                    setSelectedEmployee(emp)
                    onSelect(emp)
                }}
                nullable
            >
                <div className="relative mt-1">
                    <div className="relative w-full cursor-default overflow-hidden rounded-lg bg-white text-right shadow-sm border border-gray-300 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 sm:text-sm">
                        <Combobox.Input
                            className="w-full border-none py-2 pl-3 pr-10 text-sm leading-5 text-gray-900 focus:ring-0"
                            displayValue={(emp: any) => emp ? `${emp.full_name || emp.name || ''} (${emp.employee_no})` : ''}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder={placeholder}
                        />
                        <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
                            <ChevronsUpDown
                                className="h-5 w-5 text-gray-400"
                                aria-hidden="true"
                            />
                        </Combobox.Button>
                    </div>
                    <Combobox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm z-50">
                        {loading ? (
                            <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
                                جاري البحث...
                            </div>
                        ) : options.length === 0 && query !== '' ? (
                            <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
                                لا توجد نتائج
                            </div>
                        ) : (
                            options.map((person) => (
                                <Combobox.Option
                                    key={person.id}
                                    className={({ active }) =>
                                        `relative cursor-default select-none py-2 pl-10 pr-4 ${active ? 'bg-blue-100 text-blue-900' : 'text-gray-900'
                                        }`
                                    }
                                    value={person}
                                >
                                    {({ selected, active }) => (
                                        <>
                                            <span
                                                className={`block truncate text-right ${selected ? 'font-medium' : 'font-normal'
                                                    }`}
                                            >
                                                {person.full_name || person.name} <span className="text-gray-500 text-xs mr-2">#{person.employee_no}</span>
                                            </span>
                                            {selected ? (
                                                <span
                                                    className={`absolute inset-y-0 left-0 flex items-center pl-3 ${active ? 'text-blue-600' : 'text-blue-600'
                                                        }`}
                                                >
                                                    <Check className="h-5 w-5" aria-hidden="true" />
                                                </span>
                                            ) : null}
                                        </>
                                    )}
                                </Combobox.Option>
                            ))
                        )}
                    </Combobox.Options>
                </div>
            </Combobox>
            {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
        </div>
    )
}
