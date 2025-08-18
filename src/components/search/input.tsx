"use client"

import { useRef, useCallback } from "react"
import { Search } from "lucide-react"
import { motion } from "framer-motion"

interface SearchInputProps {
  query: string
  setQuery: (query: string) => void
  isActive: boolean
  setIsActive: (active: boolean) => void
  isSearching: boolean
  onSearch: (searchQuery?: string) => void
}

export default function SearchInput({
  query,
  setQuery,
  isActive,
  setIsActive,
  isSearching,
  onSearch
}: SearchInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)


  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSearch()
    }
  }, [onSearch])

  return (
    <div className="relative">
      <motion.div className={`relative transition-all duration-300 ${isActive ? "scale-105" : "scale-100"}`}>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsActive(true)}
          onBlur={() => {

            setTimeout(() => {
              if (document.activeElement !== inputRef.current) {
                setIsActive(false)
              }
            }, 150)
          }}
          onKeyDown={handleKeyPress}
          placeholder="Search blocks, transactions, rollups..."
          className={`w-full h-16 pl-16 pr-6 text-lg bg-white text-gray-900 placeholder:text-gray-400 border border-gray-200 focus:border-gray-400 focus:outline-none transition-all duration-200 shadow-sm hover:shadow-md focus:shadow-lg ${
            isSearching ? 'pr-12' : ''
          }`}
        />
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
        {isSearching && (
          <div className="absolute right-5 top-1/2 -translate-y-1/2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-400"></div>
          </div>
        )}
      </motion.div>
    </div>
  )
}