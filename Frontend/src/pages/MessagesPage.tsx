import React, { useState } from 'react';
import { Send, Users, Compass, Search, ArrowLeft } from 'lucide-react';
import { mockChatThreads, ChatThread } from '../data/mockMessages';
import { useAuth } from '../context/AuthContext';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';

export const MessagesPage: React.FC = () => {
  const { user } = useAuth();
  const [threads, setThreads] = useState<ChatThread[]>(mockChatThreads);
  const [activeThreadId, setActiveThreadId] = useState<string>(mockChatThreads[0].id);
  const [messageText, setMessageText] = useState('');
  const [mobileChatOpen, setMobileChatOpen] = useState(false);
  const [threadQuery, setThreadQuery] = useState('');

  const activeThread = threads.find((t) => t.id === activeThreadId) || threads[0];

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;

    const newMsg = {
      id: Date.now().toString(),
      senderName: user.name,
      avatarUrl: user.avatarUrl,
      isCurrentUser: true,
      text: messageText.trim(),
      time: 'Just now',
    };

    setThreads((prev) =>
      prev.map((t) => {
        if (t.id === activeThreadId) {
          return {
            ...t,
            lastMessage: messageText.trim(),
            time: 'Just now',
            messages: [...t.messages, newMsg],
          };
        }
        return t;
      })
    );

    setMessageText('');
  };

  return (
    <div className={`flex flex-col gap-4 text-left w-full min-w-0 max-w-6xl mx-auto md:h-[calc(100dvh-160px)] md:min-h-[400px] ${mobileChatOpen ? 'h-[calc(100dvh-160px)] min-h-[400px]' : ''}`}>
      <div>
        <h1 className="font-heading font-bold text-2xl text-text">
          Trip Messages
        </h1>
        <p className="text-xs sm:text-sm text-text-muted mt-0.5">
          Group coordination and discussions for your confirmed trips.
        </p>
      </div>

      <div className="flex-1 min-h-0 bg-white rounded-2xl border border-border shadow-card overflow-hidden grid grid-cols-1 md:grid-cols-3">
        {/* Left Pane: Threads List */}
        <div className={`${mobileChatOpen ? 'hidden md:flex' : 'flex'} min-h-0 border-r border-border flex-col h-full bg-white`}>
          <div className="p-4 border-b border-border">
            <div className="relative">
              <Search className="w-4 h-4 text-text-subtle absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search trip chats..."
                aria-label="Search trip chats"
                value={threadQuery}
                onChange={(event) => setThreadQuery(event.target.value)}
                className="w-full bg-light-bg text-xs rounded-xl pl-9 pr-3 py-2 outline-none border border-border"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-border/60">
            {threads.filter((thread) => thread.tripName.toLowerCase().includes(threadQuery.toLowerCase())).map((thread) => {
              const isActive = thread.id === activeThreadId;
              return (
                <button
                  type="button"
                  key={thread.id}
                  onClick={() => { setActiveThreadId(thread.id); setMobileChatOpen(true); }}
                  className={`w-full text-left p-4 flex items-start gap-3 cursor-pointer transition-colors ${
                    isActive ? 'bg-accent/20' : 'hover:bg-light-bg'
                  }`}
                >
                  <img
                    src={thread.coverImage}
                    alt={thread.tripName}
                    className="w-11 h-11 rounded-xl object-cover shrink-0 border border-border"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-xs sm:text-sm text-text truncate">
                        {thread.tripName}
                      </h4>
                      <span className="text-[10px] text-text-subtle whitespace-nowrap">
                        {thread.time}
                      </span>
                    </div>
                    <p className="text-xs text-text-muted truncate mt-0.5">
                      {thread.lastMessage}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Pane: Active Thread Discussion */}
        <div className={`${mobileChatOpen ? 'flex' : 'hidden md:flex'} min-h-0 min-w-0 md:col-span-2 flex-col h-full bg-light-bg/50`}>
          {/* Thread Header */}
          <div className="p-4 bg-white border-b border-border flex items-center justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <button type="button" aria-label="Back to conversations" onClick={() => setMobileChatOpen(false)} className="md:hidden p-2 -ml-2 shrink-0 rounded-lg hover:bg-light-bg"><ArrowLeft className="w-5 h-5" /></button>
              <img
                src={activeThread.coverImage}
                alt={activeThread.tripName}
                className="w-10 h-10 rounded-xl object-cover border border-border"
              />
              <div>
                <h3 className="font-heading font-bold text-sm sm:text-base text-text">
                  {activeThread.tripName}
                </h3>
                <p className="text-xs text-text-muted flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-primary" />
                  {activeThread.membersCount} trip members
                </p>
              </div>
            </div>
          </div>

          {/* Messages Container */}
          <div className="flex-1 min-h-0 p-3 sm:p-6 overflow-y-auto space-y-4">
            {activeThread.messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex items-start gap-3 max-w-[85%] ${
                  msg.isCurrentUser ? 'ml-auto flex-row-reverse' : ''
                }`}
              >
                <Avatar src={msg.avatarUrl} name={msg.senderName} size="xs" />
                <div>
                  <div
                    className={`flex items-center gap-2 mb-1 text-[11px] ${
                      msg.isCurrentUser ? 'justify-end' : ''
                    }`}
                  >
                    <span className="font-semibold text-text">{msg.senderName}</span>
                    <span className="text-text-subtle">{msg.time}</span>
                  </div>
                  <div
                    className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed break-words [overflow-wrap:anywhere] ${
                      msg.isCurrentUser
                        ? 'bg-primary text-white rounded-tr-none'
                        : 'bg-white text-text border border-border rounded-tl-none shadow-subtle'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Message Input Footer */}
          <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-border flex gap-2">
            <input
              type="text"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Send a message to trip group..."
              aria-label="Message"
              className="min-w-0 flex-1 bg-light-bg text-sm rounded-xl px-3 py-2.5 outline-none border border-border focus:border-primary"
            />
            <Button
              type="submit"
              variant="primary"
              size="sm"
              icon={<Send className="w-4 h-4" />}
              className="px-4"
            >
              Send
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};
