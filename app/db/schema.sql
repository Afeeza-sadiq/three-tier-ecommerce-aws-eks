CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  stock INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  quantity INT NOT NULL,
  customer_name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

INSERT INTO products (name, description, price, stock) VALUES
  ('Wireless Mouse', 'Ergonomic wireless mouse with USB receiver', 799.00, 150),
  ('Mechanical Keyboard', 'RGB backlit mechanical keyboard', 3499.00, 80),
  ('USB-C Hub', '7-in-1 USB-C hub with HDMI and card reader', 1899.00, 120),
  ('Laptop Stand', 'Adjustable aluminum laptop stand', 1299.00, 200);
