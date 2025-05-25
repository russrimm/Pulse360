'use client'

import { useState, useMemo, useCallback } from 'react'
import { ReleasePlansList } from '@/components/ReleasePlansList'
import { ProductFilter } from '@/components/ProductFilter'
import { SearchBar } from '@/components/SearchBar'
import * as Accordion from '@radix-ui/react-accordion'

interface ReleasePlan {
  id: string
  title: string
  content: string
  product: string
  investmentArea: string
  businessValue: string
  enabledFor: string
  publicPreviewDate: string
  gaDate: string
  publicPreviewWave: string
  gaWave: string
  published: string
  lastUpdated: string
  tags: string[]
  service: string[]
}

export function FabricRoadmapContent({ allPlans }: { allPlans: ReleasePlan[] }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedServices, setSelectedServices] = useState<string[]>([])

  // Build all unique services for the product filter from ProductName in the data
  const allServices = useMemo(() => {
    const set = new Set<string>()
    allPlans.forEach(plan => plan.product && set.add(plan.product))
    const arr = Array.from(set).sort()
    return arr
  }, [allPlans])

  // Filtering logic
  const filterPlans = useCallback((plans: ReleasePlan[]) => {
    return plans.filter(plan => {
      const matchesService =
        selectedServices.length === 0 ||
        selectedServices.some(sel => plan.product?.trim().toLowerCase() === sel.trim().toLowerCase())
      const matchesSearch =
        !searchTerm ||
        plan.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        plan.content.toLowerCase().includes(searchTerm.toLowerCase())
      return matchesService && matchesSearch
    })
  }, [selectedServices, searchTerm])

  // Group plans by product
  const plansByProduct = useMemo(() => {
    const map = new Map<string, ReleasePlan[]>()
    allPlans.forEach(plan => {
      if (!plan.product) return
      if (!map.has(plan.product)) map.set(plan.product, [])
      map.get(plan.product)!.push(plan)
    })
    return map
  }, [allPlans])

  // Only show sections for products with filtered plans
  const visibleSections = Array.from(plansByProduct.entries())
    .map(([product, plans]) => {
      const filtered = filterPlans(plans)
      return { product, plans: filtered }
    })
    .filter(section => section.plans.length > 0)

  return (
    <>
      <div>
        <div className="mb-8">
          <SearchBar
            messages={allPlans}
            onSearch={() => {}}
            searchQuery={searchTerm}
            onSearchQueryChange={setSearchTerm}
          />
          <div className="mt-4">
            <ProductFilter
              services={allServices}
              selectedServices={selectedServices}
              onFilterChange={setSelectedServices}
            />
          </div>
        </div>
        <Accordion.Root type="multiple" defaultValue={visibleSections.map(s => s.product)} className="space-y-4">
          {visibleSections.map(section => (
            <Accordion.Item value={section.product} key={section.product} className="border border-gray-200 dark:border-gray-700 rounded-xl bg-white/80 dark:bg-gray-900/60">
              <Accordion.Header>
                <Accordion.Trigger className="w-full flex justify-between items-center px-6 py-4 text-2xl font-bold text-gray-900 dark:text-white mb-0 focus:outline-none">
                  {section.product}
                  <span className="ml-2 transition-transform group-data-[state=open]:rotate-180">
                    <svg width="20" height="20" fill="none" viewBox="0 0 20 20"><path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </span>
                </Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Content className="px-2 pb-4">
                <ReleasePlansList releasePlans={section.plans} hideFilters={true} drillthroughBasePath="/fabric-roadmap" />
              </Accordion.Content>
            </Accordion.Item>
          ))}
        </Accordion.Root>
      </div>
    </>
  )
} 