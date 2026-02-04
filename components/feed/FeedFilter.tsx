'use client'

import { useState } from 'react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface FeedFilterProps {
    onFilterChange: (filter: 'new' | 'hot' | 'controversial' | 'top') => void
    currentFilter: 'new' | 'hot' | 'controversial' | 'top'
}

export function FeedFilter({ onFilterChange, currentFilter }: FeedFilterProps) {
    return (
        <Tabs value={currentFilter} onValueChange={(value) => onFilterChange(value as any)}>
            <TabsList className="grid w-full grid-cols-4 bg-gray-100/50 p-1 rounded-xl">
                <TabsTrigger value="hot" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm font-bold text-xs uppercase tracking-wider">Hot</TabsTrigger>
                <TabsTrigger value="new" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm font-bold text-xs uppercase tracking-wider">New</TabsTrigger>
                <TabsTrigger value="controversial" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm font-bold text-xs uppercase tracking-wider">Controversial</TabsTrigger>
                <TabsTrigger value="top" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm font-bold text-xs uppercase tracking-wider">Top</TabsTrigger>
            </TabsList>
        </Tabs>
    )
}
