'use client'

import { useEffect, useState, useMemo, useCallback, useRef } from 'react'
import { WidgetHeader } from './WidgetHeader'
import { AccordionSection } from './AccordionSection'
import { ProjectCard } from './ProjectCard'
import { VideoCard } from './VideoCard'
import { MinimizedBar } from './MinimizedBar'
import { VerticalLauncher } from './VerticalLauncher'
import { LicenseTab } from './LicenseTab'
import { ReviewRow, type Review } from './ReviewRow'
import type { Project, Video } from '../types'
import { Star, Briefcase, Shield, Info, Building2, ChevronDown, ChevronLeft, ChevronRight, X, Smartphone, Share2, Video as VideoIcon } from 'lucide-react'
import { initGA, trackWidgetView, trackWidgetOpen, trackWidgetClose, trackSectionOpen } from '../lib/analytics'



interface PlatformData {
    id: string
    name: string
    rating: number
    count: number
    color: string
    url: string
    reviews: Review[]
    customRating?: string
}

interface FeaturedReview {
    id: string
    author: string
    rating: number
    date: string
    content: string
    embedUrl?: string
    embedHeight?: number
    embedScale?: number
    mobileEmbedScale?: number
    embedWidth?: number | string
    source?: string
}

interface BusinessInfo {
    name: string
    foundedYear?: string
    onTrustHireSince?: string
    owners?: string
    serviceArea?: string
    incorporationNumber?: string
    warranty?: string
    insuredAmount?: string
    employees?: number
    rbq?: {
        number: string
        url: string
    }
    insurance?: {
        provider: string
        url: string
        amount: string
    }
}

interface SocialPost {
    url: string
    height?: number
    containerHeight?: number
    marginTop?: number
}

interface TrustHireWidgetProps {
    slug: string
    variant?: 'A' | 'B' | 'D'
}

export function TrustHireWidget({ slug, variant = 'A' }: TrustHireWidgetProps) {
    const [isOpen, setIsOpen] = useState(true)
    const [projects, setProjects] = useState<Project[]>([])
    const [videos, setVideos] = useState<Video[]>([])
    const [reviews, setReviews] = useState<PlatformData[]>([])
    const [loading, setLoading] = useState(true)
    const [visibleProjects, setVisibleProjects] = useState(2)
    const [visiblePosts, setVisiblePosts] = useState(1)
    const [isMobile, setIsMobile] = useState(false)
    const startTimeRef = useRef<number | null>(null);

    // Initialize Analytics
    useEffect(() => {
        initGA();
        trackWidgetView(variant, slug);
    }, [variant, slug]); // Re-track if variant changes, though unlikely

    // Track mobile viewport with User Agent check to avoid iframe false positives
    useEffect(() => {
        const checkMobile = () => {
            const isSmallScreen = window.innerWidth < 640
            const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
            setIsMobile(isSmallScreen && isMobileUA)
        }
        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])
    const [businessInfo, setBusinessInfo] = useState<BusinessInfo>({ name: '' })
    const [featuredReviews, setFeaturedReviews] = useState<FeaturedReview[]>([])
    const [socialPosts, setSocialPosts] = useState<SocialPost[]>([])
    const [currentPostIndex, setCurrentPostIndex] = useState(0)
    const [currentVideoIndex, setCurrentVideoIndex] = useState(0)
    const [isVideoGalleryOpen, setIsVideoGalleryOpen] = useState(false)
    const [currentReviewIndex, setCurrentReviewIndex] = useState(0)
    const [hasPlayedAnimation, setHasPlayedAnimation] = useState(false)
    const [isClosed, setIsClosed] = useState(false)

    const handleLoadMoreProjects = () => {
        setVisibleProjects(prev => prev + 2)
    }

    const handlePrevPost = (e: React.MouseEvent) => {
        e.stopPropagation()
        setCurrentPostIndex((prev) => (prev === 0 ? socialPosts.length - 1 : prev - 1))
    }

    const handleNextPost = (e: React.MouseEvent) => {
        e.stopPropagation()
        setCurrentPostIndex((prev) => (prev === socialPosts.length - 1 ? 0 : prev + 1))
    }

    const handlePrevReview = () => {
        setCurrentReviewIndex((prev) => (prev === 0 ? featuredReviews.length - 1 : prev - 1))
    }

    const handleNextReview = () => {
        setCurrentReviewIndex((prev) => (prev === featuredReviews.length - 1 ? 0 : prev + 1))
    }


    useEffect(() => {
        const timer = setTimeout(() => {
            setHasPlayedAnimation(true)
        }, 2200) // Match animation delay (1s) + duration (1s) + buffer
        return () => clearTimeout(timer)
    }, [])

    const handleSocialToggle = useCallback((isOpen: boolean) => {
        if (!isOpen) {
            setVisiblePosts(1)
        }
    }, [])



    useEffect(() => {
        async function fetchData() {
            setLoading(true)
            try {
                // Fetch data from local JSON API
                const response = await fetch(`/api/widget/${slug}`)

                if (!response.ok) {
                    throw new Error('Failed to fetch data')
                }

                const data = await response.json()

                if (data.projects) {
                    setProjects(data.projects)
                }

                if (data.videos) {
                    setVideos(data.videos)
                }

                if (data.reviews) {
                    setReviews(data.reviews)
                }

                setBusinessInfo({
                    name: data.companyName || '',
                    foundedYear: data.foundedYear,
                    onTrustHireSince: data.onTrustHireSince,
                    owners: data.owners,
                    serviceArea: data.serviceArea,
                    incorporationNumber: data.incorporationNumber,
                    warranty: data.warranty,
                    insuredAmount: data.insuredAmount,
                    employees: data.employees,
                    rbq: data.rbq,
                    insurance: data.insurance
                })

                if (data.featuredReviews) {
                    setFeaturedReviews(data.featuredReviews)
                }

                if (data.socialPosts) {
                    setSocialPosts(data.socialPosts)
                }
            } catch (err) {
                console.error('Fetch error:', err)
                // Fallback to empty states or could show an error message
                setProjects([])
                setReviews([])
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [slug])

    const handleOpen = () => {
        console.log('Widget: handleOpen called')
        startTimeRef.current = Date.now();
        setIsOpen(true)
        trackWidgetOpen(variant, slug);
        window.parent.postMessage({ type: 'trusthire-resize', state: 'fullscreen' }, '*')
        // New Analytics Message
        window.parent.postMessage({
            type: 'TRUSTHIRE_WIDGET_OPEN',
            business_id: slug,
            variant,
            timestamp: new Date().toISOString()
        }, '*')
    }

    const handleClose = () => {
        console.log('Widget: handleClose called')
        const now = Date.now();
        const duration = startTimeRef.current ? (now - startTimeRef.current) / 1000 : 0;

        setIsClosed(true)
        trackWidgetClose(variant, slug, duration);
        window.parent.postMessage({ type: 'trusthire-resize', state: 'closed' }, '*')
        // New Analytics Message
        window.parent.postMessage({
            type: 'TRUSTHIRE_WIDGET_CLOSE',
            business_id: slug,
            variant,
            timestamp: new Date(now).toISOString(),
            duration_seconds: duration
        }, '*')
    }

    useEffect(() => {
        // Notify parent that widget is ready and minimized
        if (!isOpen && !isClosed) {
            window.parent.postMessage({ type: 'trusthire-resize', state: 'minimized' }, '*')
        }
    }, [isOpen, isClosed])

    // Listen for auto-open message (for Variant D overlay)
    useEffect(() => {
        function handleMessage(event: MessageEvent) {
            if (event.data.type === 'TRUSTHIRE_AUTO_OPEN') {
                console.log('Widget: Received auto-open message, expanding...');
                handleOpen();
            }
        }

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    const handleMinimize = () => {
        console.log('Widget: handleMinimize called')
        const now = Date.now();
        const duration = startTimeRef.current ? (now - startTimeRef.current) / 1000 : 0;

        setIsOpen(false)
        trackWidgetClose(variant, slug, duration);
        // We track 'minimize' (modal close) as the close event for analytics
        window.parent.postMessage({
            type: 'TRUSTHIRE_WIDGET_CLOSE',
            business_id: slug,
            variant,
            timestamp: new Date(now).toISOString(),
            duration_seconds: duration
        }, '*')
        window.parent.postMessage({ type: 'trusthire-resize', state: 'minimized' }, '*')
    }

    if (isClosed) {
        return null
    }

    if (!isOpen) {
        if (variant === 'B') {
            return (
                <div className={`fixed top-1/2 -translate-y-1/2 z-50 ${isMobile ? 'right-0 scale-[0.75] origin-right' : 'left-0 sm:left-4'}`}>
                    <VerticalLauncher onOpen={handleOpen} onClose={handleClose} isMobile={isMobile} />
                </div>
            )
        }
        // Default Variant A or D
        return (
            <div
                className={`fixed top-0 right-0 top-3 right-3 z-50 ${isMobile ? 'scale-[0.72] origin-top-right' : ''}`}
            >
                <MinimizedBar onOpen={handleOpen} onClose={handleClose} isMobile={isMobile} showChevron={variant !== 'D'} />
            </div>
        )
    }

    return (
        <>
            {/* Full-screen darkened overlay */}
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-in fade-in duration-300"
                onClick={handleMinimize}
            />

            {/* Centered modal */}
            <main className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
                <div
                    className="w-full max-w-[440px] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[calc(85vh+25px)] animate-in zoom-in-95 fade-in duration-300 pointer-events-auto"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* White band strip at top with Verified by TrustHire - sticky on scroll */}
                    <div className="sticky top-0 z-10 bg-white border-b border-gray-200 py-2 pl-3 pr-4 relative flex items-center">
                        <div className="flex items-center gap-1">
                            <span className="text-[13px] text-black leading-none whitespace-nowrap">
                                Vérifié par <span className="font-bold">TrustHire</span>
                            </span>
                            <div className="shrink-0 w-[22px] h-[22px]">
                                <img
                                    src="/trusthire-check.png"
                                    alt="TrustHire"
                                    className="w-full h-full object-contain"
                                />
                            </div>
                        </div>
                        <button
                            onClick={handleMinimize}
                            className="absolute right-4 text-gray-600 hover:bg-gray-100 rounded-full p-1.5 transition-colors"
                            aria-label="Close modal"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Scrollable content area - includes header and accordions */}
                    <div className="flex-1 overflow-y-auto bg-white">
                        <WidgetHeader onClose={() => setIsOpen(false)} businessName={businessInfo.name} />

                        <div className="px-3 pt-0 pb-3 space-y-2">
                            {/* Reviews Accordion */}
                            <AccordionSection
                                title="Avis en ligne"
                                icon={<Star className="text-[#32BD5E]" size={20} />}
                                verified={true}
                                onToggle={(open) => { if (open) trackSectionOpen('Avis en ligne', variant, slug) }}
                            >
                                <div className="space-y-0">
                                    {reviews.map((platform) => (
                                        <ReviewRow
                                            key={platform.id}
                                            id={platform.id}
                                            platform={platform.name}
                                            rating={platform.rating}
                                            count={platform.count}
                                            color={platform.color}
                                            url={platform.url}
                                            reviews={platform.reviews}
                                            customRating={platform.customRating}
                                        />
                                    ))}
                                    {reviews.length === 0 && !loading && (
                                        <p className="text-gray-500 text-sm py-2">No reviews found.</p>
                                    )}
                                </div>

                                {featuredReviews.length > 0 && (
                                    <div className="mt-0 relative pt-1">
                                        {/* Left Arrow */}
                                        {featuredReviews.length > 1 && (
                                            <button
                                                onClick={handlePrevReview}
                                                className="absolute left-0 top-1/2 -translate-y-1/2 bg-gray-100 p-1.5 rounded-full hover:bg-gray-200 text-gray-600 transition-colors z-10"
                                            >
                                                <ChevronLeft size={20} />
                                            </button>
                                        )}


                                        <div className="h-[175px] relative overflow-hidden">
                                            {featuredReviews[currentReviewIndex].embedUrl ? (
                                                <div className="flex justify-center overflow-hidden">
                                                    <iframe
                                                        src={featuredReviews[currentReviewIndex].embedUrl}
                                                        width={featuredReviews[currentReviewIndex].embedWidth || "100%"}
                                                        height={featuredReviews[currentReviewIndex].embedHeight || 194}
                                                        style={{
                                                            border: 'none',
                                                            overflow: 'hidden',
                                                            borderRadius: '12px',
                                                            maxWidth: 'none',
                                                            transform: `scale(${isMobile && featuredReviews[currentReviewIndex].mobileEmbedScale ? featuredReviews[currentReviewIndex].mobileEmbedScale : (featuredReviews[currentReviewIndex].embedScale || 0.85)})`,
                                                            transformOrigin: 'center top',
                                                            marginBottom: `${-1 * (featuredReviews[currentReviewIndex].embedHeight || 194) * (1 - (isMobile && featuredReviews[currentReviewIndex].mobileEmbedScale ? featuredReviews[currentReviewIndex].mobileEmbedScale : (featuredReviews[currentReviewIndex].embedScale || 0.85)))}px`
                                                        }}
                                                        scrolling="no"
                                                        frameBorder="0"
                                                        allowFullScreen={true}
                                                        allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                                                    />
                                                </div>
                                            ) : (
                                                <div className="flex justify-center overflow-hidden px-[20px]">
                                                    <div
                                                        style={{
                                                            transform: 'scale(0.8)',
                                                            transformOrigin: 'center top',
                                                            marginBottom: '-10px',
                                                            width: '100%'
                                                        }}
                                                    >
                                                        <div className="bg-white border-2 border-gray-300 rounded-lg p-3 h-[190px] flex flex-col">
                                                            {/* Header with avatar, name, date, and Google logo */}
                                                            <div className="flex items-start justify-between mb-3">
                                                                <div className="flex items-center gap-2">
                                                                    {/* Purple avatar circle with initial */}
                                                                    <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                                                                        {featuredReviews[currentReviewIndex].author.charAt(0)}
                                                                    </div>
                                                                    <div>
                                                                        <div className="font-medium text-sm text-gray-900">
                                                                            {featuredReviews[currentReviewIndex].author}
                                                                        </div>
                                                                        <div className="text-xs text-gray-500">
                                                                            {featuredReviews[currentReviewIndex].date}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                {/* Google logo */}
                                                                {featuredReviews[currentReviewIndex].source === 'Google' && (
                                                                    <svg className="w-6 h-6 flex-shrink-0" viewBox="0 0 48 48">
                                                                        <path fill="#4285F4" d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z" />
                                                                        <path fill="#34A853" d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z" />
                                                                        <path fill="#FBBC05" d="M11.69 28.18C11.25 26.86 11 25.45 11 24s.25-2.86.69-4.18v-5.7H4.34C2.85 17.09 2 20.45 2 24c0 3.55.85 6.91 2.34 9.88l7.35-5.7z" />
                                                                        <path fill="#EA4335" d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07z" />
                                                                    </svg>
                                                                )}
                                                            </div>

                                                            {/* Gold stars */}
                                                            <div className="flex gap-0.5 mb-3">
                                                                {[...Array(5)].map((_, i) => (
                                                                    <svg key={i} className="w-4 h-4" viewBox="0 0 24 24" fill="#FDB022">
                                                                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                                                    </svg>
                                                                ))}
                                                            </div>

                                                            {/* Review text */}
                                                            <p className="text-sm leading-relaxed text-gray-700 flex-1">
                                                                {featuredReviews[currentReviewIndex].content}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>


                                        {/* Right Arrow */}
                                        {featuredReviews.length > 1 && (
                                            <button
                                                onClick={handleNextReview}
                                                className="absolute right-0 top-1/2 -translate-y-1/2 bg-gray-100 p-1.5 rounded-full hover:bg-gray-200 text-gray-600 transition-colors z-10"
                                            >
                                                <ChevronRight size={20} />
                                            </button>
                                        )}



                                        {/* Carousel Dots */}
                                        <div className="flex justify-center gap-2 mt-2">
                                            {featuredReviews.map((_, index) => (
                                                <button
                                                    key={index}
                                                    onClick={() => setCurrentReviewIndex(index)}
                                                    className={`w-2 h-2 rounded-full transition-colors ${index === currentReviewIndex ? 'bg-[#32BD5E]' : 'bg-gray-300 hover:bg-gray-400'}`}
                                                    aria-label={`Go to review ${index + 1}`}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </AccordionSection>

                            {/* Credentials & Insurance Accordion */}
                            <AccordionSection
                                title="Conformité & Protection"
                                icon={<Shield className="text-[#32BD5E]" size={20} />}
                                verified={true}
                                onToggle={(open) => { if (open) trackSectionOpen('Conformité & Protection', variant, slug) }}
                            >
                                <LicenseTab
                                    incorporationNumber={businessInfo.incorporationNumber}
                                    warranty={businessInfo.warranty}
                                    insuredAmount={businessInfo.insuredAmount}
                                    rbq={businessInfo.rbq}
                                    insurance={businessInfo.insurance}
                                />
                            </AccordionSection>

                            {/* Video Gallery Accordion */}
                            <AccordionSection
                                title="Galerie vidéo"
                                icon={<VideoIcon className="text-[#32BD5E]" size={20} />}
                                verified={true}
                                onToggle={(open) => {
                                    setIsVideoGalleryOpen(open)
                                    if (open) trackSectionOpen('Galerie vidéo', variant, slug)
                                }}
                            >
                                <div className="space-y-0 relative group">
                                    {videos && videos.length > 0 ? (
                                        <>
                                            <div className="relative pb-3">
                                                <div className="px-1 is-carousel-slide">
                                                    <VideoCard
                                                        video={videos[currentVideoIndex]}
                                                        isActive={isVideoGalleryOpen}
                                                    />
                                                </div>

                                                {/* Navigation Arrows */}
                                                {videos.length > 1 && (
                                                    <>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                setCurrentVideoIndex((prev) => (prev === 0 ? videos.length - 1 : prev - 1))
                                                            }}
                                                            className="absolute left-2 top-1/2 -translate-y-8 bg-gray-100 p-1.5 rounded-full hover:bg-gray-200 text-gray-600 transition-colors z-10 backdrop-blur-sm"
                                                        >
                                                            <ChevronLeft size={20} />
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                setCurrentVideoIndex((prev) => (prev === videos.length - 1 ? 0 : prev + 1))
                                                            }}
                                                            className="absolute right-2 top-1/2 -translate-y-8 bg-gray-100 p-1.5 rounded-full hover:bg-gray-200 text-gray-600 transition-colors z-10 backdrop-blur-sm"
                                                        >
                                                            <ChevronRight size={20} />
                                                        </button>
                                                    </>
                                                )}
                                            </div>

                                            {/* Carousel Dots */}
                                            {videos.length > 1 && (
                                                <div className="flex justify-center gap-2 mt-2">
                                                    {videos.map((_, index) => (
                                                        <button
                                                            key={index}
                                                            onClick={() => setCurrentVideoIndex(index)}
                                                            className={`w-2 h-2 rounded-full transition-colors ${index === currentVideoIndex ? 'bg-[#32BD5E]' : 'bg-gray-300 hover:bg-gray-400'}`}
                                                            aria-label={`Go to video ${index + 1}`}
                                                        />
                                                    ))}
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <div className="text-center py-8 text-gray-500 text-sm">
                                            Video coming soon
                                        </div>
                                    )}
                                </div>
                            </AccordionSection>

                            {/* About the Business Accordion */}
                            <AccordionSection
                                title="L'entreprise"
                                icon={<Building2 className="text-[#32BD5E]" size={20} />}
                                verified={true}
                                onToggle={(open) => { if (open) trackSectionOpen("L'entreprise", variant, slug) }}
                            >
                                <div className="grid grid-cols-3 gap-2">
                                    <div className="bg-gray-50 rounded-lg p-2 border border-gray-100">
                                        <p className="text-[10px] text-gray-500 mb-0.5">Année de fondation</p>
                                        <p className="font-semibold text-sm text-gray-900">{businessInfo.foundedYear || '2009'}</p>
                                    </div>

                                    <div className="bg-gray-50 rounded-lg p-2 border border-gray-100">
                                        <p className="text-[10px] text-gray-500 mb-0.5">Sur TrustHire depuis</p>
                                        <p className="font-semibold text-sm text-gray-900">{businessInfo.onTrustHireSince || '2024'}</p>
                                    </div>

                                    <div className="bg-gray-50 rounded-lg p-2 border border-gray-100">
                                        <p className="text-[10px] text-gray-500 mb-0.5">Nombre d'employés</p>
                                        <p className="font-semibold text-sm text-gray-900">{businessInfo.employees || 12}</p>
                                    </div>

                                    {businessInfo.owners && (
                                        <div className="col-span-3 bg-gray-50 rounded-lg p-2 border border-gray-100">
                                            <p className="text-[10px] text-gray-500 mb-0.5">
                                                Propriétaire{businessInfo.owners.match(/(&|and|et)/i) ? 's' : ''}
                                            </p>
                                            <p className="font-semibold text-sm text-gray-900">{businessInfo.owners}</p>
                                        </div>
                                    )}

                                    {businessInfo.serviceArea && (
                                        <div className="col-span-3 bg-gray-50 rounded-lg p-2 border border-gray-100">
                                            <p className="text-[10px] text-gray-500 mb-0.5">Zone desservie</p>
                                            <p className="font-semibold text-sm text-gray-900">{businessInfo.serviceArea}</p>
                                        </div>
                                    )}


                                </div>
                            </AccordionSection>

                            {/* Social Posts Accordion */}
                            <AccordionSection
                                title="Publications sociales"
                                icon={<Share2 className="text-[#32BD5E]" size={20} />}
                                verified={true}
                                onToggle={(open) => {
                                    handleSocialToggle(open)
                                    if (open) trackSectionOpen('Publications sociales', variant, slug)
                                }}
                                scrollAnchor="start"
                                scrollTarget="content"
                            >
                                <div className="space-y-0 relative group">
                                    {socialPosts.length > 0 ? (
                                        <>
                                            <div className="relative">
                                                <div
                                                    key={currentPostIndex}
                                                    className="relative w-full aspect-[3/4] rounded-lg overflow-hidden bg-white border border-gray-100 mb-4"
                                                >
                                                    <img
                                                        src={socialPosts[currentPostIndex].url}
                                                        alt="Social Post"
                                                        className="w-full h-full object-contain block"
                                                        style={{
                                                            marginTop: socialPosts[currentPostIndex].marginTop ? `${socialPosts[currentPostIndex].marginTop}px` : undefined
                                                        }}
                                                    />
                                                </div>

                                                {/* Navigation Arrows */}
                                                {currentPostIndex > 0 && (
                                                    <button
                                                        onClick={handlePrevPost}
                                                        className="absolute left-2 top-1/2 -translate-y-1/2 bg-gray-100 p-1.5 rounded-full hover:bg-gray-200 text-gray-600 transition-colors z-10 backdrop-blur-sm"
                                                    >
                                                        <ChevronLeft size={20} />
                                                    </button>
                                                )}

                                                {currentPostIndex < socialPosts.length - 1 && (
                                                    <button
                                                        onClick={handleNextPost}
                                                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-gray-100 p-1.5 rounded-full hover:bg-gray-200 text-gray-600 transition-colors z-10 backdrop-blur-sm"
                                                    >
                                                        <ChevronRight size={20} />
                                                    </button>
                                                )}
                                            </div>

                                            {/* Carousel Dots */}
                                            <div className="flex justify-center gap-2 mt-2">
                                                {socialPosts.map((_, index) => (
                                                    <button
                                                        key={index}
                                                        onClick={() => setCurrentPostIndex(index)}
                                                        className={`w-2 h-2 rounded-full transition-colors ${index === currentPostIndex ? 'bg-[#32BD5E]' : 'bg-gray-300 hover:bg-gray-400'}`}
                                                        aria-label={`Go to post ${index + 1}`}
                                                    />
                                                ))}
                                            </div>


                                        </>
                                    ) : (
                                        <div className="text-center py-8 text-gray-500 text-sm">
                                            No posts available
                                        </div>
                                    )}
                                </div>
                            </AccordionSection>

                            {/* About TrustHire Accordion */}
                            <AccordionSection
                                title="À propos de TrustHire"
                                icon={<Info size={16} />}
                                onToggle={(open) => { if (open) trackSectionOpen('À propos de TrustHire', variant, slug) }}
                            >
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-xs text-gray-600 leading-relaxed mb-2">
                                            TrustHire est une plateforme de vérification indépendante qui regroupe des informations publiques sur les entreprises et les présente aux côtés de documents fournis directement par celles-ci. Les avis, accréditations, licences, détails d'assurance et exemples de travaux antérieurs sont affichés avec l'autorisation et le plein consentement de l'entreprise.
                                        </p>
                                        <p className="text-xs text-gray-600 leading-relaxed mb-2">
                                            Les informations affichées par TrustHire sont présentées telles quelles et ne sont ni altérées ni modifiées. En organisant des informations vérifiées et clairement attribuées en un seul endroit, TrustHire aide les clients à mieux comprendre une entreprise lors de leurs prises de décision.
                                        </p>
                                    </div>
                                </div>
                            </AccordionSection>
                        </div>
                    </div>
                </div >
            </main >
        </>
    )
}
