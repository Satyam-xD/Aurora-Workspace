import { useState, useRef, useEffect, useCallback } from 'react';
import { useChatContext } from '../../context/ChatContext';
import { logger } from '../../utils/logger';

export const useDirectCall = ({
    isIncoming,
    callerSignal,
    callerId,
    userToCall,
    onEndCall,
    onAnswer,
    isVideoCall = true
}) => {
    const { socketRef, user } = useChatContext();
    const [stream, setStream] = useState(null);
    const [callAccepted, setCallAccepted] = useState(false);
    const [callEnded, setCallEnded] = useState(false);
    const [remoteStream, setRemoteStream] = useState(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(!isVideoCall);
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [mediaError, setMediaError] = useState(null);
    const [connectionState, setConnectionState] = useState('connecting');
    const [startTime, setStartTime] = useState(null);

    const myVideo = useRef();
    const userVideo = useRef();
    const connectionRef = useRef();
    const streamRef = useRef();
    const screenStreamRef = useRef(); // Track screen share stream for cleanup
    const candidateQueue = useRef([]);
    const callStartTime = useRef(null);

    // Cleanup function
    const cleanup = useCallback(() => {
        logger.log("Cleaning up resources");

        if (connectionRef.current) {
            connectionRef.current.close();
            connectionRef.current = null;
        }

        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => {
                track.stop();
                logger.log(`Stopped ${track.kind} track`);
            });
            streamRef.current = null;
        }

        if (screenStreamRef.current) {
            screenStreamRef.current.getTracks().forEach(track => {
                track.stop();
                logger.log(`Stopped screen share track`);
            });
            screenStreamRef.current = null;
        }

        setStream(null);
        setRemoteStream(null);
    }, []);

    // Get media function
    const getMedia = useCallback(async () => {
        setMediaError(null);
        try {
            const constraints = {
                video: isVideoCall ? {
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                } : false,
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            };

            const currentStream = await navigator.mediaDevices.getUserMedia(constraints);

            logger.log("Media stream obtained");
            setStream(currentStream);
            streamRef.current = currentStream;

            if (myVideo.current && isVideoCall) {
                myVideo.current.srcObject = currentStream;
            }

            return currentStream;
        } catch (err) {
            logger.error("Error accessing media devices:", err);
            setMediaError(
                err.name === 'NotReadableError'
                    ? "Microphone (or Camera) is in use by another app."
                    : err.name === 'NotAllowedError'
                        ? "Please allow microphone (and camera) access."
                        : "Could not access media devices. Please check your device."
            );
            // Don't throw, just let the UI handle the error state
            return null;
        }
    }, [isVideoCall]);

    // Process queued ICE candidates
    const processCandidateQueue = useCallback(() => {
        const peer = connectionRef.current;
        if (!peer || !peer.remoteDescription) return;

        logger.log(`Processing ${candidateQueue.current.length} queued candidates`);
        while (candidateQueue.current.length > 0) {
            const candidate = candidateQueue.current.shift();
            peer.addIceCandidate(candidate)
                .catch(e => console.error("Error processing queued candidate:", e));
        }
    }, []);

    const createPeerConnection = useCallback((mediaStream) => {
        logger.log("Creating new peer connection");

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
        if (mediaStream) {
            mediaStream.getTracks().forEach(track => {
                logger.log(`Adding ${track.kind} track to peer connection`);
                peer.addTrack(track, mediaStream);
            });
        }

        // Handle remote stream
        peer.ontrack = (event) => {
            logger.log("Received remote track:", event.streams[0]);
            setRemoteStream(event.streams[0]);
            if (userVideo.current && event.streams[0]) {
                userVideo.current.srcObject = event.streams[0];
            }
        };

        // Handle ICE candidates
        peer.onicecandidate = (event) => {
            if (event.candidate && socketRef.current?.connected) {
                logger.log("Sending ICE candidate");
                socketRef.current.emit("ice-candidate", {
                    to: isIncoming ? callerId : userToCall,
                    candidate: event.candidate
                });
            }
        };

        // Handle connection state changes
        peer.onconnectionstatechange = () => {
            logger.log("Connection state:", peer.connectionState);
            setConnectionState(peer.connectionState);

            if (peer.connectionState === 'connected') {
                logger.log("Peer connection established!");
                if (!callStartTime.current) {
                    const start = Date.now();
                    callStartTime.current = start;
                    setStartTime(start);
                }
            } else if (peer.connectionState === 'failed' || peer.connectionState === 'disconnected') {
                logger.log("Connection failed or disconnected");
                setConnectionState('failed');
            }
        };

        peer.oniceconnectionstatechange = () => {
            logger.log("ICE connection state:", peer.iceConnectionState);
        };

        return peer;
    }, [isIncoming, callerId, userToCall, socketRef]);

    // Initialize media and socket listeners
    useEffect(() => {
        let mounted = true;

        const initializeCall = async () => {
            try {
                const mediaStream = await getMedia();

                // Even if media fails, we might still want to proceed with call logic (e.g. audio only or listen only)
                // But for now, if media fails, getMedia returns null and sets error.
                if (!mediaStream && !mounted) return;

                if (!mounted) {
                    if (mediaStream) mediaStream.getTracks().forEach(track => track.stop());
                    return;
                }

                const socket = socketRef.current;
                if (!socket) return;

                // Socket event listeners
                const handleCallAccepted = async (signal) => {
                    logger.log("Call accepted, setting remote description");
                    setCallAccepted(true);
                    const peer = connectionRef.current;

                    if (peer && signal) {
                        try {
                            await peer.setRemoteDescription(new RTCSessionDescription(signal));
                            logger.log("Remote description set, processing candidates");
                            processCandidateQueue();
                        } catch (e) {
                            logger.error("Error setting remote description:", e);
                        }
                    }
                };

                const handleCallEnded = () => {
                    logger.log("Call ended by remote peer");
                    if (mounted) {
                        setCallEnded(true);
                        cleanup();
                        if (onEndCall) onEndCall();
                    }
                };

                const handleIceCandidate = (candidate) => {
                    logger.log("Received ICE candidate");
                    const peer = connectionRef.current;

                    if (peer) {
                        const iceCandidate = new RTCIceCandidate(candidate);

                        if (peer.remoteDescription && peer.remoteDescription.type) {
                            logger.log("Adding ICE candidate immediately");
                            peer.addIceCandidate(iceCandidate)
                                .catch(e => logger.error("Error adding ICE candidate:", e));
                        } else {
                            logger.log("Queueing ICE candidate");
                            candidateQueue.current.push(iceCandidate);
                        }
                    }
                };

                socket.on("callAccepted", handleCallAccepted);
                socket.on("callEnded", handleCallEnded);
                socket.on("ice-candidate", handleIceCandidate);

                // Create peer connection after media is ready (or attempting to)
                // Pass mediaStream only if it exists
                if (mediaStream) {
                    const peer = createPeerConnection(mediaStream);

                    // If outgoing call, create and send offer
                    if (!isIncoming && userToCall) {
                        logger.log("Creating offer for outgoing call");
                        try {
                            const offer = await peer.createOffer({
                                offerToReceiveAudio: true,
                                offerToReceiveVideo: true
                            });
                            await peer.setLocalDescription(offer);

                            logger.log("Sending offer to", userToCall);
                            socket.emit("callUser", {
                                userToCall: userToCall,
                                signalData: peer.localDescription,
                                from: user?._id || user?.id,
                                name: user?.name,
                                isVideo: isVideoCall
                            });
                        } catch (err) {
                            logger.error("Error creating offer:", err);
                            setMediaError("Failed to initiate call. Please try again.");
                        }
                    }
                }

                // Store cleanup for these specific listeners
                return () => {
                    socket.off("callAccepted", handleCallAccepted);
                    socket.off("callEnded", handleCallEnded);
                    socket.off("ice-candidate", handleIceCandidate);
                };

            } catch (err) {
                logger.error("Failed to initialize call:", err);
            }
        };

        const cleanupListeners = initializeCall();

        return () => {
            mounted = false;
            cleanupListeners.then(cleanupFn => cleanupFn && cleanupFn());
            cleanup();
        };
    }, [getMedia, createPeerConnection, cleanup, isIncoming, userToCall, isVideoCall, user, socketRef, onEndCall]);

    // Answer incoming call
    const answerCall = async () => {
        logger.log("Answering call");
        setCallAccepted(true);
        if (onAnswer) onAnswer();
        const peer = connectionRef.current;

        if (!peer) {
            logger.error("No peer connection available");
            return;
        }

        try {
            await peer.setRemoteDescription(new RTCSessionDescription(callerSignal));
            logger.log("Remote offer set, processing candidates");
            processCandidateQueue();

            const answer = await peer.createAnswer();
            await peer.setLocalDescription(answer);

            logger.log("Sending answer to", callerId);
            if (socketRef.current?.connected) {
                socketRef.current.emit("answerCall", {
                    signal: peer.localDescription,
                    to: callerId
                });
            }
        } catch (e) {
            logger.error("Error answering call:", e);
            setMediaError("Failed to answer call. Please try again.");
        }
    };

    // Leave call
    const leaveCall = useCallback(() => {
        logger.log("Leaving call");
        setCallEnded(true);
        cleanup();

        if (socketRef.current?.connected) {
            socketRef.current.emit("endCall", {
                to: isIncoming ? callerId : userToCall
            });
        }

        if (onEndCall) onEndCall();
    }, [cleanup, isIncoming, callerId, userToCall, socketRef, onEndCall]);

    // Toggle mute
    const toggleMute = useCallback(() => {
        if (streamRef.current) {
            const audioTrack = streamRef.current.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsMuted(!audioTrack.enabled);
            }
        }
    }, []);

    // Toggle video
    const toggleVideo = useCallback(() => {
        if (streamRef.current) {
            const videoTrack = streamRef.current.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                setIsVideoOff(!videoTrack.enabled);
            }
        }
    }, []);

    // Toggle screen sharing
    const toggleScreenShare = async () => {
        if (!isScreenSharing) {
            try {
                const screenStream = await navigator.mediaDevices.getDisplayMedia({
                    video: { cursor: "always" },
                    audio: false
                });

                screenStreamRef.current = screenStream; // Store for cleanup

                const screenTrack = screenStream.getVideoTracks()[0];
                const peer = connectionRef.current;
                const videoTrack = streamRef.current?.getVideoTracks()[0];

                if (peer && screenTrack) {
                    const sender = peer.getSenders().find(s => s.track?.kind === 'video');
                    if (sender) {
                        sender.replaceTrack(screenTrack);
                    }
                }

                // When screen sharing stops (user clicks 'Stop sharing' in browser UI)
                screenTrack.onended = () => {
                    const currentVideoTrack = streamRef.current?.getVideoTracks()[0];
                    const currentPeer = connectionRef.current;

                    if (currentVideoTrack && currentPeer) {
                        const sender = currentPeer.getSenders().find(s => s.track?.kind === 'video');
                        if (sender) {
                            sender.replaceTrack(currentVideoTrack);
                        }
                    }
                    setIsScreenSharing(false);
                    screenStreamRef.current = null;
                };

                setIsScreenSharing(true);
            } catch (err) {
                logger.error("Error sharing screen:", err);
            }
        } else {
            // Manually stop screen sharing
            const videoTrack = streamRef.current?.getVideoTracks()[0];
            const peer = connectionRef.current;

            if (screenStreamRef.current) {
                screenStreamRef.current.getTracks().forEach(track => track.stop());
                screenStreamRef.current = null;
            }

            if (videoTrack && peer) {
                const sender = peer.getSenders().find(s => s.track?.kind === 'video');
                if (sender) {
                    sender.replaceTrack(videoTrack);
                }
            }
            setIsScreenSharing(false);
        }
    };

    return {
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
        myVideoRef: myVideo,
        userVideoRef: userVideo,
        answerCall,
        leaveCall,
        toggleMute,
        toggleVideo,
        toggleScreenShare,
        getMedia
    };
};
