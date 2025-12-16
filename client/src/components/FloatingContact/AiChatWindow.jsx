import React, { useState, useEffect, useRef } from 'react';
import { FaPaperPlane, FaTimes, FaRobot } from 'react-icons/fa';
import axios from 'axios';
import './AiChatWindow.css';

const AiChatWindow = ({ onClose }) => {
  // ID=1 là câu chào mặc định, sẽ bị lọc bỏ khi gửi API
  const [messages, setMessages] = useState([
    { id: 1, text: 'Xin chào! Tôi là Trợ lý ảo Pethub. Tôi có thể giúp gì cho bạn hôm nay?', sender: 'ai' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userText = inputValue;
    
    // 1. Hiển thị tin nhắn người dùng
    const newUserMsg = {
      id: Date.now(),
      text: userText,
      sender: 'user'
    };

    setMessages((prev) => [...prev, newUserMsg]);
    setInputValue('');
    setIsLoading(true);

    try {
      // --- FIX LỖI GOOGLE GEMINI: FIRST CONTENT MUST BE USER ---
      // Lọc bỏ tin nhắn chào mừng (id=1) khỏi lịch sử gửi đi
      const validHistory = messages.filter(msg => msg.id !== 1);
      
      const historyForGemini = validHistory.slice(-10).map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }]
      }));

      // Đảm bảo tin nhắn đầu tiên trong lịch sử phải là 'user'. Nếu không phải (hoặc rỗng), gửi mảng rỗng.
      const finalHistory = (historyForGemini.length > 0 && historyForGemini[0].role === 'user') 
                           ? historyForGemini 
                           : [];
      
      // ---------------------------------------------------------

      // 3. GỌI API BACKEND
      const res = await axios.post('http://localhost:5000/api/ai/chat', {
        message: userText,
        history: finalHistory
      });

      // 4. Hiển thị phản hồi từ AI
      const newAiMsg = {
        id: Date.now() + 1,
        text: res.data.reply,
        sender: 'ai'
      };
      setMessages((prev) => [...prev, newAiMsg]);

    } catch (error) {
      console.error("Lỗi chat AI:", error);
      const errorMsg = {
        id: Date.now() + 1,
        text: "Xin lỗi, tôi đang gặp chút trục trặc. Bạn thử lại câu hỏi khác nhé! 😿",
        sender: 'ai'
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="ai-chat-window">
      {/* HEADER */}
      <div className="ai-chat-header">
        <div className="ai-header-info">
          <div className="ai-avatar-circle">
            <FaRobot size={18} />
          </div>
          <div>
            <span className="ai-title">Trợ lý ảo Pethub</span>
            <span className="ai-status">● Đang hoạt động</span>
          </div>
        </div>
        <button className="ai-close-btn" onClick={onClose}>
          <FaTimes size={16} />
        </button>
      </div>

      {/* BODY */}
      <div className="ai-chat-body">
        <div className="ai-chat-date">Hôm nay</div>
        
        {messages.map((msg) => (
          <div key={msg.id} className={`message-row ${msg.sender === 'user' ? 'user-row' : 'ai-row'}`}>
            {msg.sender === 'ai' && (
                <div className="msg-avatar">
                    <img src="/images/chatbot.png" alt="AI" />
                </div>
            )}
            <div className={`message-bubble ${msg.sender === 'user' ? 'user-bubble' : 'ai-bubble'}`}>
              {msg.text}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="message-row ai-row">
             <div className="msg-avatar">
                <img src="/images/chatbot.png" alt="AI" />
             </div>
             <div className="message-bubble ai-bubble typing-indicator">
                <span>.</span><span>.</span><span>.</span>
             </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* FOOTER */}
      <form className="ai-chat-footer" onSubmit={handleSendMessage}>
        <input 
          type="text" 
          placeholder="Nhập câu hỏi..." 
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          disabled={isLoading} 
        />
        <button type="submit" className="ai-send-btn" disabled={isLoading}>
          <FaPaperPlane size={16} />
        </button>
      </form>
    </div>
  );
};

export default AiChatWindow;