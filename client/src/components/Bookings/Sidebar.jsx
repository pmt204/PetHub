import React, { useEffect, useRef, useCallback } from 'react';
import './Sidebar.css'; 

const Sidebar = ({ isOpen, onClose, children, title }) => {
    const sidebarRef = useRef(null); 

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (sidebarRef.current && !sidebarRef.current.contains(event.target) && isOpen) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            document.body.style.overflow = 'hidden'; 
        } else {
            document.removeEventListener('mousedown', handleClickOutside);
            document.body.style.overflow = '';
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.body.style.overflow = ''; // Đảm bảo scroll được phục hồi
        };
    }, [isOpen, onClose]); 

    if (!isOpen) {
        return null;
    }

    return (
        <>
            <div className={`sidebar-overlay ${isOpen ? 'show' : ''}`} onClick={onClose}></div>

            <div ref={sidebarRef} className={`sidebar ${isOpen ? 'show' : ''}`}>
                <div className="sidebar-header">
                    <h5 className="sidebar-title">{title}</h5>
                    <button type="button" className="sidebar-close-btn" onClick={onClose}>
                        &times; 
                    </button>
                </div>
                <div className="sidebar-body">
                    {children} 
                </div>
            </div>
        </>
    );
};

export default Sidebar;