import "./App.css";

function App() {
  return (
    <div className="app">

      {/* Navbar */}
      <nav className="navbar">
        <div className="logo">
          🌾 SmartAgri
        </div>

        <div className="nav-links">
          <a href="/">Home</a>
          <a href="#products">Products</a>
          <a href="#about">About</a>
          <a href="#contact">Contact</a>
          <button className="login-btn">Login</button>
          <span className="cart">🛒</span>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero">

        <div className="hero-content">
          <h1>
            Fresh From <span>Farmers</span>
            <br />
            Directly To You
          </h1>

          <p>
            Buy fresh agricultural products directly from local farmers.
            Support farmers and enjoy quality products at fair prices.
          </p>

          <button className="explore-btn">
            Explore Products
          </button>
        </div>

        <div className="hero-image">
          🌾
        </div>

      </section>

      {/* Categories */}
      <section className="categories" id="products">

        <h2>Explore Categories</h2>

        <p className="section-description">
          Discover fresh products from local farmers
        </p>

        <div className="category-container">

          <div className="category-card">
            <div className="category-icon">🥕</div>
            <h3>Vegetables</h3>
            <p>Fresh farm vegetables</p>
          </div>

          <div className="category-card">
            <div className="category-icon">🌾</div>
            <h3>Grains</h3>
            <p>Quality grains and cereals</p>
          </div>

          <div className="category-card">
            <div className="category-icon">🍎</div>
            <h3>Fruits</h3>
            <p>Fresh seasonal fruits</p>
          </div>

          <div className="category-card">
            <div className="category-icon">🥛</div>
            <h3>Dairy</h3>
            <p>Fresh dairy products</p>
          </div>

        </div>

      </section>

      {/* Why SmartAgri */}
      <section className="why-section" id="about">

        <h2>Why Choose SmartAgri?</h2>

        <div className="features">

          <div className="feature">
            <span>👨‍🌾</span>
            <h3>Support Farmers</h3>
            <p>
              Connect directly with farmers and support local agriculture.
            </p>
          </div>

          <div className="feature">
            <span>🥬</span>
            <h3>Fresh Products</h3>
            <p>
              Get fresh and quality agricultural products.
            </p>
          </div>

          <div className="feature">
            <span>💰</span>
            <h3>Fair Prices</h3>
            <p>
              Better prices for both farmers and buyers.
            </p>
          </div>

        </div>

      </section>

      {/* Footer */}
      <footer id="contact">
        <h3>🌾 SmartAgri</h3>
        <p>Connecting Farmers and Buyers</p>
        <p>© 2026 SmartAgri Marketplace</p>
      </footer>

    </div>
  );
}

export default App;