import React from 'react';
import '../styles/footer.css';
import { FaInstagram, FaTwitter, FaLinkedin, FaEnvelope } from 'react-icons/fa';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        
        <div className="footer-columns">
            <div className="footer-brand">
                <h1 className="app-name">AgroMitra</h1>
                <p className="app-quote">"Cultivating the future of <br/>sustainable farming"</p>
            </div>
          <div className="footer-column">
            <h3 className="column-title">Quick Links</h3>
            <ul className="footer-links">
              <li><a href="/about">About Us</a></li>
              <li><a href="/services">Services</a></li>
              <li><a href="/blog">Blog</a></li>
              <li><a href="/contact">Contact</a></li>
            </ul>
          </div>

          <div className="footer-column">
            <h3 className="column-title">Our Office</h3>
            <address className="footer-address">
              VIT-AP<br />
              Amaravati, AP<br />
              India<br />
              Phone: +91 9821656724<br />
              Email: Kunal.ashutosh@agromitra.com
            </address>
          </div>

          <div className="footer-column">
            <h3 className="column-title">Connect With Us</h3>
            <div className="social-links">
              <a href="https://instagram.com" aria-label="Instagram">
                <FaInstagram className="social-icon" />
              </a>
              <a href="https://twitter.com" aria-label="Twitter">
                <FaTwitter className="social-icon" />
              </a>
              <a href="https://linkedin.com" aria-label="LinkedIn">
                <FaLinkedin className="social-icon" />
              </a>
              <a href="mailto:info@greengrow.com" aria-label="Email">
                <FaEnvelope className="social-icon" />
              </a>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p className="license-text">
            © 2025 AgroMitra. Licensed under MIT License.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;