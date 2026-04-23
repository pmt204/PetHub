import React, { useState } from 'react';
import { FaPhoneAlt, FaHeadset, FaTimes } from 'react-icons/fa'; 
import { SiZalo } from 'react-icons/si';
import AiChatWindow from './AiChatWindow';
import './FloatingContact.css';

const FloatingContact = ({ isBookingModalOpen = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const toggleMenu = () => {
    if (isChatOpen) {
        setIsChatOpen(false);
        setIsOpen(false);
    } else {
        setIsOpen(!isOpen);
    }
  };

  const handleOpenChatbot = () => {
    setIsOpen(false);
    setIsChatOpen(true);
  };

  return (
    <div className="floating-contact-wrapper">
      {isChatOpen && <AiChatWindow onClose={() => setIsChatOpen(false)} />}
      <div className={`contact-menu ${isOpen && !isChatOpen ? 'show' : ''}`}>
        <div className="contact-header">
          <span>TRUNG TÂM HỖ TRỢ PETHUB</span>
        </div>
        
        <div className="contact-list">
          <div className="contact-item ai-item cursor-pointer" onClick={handleOpenChatbot}>
            <div className="icon-box bg-ai-gradient">
              <img 
                src="/images/chatbot.png" 
                alt="AI Icon" 
                className="ai-menu-img" 
              />
            </div>
            <div className="text-box">
              <strong className="ai-text">Trợ lý ảo Pethub (AI)</strong>
              <span className="ai-subtext">Hỗ trợ thông minh 24/7</span>
            </div>
          </div>
          
          <a href="https://zalo.me/0363213230" target="_blank" rel="noreferrer" className="contact-item">
            <div className="icon-box bg-blue">
              <SiZalo size={20} />
            </div>
            <div className="text-box">
              <strong>Liên hệ Zalo</strong>
              <span>(7h30 - 22h30)</span>
            </div>
          </a>
        </div>
      </div>

      <button 
        className={`floating-btn-custom ${isOpen || isChatOpen ? 'active' : ''}`} 
        onClick={toggleMenu}
      >
        {isOpen || isChatOpen ? (
            <FaTimes size={24} color="#fff" />
        ) : (
            <>
                <div className="pulse-ring"></div>
                <img src="/images/chatbot.png" alt="Mascot" className="mascot-img-small" />
                <span className="btn-label">LIÊN HỆ</span>
            </>
        )}
      </button>
    </div>
  );
};

export default FloatingContact;