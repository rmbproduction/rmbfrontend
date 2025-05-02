import React, { useState, useEffect, useRef } from 'react';
import { apiService } from '../services/api.service';
import { showNotification } from './NotificationCenter';

interface Message {
  id: string;
  content: string;
  sender: {
    id: string;
    name: string;
    avatar?: string;
    role: 'user' | 'mechanic' | 'admin';
  };
  timestamp: string;
  attachments?: {
    type: 'image' | 'document';
    url: string;
    name: string;
  }[];
  status: 'sent' | 'delivered' | 'read';
}

interface ChatSystemProps {
  serviceRequestId: string;
  currentUser: {
    id: string;
    role: 'user' | 'mechanic' | 'admin';
  };
  className?: string;
}

const ChatSystem: React.FC<ChatSystemProps> = ({
  serviceRequestId,
  currentUser,
  className = ''
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    // Initial messages load
    fetchMessages();

    // Setup WebSocket connection
    setupWebSocket();

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [serviceRequestId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const setupWebSocket = () => {
    const wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws/chat/${serviceRequestId}/`;
    ws.current = new WebSocket(wsUrl);

    ws.current.onmessage = (event) => {
      const message = JSON.parse(event.data);
      setMessages(prev => [...prev, message]);
    };

    ws.current.onclose = () => {
      // Try to reconnect after 3 seconds
      setTimeout(setupWebSocket, 3000);
    };
  };

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const response = await apiService.request<Message[]>(
        `/repairing_service/chat/${serviceRequestId}/messages/`
      );
      setMessages(response.data);
    } catch (error) {
      showNotification({
        type: 'error',
        message: 'Failed to load messages',
      });
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() && attachments.length === 0) return;

    setSending(true);
    try {
      const formData = new FormData();
      formData.append('content', newMessage);
      formData.append('service_request_id', serviceRequestId);
      
      attachments.forEach((file, index) => {
        formData.append(`attachments[${index}]`, file);
      });

      await apiService.request<Message>(
        `/repairing_service/chat/${serviceRequestId}/messages/`,
        {
          method: 'POST',
          body: formData
        }
      );

      setNewMessage('');
      setAttachments([]);
    } catch (error) {
      showNotification({
        type: 'error',
        message: 'Failed to send message',
      });
    } finally {
      setSending(false);
    }
  };

  const handleAttachment = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setAttachments(prev => [...prev, ...newFiles]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const MessageBubble: React.FC<{ message: Message }> = ({ message }) => {
    const isOwnMessage = message.sender.id === currentUser.id;

    return (
      <div
        className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4`}
      >
        {!isOwnMessage && (
          <div className="flex-shrink-0 mr-3">
            {message.sender.avatar ? (
              <img
                src={message.sender.avatar}
                alt={message.sender.name}
                className="w-8 h-8 rounded-full"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-blue-600 font-medium">
                  {message.sender.name.charAt(0)}
                </span>
              </div>
            )}
          </div>
        )}

        <div
          className={`flex flex-col max-w-[70%] ${
            isOwnMessage ? 'items-end' : 'items-start'
          }`}
        >
          {!isOwnMessage && (
            <span className="text-xs text-gray-500 mb-1">
              {message.sender.name}
            </span>
          )}

          <div
            className={`rounded-lg px-4 py-2 ${
              isOwnMessage
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-900'
            }`}
          >
            <p className="text-sm">{message.content}</p>

            {message.attachments && message.attachments.length > 0 && (
              <div className="mt-2 space-y-2">
                {message.attachments.map((attachment, index) => (
                  <div key={index} className="flex items-center">
                    {attachment.type === 'image' ? (
                      <img
                        src={attachment.url}
                        alt={attachment.name}
                        className="max-w-[200px] rounded"
                      />
                    ) : (
                      <a
                        href={attachment.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-sm underline"
                      >
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z" />
                        </svg>
                        {attachment.name}
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center mt-1">
            <span className="text-xs text-gray-500">
              {formatTime(message.timestamp)}
            </span>
            {isOwnMessage && (
              <span className="ml-2">
                {message.status === 'read' ? (
                  <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.707 14.707l-1.414-1.414L13.586 8H4V6h9.586l-5.293-5.293 1.414-1.414L16.414 6 9.707 14.707z" />
                  </svg>
                ) : message.status === 'delivered' ? (
                  <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.707 14.707l-1.414-1.414L13.586 8H4V6h9.586l-5.293-5.293 1.414-1.414L16.414 6 9.707 14.707z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" />
                  </svg>
                )}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`chat-system flex flex-col h-[600px] ${className}`}>
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 bg-white rounded-t-lg">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : messages.length > 0 ? (
          messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            No messages yet. Start the conversation!
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <form onSubmit={handleSubmit} className="p-4 bg-white border-t rounded-b-lg">
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {attachments.map((file, index) => (
              <div
                key={index}
                className="flex items-center bg-gray-100 rounded-lg p-2"
              >
                <span className="text-sm text-gray-600 truncate max-w-[150px]">
                  {file.name}
                </span>
                <button
                  type="button"
                  onClick={() => removeAttachment(index)}
                  className="ml-2 text-gray-500 hover:text-red-500"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center space-x-2">
          <button
            type="button"
            className="p-2 text-gray-500 hover:text-blue-600"
            onClick={() => document.getElementById('file-input')?.click()}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          </button>
          <input
            id="file-input"
            type="file"
            multiple
            className="hidden"
            onChange={handleAttachment}
            accept="image/*,.pdf,.doc,.docx"
          />

          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <button
            type="submit"
            disabled={sending || (!newMessage.trim() && attachments.length === 0)}
            className={`p-2 rounded-lg ${
              sending || (!newMessage.trim() && attachments.length === 0)
                ? 'bg-gray-100 text-gray-400'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {sending ? (
              <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatSystem; 