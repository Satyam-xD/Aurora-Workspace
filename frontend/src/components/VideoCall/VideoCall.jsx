import React, { useEffect, useRef, useState } from 'react';
import { useChatContext } from '../../context/ChatContext';
import { Mic, MicOff, Video, VideoOff, PhoneOff, X, Monitor, MonitorOff, Maximize2, Minimize2 } from 'lucide-react';

const VideoCall = ({ isIncoming, callerSignal, callerName, callerId, userToCall, onEndCall }) => {
    const { socketRef, user } = useChatContext();
    const [stream, setStream] = useState(null);
    const [callAccepted, setCallAccepted] = useState(false);
    const [callEnded, setCallEnded] = useState(false);
    const [remoteStream, setRemoteStream] = useState(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [mediaError, setMediaError] = useState(null);
    const [connectionState, setConnectionState] = useState('connecting');
    const [callDuration, setCallDuration] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);

    const myVideo = useRef();
    const userVideo = useRef();
    const connectionRef = useRef();
    const streamRef = useRef();
    const candidateQueue = useRef([]);
    const callStartTime = useRef(null);
    const durationInterval = useRef(null);

    // Format call duration
    const formatDuration = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Cleanup function
    const cleanup = () => {
        console.log("Cleaning up resources");

        if (durationInterval.current) {
            clearInterval(durationInterval.current);
            durationInterval.current = null;
        }

        if (connectionRef.current) {
            connectionRef.current.close();
            connectionRef.current = null;
        }

        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => {
                track.stop();
                console.log(`Stopped ${track.kind} track`);
            });
            streamRef.current = null;
        }

        setStream(null);
        setRemoteStream(null);
    };

    // Get media function
    const getMedia = async () => {
        setMediaError(null);
        try {
            const currentStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                },
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });

            console.log("Media stream obtained");
            setStream(currentStream);
            streamRef.current = currentStream;

            if (myVideo.current) {
                myVideo.current.srcObject = currentStream;
            }

            return currentStream;
        } catch (err) {
            console.error("Error accessing media devices:", err);
            setMediaError(
                err.name === 'NotReadableError'
                    ? "Camera/Microphone is in use by another app."
                    : err.name === 'NotAllowedError'
                        ? "Please allow camera and microphone access."
                        : "Could not access camera/microphone. Please check your device."
            );
            throw err;
        }
    };

    // Process queued ICE candidates
    const processCandidateQueue = () => {
        const peer = connectionRef.current;
        if (!peer || !peer.remoteDescription) return;

        console.log(`Processing ${candidateQueue.current.length} queued candidates`);
        while (candidateQueue.current.length > 0) {
            const candidate = candidateQueue.current.shift();
            peer.addIceCandidate(candidate)
                .catch(e => console.error("Error processing queued candidate:", e));
        }
    };

    // Create peer connection
    const createPeerConnection = (mediaStream) => {
        console.log("Creating new peer connection");

        const peer = new RTCPeerConnection({
            iceServers: [
                { urls: "stun:stun.l.google.com:19302" },
                { urls: "stun:stun1.l.google.com:19302" },
                { urls: "stun:stun2.l.google.com:19302" },
                { urls: "stun:global.stun.twilio.com:3478" }
            ],
            iceCandidatePoolSize: 10
        });

        connectionRef.current = peer;

        // Add local tracks
        mediaStream.getTracks().forEach(track => {
            console.log(`Adding ${track.kind} track to peer connection`);
            peer.addTrack(track, mediaStream);
        });

        // Handle remote stream
        peer.ontrack = (event) => {
            console.log("Received remote track:", event.streams[0]);
            setRemoteStream(event.streams[0]);
            if (userVideo.current && event.streams[0]) {
                userVideo.current.srcObject = event.streams[0];
            }
        };

        // Handle ICE candidates
        peer.onicecandidate = (event) => {
            if (event.candidate) {
                console.log("Sending ICE candidate");
                socketRef.current.emit("ice-candidate", {
                    to: isIncoming ? callerId : userToCall,
                    candidate: event.candidate
                });
            }
        };

        // Handle connection state changes
        peer.onconnectionstatechange = () => {
            console.log("Connection state:", peer.connectionState);
            setConnectionState(peer.connectionState);

            if (peer.connectionState === 'connected') {
                console.log("Peer connection established!");
                if (!callStartTime.current) {
                    callStartTime.current = Date.now();
                    durationInterval.current = setInterval(() => {
                        const elapsed = Math.floor((Date.now() - callStartTime.current) / 1000);
                        setCallDuration(elapsed);
                    }, 1000);
                }
            } else if (peer.connectionState === 'failed' || peer.connectionState === 'disconnected') {
                console.log("Connection failed or disconnected");
                setConnectionState('failed');
            }
        };

        peer.oniceconnectionstatechange = () => {
            console.log("ICE connection state:", peer.iceConnectionState);
        };

        return peer;
    };

    // Initialize media and socket listeners
    useEffect(() => {
        let mounted = true;

        const initializeCall = async () => {
            try {
                const mediaStream = await getMedia();

                if (!mounted) {
                    mediaStream.getTracks().forEach(track => track.stop());
                    return;
                }

                const socket = socketRef.current;

                // Socket event listeners
                socket.on("callAccepted", async (signal) => {
                    console.log("Call accepted, setting remote description");
                    setCallAccepted(true);
                    const peer = connectionRef.current;

                    if (peer && signal) {
                        try {
                            await peer.setRemoteDescription(new RTCSessionDescription(signal));
                            console.log("Remote description set, processing candidates");
                            processCandidateQueue();
                        } catch (e) {
                            console.error("Error setting remote description:", e);
                        }
                    }
                });

                socket.on("callEnded", () => {
                    console.log("Call ended by remote peer");
                    if (mounted) {
                        setCallEnded(true);
                        cleanup();
                        if (onEndCall) onEndCall();
                    }
                });

                socket.on("ice-candidate", (candidate) => {
                    console.log("Received ICE candidate");
                    const peer = connectionRef.current;

                    if (peer) {
                        const iceCandidate = new RTCIceCandidate(candidate);

                        if (peer.remoteDescription && peer.remoteDescription.type) {
                            console.log("Adding ICE candidate immediately");
                            peer.addIceCandidate(iceCandidate)
                                .catch(e => console.error("Error adding ICE candidate:", e));
                        } else {
                            console.log("Queueing ICE candidate");
                            candidateQueue.current.push(iceCandidate);
                        }
                    }
                });

                // Create peer connection after media is ready
                const peer = createPeerConnection(mediaStream);

                // If outgoing call, create and send offer
                if (!isIncoming && userToCall) {
                    console.log("Creating offer for outgoing call");
                    try {
                        const offer = await peer.createOffer({
                            offerToReceiveAudio: true,
                            offerToReceiveVideo: true
                        });
                        await peer.setLocalDescription(offer);

                        console.log("Sending offer to", userToCall);
                        socket.emit("callUser", {
                            userToCall: userToCall,
                            signalData: peer.localDescription,
                            from: user._id || user.id,
                            name: user.name
                        });
                    } catch (err) {
                        console.error("Error creating offer:", err);
                        setMediaError("Failed to initiate call. Please try again.");
                    }
                }
            } catch (err) {
                console.error("Failed to initialize call:", err);
            }
        };

        initializeCall();

        return () => {
            mounted = false;
            const socket = socketRef.current;
            if (socket) {
                socket.off("callAccepted");
                socket.off("callEnded");
                socket.off("ice-candidate");
            }
            cleanup();
        };
    }, []);

    // Answer incoming call
    const answerCall = async () => {
        console.log("Answering call");
        setCallAccepted(true);
        const peer = connectionRef.current;

        if (!peer) {
            console.error("No peer connection available");
            return;
        }

        try {
            await peer.setRemoteDescription(new RTCSessionDescription(callerSignal));
            console.log("Remote offer set, processing candidates");
            processCandidateQueue();

            const answer = await peer.createAnswer();
            await peer.setLocalDescription(answer);

            console.log("Sending answer to", callerId);
            socketRef.current.emit("answerCall", {
                signal: peer.localDescription,
                to: callerId
            });
        } catch (e) {
            console.error("Error answering call:", e);
            setMediaError("Failed to answer call. Please try again.");
        }
    };

    // Leave call
    const leaveCall = () => {
        console.log("Leaving call");
        setCallEnded(true);
        cleanup();

        socketRef.current.emit("endCall", {
            to: isIncoming ? callerId : userToCall
        });

        if (onEndCall) onEndCall();
    };

    // Toggle mute
    const toggleMute = () => {
        if (streamRef.current) {
            const audioTrack = streamRef.current.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsMuted(!audioTrack.enabled);
            }
        }
    };

    // Toggle video
    const toggleVideo = () => {
        if (streamRef.current) {
            const videoTrack = streamRef.current.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                setIsVideoOff(!videoTrack.enabled);
            }
        }
    };

    // Toggle screen sharing
    const toggleScreenShare = async () => {
        if (!isScreenSharing) {
            try {
                const screenStream = await navigator.mediaDevices.getDisplayMedia({
                    video: { cursor: "always" },
                    audio: false
                });

                const screenTrack = screenStream.getVideoTracks()[0];
                const peer = connectionRef.current;

                if (peer) {
                    const sender = peer.getSenders().find(s => s.track?.kind === 'video');
                    if (sender) {
                        sender.replaceTrack(screenTrack);
                    }
                }

                // When screen sharing stops
                screenTrack.onended = () => {
                    const videoTrack = streamRef.current?.getVideoTracks()[0];
                    if (videoTrack && peer) {
                        const sender = peer.getSenders().find(s => s.track?.kind === 'video');
                        if (sender) {
                            sender.replaceTrack(videoTrack);
                        }
                    }
                    setIsScreenSharing(false);
                };

                setIsScreenSharing(true);
            } catch (err) {
                console.error("Error sharing screen:", err);
            }
        } else {
            const videoTrack = streamRef.current?.getVideoTracks()[0];
            const peer = connectionRef.current;

            if (videoTrack && peer) {
                const sender = peer.getSenders().find(s => s.track?.kind === 'video');
                if (sender) {
                    sender.replaceTrack(videoTrack);
                }
            }
            setIsScreenSharing(false);
        }
    };

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
                            {isIncoming ? callerName : "Calling..."}
                        </h3>
                        <div className="flex items-center gap-3">
                            <div className={`flex items-center gap-2 px-3 py-1 rounded-full bg-black/40 backdrop-blur-sm`}>
                                <div className={`w-2 h-2 rounded-full ${quality.color} ${quality.pulse ? 'animate-pulse' : ''}`}></div>
                                <span className="text-sm font-medium">{quality.text}</span>
                            </div>
                            {callAccepted && connectionState === 'connected' && (
                                <div className="px-3 py-1 rounded-full bg-black/40 backdrop-blur-sm">
                                    <span className="text-sm font-medium">{formatDuration(callDuration)}</span>
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
                    ) : callAccepted && !callEnded && remoteStream ? (
                        <video
                            playsInline
                            ref={userVideo}
                            autoPlay
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="text-white flex flex-col items-center">
                            <div className="w-32 h-32 bg-gradient-to-br from-aurora-500 to-aurora-700 rounded-full flex items-center justify-center text-4xl font-bold mb-6 shadow-2xl shadow-aurora-500/50 animate-pulse">
                                {isIncoming && callerName ? callerName[0].toUpperCase() : "U"}
                            </div>
                            <p className="text-2xl mb-2 font-semibold">
                                {isIncoming ? `${callerName} is calling...` : "Calling..."}
                            </p>
                            <p className="text-gray-400 mb-8">
                                {isIncoming ? "Incoming video call" : "Waiting for response..."}
                            </p>
                            {isIncoming && !callAccepted && (
                                <button
                                    onClick={answerCall}
                                    className="px-10 py-4 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-full font-semibold shadow-2xl shadow-green-500/50 transform hover:scale-105 transition-all flex items-center gap-3 text-lg"
                                >
                                    <Video size={24} />
                                    Answer Call
                                </button>
                            )}
                        </div>
                    )}

                    {/* My Video (PiP) */}
                    {stream && !mediaError && (
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
                                    ref={myVideo}
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
                <div className="h-24 bg-gradient-to-t from-black via-gray-900 to-gray-900/50 border-t border-gray-800 flex items-center justify-center gap-4 px-6">
                    <button
                        onClick={toggleMute}
                        className={`p-4 rounded-full transition-all transform hover:scale-110 ${isMuted
                                ? 'bg-red-500 text-white shadow-lg shadow-red-500/50'
                                : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                            }`}
                        title={isMuted ? "Unmute" : "Mute"}
                    >
                        {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
                    </button>

                    <button
                        onClick={toggleVideo}
                        className={`p-4 rounded-full transition-all transform hover:scale-110 ${isVideoOff
                                ? 'bg-red-500 text-white shadow-lg shadow-red-500/50'
                                : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                            }`}
                        title={isVideoOff ? "Turn on camera" : "Turn off camera"}
                    >
                        {isVideoOff ? <VideoOff size={24} /> : <Video size={24} />}
                    </button>

                    <button
                        onClick={toggleScreenShare}
                        className={`p-4 rounded-full transition-all transform hover:scale-110 ${isScreenSharing
                                ? 'bg-aurora-600 text-white shadow-lg shadow-aurora-500/50'
                                : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                            }`}
                        title={isScreenSharing ? "Stop sharing" : "Share screen"}
                    >
                        {isScreenSharing ? <MonitorOff size={24} /> : <Monitor size={24} />}
                    </button>

                    <button
                        onClick={leaveCall}
                        className="p-5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-full shadow-2xl shadow-red-500/50 transform hover:scale-110 transition-all ml-4"
                        title="End call"
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
