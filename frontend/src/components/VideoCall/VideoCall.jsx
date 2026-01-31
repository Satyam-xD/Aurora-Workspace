import React, { useState, useEffect } from 'react';
import { useChatContext } from '../../context/ChatContext';
import { useDirectCall } from '../../hooks/useVideoCall/useDirectCall';
import { Mic, MicOff, Video, VideoOff, PhoneOff, X, Monitor, MonitorOff, Maximize2, Minimize2 } from 'lucide-react';

const CallTimer = ({ startTime }) => {
    const [duration, setDuration] = useState(0);

    useEffect(() => {
        if (!startTime) return;

        const updateTimer = () => {
            const elapsed = Math.floor((Date.now() - startTime) / 1000);
            setDuration(elapsed);
        };

        // Update immediately
        updateTimer();

        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [startTime]);

    const mins = Math.floor(duration / 60);
    const secs = duration % 60;
    const formatted = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

    return (
        <span className="text-sm font-medium">{formatted}</span>
    );
};

const VideoCall = ({ isIncoming, callerSignal, callerName, callerId, userToCall, onEndCall, onAnswer, isVideoCall = true }) => {
    const { user } = useChatContext();
    const [isFullscreen, setIsFullscreen] = useState(false);

    const {
        stream,
        callAccepted,
        callEnded,
        remoteStream,
        isMuted,
        isVideoOff,
        isScreenSharing,
        mediaError,
        connectionState,
        startTime,
        myVideoRef,
        userVideoRef,
        answerCall,
        leaveCall,
        toggleMute,
        toggleVideo,
        toggleScreenShare,
        getMedia
    } = useDirectCall({
        isIncoming,
        callerSignal,
        callerId,
        userToCall,
        onEndCall,
        onAnswer,
        isVideoCall
    });

    // Connection quality indicator
    const getConnectionQuality = () => {
        switch (connectionState) {
            case 'connected':
                return { color: 'bg-green-500', text: 'Connected', pulse: true };
            case 'connecting':
                return { color: 'bg-yellow-500', text: 'Connecting...', pulse: true };
            case 'failed':
            case 'disconnected':
                return { color: 'bg-red-500', text: 'Connection Lost', pulse: false };
            default:
                return { color: 'bg-gray-500', text: 'Initializing...', pulse: true };
        }
    };

    const quality = getConnectionQuality();

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm">
            <div className={`relative w-full ${isFullscreen ? 'h-full' : 'max-w-6xl h-[90vh]'} bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl overflow-hidden shadow-2xl border border-gray-700 flex flex-col transition-all duration-300`}>

                {/* Header */}
                <div className="absolute top-0 left-0 right-0 p-6 z-10 flex justify-between items-start bg-gradient-to-b from-black/80 via-black/40 to-transparent">
                    <div className="text-white">
                        <h3 className="text-2xl font-bold mb-1">
                            {isIncoming
                                ? `${callerName} 📞 ${user?.name || 'You'}`
                                : `${user?.name || 'You'} 📞 ${callerName || '...'}`
                            }
                        </h3>
                        <div className="flex items-center gap-3">
                            <div className={`flex items-center gap-2 px-3 py-1 rounded-full bg-black/40 backdrop-blur-sm`}>
                                <div className={`w-2 h-2 rounded-full ${quality.color} ${quality.pulse ? 'animate-pulse' : ''}`}></div>
                                <span className="text-sm font-medium">{isVideoCall ? 'Video Call' : 'Audio Call'}</span>
                            </div>
                            <div className={`flex items-center gap-2 px-3 py-1 rounded-full bg-black/40 backdrop-blur-sm`}>
                                <span className="text-sm font-medium">{quality.text}</span>
                            </div>
                            {callAccepted && connectionState === 'connected' && startTime && (
                                <div className="px-3 py-1 rounded-full bg-black/40 backdrop-blur-sm">
                                    <CallTimer startTime={startTime} />
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setIsFullscreen(!isFullscreen)}
                            className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all backdrop-blur-sm"
                            title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
                        >
                            {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                        </button>
                        <button
                            onClick={leaveCall}
                            className="p-2 bg-red-500/20 hover:bg-red-500 text-red-500 hover:text-white rounded-lg transition-all backdrop-blur-sm"
                            title="Close"
                        >
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Main Video Area */}
                <div className="relative flex-1 bg-gradient-to-br from-gray-900 to-black flex items-center justify-center overflow-hidden">
                    {mediaError ? (
                        <div className="text-white flex flex-col items-center p-8 text-center max-w-md">
                            {/* Error View */}
                            <div className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center mb-6 backdrop-blur-sm border border-red-500/30">
                                <VideoOff size={48} className="text-red-400" />
                            </div>
                            <h3 className="text-2xl font-bold mb-3">Camera Error</h3>
                            <p className="text-gray-300 mb-8 leading-relaxed">{mediaError}</p>
                            <div className="flex gap-4">
                                <button
                                    onClick={leaveCall}
                                    className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl font-medium transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={getMedia}
                                    className="px-6 py-3 bg-aurora-600 hover:bg-aurora-700 rounded-xl font-medium transition-all shadow-lg shadow-aurora-500/30"
                                >
                                    Retry
                                </button>
                            </div>
                        </div>
                    ) : callAccepted && !callEnded && remoteStream && isVideoCall ? (
                        <video
                            playsInline
                            ref={userVideoRef}
                            autoPlay
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="text-white flex flex-col items-center">
                            {/* Avatar/Waiting View */}
                            <div className="w-32 h-32 bg-gradient-to-br from-aurora-500 to-aurora-700 rounded-full flex items-center justify-center text-4xl font-bold mb-6 shadow-2xl shadow-aurora-500/50 animate-pulse">
                                {callerName ? callerName[0].toUpperCase() : (userToCall ? 'C' : 'U')}
                            </div>
                            <p className="text-2xl mb-2 font-semibold">
                                {callAccepted ? (isIncoming ? callerName : "Connected") : (isIncoming ? `${callerName} is calling...` : `Calling ${callerName || '...'}...`)}
                            </p>
                            <p className="text-gray-400 mb-8">
                                {callAccepted ? "Call in progress" : (isIncoming ? (isVideoCall ? "Incoming video call" : "Incoming audio call") : "Waiting for response...")}
                            </p>

                            {/* Incoming Call Actions */}
                            {isIncoming && !callAccepted && (
                                <div className="flex items-center gap-6">
                                    <button
                                        onClick={answerCall}
                                        className="px-10 py-4 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-full font-semibold shadow-2xl shadow-green-500/50 transform hover:scale-105 transition-all flex items-center gap-3 text-lg"
                                    >
                                        {isVideoCall ? <Video size={24} /> : <Mic size={24} />}
                                        Answer
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* My Video (PiP) */}
                    {stream && !mediaError && isVideoCall === true && (
                        <div className="absolute bottom-28 right-6 w-64 h-48 bg-gray-900 rounded-2xl overflow-hidden border-2 border-gray-600 shadow-2xl group hover:scale-105 transition-transform">
                            {isVideoOff ? (
                                <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                                    <div className="text-center">
                                        <div className="w-16 h-16 bg-aurora-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-2">
                                            {user?.name?.[0]?.toUpperCase() || 'Y'}
                                        </div>
                                        <p className="text-sm text-gray-400">Camera Off</p>
                                    </div>
                                </div>
                            ) : (
                                <video
                                    playsInline
                                    muted
                                    ref={myVideoRef}
                                    autoPlay
                                    className="w-full h-full object-cover mirror"
                                />
                            )}
                            <div className="absolute top-2 left-2 px-2 py-1 bg-black/60 backdrop-blur-sm rounded text-xs text-white font-medium">
                                You
                            </div>
                        </div>
                    )}
                </div>

                {/* Controls */}
                <div className="h-24 bg-gradient-to-t from-black via-gray-900 to-gray-900/50 border-t border-gray-800 flex items-center justify-center gap-4 px-6 z-20">
                    <button
                        onClick={toggleMute}
                        disabled={!stream}
                        className={`p-4 rounded-full transition-all duration-200 flex items-center justify-center active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${isMuted
                            ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/50 ring-2 ring-red-500/30'
                            : 'bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/10'
                            }`}
                        title={isMuted ? "Unmute Microphone" : "Mute Microphone"}
                    >
                        {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
                    </button>

                    {isVideoCall && (
                        <button
                            onClick={toggleVideo}
                            disabled={!stream}
                            className={`p-4 rounded-full transition-all duration-200 flex items-center justify-center active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${isVideoOff
                                ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/50 ring-2 ring-red-500/30'
                                : 'bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/10'
                                }`}
                            title={isVideoOff ? "Turn Camera On" : "Turn Camera Off"}
                        >
                            {isVideoOff ? <VideoOff size={24} /> : <Video size={24} />}
                        </button>
                    )}

                    {isVideoCall && (
                        <button
                            onClick={toggleScreenShare}
                            disabled={!stream}
                            className={`p-4 rounded-full transition-all duration-200 flex items-center justify-center active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${isScreenSharing
                                ? 'bg-aurora-600 hover:bg-aurora-700 text-white shadow-lg shadow-aurora-500/50 ring-2 ring-aurora-500/30'
                                : 'bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/10'
                                }`}
                            title={isScreenSharing ? "Stop Sharing" : "Share Screen"}
                        >
                            {isScreenSharing ? <MonitorOff size={24} /> : <Monitor size={24} />}
                        </button>
                    )}

                    <button
                        onClick={leaveCall}
                        className="p-5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-full shadow-2xl shadow-red-500/50 transform hover:scale-105 active:scale-95 transition-all ml-4 border border-red-500/30 flex items-center justify-center"
                        title="End Call"
                    >
                        <PhoneOff size={28} />
                    </button>
                </div>
            </div>

            {/* Custom styles */}
            <style>{`
                .mirror {
                    transform: scaleX(-1);
                }
            `}</style>
        </div>
    );
};

export default VideoCall;
