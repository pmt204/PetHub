import React from 'react';
import { motion } from 'framer-motion';

const HeroBottomDoctor = () => {

    return (
        <div
            className="d-flex align-items-center justify-content-center position-relative"
            style={{
                borderRadius: '30px',
                overflow: 'hidden',
                width: '99.9%',
                maxWidth: '100%',
                minHeight: '350px',
                maxHeight: '400px',
                backgroundImage: 'url(/images/herobottomdoctor.jpg)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',

                textAlign: 'center',
            }}
        >
            <div
                className="position-absolute top-0 start-0 w-100 h-100"
                style={{
                    backgroundColor: 'rgba(10, 31, 73, 0.89)',
                    zIndex: 1
                }}
            />
            <div
                className="container text-center text-white position-relative"
                style={{ zIndex: 2 }}
            >
                <motion.h2
                    className="fw-bold mb-3"
                    style={{
                        color: 'white',
                        fontFamily: 'Quicksand, sans-serif',
                        fontSize: '2.5rem',
                        lineHeight: '1.5',
                        maxWidth: '800px',
                        margin: '0 auto',
                    }}
                    initial={{ opacity: 0, y: -40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1 }}
                >
                    Xây dựng không gian nơi thú cưng của bạn được nâng lên hàng đầu
                </motion.h2>
            </div>
        </div>
    );
};

export default HeroBottomDoctor;