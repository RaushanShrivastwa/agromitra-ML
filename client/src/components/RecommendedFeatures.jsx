import React from 'react';
import '../styles/RecommendedFeatures.css';

const RecommendedFeatures = () => {
  // Reports Data
  const reportCards = [
    {
      id: 1,
      title: "Weather Report",
      icon: "🌦️",
      description: "Get accurate weather forecasts for your farming needs"
    },
    {
      id: 2,
      title: "Soil Report",
      icon: "🌱",
      description: "Detailed soil analysis and recommendations"
    },
    {
      id: 3,
      title: "Price Report",
      icon: "💰",
      description: "Current market prices for agricultural produce"
    },
    {
      id: 4,
      title: "Fertilizer Report",
      icon: "🧪",
      description: "Optimal fertilizer usage based on soil conditions"
    }
  ];

  // Crop Listings Data
  // const cropCategories = [
  //   {
  //     id: 1,
  //     name: "Vegetables",
  //     image: "https://images.unsplash.com/photo-1598170845058-32b9d6a5da37",
  //     items: 45
  //   },
  //   {
  //     id: 2,
  //     name: "Cereals",
  //     image: "https://images.unsplash.com/photo-1601593768799-76d6d8cde7dc",
  //     items: 32
  //   },
  //   {
  //     id: 3,
  //     name: "Pulses",
  //     image: "https://images.unsplash.com/photo-1603048719537-7a7387dfb1e1",
  //     items: 28
  //   },
  //   {
  //     id: 4,
  //     name: "Spices",
  //     image: "https://images.unsplash.com/photo-1601493700631-2b16ec4b4716",
  //     items: 19
  //   }
  // ];

  // Schemes Data
  const schemeCategories = [
    {
      id: 1,
      name: "Agriculture",
      schemes: 12,
      description: "Government schemes for farmers and agriculture"
    },
    {
      id: 2,
      name: "Education",
      schemes: 8,
      description: "Educational benefits for farmers' families"
    },
    {
      id: 3,
      name: "Finance",
      schemes: 15,
      description: "Financial support and loan schemes"
    },
    {
      id: 4,
      name: "Technology",
      schemes: 7,
      description: "Subsidies for agricultural technology"
    }
  ];

  return (
    <div className="recommended-features">
      <h2 className="section-title">Recommended Features</h2>
      
      {/* Reports Card */}
      <div className="feature-card">
       <div className="card-header">
            <h3>Reports</h3>
            <a href="/reports" className="view-more">View More →</a>
        </div>
        <p className="header-description">Access various agricultural reports</p>
        <div className="report-cards">
          {reportCards.map(report => (
            <div key={report.id} className="report-card">
              <div className="report-icon">{report.icon}</div>
              <div className="report-content">
                <h4>{report.title}</h4>
                <p>{report.description}</p>
                <div className="category-actions">
                <button className="view-reports">View Reports</button>
              </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Crop Listings Card */}
      {/* <div className="feature-card">
        <div className="card-header">
          <h3>Crop Listings</h3>
          <a href="/crops" className="view-more">View More →</a>
        </div>
        <div className="crop-categories">
          {cropCategories.map(category => (
            <div key={category.id} className="category-card">
              <div 
                className="category-image"
                style={{ backgroundImage: `url(${category.image})` }}
              >
                <div className="items-count">{category.items} items</div>
              </div>
              <h4>{category.name}</h4>
              <div className="category-actions">
                <button className="add-items">Add Items</button>
                <button className="view-items">View Items</button>
              </div>
            </div>
          ))}
        </div>
      </div> */}
      
      {/* Schemes Card */}
      <div className="feature-card">
        <div className="card-header">
          <h3>Schemes & Subsidies</h3>
          <a href="/schemes" className="view-more">View More →</a>
        </div>
        <div className="scheme-categories">
          {schemeCategories.map(scheme => (
            <div key={scheme.id} className="scheme-card">
              <div className="scheme-info">
                <h4>{scheme.name}</h4>
                <p className="schemes-count">{scheme.schemes} schemes available</p>
                <p className="scheme-description">{scheme.description}</p>
              </div>
              <button className="view-details">View Details</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RecommendedFeatures;