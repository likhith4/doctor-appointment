import React from 'react';
import './index.css';
import { FaFacebookSquare, FaInstagramSquare, FaLinkedin, FaGithubSquare, FaPhoneAlt, FaEnvelope  } from "react-icons/fa";

const TopHeader = () => {
    return (
        <div id="topbar" className="d-flex align-items-center fixed-top">
            <div className="container d-flex justify-content-between">
                <div className="contact-info d-flex align-items-center">
                    <FaEnvelope className='contact-icon'/> <a href="mailto:likhithk495@gmail.com">likhithk495@gmail.com</a>
                    <FaPhoneAlt className='contact-icon'/> <a href="tel:+1 (555) 123-4567">+1 (555) 123-4567</a> 
                </div>
                <div className="d-none d-lg-flex social-links align-items-center">
                    
                </div>
            </div>
        </div>
    );
};
export default TopHeader;