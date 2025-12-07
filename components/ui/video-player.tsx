"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  SkipBack,
  SkipForward,
  Settings,
  PictureInPicture,
  Loader2,
  Camera,
  Repeat,
  MonitorPlay,
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "./button";

interface CustomVideoPlayerProps {
  src: string;
  poster?: string;
  autoPlay?: boolean;
  qualities?: Record<string, string>; // e.g. { "1080p": "...", "720p": "..." }
}

export function CustomVideoPlayer({
  src,
  poster,
  autoPlay = false,
  qualities,
}: CustomVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // State
  const [currentSrc, setCurrentSrc] = useState(src); // Track current source
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  // Browser policy: Autoplay must be muted. We start muted if autoplay is requested.
  const [isMuted, setIsMuted] = useState(autoPlay); 
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [quality, setQuality] = useState("Auto"); // Default quality label
  const [isLooping, setIsLooping] = useState(false);

  // Initialize Autoplay
  useEffect(() => {
    if (autoPlay && videoRef.current) {
      videoRef.current.muted = true; // Use prop or state? Direct assignment is safer for autoplay policy
      videoRef.current.play()
        .then(() => {
            setIsPlaying(true);
            setIsMuted(true); // Sync state
        })
        .catch((e) => {
            console.warn("Autoplay blocked/failed:", e);
            setIsPlaying(false);
            // If autoplay fails, we can unmute so manual play works with sound
            if(videoRef.current) videoRef.current.muted = false;
            setIsMuted(false);
        });
    }
  }, [autoPlay]);

  // Update src if prop changes (e.g. from parent)
  useEffect(() => {
      setCurrentSrc(src);
      setQuality("Auto");
  }, [src]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Allow keyboard control if hovering, fullscreen, or generally focused on the player context
      // Simplified: always allow if no other input is focused
      if (document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA") return;
      if (!isHovering && !isFullscreen && !isPlaying) return; 
      
      switch(e.key.toLowerCase()) {
        case " ":
        case "k":
          e.preventDefault();
          togglePlay();
          break;
        case "arrowright":
          e.preventDefault();
          skip(5);
          break;
        case "arrowleft":
          e.preventDefault();
          skip(-5);
          break;
        case "m":
          e.preventDefault();
          toggleMute();
          break;
        case "f":
          e.preventDefault();
          toggleFullscreen();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isHovering, isFullscreen, isPlaying, isMuted]); // Add deps if needed by handlers, but refs usually sufficient for actions

  // Controls
  const togglePlay = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (videoRef.current) {
      if (videoRef.current.paused) {
        // Optimistic update
        setIsPlaying(true);
        videoRef.current.play()
            .catch((e) => {
                console.error("Play failed:", e);
                setIsPlaying(false); // Revert on failure
            });
      } else {
        // Optimistic update
        setIsPlaying(false);
        videoRef.current.pause();
      }
    }
  }, []);

  const skip = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime += seconds;
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleSeek = (value: number[]) => {
    if (videoRef.current) {
      videoRef.current.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const changeSpeed = (speed: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
      setPlaybackRate(speed);
    }
  };

  const togglePiP = async () => {
    if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
    } else if (videoRef.current) {
        await videoRef.current.requestPictureInPicture();
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement && containerRef.current) {
        containerRef.current.requestFullscreen();
        setIsFullscreen(true);
    } else if (document.fullscreenElement) {
        document.exitFullscreen();
        setIsFullscreen(false);
    }
  };

  // Double Click / Tap Gestures
  const handleDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const width = rect.width;

    if (x < width * 0.3) {
        skip(-10); // Double tap left
    } else if (x > width * 0.7) {
        skip(10); // Double tap right
    } else {
        toggleFullscreen(); // Center double tap
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  // New Features
  const takeSnapshot = () => {
    if (videoRef.current) {
        const canvas = document.createElement("canvas");
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        
        try {
            const dataUrl = canvas.toDataURL("image/png");
            const a = document.createElement("a");
            a.href = dataUrl;
            a.download = `snapshot-${Date.now()}.png`;
            a.click();
        } catch (e) {
            console.warn("Snapshot failed (tainted canvas?):", e);
        }
    }
  };

  const downloadVideo = async () => {
      try {
        const response = await fetch(currentSrc);
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = `video-${Date.now()}.mp4`; 
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(blobUrl);
        setIsSettingsOpen(false);
      } catch (e) {
        console.error("Download failed:", e);
      }
  };

  const toggleLoop = () => {
    if (videoRef.current) {
        videoRef.current.loop = !isLooping;
        setIsLooping(!isLooping);
    }
  };


  // ... state ...
  const [settingsView, setSettingsView] = useState<"main" | "quality" | "speed">("main");
  const [isSimulatingQualityChange, setIsSimulatingQualityChange] = useState(false);

  // ... existing functions ...
  
  const handleQualityChange = (newQuality: string) => {
    setSettingsView("main");
    setIsSettingsOpen(false);
    if (newQuality === quality) return;
    
    // Check if we actually have this quality
    let newSrc = src;
    if (newQuality !== "Auto" && qualities && qualities[newQuality]) {
        newSrc = qualities[newQuality];
    } else if (newQuality === "Auto") {
        newSrc = src; // Revert to default
    } 
    // If no qualities provided, we just proceed to simulation logic below

    // Quality Switch Logic
    const wasPlaying = isPlaying;
    const currentTime = videoRef.current?.currentTime || 0;
    
    setIsPlaying(false);
    videoRef.current?.pause();
    setIsSimulatingQualityChange(true);
    setQuality(newQuality);
    setCurrentSrc(newSrc);

    // Artificial delay for "buffering" feel or just load
    setTimeout(() => {
        if(videoRef.current) {
            videoRef.current.currentTime = currentTime; // Restore time
        }
        setIsSimulatingQualityChange(false);
        if (wasPlaying) {
            videoRef.current?.play().catch(console.error);
            setIsPlaying(true);
        }
    }, 500); 
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative w-full h-full group bg-black rounded-lg overflow-hidden border border-white/10 shadow-2xl select-none flex items-center justify-center",
        (isHovering || !isPlaying) ? "cursor-default" : "cursor-none"
      )}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onClick={togglePlay}
      onDoubleClick={handleDoubleClick}
    >
      <video
        ref={videoRef}
        src={currentSrc}
        poster={poster}
        muted={isMuted}
        playsInline 
        controls={false}
        className="w-full h-full object-contain max-h-[95vh] cursor-pointer" 
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)}
        onEnded={() => setIsPlaying(false)}
        onWaiting={() => setIsBuffering(true)}
        onPlaying={() => setIsBuffering(false)}
        onCanPlay={() => setIsBuffering(false)}
        onError={() => setHasError(true)}
      />

      {/* Buffering Indicator */}
      {(isBuffering || isSimulatingQualityChange) && !hasError && (
         <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20 bg-black/20 backdrop-blur-[2px]">
            <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-12 h-12 text-white/90 animate-spin drop-shadow-md" />
                {isSimulatingQualityChange && <span className="text-white font-medium text-sm">Changing Quality...</span>}
            </div>
         </div>
      )}

      {/* Error State */}
      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-black/80 text-white/80 gap-2">
            <div className="p-3 bg-red-500/20 rounded-full">
                <Settings className="w-6 h-6 text-red-500" />
            </div>
            <p className="text-sm font-medium">Video Error</p>
        </div>
      )}

      {/* Big Play Button (Paused state) */}
      {!isPlaying && !isBuffering && !hasError && !isSimulatingQualityChange && !isSettingsOpen && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 transition-opacity duration-300">
          <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 shadow-2xl group-hover:scale-110 transition-transform">
            <Play className="w-8 h-8 text-white fill-white ml-1" />
          </div>
        </div>
      )}

      {/* Controls Bar */}
      <div
        className={cn(
          "absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent px-6 pb-6 pt-24 transition-all duration-300 flex flex-col gap-3 z-30",
          (isHovering || !isPlaying || isSettingsOpen) ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Progress Bar */}
        <div className="w-full group/slider cursor-pointer relative flex items-center">
            <Slider
              value={[currentTime]}
              max={duration || 100}
              step={0.1}
              onValueChange={handleSeek}
              className="cursor-pointer transition-all hover:h-2 py-2" 
            />
        </div>
        
        <div className="flex items-center justify-between">
          {/* Left Controls */}
          <div className="flex items-center gap-4">
            <button onClick={() => togglePlay(undefined)} className="text-white hover:text-purple-400 transition-colors">
              {isPlaying ? <Pause className="w-7 h-7 fill-white" /> : <Play className="w-7 h-7 fill-white" />}
            </button>

            <div className="flex items-center gap-2 group/vol">
                 <button onClick={toggleMute} className="text-white hover:text-purple-400">
                    {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>
            </div>

            <span className="text-xs font-medium font-mono text-white/80">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-3 relative">
             {/* Settings Menu Trigger */}
             <button 
                onClick={() => {
                    setIsSettingsOpen(!isSettingsOpen);
                    setSettingsView("main");
                }}
                className={cn(
                    "p-2 hover:bg-white/10 rounded-full text-white transition-all duration-300 focus:outline-none",
                    isSettingsOpen ? "rotate-90 bg-white/20" : "rotate-0"
                )}
             >
                <Settings className="w-5 h-5" />
             </button>

             {/* Custom Settings Menu Overlay */}
             {isSettingsOpen && (
                <div className="absolute bottom-12 right-0 w-64 bg-black/95 border border-white/10 rounded-xl backdrop-blur-xl p-2 shadow-2xl flex flex-col gap-1 z-[50] animate-in fade-in slide-in-from-bottom-2">
                    {settingsView === "main" && (
                        <>
                            <div className="px-3 py-2 text-xs font-semibold text-white/50 border-b border-white/10 mb-1">
                                Settings
                            </div>
                            
                            {/* Quality Trigger - Always Show for Simulation */}
                            <button 
                                onClick={() => setSettingsView("quality")}
                                className="flex items-center justify-between w-full px-3 py-2 text-sm text-white hover:bg-white/10 rounded transition-colors"
                            >
                                <div className="flex items-center gap-2">
                                    <MonitorPlay className="w-4 h-4" />
                                    <span>Quality</span>
                                </div>
                                <div className="flex items-center gap-1 text-white/50">
                                    <span>{quality}</span>
                                    <SkipForward className="w-3 h-3 rotate-90" />
                                </div>
                            </button>

                            {/* Speed Trigger */}
                            <button 
                                onClick={() => setSettingsView("speed")}
                                className="flex items-center justify-between w-full px-3 py-2 text-sm text-white hover:bg-white/10 rounded transition-colors"
                            >
                                <div className="flex items-center gap-2">
                                    <Settings className="w-4 h-4" /> {/* Speed icon analog */}
                                    <span>Speed</span>
                                </div>
                                <div className="flex items-center gap-1 text-white/50">
                                    <span>{playbackRate}x</span>
                                    <SkipForward className="w-3 h-3 rotate-90" />
                                </div>
                            </button>

                            {/* Loop Toggle */}
                            <button 
                                onClick={toggleLoop}
                                className="flex items-center justify-between w-full px-3 py-2 text-sm text-white hover:bg-white/10 rounded transition-colors"
                            >
                                <div className="flex items-center gap-2">
                                    <Repeat className="w-4 h-4" />
                                    <span>Loop</span>
                                </div>
                                <span className={cn("text-xs font-bold px-1.5 py-0.5 rounded", isLooping ? "bg-green-500/20 text-green-400" : "bg-white/10 text-white/50")}>
                                    {isLooping ? "ON" : "OFF"}
                                </span>
                            </button>
                             {/* Snapshot */}
                            <button 
                                onClick={takeSnapshot}
                                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-white hover:bg-white/10 rounded transition-colors"
                            >
                                <Camera className="w-4 h-4" />
                                <span>Snapshot</span>
                            </button>

                            {/* Download */}
                            <button 
                                onClick={downloadVideo}
                                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-white hover:bg-white/10 rounded transition-colors"
                            >
                                <SkipBack className="w-4 h-4 rotate-[-90deg]" /> {/* Arrow down icon */}
                                <span>Download</span>
                            </button>
                        </>
                    )}

                    {settingsView === "quality" && (
                        <>
                             <div className="flex items-center gap-2 px-2 py-2 border-b border-white/10 mb-1">
                                <button onClick={() => setSettingsView("main")} className="p-1 hover:bg-white/10 rounded-full">
                                    <SkipBack className="w-4 h-4" />
                                </button>
                                <span className="text-xs font-semibold text-white/50">Quality</span>
                             </div>
                             {(qualities ? ["Auto", ...Object.keys(qualities)] : ["Auto", "1080p", "720p", "480p", "360p"]).map(q => (
                                <button 
                                    key={q}
                                    onClick={() => handleQualityChange(q)}
                                    className="flex items-center justify-between w-full px-3 py-2 text-sm text-white hover:bg-white/10 rounded transition-colors"
                                >
                                    <span>{q}</span>
                                    {quality === q && <span className="text-purple-400 font-bold">✓</span>}
                                </button>
                             ))}
                        </>
                    )}

                    {settingsView === "speed" && (
                        <>
                             <div className="flex items-center gap-2 px-2 py-2 border-b border-white/10 mb-1">
                                <button onClick={() => setSettingsView("main")} className="p-1 hover:bg-white/10 rounded-full">
                                    <SkipBack className="w-4 h-4" />
                                </button>
                                <span className="text-xs font-semibold text-white/50">Playback Speed</span>
                             </div>
                             <div className="grid grid-cols-2 gap-1 p-1">
                                {[0.5, 0.75, 1, 1.25, 1.5, 2].map(rate => (
                                    <button 
                                        key={rate} 
                                        onClick={() => { changeSpeed(rate); setSettingsView("main"); }}
                                        className={cn(
                                            "text-xs py-2 rounded hover:bg-white/20 transition-colors border",
                                            playbackRate === rate ? "bg-white text-black font-bold border-white" : "text-white/70 border-transparent"
                                        )}
                                    >
                                        {rate}x
                                    </button>
                                ))}
                             </div>
                        </>
                    )}
                </div>
             )}

            {/* PiP */}
            <button className="p-2 hover:bg-white/10 rounded-full text-white transition-colors" onClick={togglePiP} title="Picture in Picture">
                <PictureInPicture className="w-5 h-5" />
            </button>

            {/* Fullscreen */}
             <button className="p-2 hover:bg-white/10 rounded-full text-white transition-colors" onClick={toggleFullscreen} title="Fullscreen">
                {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
