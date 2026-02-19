export interface Project {
    id: string
    title: string
    before_image: string
    after_image: string
    likes: number
    verified: boolean
    category: string
    date: string
    location: string
    source?: string
    duration?: string
}

export interface Video {
    id: string
    title: string
    url: string
    poster?: string
    duration?: string
    forceMuted?: boolean
    scale?: number
    objectFit?: 'cover' | 'contain'
}
