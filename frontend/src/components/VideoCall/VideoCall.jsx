import React, { useEffect, useRef, useState } from 'react';
import { useChatContext } from '../../context/ChatContext';
import { Mic, MicOff, Video, VideoOff, PhoneOff, X } from 'lucide-react';

const VideoCall = ({ isIncoming, callerSignal, callerName, callerId, userToCall, onEndCall }) => {
    const { socketRef, user } = useChatContext();
    const [stream, setStream] = useState(null);
    const [callAccepted, setCallAccepted] = useState(false);
    const [callEnded, setCallEnded] = useState(false);
    const [remoteStream, setRemoteStream] = useState(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [mediaError, setMediaError] = useState(null);

    const myVideo = useRef();
    const userVideo = useRef();
    const connectionRef = useRef();
    const streamRef = useRef();
    const candidateQueue = useRef([]);

    // Cleanup function
    const cleanup = () => {
        console.log("Cleaning up resources");
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
    };

    // Get media function
    const getMedia = () => {
        setMediaError(null);
        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then((currentStream) => {
                console.log("Media stream obtained");
                setStream(currentStream);
                streamRef.current = currentStream;
                if (myVideo.current) {
                    myVideo.current.srcObject = currentStream;
                }
            })
            .catch(err => {
                console.error("Error accessing media devices:", err);
                setMediaError(
                    err.name === 'NotReadableError'
                        ? "Camera/Microphone is in use by another app."
                        : "Could not access camera/microphone. Please grant permissions."
                );
            });
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

    // Initialize media and socket listeners
    useEffect(() => {
        getMedia();

        const socket = socketRef.current;

        socket.on("callAccepted", (signal) => {
            console.log("Call accepted, setting remote description");
            setCallAccepted(true);
            const peer = connectionRef.current;
            if (peer) {
                peer.setRemoteDescription(new RTCSessionDescription(signal))
                    .then(() => {
                        console.log("Remote description set, processing candidates");
                        processCandidateQueue();
                    })
                    .catch(e => console.error("Error setting remote description:", e));
            }
        });

        socket.on("callEnded", () => {
            console.log("Call ended by remote peer");
            setCallEnded(true);
            cleanup();
            if (onEndCall) onEndCall();
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

        return () => {
            socket.off("callAccepted");
            socket.off("callEnded");
            socket.off("ice-candidate");
            cleanup();
        };
    }, []);

    // Setup WebRTC peer connection
    useEffect(() => {
        if (!stream) return;

        // Cleanup existing peer if any
        if (connectionRef.current) {
            console.log("Cleaning up existing peer connection");
            connectionRef.current.close();
        }

        console.log("Creating new peer connection");
        const peer = new RTCPeerConnection({
            iceServers: [
                { urls: "stun:stun.l.google.com:19302" },
                { urls: "stun:global.stun.twilio.com:3478" }
            ]
        });

        connectionRef.current = peer;

        // Add local tracks
        stream.getTracks().forEach(track => {
            console.log(`Adding ${track.kind} track`);
            peer.addTrack(track, stream);
        });

        // Handle remote stream
        peer.ontrack = (event) => {
            console.log("Received remote track");
            setRemoteStream(event.streams[0]);
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
        };

        // Create offer if initiating call
        if (!isIncoming) {
            console.log("Creating offer");
            peer.createOffer()
                .then(offer => peer.setLocalDescription(offer))
                .then(() => {
                    console.log("Sending offer to", userToCall);
                    socketRef.current.emit("callUser", {
                        userToCall: userToCall,
                        signalData: peer.localDescription,
                        from: user._id || user.id,
                        name: user.name
                    });
                })
                .catch(err => console.error("Error creating offer:", err));
        }

        return () => {
            console.log("Peer connection effect cleanup");
            if (peer && peer.connectionState !== 'closed') {
                peer.close();
            }
        };
    }, [stream, isIncoming, userToCall]);

    // Attach remote stream to video element
    useEffect(() => {
        if (remoteStream && userVideo.current) {
            console.log("Attaching remote stream to video element");
            userVideo.current.srcObject = remoteStream;
        }
    }, [remoteStream]);

    // Answer incoming call
    const answerCall = () => {
        console.log("Answering call");
        setCallAccepted(true);
        const peer = connectionRef.current;

        if (!peer) {
            console.error("No peer connection available");
            return;
        }

        peer.setRemoteDescription(new RTCSessionDescription(callerSignal))
            .then(() => {
                console.log("Remote offer set, processing candidates");
                processCandidateQueue();
                return peer.createAnswer();
            })
            .then(answer => peer.setLocalDescription(answer))
            .then(() => {
                console.log("Sending answer to", callerId);
                socketRef.current.emit("answerCall", {
                    signal: peer.localDescription,
                    to: callerId
                });
            })
            .catch(e => console.error("Error answering call:", e));
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

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
            <div className="relative w-full max-w-5xl h-[90vh] bg-gray-900 rounded-2xl overflow-hidden shadow-2xl border border-gray-800 flex flex-col">

                {/* Header */}
                <div className="absolute top-0 left-0 right-0 p-4 z-10 flex justify-between items-center bg-gradient-to-b from-black/60 to-transparent">
                    <div className="text-white">
                        <h3 className="text-xl font-semibold">
                            {isIncoming ? callerName : "Calling..."}
                        </h3>
                        <p className="text-sm text-gray-300">
                            {callAccepted ? "Connected" : "Connecting..."}
                        </p>
                    </div>
                    <button
                        onClick={leaveCall}
                        className="p-2 bg-red-500/20 hover:bg-red-500 text-red-500 hover:text-white rounded-full transition-all"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Main Video Area */}
                <div className="relative flex-1 bg-black flex items-center justify-center">
                    {mediaError ? (
                        <div className="text-white flex flex-col items-center p-8 text-center">
                            <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mb-6">
                                <VideoOff size={40} className="text-red-500" />
                            </div>
                            <h3 className="text-xl font-bold mb-2">Camera Error</h3>
                            <p className="text-gray-400 mb-8 max-w-md">{mediaError}</p>
                            <div className="flex gap-4">
                                <button
                                    onClick={leaveCall}
                                    className="px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={getMedia}
                                    className="px-6 py-2 bg-aurora-600 hover:bg-aurora-700 rounded-lg font-medium transition-colors"
                                >
                                    Retry
                                </button>
                            </div>
                        </div>
                    ) : callAccepted && !callEnded ? (
                        <video
                            playsInline
                            ref={userVideo}
                            autoPlay
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="text-white flex flex-col items-center">
                            <div className="w-24 h-24 bg-aurora-500 rounded-full flex items-center justify-center text-3xl font-bold mb-4 animate-pulse">
                                {isIncoming && callerName ? callerName[0] : "U"}
                            </div>
                            <p className="text-xl mb-2">
                                {isIncoming ? `${callerName} is calling...` : "Calling..."}
                            </p>
                            {isIncoming && !callAccepted && (
                                <button
                                    onClick={answerCall}
                                    className="mt-8 px-8 py-3 bg-green-500 hover:bg-green-600 text-white rounded-full font-semibold shadow-lg transform hover:scale-105 transition-all flex items-center gap-2"
                                >
                                    <Video size={20} />
                                    Answer Call
                                </button>
                            )}
                        </div>
                    )}

                    {/* My Video (PiP) */}
                    {stream && !mediaError && (
                        <div className="absolute bottom-24 right-6 w-48 h-36 bg-gray-800 rounded-xl overflow-hidden border-2 border-gray-700 shadow-xl">
                            <video
                                playsInline
                                muted
                                ref={myVideo}
                                autoPlay
                                className="w-full h-full object-cover"
                            />
                        </div>
                    )}
                </div>

                {/* Controls */}
                <div className="h-20 bg-gray-900 border-t border-gray-800 flex items-center justify-center gap-6">
                    <button
                        onClick={toggleMute}
                        className={`p-4 rounded-full transition-all ${isMuted
                                ? 'bg-red-500 text-white'
                                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                            }`}
                    >
                        {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
                    </button>

                    <button
                        onClick={toggleVideo}
                        className={`p-4 rounded-full transition-all ${isVideoOff
                                ? 'bg-red-500 text-white'
                                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                            }`}
                    >
                        {isVideoOff ? <VideoOff size={24} /> : <Video size={24} />}
                    </button>

                    <button
                        onClick={leaveCall}
                        className="p-4 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-lg transform hover:scale-105 transition-all"
                    >
                        <PhoneOff size={28} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VideoCall;
