import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'

export function PostCardSkeleton() {
    return (
        <Card className="w-full border-gray-200">
            <CardHeader className="flex flex-row items-center gap-3 p-4 pb-2">
                <Skeleton className="w-9 h-9 rounded-full" />
                <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                </div>
            </CardHeader>
            <CardContent className="p-4 pt-1">
                <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                </div>
            </CardContent>
            <CardFooter className="flex gap-4 p-4 pt-0">
                <Skeleton className="h-7 w-16" />
                <Skeleton className="h-7 w-16" />
            </CardFooter>
        </Card>
    )
}
