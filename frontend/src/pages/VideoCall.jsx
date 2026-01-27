import React, { useState, useEffect, useRef } from 'react';
import { useChatContext } from '../context/ChatContext';
import { Video, Copy, Check, Plus, LogIn, Users, Sparkles, ArrowRight, Phone, Monitor, Mic, MicOff, VideoOff, MessageSquare, Send, X } from 'lucide-react';

const VideoCallPage = () => {
    const { user, socketRef } = useChatContext();
    const [roomId, setRoomId] = useState('');
    const [inputRoomId, setInputRoomId] = useState('');
    const [isInRoom, setIsInRoom] = useState(false);
    const [copied, setCopied] = useState(false);
    const [participants, setParticipants] = useState([]);
    const [stream, setStream] = useState(null);
    const [remoteStreams, setRemoteStreams] = useState(new Map());
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [hasMedia, setHasMedia] = useState(false);

    // Chat state
    const [messages, setMessages] = useState([]);
    const [messageInput, setMessageInput] = useState('');
    const [showChat, setShowChat] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    const myVideoRef = useRef();
    const peersRef = useRef(new Map());
    const streamRef = useRef(null);
    const messagesEndRef = useRef(null);

    // Auto-scroll chat
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    // Generate random room ID
    const generateRoomId = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let id = '';
        for (let i = 0; i < 9; i++) {
            if (i === 3 || i === 6) id += '-';
            else id += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return id;
    };

    // Copy room ID to clipboard
    const copyRoomId = () => {
        navigator.clipboard.writeText(roomId);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Get user media (optional)
    const getUserMedia = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { width: { ideal: 1280 }, height: { ideal: 720 } },
                audio: { echoCancellation: true, noiseSuppression: true }
            });
            setStream(mediaStream);
            streamRef.current = mediaStream;
            setHasMedia(true);
            if (myVideoRef.current) {
                myVideoRef.current.srcObject = mediaStream;
            }
            return mediaStream;
        } catch (err) {
            console.log('Media not available, joining without camera/mic');
            setHasMedia(false);
            return null;
        }
    };

    // Enable media later
    const enableMedia = async () => {
        const mediaStream = await getUserMedia();
        if (mediaStream && peersRef.current.size > 0) {
            // Add tracks to existing peer connections
            peersRef.current.forEach(peer => {
                mediaStream.getTracks().forEach(track => {
                    peer.addTrack(track, mediaStream);
                });
            });
        }
    };

    // Create a new room
    const createRoom = async () => {
        const newRoomId = generateRoomId();
        await getUserMedia(); // Try to get media, but don't fail if unavailable

        setRoomId(newRoomId);
        setIsInRoom(true);
        // Participants will be set by the roomJoined socket event

        // Join the room via socket
        socketRef.current.emit('joinRoom', {
            roomId: newRoomId,
            userId: user._id,
            userName: user.name
        });
    };

    // Join existing room
    const joinRoom = async () => {
        if (!inputRoomId.trim()) {
            alert('Please enter a room ID');
            return;
        }

        await getUserMedia(); // Try to get media, but don't fail if unavailable

        setRoomId(inputRoomId.toUpperCase());
        setIsInRoom(true);

        // Join the room via socket
        socketRef.current.emit('joinRoom', {
            roomId: inputRoomId.toUpperCase(),
            userId: user._id,
            userName: user.name
        });
    };

    // Send message
    const sendMessage = () => {
        if (!messageInput.trim()) return;

        const message = {
            id: Date.now(),
            text: messageInput,
            sender: user.name,
            senderId: user._id,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        // Add to local messages
        setMessages(prev => [...prev, message]);

        // Send via socket
        socketRef.current.emit('roomMessage', {
            roomId,
            message
        });

        setMessageInput('');
    };

    // Leave room
    const leaveRoom = () => {
        // Stop all tracks
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
        }

        // Close all peer connections
        peersRef.current.forEach(peer => peer.close());
        peersRef.current.clear();

        // Leave socket room
        if (socketRef.current) {
            socketRef.current.emit('leaveRoom', { roomId, userId: user._id });
        }

        setIsInRoom(false);
        setRoomId('');
        setInputRoomId('');
        setParticipants([]);
        setStream(null);
        setRemoteStreams(new Map());
        setMessages([]);
        setHasMedia(false);
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

    // Socket event handlers
    useEffect(() => {
        if (!socketRef.current || !isInRoom) return;

        const socket = socketRef.current;

        // Room joined confirmation (for the user who just joined)
        socket.on('roomJoined', ({ participants }) => {
            console.log('Successfully joined room with participants:', participants);
            setParticipants(participants);

            // Create peer connections for existing users
            participants.forEach(p => {
                if (p.id !== user._id) {
                    createPeerConnection(p.id, p.name, true);
                }
            });
        });

        // User joined the room (for other users already in the room)
        socket.on('userJoinedRoom', ({ userId, userName, participants: roomParticipants }) => {
            console.log('User joined:', userName);
            setParticipants(roomParticipants);

            // Create peer connection for new user (even without media)
            if (userId !== user._id) {
                createPeerConnection(userId, userName, true);
            }
        });

        // User left the room
        socket.on('userLeftRoom', ({ userId, participants: roomParticipants }) => {
            console.log('User left:', userId);
            setParticipants(roomParticipants);

            // Close and remove peer connection
            const peer = peersRef.current.get(userId);
            if (peer) {
                peer.close();
                peersRef.current.delete(userId);
            }

            setRemoteStreams(prev => {
                const newMap = new Map(prev);
                newMap.delete(userId);
                return newMap;
            });
        });

        // Receive offer
        socket.on('receiveOffer', async ({ from, fromName, offer }) => {
            console.log('Received offer from:', fromName);
            const peer = createPeerConnection(from, fromName, false);

            try {
                await peer.setRemoteDescription(new RTCSessionDescription(offer));
                const answer = await peer.createAnswer();
                await peer.setLocalDescription(answer);

                socket.emit('sendAnswer', {
                    to: from,
                    answer: peer.localDescription,
                    roomId
                });
            } catch (err) {
                console.error('Error handling offer:', err);
            }
        });

        // Receive answer
        socket.on('receiveAnswer', async ({ from, answer }) => {
            console.log('Received answer from:', from);
            const peer = peersRef.current.get(from);

            if (peer) {
                try {
                    await peer.setRemoteDescription(new RTCSessionDescription(answer));
                } catch (err) {
                    console.error('Error setting remote description:', err);
                }
            }
        });

        // Receive ICE candidate
        socket.on('receiveIceCandidate', async ({ from, candidate }) => {
            const peer = peersRef.current.get(from);

            if (peer) {
                try {
                    await peer.addIceCandidate(new RTCIceCandidate(candidate));
                } catch (err) {
                    console.error('Error adding ICE candidate:', err);
                }
            }
        });

        // Receive room message
        socket.on('roomMessage', ({ message }) => {
            setMessages(prev => [...prev, message]);
            if (!showChat) {
                setUnreadCount(prev => prev + 1);
            }
        });

        return () => {
            socket.off('roomJoined');
            socket.off('userJoinedRoom');
            socket.off('userLeftRoom');
            socket.off('receiveOffer');
            socket.off('receiveAnswer');
            socket.off('receiveIceCandidate');
            socket.off('roomMessage');
        };
    }, [isInRoom, roomId, user, showChat]);

    // Reset unread when opening chat
    useEffect(() => {
        if (showChat) {
            setUnreadCount(0);
        }
    }, [showChat]);

    // Create peer connection
    const createPeerConnection = (userId, userName, isInitiator) => {
        const peer = new RTCPeerConnection({
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' }
            ]
        });

        peersRef.current.set(userId, peer);

        // Add local stream if available
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => {
                peer.addTrack(track, streamRef.current);
            });
        }

        // Handle remote stream
        peer.ontrack = (event) => {
            console.log('Received remote track from:', userName);
            setRemoteStreams(prev => new Map(prev).set(userId, {
                stream: event.streams[0],
                name: userName
            }));
        };

        // Handle ICE candidates
        peer.onicecandidate = (event) => {
            if (event.candidate) {
                socketRef.current.emit('sendIceCandidate', {
                    to: userId,
                    candidate: event.candidate,
                    roomId
                });
            }
        };

        // If initiator, create and send offer
        if (isInitiator) {
            peer.createOffer()
                .then(offer => peer.setLocalDescription(offer))
                .then(() => {
                    socketRef.current.emit('sendOffer', {
                        to: userId,
                        offer: peer.localDescription,
                        roomId
                    });
                })
                .catch(err => console.error('Error creating offer:', err));
        }

        return peer;
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
            peersRef.current.forEach(peer => peer.close());
        };
    }, []);

    if (isInRoom) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white p-4 flex flex-col">
                {/* Header */}
                <div className="mb-4">
                    <div className="flex items-center justify-between bg-gray-800/50 backdrop-blur-lg rounded-2xl p-4 border border-gray-700">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <div className="w-10 h-10 bg-gradient-to-br from-aurora-500 to-aurora-700 rounded-xl flex items-center justify-center">
                                    <Video size={20} />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-400">Room ID</p>
                                    <p className="font-mono font-bold text-lg">{roomId}</p>
                                </div>
                            </div>
                            <button
                                onClick={copyRoomId}
                                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg flex items-center gap-2 transition-all"
                            >
                                {copied ? <Check size={16} /> : <Copy size={16} />}
                                {copied ? 'Copied!' : 'Copy ID'}
                            </button>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 px-4 py-2 bg-gray-700/50 rounded-lg">
                                <Users size={18} />
                                <span className="font-semibold">{participants.length}</span>
                            </div>
                            <button
                                onClick={leaveRoom}
                                className="px-6 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-semibold transition-all"
                            >
                                Leave Room
                            </button>
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 flex gap-4 overflow-hidden">
                    {/* Video Grid */}
                    <div className={`flex-1 ${showChat ? 'lg:w-2/3' : 'w-full'}`}>
                        <div className={`grid gap-4 h-full ${remoteStreams.size === 0 ? 'grid-cols-1' : remoteStreams.size === 1 ? 'grid-cols-2' : 'grid-cols-2 lg:grid-cols-3'}`}>
                            {/* My Video */}
                            <div className="relative bg-gray-800 rounded-2xl overflow-hidden aspect-video border-2 border-aurora-500">
                                {!hasMedia || isVideoOff ? (
                                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                                        <div className="text-center">
                                            <div className="w-20 h-20 bg-aurora-600 rounded-full flex items-center justify-center text-white text-3xl font-bold mx-auto mb-3">
                                                {user?.name?.[0]?.toUpperCase()}
                                            </div>
                                            <p className="text-gray-400">{!hasMedia ? 'No Camera' : 'Camera Off'}</p>
                                            {!hasMedia && (
                                                <button
                                                    onClick={enableMedia}
                                                    className="mt-3 px-4 py-2 bg-aurora-600 hover:bg-aurora-700 rounded-lg text-sm transition-all"
                                                >
                                                    Enable Camera
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <video
                                        ref={myVideoRef}
                                        autoPlay
                                        muted
                                        playsInline
                                        className="w-full h-full object-cover mirror"
                                    />
                                )}
                                <div className="absolute bottom-3 left-3 px-3 py-1 bg-black/70 backdrop-blur-sm rounded-lg flex items-center gap-2">
                                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                    <span className="font-semibold">You</span>
                                </div>
                            </div>

                            {/* Remote Videos */}
                            {Array.from(remoteStreams.entries()).map(([userId, { stream, name }]) => (
                                <RemoteVideo key={userId} stream={stream} name={name} />
                            ))}

                            {/* Empty Slots */}
                            {remoteStreams.size === 0 && (
                                <div className="relative bg-gray-800/30 rounded-2xl overflow-hidden aspect-video border-2 border-dashed border-gray-700 flex items-center justify-center">
                                    <div className="text-center">
                                        <Users size={48} className="mx-auto mb-3 text-gray-600" />
                                        <p className="text-gray-500 font-medium">Waiting for others to join...</p>
                                        <p className="text-sm text-gray-600 mt-1">Share the room ID above</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Chat Panel */}
                    {showChat && (
                        <div className="w-full lg:w-1/3 bg-gray-800/50 backdrop-blur-lg rounded-2xl border border-gray-700 flex flex-col overflow-hidden">
                            <div className="p-4 border-b border-gray-700 flex items-center justify-between">
                                <h3 className="font-semibold flex items-center gap-2">
                                    <MessageSquare size={20} />
                                    Chat
                                </h3>
                                <button
                                    onClick={() => setShowChat(false)}
                                    className="p-1 hover:bg-gray-700 rounded transition-all"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                {messages.map((msg) => (
                                    <div
                                        key={msg.id}
                                        className={`flex flex-col ${msg.senderId === user._id ? 'items-end' : 'items-start'}`}
                                    >
                                        <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${msg.senderId === user._id
                                            ? 'bg-aurora-600 text-white'
                                            : 'bg-gray-700 text-gray-100'
                                            }`}>
                                            {msg.senderId !== user._id && (
                                                <p className="text-xs font-semibold mb-1 opacity-70">{msg.sender}</p>
                                            )}
                                            <p className="text-sm">{msg.text}</p>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">{msg.timestamp}</p>
                                    </div>
                                ))}
                                <div ref={messagesEndRef} />
                            </div>

                            <div className="p-4 border-t border-gray-700">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={messageInput}
                                        onChange={(e) => setMessageInput(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                                        placeholder="Type a message..."
                                        className="flex-1 px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-aurora-500 focus:ring-2 focus:ring-aurora-500/20 transition-all outline-none"
                                    />
                                    <button
                                        onClick={sendMessage}
                                        className="px-4 py-2 bg-aurora-600 hover:bg-aurora-700 rounded-lg transition-all"
                                    >
                                        <Send size={20} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Controls */}
                <div className="mt-4 flex items-center justify-center gap-4 bg-gray-800/90 backdrop-blur-xl rounded-2xl p-4 border border-gray-700">
                    <button
                        onClick={toggleMute}
                        disabled={!hasMedia}
                        className={`p-4 rounded-xl transition-all ${!hasMedia ? 'bg-gray-700 opacity-50 cursor-not-allowed' :
                            isMuted ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-700 hover:bg-gray-600'
                            }`}
                        title={!hasMedia ? 'No microphone' : isMuted ? 'Unmute' : 'Mute'}
                    >
                        {isMuted || !hasMedia ? <MicOff size={24} /> : <Mic size={24} />}
                    </button>

                    <button
                        onClick={toggleVideo}
                        disabled={!hasMedia}
                        className={`p-4 rounded-xl transition-all ${!hasMedia ? 'bg-gray-700 opacity-50 cursor-not-allowed' :
                            isVideoOff ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-700 hover:bg-gray-600'
                            }`}
                        title={!hasMedia ? 'No camera' : isVideoOff ? 'Turn on camera' : 'Turn off camera'}
                    >
                        {isVideoOff || !hasMedia ? <VideoOff size={24} /> : <Video size={24} />}
                    </button>

                    <button
                        onClick={() => setShowChat(!showChat)}
                        className="relative p-4 bg-gray-700 hover:bg-gray-600 rounded-xl transition-all"
                        title="Toggle chat"
                    >
                        <MessageSquare size={24} />
                        {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center font-bold">
                                {unreadCount}
                            </span>
                        )}
                    </button>

                    <button
                        onClick={leaveRoom}
                        className="p-4 bg-red-600 hover:bg-red-700 rounded-xl transition-all ml-4"
                        title="Leave call"
                    >
                        <Phone size={24} className="rotate-135" />
                    </button>
                </div>

                <style>{`
                    .mirror { transform: scaleX(-1); }
                    .rotate-135 { transform: rotate(135deg); }
                `}</style>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 flex items-center justify-center p-4">
            <div className="max-w-6xl w-full">
                {/* Header */}
                <div className="text-center mb-12 animate-fade-in">
                    <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-aurora-500 via-aurora-600 to-purple-600 rounded-3xl mb-6 shadow-2xl shadow-aurora-500/50 animate-float">
                        <Video size={48} className="text-white" />
                    </div>
                    <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-white via-aurora-200 to-purple-200 bg-clip-text text-transparent">
                        Video Conferencing
                    </h1>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                        Create a room or join an existing one to start your video call
                    </p>
                </div>

                {/* Testing Info Banner */}
                <div className="mb-8 bg-blue-900/20 border border-blue-700/50 rounded-2xl p-4 backdrop-blur-sm animate-slide-up">
                    <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Monitor className="text-blue-400" size={20} />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-white font-semibold mb-1">💡 Camera Optional!</h3>
                            <p className="text-sm text-gray-300 leading-relaxed">
                                You can join rooms without camera/mic. Perfect for testing on the same device with multiple tabs!
                                Use the chat feature to communicate even without audio.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Cards */}
                <div className="grid md:grid-cols-2 gap-6 mb-8">
                    {/* Create Room */}
                    <div className="group bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl p-8 border border-gray-700 hover:border-aurora-500 transition-all duration-300 hover:shadow-2xl hover:shadow-aurora-500/20 animate-slide-up">
                        <div className="w-16 h-16 bg-gradient-to-br from-aurora-500 to-aurora-700 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <Plus size={32} className="text-white" />
                        </div>
                        <h2 className="text-3xl font-bold text-white mb-3">Create Room</h2>
                        <p className="text-gray-400 mb-6 leading-relaxed">
                            Start a new video call room and invite others to join using the generated room ID
                        </p>
                        <button
                            onClick={createRoom}
                            className="w-full py-4 bg-gradient-to-r from-aurora-600 to-aurora-700 hover:from-aurora-700 hover:to-aurora-800 text-white rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all shadow-lg shadow-aurora-500/30 hover:shadow-aurora-500/50 group-hover:scale-105"
                        >
                            <Sparkles size={20} />
                            Create New Room
                            <ArrowRight size={20} />
                        </button>

                        <div className="mt-6 flex items-center gap-3 text-sm text-gray-500">
                            <MessageSquare size={16} />
                            <span>With Built-in Chat</span>
                        </div>
                    </div>

                    {/* Join Room */}
                    <div className="group bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl p-8 border border-gray-700 hover:border-purple-500 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/20 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                        <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <LogIn size={32} className="text-white" />
                        </div>
                        <h2 className="text-3xl font-bold text-white mb-3">Join Room</h2>
                        <p className="text-gray-400 mb-6 leading-relaxed">
                            Enter a room ID to join an existing video call with your team
                        </p>
                        <div className="space-y-4">
                            <input
                                type="text"
                                placeholder="Enter Room ID (e.g., ABC-123-XYZ)"
                                value={inputRoomId}
                                onChange={(e) => setInputRoomId(e.target.value.toUpperCase())}
                                onKeyPress={(e) => e.key === 'Enter' && joinRoom()}
                                className="w-full px-6 py-4 bg-gray-900 border-2 border-gray-700 rounded-xl text-white placeholder-gray-500 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 transition-all outline-none text-lg font-mono"
                                maxLength={11}
                            />
                            <button
                                onClick={joinRoom}
                                disabled={!inputRoomId.trim()}
                                className="w-full py-4 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 disabled:from-gray-700 disabled:to-gray-800 disabled:cursor-not-allowed text-white rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 group-hover:scale-105 disabled:scale-100"
                            >
                                <LogIn size={20} />
                                Join Room
                                <ArrowRight size={20} />
                            </button>
                        </div>

                        <div className="mt-6 flex items-center gap-3 text-sm text-gray-500">
                            <Users size={16} />
                            <span>Multi-participant Support</span>
                        </div>
                    </div>
                </div>

                {/* Features */}
                <div className="grid grid-cols-3 gap-4 max-w-3xl mx-auto animate-slide-up" style={{ animationDelay: '0.2s' }}>
                    <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-4 border border-gray-700 text-center">
                        <Video size={24} className="mx-auto mb-2 text-aurora-400" />
                        <p className="text-sm text-gray-400">Optional Video</p>
                    </div>
                    <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-4 border border-gray-700 text-center">
                        <MessageSquare size={24} className="mx-auto mb-2 text-purple-400" />
                        <p className="text-sm text-gray-400">Live Chat</p>
                    </div>
                    <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-4 border border-gray-700 text-center">
                        <Users size={24} className="mx-auto mb-2 text-blue-400" />
                        <p className="text-sm text-gray-400">Multi-user</p>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slide-up {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes float {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-10px); }
                }
                .animate-fade-in { animation: fade-in 0.6s ease-out; }
                .animate-slide-up { animation: slide-up 0.6s ease-out; animation-fill-mode: both; }
                .animate-float { animation: float 3s ease-in-out infinite; }
            `}</style>
        </div>
    );
};

// Remote Video Component
const RemoteVideo = ({ stream, name }) => {
    const videoRef = useRef();
    const [hasVideo, setHasVideo] = useState(false);

    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;

            // Check if stream has video track
            const videoTracks = stream.getVideoTracks();
            setHasVideo(videoTracks.length > 0 && videoTracks[0].enabled);

            // Listen for track changes
            stream.getVideoTracks().forEach(track => {
                track.onended = () => setHasVideo(false);
            });
        }
    }, [stream]);

    return (
        <div className="relative bg-gray-800 rounded-2xl overflow-hidden aspect-video border-2 border-gray-700">
            {!hasVideo ? (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                    <div className="text-center">
                        <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-2">
                            {name?.[0]?.toUpperCase()}
                        </div>
                        <p className="text-sm text-gray-400">No Camera</p>
                    </div>
                </div>
            ) : (
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                />
            )}
            <div className="absolute bottom-3 left-3 px-3 py-1 bg-black/70 backdrop-blur-sm rounded-lg">
                <span className="font-semibold">{name}</span>
            </div>
        </div>
    );
};

export default VideoCallPage;
