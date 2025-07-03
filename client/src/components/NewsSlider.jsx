import React, { useState, useEffect } from 'react';
import '../styles/NewsSlider.css';

const NewsSlider = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  
  const slides = [
    {
      id: 1,
      title: "Monsoon Special - 50% Off on All Seeds",
      image: "https://images.unsplash.com/photo-1605000797499-95a51c5269ae?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
      link: "/deals/monsoon-special"
    },
    {
      id: 2,
      title: "New Organic Fertilizers - Buy 1 Get 1 Free",
      image: "https://images.unsplash.com/photo-1586771107445-d3ca888129ce?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
      link: "/deals/organic-fertilizers"
    },
    {
      id: 3,
      title: "Farm Equipment Mega Sale - Limited Time Offer",
      image: "https://images.unsplash.com/photo-1585011650347-c59dbef5a823?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
      link: "/deals/farm-equipment"
    },
    {
      id: 4,
      title: "Subscribe & Save - Get 15% Off Every Month",
      image: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
      link: "/deals/subscription"
    },
    {
      id: 5,
      title: "New Arrivals - High Yield Hybrid Seeds",
      image: "https://images.unsplash.com/photo-1594122230689-45899d9e6f69?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
      link: "/deals/new-arrivals"
    }
  ];

  // Auto-rotate slides
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
    }, 5000);
    return () => clearInterval(interval);
  }, [slides.length]);

  return (
    <div className="slider-container">
      <div className="slider-card">
        {slides.map((slide, index) => (
          <a 
            href={slide.link} 
            key={slide.id}
            className={`slide ${index === currentSlide ? 'active' : ''}`}
            style={{ backgroundImage: `url(${slide.image})` }}
          >
            <div className="slide-content">
              <h3 className="slide-title">{slide.title}</h3>
              <button className="slide-button">View Offer</button>
            </div>
          </a>
        ))}
        
        <div className="slider-controls">
          {slides.map((_, index) => (
            <button
              key={index}
              className={`slider-dot ${index === currentSlide ? 'active' : ''}`}
              onClick={() => setCurrentSlide(index)}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default NewsSlider;