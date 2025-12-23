import { useEffect, useState, useRef, FormEvent, useCallback } from 'react';
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext'; // Using alias path
import { toast } from 'sonner';
import { Loader2, Send, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';

interface Message {
  message_id: number;
  sender_id: number;
  receiver_id: number;
  content: string;
  created_at: string;
}

const Chat = () => {
  const { friendId } = useParams<{ friendId: string }>();
  const { state } = useLocation(); // Get state passed from Link
  const { user } = useAuth();
  const navigate = useNavigate();

  // Get friend's name from navigation state, or set a default
  const friendName = state?.friendName || 'Friend';
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  
  const chatEndRef = useRef<HTMLDivElement>(null); // Ref to auto-scroll to bottom

  // Function to fetch messages
  const fetchMessages = useCallback(async () => {
    if (!friendId || !user) return;
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:3001/api/chat/${friendId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(response.data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to load messages.");
      console.error("Fetch messages error:", error);
    } finally {
      setIsLoading(false);
    }
  }, [friendId, user]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initial fetch and auto-refresh polling
  useEffect(() => {
    fetchMessages(); // Initial fetch

    // Set up polling every 3 seconds
    const interval = setInterval(() => {
      fetchMessages();
    }, 3000); // 3000ms = 3 seconds

    // Clean up interval on component unmount
    return () => clearInterval(interval);
  }, [fetchMessages]); // Re-run if fetchMessages function changes (i.e., friendId changes)

  // Handle sending a new message
  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !friendId || !user) return;

    setIsSending(true);
    const token = localStorage.getItem('token');
    
    // Optimistic UI update: Add message to state immediately
    const optimisticMessage: Message = {
        message_id: Math.random(), // Temporary ID
        sender_id: user.id,
        receiver_id: parseInt(friendId),
        content: newMessage,
        created_at: new Date().toISOString()
    };
    setMessages(currentMessages => [...currentMessages, optimisticMessage]);
    setNewMessage(''); // Clear input

    try {
      await axios.post('http://localhost:3001/api/chat/send', 
        { receiverId: parseInt(friendId), content: newMessage },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Message sent, refetch to get the real message ID and timestamp
      // (The polling will catch this, or you can call fetchMessages() here)
      // await fetchMessages(); // Uncomment if you want instant refresh instead of waiting for poll
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to send message.");
      console.error("Send message error:", error);
      // Rollback optimistic update if send failed
      setMessages(currentMessages => currentMessages.filter(m => m.message_id !== optimisticMessage.message_id));
      setNewMessage(optimisticMessage.content); // Put text back in box
    } finally {
      setIsSending(false);
      // Ensure scroll after send
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center min-h-[calc(100vh-160px)]">
        <Loader2 size={48} className="animate-spin text-purple-400" />
      </div>
    );
  }

  return (
    <main className="flex-1 p-4 md:p-8 max-w-4xl mx-auto w-full">
      {/* Chat Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link to="/friends" className="text-gray-400 hover:text-white transition-colors">
            <ArrowLeft size={24} />
        </Link>
        <h1 data-font-orbitron className="text-3xl font-bold text-white text-glow-blue">
          Chat with {friendName}
        </h1>
      </div>

      {/* Chat Messages Area */}
      <div className="admin-card h-[60vh] flex flex-col p-4">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          {messages.length > 0 ? (
            messages.map(msg => {
              const isSender = msg.sender_id === user?.id;
              return (
                <div 
                  key={msg.message_id}
                  className={`flex ${isSender ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`max-w-[70%] p-3 rounded-lg ${
                      isSender 
                        ? 'bg-purple-600 text-white rounded-br-none' 
                        : 'bg-gray-700 text-gray-200 rounded-bl-none'
                    }`}
                  >
                    <p className="text-sm">{msg.content}</p>
                    <p className={`text-xs mt-1 ${isSender ? 'text-purple-200' : 'text-gray-400'} text-right`}>
                      {format(new Date(msg.created_at), 'h:mm a')}
                    </p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-gray-500">No messages yet. Say hello!</p>
            </div>
          )}
          {/* Empty div to scroll to */}
          <div ref={chatEndRef} />
        </div>

        {/* Message Input Form */}
        <form onSubmit={handleSendMessage} className="mt-4 flex gap-3 border-t border-purple-500/30 pt-4">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="modal-input flex-1" // Reuse style from index.css
            disabled={isSending}
          />
          <button
            type="submit"
            disabled={isSending || !newMessage.trim()}
            className="neon-button-small !px-4 !py-2 bg-blue-600 hover:bg-blue-500 hover:shadow-blue-500/40 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSending ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
          </button>
        </form>
      </div>
    </main>
  );
};

export default Chat;
