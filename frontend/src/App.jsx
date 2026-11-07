
import Login from "./Login";
import FarmerDashboard from "./FarmerDashboard";
import { useEffect, useState } from "react";
import "./App.css";

// CATEGORY IMAGE AND ICONS
const categoryVisuals = {
  Vegetables: {
    image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=900",
    icon: "🥕"
  },
  Fruits: {
    image: "https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=900",
    icon: "🍎"
  },
  Grains: {
    image: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=900",
    icon: "🌾"
  },
  Dairy: {
    image: "https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=900",
    icon: "🥛"
  }
};

// PRODUCT-SPECIFIC IMAGES
function getProductVisual(product) {
  const name = product?.name?.toLowerCase() || "";

  if (name.includes("tomato")) {
    return {
      image: "https://images.unsplash.com/photo-1546094096-0df4bcaaa337?w=900",
      icon: "🍅"
    };
  }

  if (name.includes("potato")) {
    return {
      image: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=900",
      icon: "🥔"
    };
  }

  if (name.includes("onion")) {
    return {
      image: "https://images.unsplash.com/photo-1508747703725-719777637510?w=900",
      icon: "🧅"
    };
  }

  return categoryVisuals[product?.category] || {
    image: "",
    icon: "🌱"
  };
}

// GET INDIVIDUAL PRODUCT STATUS
// Fallback supports orders created before item-level status was introduced.
function getItemStatus(item, order) {
  return item?.status || order?.status || "Placed";
}

// GET OVERALL ORDER STATUS FROM INDIVIDUAL PRODUCT STATUSES
function getOverallOrderStatus(order) {
  const items = order?.items || [];

  if (items.length === 0) {
    return order?.status || "Placed";
  }

  const statuses = items.map((item) => getItemStatus(item, order));

  if (statuses.every((status) => status === "Cancelled")) {
    return "Cancelled";
  }

  const activeStatuses = statuses.filter(
    (status) => status !== "Cancelled"
  );

  const rank = {
    Placed: 1,
    Confirmed: 2,
    Shipped: 3,
    Delivered: 4
  };

  return activeStatuses.reduce((earliest, status) => {
    return (rank[status] || 1) < (rank[earliest] || 1)
      ? status
      : earliest;
  }, activeStatuses[0] || "Placed");
}

// ORDER TRACKING COMPONENT
function OrderTracker({ status }) {
  const steps = ["Placed", "Confirmed", "Shipped", "Delivered"];

  if (status === "Cancelled") {
    return (
      <div style={{
        marginTop: "15px",
        padding: "15px",
        backgroundColor: "#fee2e2",
        color: "#991b1b",
        borderRadius: "8px"
      }}>
        <h4>Product Cancelled</h4>
        <p>This product has been cancelled.</p>
      </div>
    );
  }

  const currentIndex = steps.indexOf(status);

  return (
    <div style={{ marginTop: "15px", marginBottom: "15px" }}>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        position: "relative",
        marginTop: "20px",
        gap: "5px"
      }}>
        {steps.map((step, index) => {
          const completed = index <= currentIndex;

          return (
            <div key={step} style={{
              flex: 1,
              textAlign: "center",
              position: "relative",
              zIndex: 1
            }}>
              <div style={{
                width: "28px",
                height: "28px",
                borderRadius: "50%",
                backgroundColor: completed ? "#16a34a" : "#d1d5db",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 8px",
                fontWeight: "bold"
              }}>
                {completed ? "✓" : index + 1}
              </div>

              <span style={{
                fontSize: "12px",
                fontWeight: completed ? "bold" : "normal",
                color: completed ? "#15803d" : "#6b7280"
              }}>
                {step}
              </span>
            </div>
          );
        })}
      </div>

      <div style={{
        height: "6px",
        backgroundColor: "#d1d5db",
        borderRadius: "10px",
        marginTop: "12px",
        overflow: "hidden"
      }}>
        <div style={{
          height: "100%",
          width: currentIndex < 0
            ? "0%"
            : `${(currentIndex / (steps.length - 1)) * 100}%`,
          backgroundColor: "#16a34a",
          borderRadius: "10px",
          transition: "width 0.4s ease"
        }} />
      </div>

      <p style={{
        color: status === "Delivered" ? "#15803d" : "#374151",
        fontWeight: "bold",
        marginTop: "12px"
      }}>
        Current Status: {status}
      </p>
    </div>
  );
}

function App() {
  const [products, setProducts] = useState([]);
  const [cartMessage, setCartMessage] = useState({});
  const [selectedProduct, setSelectedProduct] = useState(null);

  // SEARCH, CATEGORY AND SORTING STATES
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortOption, setSortOption] = useState("default");

  const categories = [
    { name: "Vegetables", icon: "🥕", description: "Fresh farm vegetables" },
    { name: "Grains", icon: "🌾", description: "Quality grains and cereals" },
    { name: "Fruits", icon: "🍎", description: "Fresh seasonal fruits" },
    { name: "Dairy", icon: "🥛", description: "Fresh dairy products" }
  ];

  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [showLogin, setShowLogin] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [cartItems, setCartItems] = useState([]);

  // MY ORDERS STATES
  const [orders, setOrders] = useState([]);
  const [showOrders, setShowOrders] = useState(false);
  const [ordersMessage, setOrdersMessage] = useState("");

  // FETCH PRODUCTS
  const fetchProducts = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/products");
      const data = await response.json();

      if (response.ok) {
        setProducts(Array.isArray(data) ? data : data.products || []);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // FILTER AND SORT PRODUCTS
  const filteredProducts = products
    .filter((product) => {
      const matchesSearch = product.name
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase());

      const matchesCategory =
        selectedCategory === "All" ||
        product.category?.toLowerCase() === selectedCategory.toLowerCase();

      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (sortOption === "price-low") {
        return Number(a.price) - Number(b.price);
      }

      if (sortOption === "price-high") {
        return Number(b.price) - Number(a.price);
      }

      if (sortOption === "name-az") {
        return a.name.localeCompare(b.name);
      }

      return 0;
    });

  // FETCH CART
  const fetchCart = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/cart", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        setCartItems(data.cart?.items || data.items || []);
      } else {
        console.error("Error fetching cart:", data.message);
      }
    } catch (error) {
      console.error("Unable to fetch cart:", error);
    }
  };

  // FETCH MY ORDERS
  const fetchMyOrders = async () => {
    try {
      setOrdersMessage("Loading your orders...");

      const response = await fetch(
        "http://localhost:5000/api/orders/my-orders",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`
          }
        }
      );

      const data = await response.json();

      if (response.ok) {
        const orderList = Array.isArray(data) ? data : data.orders || [];
        setOrders(orderList);

        setOrdersMessage(
          orderList.length === 0
            ? "You haven't placed any orders yet."
            : ""
        );
      } else {
        setOrdersMessage(data.message || "Unable to fetch orders.");
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      setOrdersMessage("Unable to connect to server.");
    }
  };

  // ADD PRODUCT TO CART
  const handleAddToCart = async (productId) => {
    if (!user) {
      setCartMessage((previous) => ({
        ...previous,
        [productId]: "Please login as a buyer before adding products."
      }));
      return;
    }

    if (user.role !== "buyer") {
      setCartMessage((previous) => ({
        ...previous,
        [productId]: "Only buyers can add products to cart."
      }));
      return;
    }

    try {
      const response = await fetch(
        "http://localhost:5000/api/cart/add",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`
          },
          body: JSON.stringify({
            productId,
            quantity: 1
          })
        }
      );

      const data = await response.json();

      if (response.ok) {
        setCartMessage((previous) => ({
          ...previous,
          [productId]: "✓ Product added to cart successfully!"
        }));

        await fetchCart();
      } else {
        setCartMessage((previous) => ({
          ...previous,
          [productId]: data.message || "Unable to add product to cart."
        }));
      }
    } catch (error) {
      console.error("Add to cart error:", error);

      setCartMessage((previous) => ({
        ...previous,
        [productId]: "Unable to connect to server."
      }));
    }
  };

  // UPDATE CART QUANTITY
  const updateCartQuantity = async (productId, quantity) => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/cart/update/${productId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`
          },
          body: JSON.stringify({ quantity })
        }
      );

      const data = await response.json();

      if (response.ok) {
        await fetchCart();
      } else {
        alert(data.message || "Unable to update quantity");
      }
    } catch (error) {
      alert("Unable to connect to server");
    }
  };

  // REMOVE PRODUCT FROM CART
  const handleRemoveFromCart = async (productId) => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/cart/remove/${productId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`
          }
        }
      );

      const data = await response.json();

      if (response.ok) {
        await fetchCart();
      } else {
        alert(data.message || "Unable to remove product");
      }
    } catch (error) {
      alert("Unable to connect to server");
    }
  };

  // PLACE ORDER
  const handlePlaceOrder = async () => {
    if (cartItems.length === 0) {
      alert("Your cart is empty!");
      return;
    }

    try {
      const response = await fetch(
        "http://localhost:5000/api/orders/place",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`
          }
        }
      );

      const data = await response.json();

      if (response.ok) {
        alert("Order placed successfully!");
        setCartItems([]);
        await fetchCart();
        await fetchProducts();
        setShowCart(false);
      } else {
        alert(data.message || "Unable to place order");
      }
    } catch (error) {
      alert("Unable to connect to server");
    }
  };

  // CANCEL ORDER
  const handleCancelOrder = async (orderId) => {
    const confirmCancel = window.confirm(
      "Are you sure you want to cancel this order?"
    );

    if (!confirmCancel) return;

    try {
      const response = await fetch(
        `http://localhost:5000/api/orders/cancel/${orderId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`
          }
        }
      );

      const data = await response.json();

      if (response.ok) {
        alert("Order cancelled successfully! Stock has been restored.");

        await fetchMyOrders();
        await fetchProducts();
      } else {
        alert(data.message || "Unable to cancel order.");
      }
    } catch (error) {
      console.error("Cancel order error:", error);
      alert("Unable to connect to server.");
    }
  };

  // LOGOUT
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setUser(null);
    setShowLogin(false);
    setShowCart(false);
    setCartItems([]);
    setCartMessage({});
    setOrders([]);
    setShowOrders(false);
    setOrdersMessage("");
    setSelectedProduct(null);
  };

  // COMMON ADD TO CART BUTTON STYLE
  const addCartButtonStyle = {
    display: "inline-block",
    padding: "12px 20px",
    backgroundColor: "#15803d",
    color: "#ffffff",
    border: "none",
    borderRadius: "9px",
    fontSize: "14px",
    fontWeight: "bold",
    cursor: "pointer",
    margin: "8px 5px",
    transition: "all 0.2s ease"
  };

  // COMMON PRODUCT IMAGE STYLE
  const productImageStyle = {
    width: "100%",
    height: "190px",
    objectFit: "cover",
    display: "block"
  };

  return (
    <div className="app">

      {/* NAVBAR */}
      <nav className="navbar">
        <div className="logo">🌾 SmartAgri</div>

        <div className="nav-links">
          <a href="/">Home</a>
          <a href="#products">Products</a>
          <a href="#about">About</a>
          <a href="#contact">Contact</a>

          {user ? (
            <>
              <span>Welcome, {user.name}</span>

              {user.role === "buyer" && (
                <button
                  className="login-btn"
                  onClick={() => {
                    const nextShowOrders = !showOrders;
                    setShowOrders(nextShowOrders);
                    setShowCart(false);
                    setShowLogin(false);

                    if (nextShowOrders) fetchMyOrders();
                  }}
                >
                  My Orders
                </button>
              )}

              <button className="login-btn" onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <button
              className="login-btn"
              onClick={() => {
                setShowLogin(!showLogin);
                setShowCart(false);
                setShowOrders(false);
              }}
            >
              Login
            </button>
          )}

          {(!user || user.role === "buyer") && (
            <button
              className="cart"
              onClick={() => {
                const nextShowCart = !showCart;
                setShowCart(nextShowCart);
                setShowOrders(false);

                if (nextShowCart && user?.role === "buyer") {
                  fetchCart();
                }
              }}
            >
              🛒
            </button>
          )}
        </div>
      </nav>

      {/* FARMER DASHBOARD */}
      {user?.role === "farmer" && <FarmerDashboard />}

      {/* CART SECTION */}
      {showCart && (
        <section className="cart-section">
          <h2>My Shopping Cart 🛒</h2>

          {!user ? (
            <p>Please login to view your cart.</p>
          ) : user.role !== "buyer" ? (
            <p>Only buyers can view the shopping cart.</p>
          ) : cartItems.length === 0 ? (
            <p>Your cart is empty.</p>
          ) : (
            <div>
              {cartItems.map((item) => (
                <div className="cart-item" key={item._id}>
                  <h3>{item.product?.name}</h3>

                  <p>
                    Price: ₹{item.product?.price} / {item.product?.unit}
                  </p>

                  <div className="quantity-controls">
                    <button
                      onClick={() =>
                        updateCartQuantity(
                          item.product._id,
                          item.quantity - 1
                        )
                      }
                      disabled={item.quantity <= 1}
                    >
                      −
                    </button>

                    <span>{item.quantity}</span>

                    <button
                      onClick={() =>
                        updateCartQuantity(
                          item.product._id,
                          item.quantity + 1
                        )
                      }
                    >
                      +
                    </button>
                  </div>

                  <p>
                    Subtotal: ₹{item.product?.price * item.quantity}
                  </p>

                  <button
                    className="remove-cart-btn"
                    onClick={() => handleRemoveFromCart(item.product._id)}
                  >
                    Remove
                  </button>
                </div>
              ))}

              <h3>
                Total Amount: ₹
                {cartItems.reduce(
                  (total, item) =>
                    total + item.product.price * item.quantity,
                  0
                )}
              </h3>

              <button className="place-order-btn" onClick={handlePlaceOrder}>
                Place Order
              </button>
            </div>
          )}

          <button onClick={() => setShowCart(false)}>Close Cart</button>
        </section>
      )}

      {/* MY ORDERS SECTION */}
      {showOrders && (
        <section className="cart-section">
          <h2>My Orders 📦</h2>

          <button
            type="button"
            onClick={fetchMyOrders}
            style={{
              backgroundColor: "#15803d",
              color: "white",
              padding: "10px 18px",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "bold",
              marginBottom: "15px"
            }}
          >
            🔄 Refresh Status
          </button>

          <p>{ordersMessage}</p>

          {orders.map((order) => {
            const overallStatus = getOverallOrderStatus(order);

            const itemStatuses = (order.items || []).map((item) =>
              getItemStatus(item, order)
            );

            const canCancelOrder =
              itemStatuses.length > 0 &&
              itemStatuses.every(
                (status) =>
                  status === "Placed" || status === "Confirmed"
              );

            return (
              <div className="cart-item" key={order._id}>
                <h3>Order ID: {order._id}</h3>

                <p>
                  Order Date:{" "}
                  {order.createdAt
                    ? new Date(order.createdAt).toLocaleDateString("en-IN")
                    : "Not available"}
                </p>

                <p>
                  Overall Order Status:{" "}
                  <strong>{overallStatus}</strong>
                </p>

                <p>Total Amount: ₹{order.totalAmount}</p>

                <h4>Ordered Products and Tracking:</h4>

                {order.items?.map((item, index) => {
                  const itemStatus = getItemStatus(item, order);

                  return (
                    <div
                      key={item._id || index}
                      style={{
                        marginTop: "18px",
                        marginBottom: "20px",
                        padding: "18px",
                        border: "1px solid #d1d5db",
                        borderRadius: "12px",
                        backgroundColor: "#ffffff"
                      }}
                    >
                      <h3 style={{
                        color: "#14532d",
                        marginTop: 0
                      }}>
                        {item.product?.name || "Product"}
                      </h3>

                      <p>
                        Quantity: {item.quantity}
                      </p>

                      <p>
                        Price: ₹{item.price}
                      </p>

                      <p>
                        Product Status:{" "}
                        <strong style={{
                          color:
                            itemStatus === "Delivered"
                              ? "#15803d"
                              : itemStatus === "Cancelled"
                                ? "#dc2626"
                                : "#1d4ed8"
                        }}>
                          {itemStatus}
                        </strong>
                      </p>

                      <OrderTracker status={itemStatus} />
                    </div>
                  );
                })}

                {canCancelOrder && (
                  <button
                    type="button"
                    onClick={() => handleCancelOrder(order._id)}
                    style={{
                      backgroundColor: "#dc2626",
                      color: "white",
                      padding: "10px 18px",
                      border: "none",
                      borderRadius: "8px",
                      cursor: "pointer",
                      fontWeight: "bold",
                      marginBottom: "15px"
                    }}
                  >
                    ❌ Cancel Order
                  </button>
                )}
              </div>
            );
          })}

          <button onClick={() => setShowOrders(false)}>Close Orders</button>
        </section>
      )}

      {/* LOGIN FORM */}
      {showLogin && (
        <Login
          onLogin={(loggedInUser) => {
            setUser(loggedInUser);
            setShowLogin(false);
            setShowCart(false);
            setShowOrders(false);
          }}
        />
      )}

      {/* HERO SECTION */}
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

          <button
            className="explore-btn"
            onClick={() =>
              document.getElementById("products")?.scrollIntoView({
                behavior: "smooth"
              })
            }
          >
            Explore Products
          </button>
        </div>

        <div className="hero-image">🌾</div>
      </section>

      {/* CATEGORIES */}
      <section className="categories" id="products">
        <h2>Explore Categories</h2>

        <p className="section-description">
          Discover fresh products from local farmers
        </p>

        <div className="category-container">
          {categories.map((category) => (
            <div
              className="category-card"
              key={category.name}
              onClick={() => {
                setSelectedCategory(category.name);
                setSearchTerm("");

                document.getElementById("available-products")?.scrollIntoView({
                  behavior: "smooth"
                });
              }}
              style={{
                cursor: "pointer",
                border: selectedCategory === category.name
                  ? "2px solid #16a34a"
                  : "2px solid transparent"
              }}
            >
              <div className="category-icon">{category.icon}</div>
              <h3>{category.name}</h3>
              <p>{category.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* AVAILABLE PRODUCTS */}
      <section className="products-section" id="available-products">

        {/* PRODUCT DETAILS PANEL */}
        {selectedProduct && (
          <div style={{
            maxWidth: "850px",
            margin: "30px auto",
            padding: "25px",
            backgroundColor: "#ffffff",
            borderRadius: "18px",
            boxShadow: "0 8px 30px rgba(0,0,0,0.10)",
            textAlign: "left",
            border: "1px solid #e5e7eb"
          }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "25px",
              flexWrap: "wrap"
            }}>
              <div style={{
                width: "230px",
                height: "220px",
                borderRadius: "14px",
                overflow: "hidden",
                backgroundColor: "#f0fdf4",
                flexShrink: 0
              }}>
                <img
                  src={getProductVisual(selectedProduct).image}
                  alt={selectedProduct.name}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover"
                  }}
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
                <span style={{
                  display: "none"
                }}>
                  {getProductVisual(selectedProduct).icon}
                </span>
              </div>

              <div style={{ flex: 1, minWidth: "200px" }}>
                <span style={{
                  backgroundColor: "#dcfce7",
                  color: "#166534",
                  padding: "7px 14px",
                  borderRadius: "20px",
                  fontSize: "13px",
                  fontWeight: "bold"
                }}>
                  {selectedProduct.category}
                </span>

                <h2 style={{
                  color: "#14532d",
                  marginTop: "15px",
                  fontSize: "28px"
                }}>
                  {selectedProduct.name}
                </h2>

                <p style={{
                  color: "#6b7280",
                  lineHeight: "1.7"
                }}>
                  {selectedProduct.description || "No description available"}
                </p>

                <h2 style={{
                  color: "#15803d",
                  marginTop: "12px",
                  fontSize: "25px"
                }}>
                  ₹{selectedProduct.price} / {selectedProduct.unit}
                </h2>
              </div>
            </div>

            <hr style={{
              border: "none",
              borderTop: "1px solid #e5e7eb",
              margin: "25px 0"
            }} />

            <div style={{
              display: "flex",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "15px"
            }}>
              <div>
                <p style={{ color: "#6b7280", marginBottom: "5px" }}>
                  Available Quantity
                </p>

                <h3 style={{ color: "#166534" }}>
                  📦 {selectedProduct.quantity} {selectedProduct.unit}
                </h3>
              </div>

              <div>
                <p style={{ color: "#6b7280", marginBottom: "5px" }}>
                  Sold By
                </p>

                <h3 style={{ color: "#166534" }}>
                  👨‍🌾 {selectedProduct.farmer?.name || "Farmer"}
                </h3>
              </div>
            </div>

            {/* PUBLIC FARMER PROFILE */}
            <div style={{
              marginTop: "22px",
              padding: "20px",
              backgroundColor: "#f0fdf4",
              border: "1px solid #bbf7d0",
              borderRadius: "12px"
            }}>
              <h3 style={{
                color: "#166534",
                marginTop: 0,
                marginBottom: "15px"
              }}>
                👨‍🌾 About the Farmer
              </h3>

              <p style={{ margin: "8px 0", color: "#374151" }}>
                <strong>Farmer Name:</strong>{" "}
                {selectedProduct.farmer?.name || "Not provided"}
              </p>

              <p style={{ margin: "8px 0", color: "#374151" }}>
                <strong>Phone Number:</strong>{" "}
                {selectedProduct.farmer?.phone || "Not provided"}
              </p>

              <p style={{ margin: "8px 0", color: "#374151" }}>
                <strong>Farm Address:</strong>{" "}
                {selectedProduct.farmer?.farmAddress || "Not provided"}
              </p>

              <p style={{
                margin: "8px 0",
                color: "#374151",
                lineHeight: "1.6"
              }}>
                <strong>About the Farm:</strong>{" "}
                {selectedProduct.farmer?.farmDescription || "No farm description provided."}
              </p>
            </div>

            <div style={{
              display: "flex",
              gap: "12px",
              flexWrap: "wrap",
              marginTop: "25px"
            }}>
              {user?.role !== "farmer" && (
                <button
                  type="button"
                  onClick={() => handleAddToCart(selectedProduct._id)}
                  disabled={Number(selectedProduct.quantity) <= 0}
                  style={{
                    ...addCartButtonStyle,
                    opacity: Number(selectedProduct.quantity) <= 0 ? 0.5 : 1,
                    cursor: Number(selectedProduct.quantity) <= 0
                      ? "not-allowed"
                      : "pointer"
                  }}
                >
                  🛒 Add to Cart
                </button>
              )}

              <button
                type="button"
                onClick={() => setSelectedProduct(null)}
                style={{
                  padding: "12px 20px",
                  backgroundColor: "#f3f4f6",
                  color: "#374151",
                  border: "none",
                  borderRadius: "9px",
                  cursor: "pointer",
                  margin: "8px 5px",
                  fontWeight: "bold"
                }}
              >
                Close Details
              </button>
            </div>

            {cartMessage[selectedProduct._id] && (
              <p style={{
                color: cartMessage[selectedProduct._id].startsWith("✓")
                  ? "#166534"
                  : "#b91c1c",
                fontWeight: "bold",
                marginTop: "15px"
              }}>
                {cartMessage[selectedProduct._id]}
              </p>
            )}
          </div>
        )}

        <h2>Available Products</h2>

        <p className="section-description">
          Fresh products directly from farmers
        </p>

        {/* SEARCH BAR */}
        <input
          type="text"
          placeholder="🔍 Search products by name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: "80%",
            maxWidth: "450px",
            padding: "13px 16px",
            margin: "20px auto",
            display: "block",
            border: "1px solid #d1d5db",
            borderRadius: "10px",
            fontSize: "15px",
            outlineColor: "#16a34a"
          }}
        />

        {/* CATEGORY FILTER */}
        <div style={{
          display: "flex",
          justifyContent: "center",
          flexWrap: "wrap",
          gap: "10px",
          marginBottom: "25px"
        }}>
          {["All", ...categories.map((category) => category.name)].map(
            (category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                style={{
                  padding: "10px 18px",
                  borderRadius: "22px",
                  border: selectedCategory === category
                    ? "1px solid #15803d"
                    : "1px solid #e5e7eb",
                  cursor: "pointer",
                  backgroundColor: selectedCategory === category
                    ? "#15803d"
                    : "#ffffff",
                  color: selectedCategory === category ? "white" : "#374151",
                  fontWeight: "600"
                }}
              >
                {category}
              </button>
            )
          )}
        </div>

        {/* SORT PRODUCTS */}
        <div style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "10px",
          marginBottom: "25px"
        }}>
          <label htmlFor="sort-products">
            <strong>Sort by:</strong>
          </label>

          <select
            id="sort-products"
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
            style={{
              padding: "10px 15px",
              borderRadius: "8px",
              border: "1px solid #d1d5db",
              fontSize: "15px",
              cursor: "pointer",
              backgroundColor: "white"
            }}
          >
            <option value="default">Default</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="name-az">Name: A to Z</option>
          </select>
        </div>

        {/* PRODUCT CARDS */}
        <div className="product-container" style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(245px, 1fr))",
          gap: "25px",
          alignItems: "stretch",
          marginTop: "25px"
        }}>
          {filteredProducts.length > 0 ? (
            filteredProducts.map((product) => {
              const visual = getProductVisual(product);
              const isOutOfStock = Number(product.quantity) <= 0;

              return (
                <div
                  className="product-card"
                  key={product._id}
                  style={{
                    backgroundColor: "#ffffff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "16px",
                    overflow: "hidden",
                    boxShadow: "0 4px 15px rgba(0,0,0,0.07)",
                    textAlign: "left",
                    display: "flex",
                    flexDirection: "column",
                    transition: "transform 0.2s ease, box-shadow 0.2s ease"
                  }}
                >
                  {/* PRODUCT IMAGE */}
                  <div style={{
                    height: "190px",
                    position: "relative",
                    overflow: "hidden",
                    backgroundColor: "#f0fdf4"
                  }}>
                    <img
                      src={visual.image}
                      alt={product.name}
                      style={productImageStyle}
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />

                    <span style={{
                      position: "absolute",
                      top: "12px",
                      left: "12px",
                      padding: "6px 12px",
                      borderRadius: "20px",
                      backgroundColor: "#ffffff",
                      color: "#166534",
                      fontSize: "12px",
                      fontWeight: "bold",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.10)"
                    }}>
                      {product.category}
                    </span>

                    <span style={{
                      position: "absolute",
                      top: "12px",
                      right: "12px",
                      padding: "6px 10px",
                      borderRadius: "20px",
                      backgroundColor: isOutOfStock ? "#fee2e2" : "#dcfce7",
                      color: isOutOfStock ? "#991b1b" : "#166534",
                      fontSize: "11px",
                      fontWeight: "bold"
                    }}>
                      {isOutOfStock ? "Out of Stock" : "In Stock"}
                    </span>
                  </div>

                  {/* PRODUCT INFORMATION */}
                  <div style={{
                    padding: "18px",
                    display: "flex",
                    flexDirection: "column",
                    flex: 1
                  }}>
                    <h3 style={{
                      color: "#14532d",
                      fontSize: "20px",
                      margin: "0 0 8px",
                      fontWeight: "700"
                    }}>
                      {product.name}
                    </h3>

                    <p style={{
                      color: "#6b7280",
                      fontSize: "13px",
                      lineHeight: "1.5",
                      minHeight: "40px",
                      margin: "0 0 12px"
                    }}>
                      {product.description || "Fresh quality product from local farmers."}
                    </p>

                    <h2 style={{
                      color: "#15803d",
                      fontSize: "23px",
                      margin: "5px 0 12px"
                    }}>
                      ₹{product.price}
                      <span style={{
                        fontSize: "13px",
                        color: "#6b7280",
                        fontWeight: "normal"
                      }}>
                        {" "} / {product.unit}
                      </span>
                    </h2>

                    <div style={{
                      borderTop: "1px solid #f0f0f0",
                      paddingTop: "12px",
                      marginTop: "auto"
                    }}>
                      <p style={{
                        color: "#4b5563",
                        fontSize: "13px",
                        margin: "5px 0"
                      }}>
                        📦 Available: <strong>{product.quantity} {product.unit}</strong>
                      </p>

                      <p style={{
                        color: "#4b5563",
                        fontSize: "13px",
                        margin: "5px 0 12px"
                      }}>
                        👨‍🌾 Farmer: {product.farmer?.name || "Local Farmer"}
                      </p>
                    </div>

                    {/* PRODUCT ACTIONS */}
                    <div style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "7px",
                      marginTop: "10px"
                    }}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedProduct(product);

                          document.getElementById("available-products")?.scrollIntoView({
                            behavior: "smooth"
                          });
                        }}
                        style={{
                          flex: 1,
                          minWidth: "100px",
                          padding: "11px 8px",
                          backgroundColor: "#eff6ff",
                          color: "#1d4ed8",
                          border: "1px solid #bfdbfe",
                          borderRadius: "9px",
                          cursor: "pointer",
                          fontWeight: "bold"
                        }}
                      >
                        View Details
                      </button>

                      {user?.role !== "farmer" && (
                        <button
                          type="button"
                          onClick={() => handleAddToCart(product._id)}
                          disabled={isOutOfStock}
                          style={{
                            flex: 1,
                            minWidth: "110px",
                            padding: "11px 8px",
                            backgroundColor: isOutOfStock ? "#9ca3af" : "#15803d",
                            color: "white",
                            border: "none",
                            borderRadius: "9px",
                            cursor: isOutOfStock ? "not-allowed" : "pointer",
                            fontWeight: "bold"
                          }}
                        >
                          🛒 Add to Cart
                        </button>
                      )}
                    </div>

                    {cartMessage[product._id] && (
                      <p style={{
                        color: cartMessage[product._id].startsWith("✓")
                          ? "#166534"
                          : "#b91c1c",
                        fontWeight: "bold",
                        fontSize: "12px",
                        marginTop: "12px"
                      }}>
                        {cartMessage[product._id]}
                      </p>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <p style={{
              textAlign: "center",
              color: "#6b7280",
              gridColumn: "1 / -1",
              padding: "30px"
            }}>
              No products found. Try another search or category.
            </p>
          )}
        </div>

        {/* CLEAR FILTERS */}
        <button
          onClick={() => {
            setSelectedCategory("All");
            setSearchTerm("");
            setSortOption("default");
            setSelectedProduct(null);
          }}
          style={{
            marginTop: "25px",
            padding: "11px 20px",
            cursor: "pointer",
            border: "1px solid #d1d5db",
            borderRadius: "8px",
            backgroundColor: "#f3f4f6",
            fontWeight: "bold"
          }}
        >
          Clear Search and Filters
        </button>
      </section>

      {/* WHY CHOOSE SMARTAGRI */}
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

      {/* FOOTER */}
      <footer id="contact">
        <h3>🌾 SmartAgri</h3>
        <p>Connecting Farmers and Buyers</p>
        <p>© 2026 SmartAgri Marketplace</p>
      </footer>

    </div>
  );
}

export default App;

