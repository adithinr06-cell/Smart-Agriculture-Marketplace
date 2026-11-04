
import { useEffect, useState } from "react";

function FarmerDashboard() {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [message, setMessage] = useState("Loading orders...");
  const [loading, setLoading] = useState(true);

  // Farmer Profile State
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    farmAddress: "",
    farmDescription: ""
  });

  const [profileLoading, setProfileLoading] = useState(true);
  const [profileEditing, setProfileEditing] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");

  // Add Product Form State
  const [productName, setProductName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Vegetables");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("kg");
  const [productMessage, setProductMessage] = useState("");

  // Edit Product Form State
  const [editingProductId, setEditingProductId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCategory, setEditCategory] = useState("Vegetables");
  const [editPrice, setEditPrice] = useState("");
  const [editQuantity, setEditQuantity] = useState("");
  const [editUnit, setEditUnit] = useState("kg");
  const [editMessage, setEditMessage] = useState("");

  // Fetch Farmer Profile
  const fetchFarmerProfile = async () => {
    setProfileLoading(true);

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        "http://localhost:5000/api/farmer-profile",
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await response.json();

      if (response.ok) {
        setProfile({
          name: data.farmer.name || "",
          email: data.farmer.email || "",
          phone: data.farmer.phone || "",
          farmAddress: data.farmer.farmAddress || "",
          farmDescription: data.farmer.farmDescription || ""
        });
      } else {
        setProfileMessage(data.message || "Unable to fetch profile");
      }
    } catch (error) {
      setProfileMessage("Unable to connect to server");
    } finally {
      setProfileLoading(false);
    }
  };

  // Update Farmer Profile
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileMessage("Saving profile...");

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        "http://localhost:5000/api/farmer-profile",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            name: profile.name,
            phone: profile.phone,
            farmAddress: profile.farmAddress,
            farmDescription: profile.farmDescription
          })
        }
      );

      const data = await response.json();

      if (response.ok) {
        setProfile({
          name: data.farmer.name || "",
          email: data.farmer.email || "",
          phone: data.farmer.phone || "",
          farmAddress: data.farmer.farmAddress || "",
          farmDescription: data.farmer.farmDescription || ""
        });

        setProfileEditing(false);
        setProfileMessage("Profile updated successfully!");
      } else {
        setProfileMessage(data.message || "Unable to update profile");
      }
    } catch (error) {
      setProfileMessage("Unable to connect to server");
    }
  };

  // Fetch Farmer Orders
  const fetchFarmerOrders = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        "http://localhost:5000/api/orders/farmer-orders",
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await response.json();

      if (response.ok) {
        setOrders(data.orders || []);
        setMessage(
          data.orders.length === 0
            ? "No incoming orders yet."
            : ""
        );
      } else {
        setMessage(data.message || "Unable to fetch orders");
      }
    } catch (error) {
      setMessage("Unable to connect to server");
    } finally {
      setLoading(false);
    }
  };

  // Fetch Products Belonging to Logged-in Farmer
  const fetchMyProducts = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        "http://localhost:5000/api/products/my-products",
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await response.json();

      if (response.ok) {
        setProducts(data);
      } else {
        console.error(data.message);
      }
    } catch (error) {
      console.error("Unable to fetch products", error);
    }
  };

  useEffect(() => {
    fetchFarmerProfile();
    fetchFarmerOrders();
    fetchMyProducts();
  }, []);

  // Update Order Status
  const updateOrderStatus = async (orderId, status) => {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `http://localhost:5000/api/orders/update-status/${orderId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ status })
        }
      );

      const data = await response.json();

      if (response.ok) {
        alert("Order status updated successfully!");
        fetchFarmerOrders();
      } else {
        alert(data.message || "Unable to update order status");
      }
    } catch (error) {
      alert("Unable to connect to server");
    }
  };

  // Add Product
  const handleAddProduct = async (e) => {
    e.preventDefault();
    setProductMessage("Adding product...");

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        "http://localhost:5000/api/products",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            name: productName,
            description,
            category,
            price: Number(price),
            quantity: Number(quantity),
            unit
          })
        }
      );

      const data = await response.json();

      if (response.ok) {
        setProductMessage("Product added successfully!");

        setProductName("");
        setDescription("");
        setCategory("Vegetables");
        setPrice("");
        setQuantity("");
        setUnit("kg");

        fetchMyProducts();
      } else {
        setProductMessage(data.message || "Unable to add product");
      }
    } catch (error) {
      setProductMessage("Unable to connect to server");
    }
  };

  // Open Edit Form
  const handleEditClick = (product) => {
    setEditingProductId(product._id);
    setEditName(product.name);
    setEditDescription(product.description);
    setEditCategory(product.category);
    setEditPrice(product.price);
    setEditQuantity(product.quantity);
    setEditUnit(product.unit);
    setEditMessage("");
  };

  // Update Product
  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    setEditMessage("Updating product...");

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `http://localhost:5000/api/products/${editingProductId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            name: editName,
            description: editDescription,
            category: editCategory,
            price: Number(editPrice),
            quantity: Number(editQuantity),
            unit: editUnit
          })
        }
      );

      const data = await response.json();

      if (response.ok) {
        setEditingProductId(null);
        setEditMessage("");
        await fetchMyProducts();
        alert("Product updated successfully!");
      } else {
        setEditMessage(data.message || "Unable to update product");
      }
    } catch (error) {
      setEditMessage("Unable to connect to server");
    }
  };

  const pendingOrders = orders.filter(
    order => ["Placed", "Confirmed", "Shipped"].includes(order.status)
  );

  const deliveredOrders = orders.filter(
    order => order.status === "Delivered"
  );

  return (
    <div className="farmer-dashboard">

      <h2>🌾 Farmer Dashboard</h2>
      <p>Manage your products and incoming customer orders.</p>

      {/* FARMER PROFILE SECTION */}

      <div className="farmer-profile-section">
        <h3>👨‍🌾 Farmer Profile</h3>

        {profileLoading ? (
          <p>Loading profile...</p>
        ) : (
          <>
            {!profileEditing ? (
              <div className="farmer-profile-card">

                <p>
                  <strong>Name:</strong> {profile.name || "Not provided"}
                </p>

                <p>
                  <strong>Email:</strong> {profile.email || "Not available"}
                </p>

                <p>
                  <strong>Phone:</strong> {profile.phone || "Not provided"}
                </p>

                <p>
                  <strong>Farm Address:</strong>{" "}
                  {profile.farmAddress || "Not provided"}
                </p>

                <p>
                  <strong>About Our Farm:</strong>{" "}
                  {profile.farmDescription || "No description added yet."}
                </p>

                <button
                  onClick={() => {
                    setProfileMessage("");
                    setProfileEditing(true);
                  }}
                >
                  ✏️ Edit Profile
                </button>

              </div>
            ) : (
              <form
                className="farmer-profile-form"
                onSubmit={handleUpdateProfile}
              >

                <label>Farmer Name</label>
                <input
                  type="text"
                  placeholder="Enter your name"
                  value={profile.name}
                  onChange={(e) =>
                    setProfile({ ...profile, name: e.target.value })
                  }
                  required
                />

                <label>Email Address</label>
                <input
                  type="email"
                  value={profile.email}
                  readOnly
                />

                <label>Phone Number</label>
                <input
                  type="tel"
                  placeholder="Enter phone number"
                  value={profile.phone}
                  onChange={(e) =>
                    setProfile({ ...profile, phone: e.target.value })
                  }
                />

                <label>Farm Address</label>
                <textarea
                  placeholder="Enter your farm address"
                  value={profile.farmAddress}
                  onChange={(e) =>
                    setProfile({ ...profile, farmAddress: e.target.value })
                  }
                />

                <label>About Your Farm</label>
                <textarea
                  placeholder="Describe your farm and the products you grow"
                  value={profile.farmDescription}
                  onChange={(e) =>
                    setProfile({ ...profile, farmDescription: e.target.value })
                  }
                />

                <button type="submit">Save Profile</button>

                <button
                  type="button"
                  onClick={() => {
                    fetchFarmerProfile();
                    setProfileEditing(false);
                    setProfileMessage("");
                  }}
                >
                  Cancel
                </button>

              </form>
            )}

            <p>{profileMessage}</p>
          </>
        )}
      </div>

      {/* ADD PRODUCT SECTION */}

      <div className="add-product-section">
        <h3>➕ Add New Product</h3>

        <form onSubmit={handleAddProduct}>

          <input
            type="text"
            placeholder="Product Name"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            required
          />

          <textarea
            placeholder="Product Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="Vegetables">Vegetables</option>
            <option value="Grains">Grains</option>
            <option value="Fruits">Fruits</option>
            <option value="Dairy">Dairy</option>
          </select>

          <input
            type="number"
            placeholder="Price"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            min="0.01"
            step="0.01"
            required
          />

          <input
            type="number"
            placeholder="Available Quantity"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            min="1"
            step="1"
            required
          />

          <select
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
          >
            <option value="kg">Kilogram (kg)</option>
            <option value="gram">Gram</option>
            <option value="quintal">Quintal</option>
            <option value="tonne">Tonne</option>
            <option value="piece">Piece</option>
            <option value="litre">Litre</option>
          </select>

          <button type="submit">Add Product</button>

        </form>

        <p>{productMessage}</p>
      </div>

      {/* MY PRODUCTS SECTION */}

      <div className="my-products-section">
        <h3>🛒 My Products</h3>

        {products.length === 0 ? (
          <p>No products added yet.</p>
        ) : (
          products.map(product => (
            <div className="my-product-card" key={product._id}>

              <h4>{product.name}</h4>
              <p>{product.description}</p>
              <p>Category: {product.category}</p>
              <p>Price: ₹{product.price} / {product.unit}</p>
              <p>
                Available Quantity: {product.quantity} {product.unit}
              </p>

              <button onClick={() => handleEditClick(product)}>
                Edit Product
              </button>

            </div>
          ))
        )}

        <button onClick={fetchMyProducts}>
          Refresh My Products
        </button>
      </div>

      {/* EDIT PRODUCT SECTION */}

      {editingProductId && (
        <div className="add-product-section">

          <h3>✏️ Edit Product</h3>

          <form onSubmit={handleUpdateProduct}>

            <input
              type="text"
              placeholder="Product Name"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              required
            />

            <textarea
              placeholder="Product Description"
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              required
            />

            <select
              value={editCategory}
              onChange={(e) => setEditCategory(e.target.value)}
            >
              <option value="Vegetables">Vegetables</option>
              <option value="Grains">Grains</option>
              <option value="Fruits">Fruits</option>
              <option value="Dairy">Dairy</option>
            </select>

            <input
              type="number"
              placeholder="Price"
              value={editPrice}
              onChange={(e) => setEditPrice(e.target.value)}
              min="0.01"
              step="0.01"
              required
            />

            <input
              type="number"
              placeholder="Available Quantity"
              value={editQuantity}
              onChange={(e) => setEditQuantity(e.target.value)}
              min="0"
              step="1"
              required
            />

            <select
              value={editUnit}
              onChange={(e) => setEditUnit(e.target.value)}
            >
              <option value="kg">Kilogram (kg)</option>
              <option value="gram">Gram</option>
              <option value="quintal">Quintal</option>
              <option value="tonne">Tonne</option>
              <option value="piece">Piece</option>
              <option value="litre">Litre</option>
            </select>

            <button type="submit">Save Changes</button>

            <button
              type="button"
              onClick={() => {
                setEditingProductId(null);
                setEditMessage("");
              }}
            >
              Cancel
            </button>

          </form>

          <p>{editMessage}</p>

        </div>
      )}

      {/* DASHBOARD SUMMARY */}

      <div className="farmer-summary">

        <div>
          <h3>{orders.length}</h3>
          <p>Total Orders</p>
        </div>

        <div>
          <h3>{pendingOrders.length}</h3>
          <p>Pending Orders</p>
        </div>

        <div>
          <h3>{deliveredOrders.length}</h3>
          <p>Delivered Orders</p>
        </div>

      </div>

      {/* INCOMING ORDERS */}

      <h3>Incoming Orders 📦</h3>

      {loading ? (
        <p>Loading orders...</p>
      ) : orders.length === 0 ? (
        <p>{message}</p>
      ) : (
        orders.map(order => (
          <div className="farmer-order-card" key={order._id}>

            <h4>Order ID: {order._id}</h4>

            <p>Buyer: {order.buyer?.name || "Unknown"}</p>

            <p>Email: {order.buyer?.email || "Not available"}</p>

            <p>
              Order Date:{" "}
              {new Date(order.createdAt).toLocaleDateString("en-IN")}
            </p>

            <p>
              Status: <strong>{order.status}</strong>
            </p>

            <h4>Ordered Products</h4>

            {order.items.map(item => (
              <div key={item._id}>

                <p>
                  {item.product?.name || "Product"} -
                  Quantity: {item.quantity} {item.product?.unit || ""}
                </p>

                <p>Price: ₹{item.price}</p>

                <p>
                  Subtotal: ₹{item.price * item.quantity}
                </p>

              </div>
            ))}

            <h4>
              Total Amount: ₹
              {order.items.reduce(
                (total, item) => total + item.price * item.quantity,
                0
              )}
            </h4>

            {order.status === "Placed" && (
              <button onClick={() => updateOrderStatus(order._id, "Confirmed")}>
                Confirm Order
              </button>
            )}

            {order.status === "Confirmed" && (
              <button onClick={() => updateOrderStatus(order._id, "Shipped")}>
                Mark as Shipped
              </button>
            )}

            {order.status === "Shipped" && (
              <button onClick={() => updateOrderStatus(order._id, "Delivered")}>
                Mark as Delivered
              </button>
            )}

            {order.status === "Delivered" && (
              <p>✅ Order Delivered</p>
            )}

            {order.status === "Cancelled" && (
              <p>❌ Order Cancelled</p>
            )}

          </div>
        ))
      )}

      <button onClick={fetchFarmerOrders}>
        Refresh Orders
      </button>

    </div>
  );
}

export default FarmerDashboard;
