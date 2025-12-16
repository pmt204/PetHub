import React from 'react';
import { motion } from 'framer-motion';

const HeroDoctor = () => {
    return (
        <section
            className="d-flex align-items-center position-relative"
            style={{
                minHeight: '55vh',
                backgroundImage: 'url(/images/herodoctor1.jpg)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
            }}
        >
            <div
                className="position-absolute top-0 start-0 w-100 h-100"
                style={{ backgroundColor: 'rgba(26, 25, 25, 0.44)', zIndex: 1 }}
            />

            <div
                className="container text-center text-white position-relative"
                style={{ zIndex: 2 }}
            >
                <motion.h1
                    className="fw-bold mb-4"
                    style={{ color: 'white', fontFamily: 'Quicksand, sans-serif', fontSize: '3.5rem', paddingTop: '20vh' }}
                    initial={{ opacity: 0, y: -40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1 }}
                >
                    Đội Ngũ Bác Sĩ & Chuyên Gia
                </motion.h1>
                <motion.p
                    className="fs-4 text-center"
                    style={{ maxWidth: '800px', margin: '0 auto' }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                >
                    Những người tận tâm chăm sóc sức khỏe cho thú cưng của bạn
                    <br />
                    Hãy tin tưởng vào những người bạn đồng hành chuyên nghiệp này.
                </motion.p>

            </div>
        </section>
    );
};

export default HeroDoctor;