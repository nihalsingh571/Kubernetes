import React, { useState, useEffect, useRef } from 'react';
import { Send, Calendar, Video, Building, Paperclip } from 'lucide-react';
import API from '../services/api';

export default function StudentChatUI() {
    const [conversations, setConversations] = useState([]);
    const [selectedConv, setSelectedConv] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const messagesEndRef = useRef(null);

    const fetchConversations = async () => {
        try {
            const res = await API.get('/api/conversations/');
            setConversations(res.data);
            if (res.data.length > 0 && !selectedConv) {
                setSelectedConv(res.data[0]);
            }
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const fetchMessages = async (convId) => {
        try {
            const res = await API.get(`/api/messages/?conversation=${convId}`);
            setMessages(res.data);
            scrollToBottom();
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchConversations();
        const interval = setInterval(fetchConversations, 10000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (selectedConv) {
            fetchMessages(selectedConv.id);
            const interval = setInterval(() => fetchMessages(selectedConv.id), 5000);
            return () => clearInterval(interval);
        }
    }, [selectedConv]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedConv) return;
        try {
            await API.post('/api/messages/', {
                conversation: selectedConv.id,
                message: newMessage,
                type: 'text'
            });
            setNewMessage('');
            fetchMessages(selectedConv.id);
            fetchConversations();
        } catch (err) {
            console.error(err);
        }
    };

    if (loading) return <div className="text-white/50 p-8 text-center">Loading messages...</div>;

    return (
        <div className="flex h-[calc(100vh-140px)] overflow-hidden rounded-[32px] border border-white/10 bg-[#070c1f]">
            {/* Sidebar */}
            <div className="w-1/3 border-r border-white/10 flex flex-col hidden md:flex">
                <div className="p-4 border-b border-white/10">
                    <h2 className="text-lg font-bold text-white">Recruiter Messages</h2>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {conversations.length === 0 ? (
                        <p className="p-4 text-white/50 text-sm text-center">No active conversations.</p>
                    ) : (
                        conversations.map(conv => (
                            <div 
                                key={conv.id} 
                                onClick={() => setSelectedConv(conv)}
                                className={`p-4 border-b border-white/5 cursor-pointer transition-colors ${selectedConv?.id === conv.id ? 'bg-white/10' : 'hover:bg-white/5'}`}
                            >
                                <div className="flex justify-between items-center mb-1">
                                    <h3 className="font-semibold text-white truncate flex items-center gap-1">
                                        <Building size={12} className="text-indigo-400"/> {conv.recruiter_company}
                                    </h3>
                                    {conv.last_message && (
                                        <span className="text-[10px] text-white/40">
                                            {new Date(conv.last_message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-emerald-400 mb-1">{conv.internship_title}</p>
                                <p className="text-xs text-white/60 truncate">
                                    {conv.last_message ? conv.last_message.message : "No messages yet"}
                                </p>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Chat Area */}
            {selectedConv ? (
                <div className="flex-1 flex flex-col bg-[#0a0f25]">
                    <div className="p-4 border-b border-white/10 flex justify-between items-center bg-[#070c1f]">
                        <div>
                            <h3 className="font-bold text-white text-lg flex items-center gap-2">
                                <Building size={18} className="text-indigo-400"/> {selectedConv.recruiter_company}
                            </h3>
                            <p className="text-xs text-emerald-400 mt-1">{selectedConv.internship_title}</p>
                        </div>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {messages.length === 0 ? (
                            <div className="h-full flex items-center justify-center">
                                <p className="text-white/40 text-sm">Start the conversation with {selectedConv.recruiter_company}</p>
                            </div>
                        ) : (
                            messages.map((msg, idx) => {
                                const isMine = msg.sender === selectedConv.student;
                                return (
                                    <div key={idx} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                                        <div className={`max-w-[70%] rounded-2xl p-3 text-sm ${isMine ? 'bg-indigo-600 text-white rounded-tr-sm' : 'bg-white/10 text-white rounded-tl-sm'}`}>
                                            {msg.type === 'interview' ? (
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-2 font-bold text-emerald-300 mb-2">
                                                        <Video size={16} /> Interview Scheduled
                                                    </div>
                                                    <p className="whitespace-pre-wrap text-white/90">{msg.message}</p>
                                                    <button className="mt-2 w-full bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors py-1.5 rounded-lg text-xs font-bold">
                                                        Accept & Add to Calendar
                                                    </button>
                                                </div>
                                            ) : (
                                                <p className="whitespace-pre-wrap">{msg.message}</p>
                                            )}
                                        </div>
                                        <span className="text-[10px] text-white/40 mt-1">
                                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                );
                            })
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <form onSubmit={sendMessage} className="p-4 border-t border-white/10 bg-[#070c1f] flex gap-2">
                        <input 
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Reply to recruiter..."
                            className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                        />
                        <button type="submit" disabled={!newMessage.trim()} className="p-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-full transition-colors">
                            <Send size={18} />
                        </button>
                    </form>
                </div>
            ) : (
                <div className="flex-1 flex items-center justify-center bg-[#0a0f25]">
                    <div className="text-center">
                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Send size={24} className="text-white/40" />
                        </div>
                        <p className="text-white/60">Select a conversation to view messages</p>
                    </div>
                </div>
            )}
        </div>
    );
}
