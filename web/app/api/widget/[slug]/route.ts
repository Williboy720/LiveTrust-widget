import { NextResponse } from 'next/server'
import demoData from '@/data/demo.json'
import ulavalData from '@/data/ulaval.json'
import ndgData from '@/data/ndg.json'
import urbainsData from '@/data/urbains.json'
import etudiantQcData from '@/data/etudiant_qc.json'

// Forces the route to be dynamic to handle the [slug] param correctly
export const dynamic = 'force-dynamic'

const dataMap: Record<string, any> = {
    'demo': demoData,
    'ulaval': ulavalData,
    'ndg': ndgData,
    'urbains': urbainsData,
    'etudiant_qc': etudiantQcData
}

export async function GET(
    request: Request,
    { params }: { params: { slug: string } }
) {
    const slug = params.slug
    const data = dataMap[slug]

    if (data) {
        return NextResponse.json(data)
    } else {
        return NextResponse.json(
            {
                error: 'Business not found',
                requestedSlug: slug,
                availableSlugs: Object.keys(dataMap)
            },
            { status: 404 }
        )
    }
}
