import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const HeroBookingShipment = () => {

    return (
        <section className="position-relative" style={{ minHeight: '100vh' }}>
            <video
                autoPlay
                loop
                muted
                playsInline
                className="w-100 h-100 position-absolute top-0 start-0"
                style={{ objectFit: 'cover', zIndex: 0 }}
            >
                <source src="/images/PA-Video.mp4" type="video/mp4" />
                Trình duyệt của bạn không hỗ trợ thẻ video.
            </video>
            <div
                className="container h-0 d-flex flex-column justify-content-start align-items-center text-white text-center"
                style={{
                    position: 'relative',
                    zIndex: 2,
                    paddingTop: '45svh',
                    fontSize: '2.5rem',
                }}
            >
                <motion.h1
                    className="display-2 fw-bold mb-3"
                    initial={{ opacity: 0, y: -40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1 }}
                    style={{ color: 'white', fontFamily: 'Quicksand, sans-serif' }}
                >
                    Mở ra một thế giới của những chuyến đi an toàn
                </motion.h1>
            </div>
        </section>
    );
};

export default HeroBookingShipment;
