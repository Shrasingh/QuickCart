"use client"

import { Search } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, FormEvent } from "react"

const SearchBar = () => {
  const router = useRouter()
  const [value, setValue] = useState("")

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    const q = value.trim()
    router.push(q ? `/products?q=${encodeURIComponent(q)}` : "/products")
  }

  return (
    <form
      onSubmit={onSubmit}
      className="hidden md:flex flex-1 max-w-xs mx-4 items-center"
      role="search"
    >
      <div className="relative w-full">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Search products, brands..."
          aria-label="Search products"
          className="w-full rounded-full border border-gray-200 bg-gray-50 py-2 pl-9 pr-4 text-sm outline-none transition focus:border-gray-400 focus:bg-white"
        />
      </div>
    </form>
  )
}

export default SearchBar
