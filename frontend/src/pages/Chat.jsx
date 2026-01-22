
import React, { useState } from 'react';
import { useChat } from '../hooks/useChat/useChat';
import ChatSidebar from '../components/Chat/ChatSidebar';
import ChatWindow from '../components/Chat/ChatWindow';
import { Menu } from 'lucide-react';

const Chat = () => {
  const {
    message,
    setMessage,
    messages,
    activeChat,
    setActiveChat,
    chats,
    handleSend,
    chatsData,
    activeOnlineCount,
    handleCreateGroup,
    searchUsers,
    handleAccessChat,
    handleFileUpload,
    isTyping,
    handleTyping,
    renameGroup,
    addToGroup,
    removeFromGroup,
    user,
    isLoadingHistory,
    isUploadingFile
  } = useChat();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="h-[calc(100vh-4rem)] bg-gray-50 dark:bg-gray-900 flex animate-fade-in relative">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="md:hidden fixed top-20 left-4 z-40 p-3 bg-aurora-600 text-white rounded-full shadow-lg hover:bg-aurora-700 transition-all"
        aria-label="Toggle menu"
      >
        <Menu size={20} />
      </button>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
      {/* Sidebar - Chat List */}
      <ChatSidebar
        chats={chats}
        activeChat={activeChat}
        setActiveChat={(chatId) => {
          setActiveChat(chatId);
          setIsMobileMenuOpen(false); // Close menu on mobile when chat selected
        }}
        chatsData={chatsData}
        onCreateGroup={handleCreateGroup}
        onSearchUsers={searchUsers}
        onAccessChat={handleAccessChat}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />

      {/* Main Chat Area */}
      <ChatWindow
        activeChat={activeChat}
        messages={messages}
        message={message}
        setMessage={setMessage}
        handleTyping={handleTyping}
        handleSend={handleSend}
        onlineCount={activeOnlineCount}
        isTyping={isTyping}
        onFileUpload={handleFileUpload}
        renameGroup={renameGroup}
        addToGroup={addToGroup}
        removeFromGroup={removeFromGroup}
        chatsData={chatsData}
        searchUsers={searchUsers}
        currentUser={user}
        isLoadingHistory={isLoadingHistory}
        isUploadingFile={isUploadingFile}
      />
    </div>
  );
};

export default Chat;