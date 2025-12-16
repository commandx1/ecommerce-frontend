"use client"

import { Barcode, Loader2, Search, ShieldCheck } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { Input } from "@/components/ui/input"
import { getFullImageUrl } from "@/lib/api/products"

interface SearchProduct {
  productId: string
  productName: string
  barcode: string
  coverPhotoPath: string | null
  secureCode: string
  manufacturerCode: string
  reorderId: string | null
  referanceNumber: string | null
  userId: string
  price: number
  oldPrice: number
  discount: number
  stock: number
}

interface SearchResponse {
  content: SearchProduct[]
  pageable: {
    pageNumber: number
    pageSize: number
    sort: {
      empty: boolean
      unsorted: boolean
      sorted: boolean
    }
    offset: number
    unpaged: boolean
    paged: boolean
  }
  last: boolean
  totalPages: number
  totalElements: number
  size: number
  number: number
  sort: {
    empty: boolean
    unsorted: boolean
    sorted: boolean
  }
  numberOfElements: number
  first: boolean
  empty: boolean
}

const HeroSection = () => {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<SearchProduct[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
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
      const response = await fetch(`/api/products/public-search?Search=${encodeURIComponent(query)}&page=0&size=20`)
      if (response.ok) {
        const data: SearchResponse = await response.json()
        setSearchResults(data.content || [])
        setShowDropdown(true)
      } else {
        setSearchResults([])
        setShowDropdown(false)
      }
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
    <section id="hero-section" className="bg-linear-to-br from-steel-blue to-blue-800 py-8 flex items-center">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="text-white">
            <h1 className="text-5xl lg:text-6xl font-bold leading-tight mb-6">
              Professional Dental
              <span className="text-pale-lime">Supplies</span>
              <br />
              &amp; Equipment
            </h1>
            <p className="text-xl text-blue-100 mb-8 leading-relaxed">
              Connect with verified suppliers, access competitive pricing, and streamline your dental practice
              procurement with our comprehensive B2B marketplace.
            </p>
            <div className="bg-white rounded-xl p-6 shadow-2xl relative">
              <div className="flex items-center">
                <div className="flex-1 relative">
                  <div className="relative">
                    <Input
                      ref={inputRef}
                      type="text"
                      placeholder="Search products, brands, or suppliers..."
                      className="w-full pl-4 pr-12 py-6 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-steel-blue text-gray-700"
                      value={searchQuery}
                      onChange={handleInputChange}
                      onFocus={() => {
                        if (searchResults.length > 0) {
                          setShowDropdown(true)
                        }
                      }}
                    />
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 text-gray-400 animate-spin absolute right-4 top-1/2 -translate-y-1/2" />
                    ) : (
                      <Search className="w-5 h-5 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2" />
                    )}
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
                                {product.coverPhotoPath && (
                                  <div className="w-12 h-12 shrink-0 bg-gray-100 rounded overflow-hidden">
                                    <Image
                                      src={getFullImageUrl(product.coverPhotoPath)}
                                      alt={product.productName}
                                      width={48}
                                      height={48}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                )}
                                <div className="flex-1">
                                  <div className="font-semibold text-steel-blue">{product.productName}</div>
                                  <div className="flex items-center gap-1 text-sm text-gray-600">
                                    {product.barcode && (
                                      <>
                                        <Barcode />
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
              </div>
              <div className="flex flex-wrap gap-2 mt-4">
                <span className="text-sm text-gray-600">Popular searches:</span>
                <button type="button" className="text-sm text-steel-blue hover:underline">
                  Dental Implants
                </button>
                <span className="text-gray-300">•</span>
                <button type="button" className="text-sm text-steel-blue hover:underline">
                  Composite Resins
                </button>
                <span className="text-gray-300">•</span>
                <button type="button" className="text-sm text-steel-blue hover:underline">
                  X-Ray Equipment
                </button>
                <span className="text-gray-300">•</span>
                <button type="button" className="text-sm text-steel-blue hover:underline">
                  Orthodontic Supplies
                </button>
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="h-96 overflow-hidden rounded-2xl shadow-2xl">
              <Image
                src="/heroSectionChair.png"
                alt="modern dental office with advanced equipment, professional dentist working, clean white environment, high-tech dental chair and tools"
                className="w-full h-full object-cover"
                width={500}
                height={500}
              />
            </div>
            <div className="absolute -bottom-6 -left-6 bg-white rounded-xl p-4 shadow-xl">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-pale-lime rounded-lg flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4 text-steel-blue" />
                </div>
                <div>
                  <div className="font-semibold text-steel-blue">Verified Suppliers</div>
                  <div className="text-sm text-gray-600">Licensed &amp; Certified</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default HeroSection
