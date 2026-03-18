"use client"

import { Barcode, Loader2, Search } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { Input } from "@/components/ui/input"
import { type SearchProduct, searchPublicProducts } from "@/lib/api/product-search"
import { getFullImageUrl } from "@/lib/api/products"
import CategorySelect from "./CategorySelect"

interface MainSearchboxProps {
  className?: string
}

const MainSearchbox = ({ className = "" }: MainSearchboxProps) => {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<SearchProduct[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [imageFallbacks, setImageFallbacks] = useState<Record<string, boolean>>({})
  const dropdownRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const performSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      setShowDropdown(false)
      return
    }

    setIsLoading(true)
    try {
      const results = await searchPublicProducts(query, 0, 20)
      setSearchResults(results)
      setShowDropdown(results.length > 0)
    } catch {
      setSearchResults([])
      setShowDropdown(false)
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchQuery(value)

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    debounceTimerRef.current = setTimeout(() => {
      performSearch(value)
    }, 300)
  }

  return (
    <div className={`flex w-full max-w-2xl mx-auto relative ${className}`}>
      <CategorySelect />
      <div className="flex-1 relative">
        <div className="relative">
          <Input
            ref={inputRef}
            type="text"
            placeholder="Search products, brands, or suppliers..."
            className="rounded-none flex-1 w-full px-4 py-2.5 border-t border-b border-gray-300 focus:outline-none focus:ring-2 focus:ring-steel-blue text-gray-700"
            value={searchQuery}
            onChange={handleInputChange}
            onFocus={() => {
              if (searchResults.length > 0) {
                setShowDropdown(true)
              }
            }}
          />
        </div>

        {showDropdown && (searchResults.length > 0 || isLoading) && (
          <div
            ref={dropdownRef}
            className="absolute z-50 w-full mt-2 bg-white border border-gray-300 rounded-lg shadow-lg max-h-96 overflow-y-auto"
          >
            {searchResults.length > 0 ? (
              <div className="py-2">
                {searchResults.map((product) => (
                  <Link
                    key={product.productId}
                    href={`/products/${product.productId}`}
                    className="block px-4 py-3 hover:bg-gray-50 transition-colors"
                    onClick={() => setShowDropdown(false)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 shrink-0 bg-gray-100 rounded overflow-hidden">
                        <Image
                          src={
                            imageFallbacks[product.productId] || !product.coverPhotoPath
                              ? "/dentypro-product-placeholder.png"
                              : getFullImageUrl(product.coverPhotoPath)
                          }
                          alt={product.productName}
                          width={48}
                          height={48}
                          className="w-full h-full object-cover"
                          onError={() =>
                            setImageFallbacks((prev) => ({
                              ...prev,
                              [product.productId]: true,
                            }))
                          }
                        />
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-steel-blue">{product.productName}</div>
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          {product.barcode && (
                            <>
                              <Barcode className="w-3 h-3" />
                              <span>{product.barcode}</span>
                            </>
                          )}
                        </div>
                        <div className="text-sm font-bold text-steel-blue mt-1">
                          {product.discount > 0 ? (
                            <>
                              <span className="line-through text-gray-400 mr-2">${product.oldPrice}</span>
                              <span>
                                ${product.price} ({product.discount}% discount)
                              </span>
                            </>
                          ) : (
                            <span>${product.price}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-gray-600">No results found</div>
            )}
          </div>
        )}
      </div>
      <button
        type="button"
        className="bg-steel-blue text-white px-5 rounded-r-lg hover:bg-opacity-90 flex items-center justify-center"
      >
        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
      </button>
    </div>
  )
}

export default MainSearchbox
