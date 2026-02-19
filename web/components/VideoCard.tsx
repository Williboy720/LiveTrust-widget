import { useState, useRef, useEffect } from 'react'
import { Play, Pause, Volume2, VolumeX, Maximize2 } from 'lucide-react'
import type { Video } from '../types'

interface VideoCardProps {
    video: Video
    isActive?: boolean
    onPlay?: () => void
}

export function VideoCard({ video, isActive = false, onPlay }: VideoCardProps) {
    const videoRef = useRef<HTMLVideoElement>(null)
    const [isPlaying, setIsPlaying] = useState(false)
    const [isMuted, setIsMuted] = useState(true)
    const [progress, setProgress] = useState(0)
    const [showControls, setShowControls] = useState(false)
    const [isHovering, setIsHovering] = useState(false)

    useEffect(() => {
        if (!isActive) {
            if (isPlaying) {
                videoRef.current?.pause()
                setIsPlaying(false)
            }
            // Reset progress when navigating away
            if (videoRef.current) {
                videoRef.current.currentTime = 0
                setProgress(0)
            }
        }
    }, [isActive, isPlaying])

    useEffect(() => {
        if (video.forceMuted) {
            setIsMuted(true)
            if (videoRef.current) {
                videoRef.current.muted = true
            }
        }
    }, [video.forceMuted])

    const togglePlay = (e?: React.MouseEvent) => {
        e?.stopPropagation()
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause()
            } else {
                videoRef.current.play()
                onPlay?.()
            }
            setIsPlaying(!isPlaying)
        }
    }

    const toggleMute = (e: React.MouseEvent) => {
        e.stopPropagation()
        if (video.forceMuted) return // Prevent unmuting if forced

        if (videoRef.current) {
            videoRef.current.muted = !isMuted
            setIsMuted(!isMuted)
        }
    }

    const handleTimeUpdate = () => {
        if (videoRef.current) {
            const progress = (videoRef.current.currentTime / videoRef.current.duration) * 100
            setProgress(progress)
        }
    }

    const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
        e.stopPropagation()
        if (videoRef.current) {
            const progressBar = e.currentTarget
            const rect = progressBar.getBoundingClientRect()
            const x = e.clientX - rect.left
            const percentage = x / rect.width
            const newTime = percentage * videoRef.current.duration
            videoRef.current.currentTime = newTime
        }
    }

    return (
        <div
            className="flex flex-col gap-2"
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
        >
            <div className="relative w-full aspect-[9/13] bg-black rounded-xl overflow-hidden group cursor-pointer shadow-sm border border-gray-100">
                <video
                    ref={videoRef}
                    src={video.url}
                    poster={video.poster}
                    className={`w-full h-full ${video.objectFit === 'contain' ? 'object-contain bg-black' : 'object-cover'}`}
                    style={video.scale ? { transform: `scale(${video.scale})` } : undefined}
                    playsInline
                    muted={isMuted}
                    preload="metadata"
                    onClick={togglePlay}
                    onTimeUpdate={handleTimeUpdate}
                    onEnded={() => {
                        setIsPlaying(false)
                        if (videoRef.current) {
                            videoRef.current.currentTime = 0
                            setProgress(0)
                        }
                    }}
                />

                {/* Overlay Play Button (Initial State) */}
                {!isPlaying && (
                    <div
                        className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-all pointer-events-none"
                    >
                        <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform duration-200">
                            <Play size={20} className="ml-1 text-black" fill="currentColor" />
                        </div>
                    </div>
                )}

                {/* Controls Overlay */}
                <div
                    className={`absolute inset-0 flex flex-col justify-end p-3 transition-opacity duration-200 ${isPlaying && !isHovering ? 'opacity-0' : 'opacity-100'
                        }`}
                    style={{ background: isPlaying ? 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 40%)' : 'none' }}
                    onClick={togglePlay} // Clicking background toggles play
                >
                    <div className="flex items-center justify-between text-white mb-2 relative z-10">
                        <button
                            onClick={togglePlay}
                            className="p-1.5 hover:bg-white/20 rounded-full transition-colors"
                        >
                            {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
                        </button>

                        {!video.forceMuted && (
                            <button
                                onClick={toggleMute}
                                className="p-1.5 hover:bg-white/20 rounded-full transition-colors"
                            >
                                {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                            </button>
                        )}
                    </div>

                    {/* Progress Bar */}
                    <div
                        className="h-1 bg-white/30 rounded-full overflow-hidden cursor-pointer relative z-10 group/progress"
                        onClick={handleProgressBarClick}
                    >
                        <div
                            className="h-full bg-white rounded-full transition-all duration-100"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Title below video */}
            <div className="px-1 text-center">
                <h3 className="text-xs font-medium text-gray-900 leading-tight">
                    {video.title}
                </h3>
            </div>
        </div>
    )
}
