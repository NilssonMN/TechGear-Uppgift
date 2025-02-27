const Database = require("better-sqlite3");
const db = new Database('./TechGearWebShop.db', { verbose: console.log });

db.prepare("PRAGMA foreign_keys = ON").run();


//Produkthantering
const query = `
SELECT 
    products.product_id,
    products.name, 
    products.description, 
    products.price, 
    products.stock_quantity, 
    manufacturers.name AS manufacturer,
    categories.name AS category
FROM products
JOIN manufacturers ON products.manufacturer_id = manufacturers.manufacturer_id
LEFT JOIN products_categories ON products.product_id = products_categories.product_id
LEFT JOIN categories ON products_categories.category_id = categories.category_id
`;

//lista på alla produkter
function getAllProducts() { 
    return db.prepare(query).all();
}

// Ser produkter baserad på deras ID (2)
function getProductByID(id) {
    try {
        return db.prepare(`${query} WHERE products.product_id = ?`).get(id) || { message: "Product not found" };
    } catch (e) {
        return { error: "Database error" };
    }
}

// Söker på produkter som laptops tex 
function searchProductsByName(productName) {
    const stmt = db.prepare(`
        ${query} 
        WHERE LOWER(products.name) LIKE LOWER(?)
    `);
    return stmt.all(`%${productName}%`);
}

//Ser produkter utifrån vilken category dem ligger i
function getProductsByCategory(categoryId) {
    return db.prepare(`${query} WHERE categories.category_id = ?`).all(categoryId);
}

//Skapar en ny produkt
function createProduct(name, description, price, stock_quantity, manufacturer_id) {
    try {
        const stmt = db.prepare('INSERT INTO products (manufacturer_id, name, description, price, stock_quantity) VALUES (?, ?, ?, ?, ?)');
        const result = stmt.run(manufacturer_id, name, description, price, stock_quantity);
        return { 
            message: "Product created successfully", 
            product_id: result.lastID 
        };
    } catch (err) {
        console.error("Failed to add product:", err.message);
        return { error: "Failed to create product", details: err.message };
    }
}

//
function updateProduct(id, name, description, price, stock_quantity, manufacturer_id) {
    try {
        const stmt = db.prepare('UPDATE products SET manufacturer_id = ?, name = ?, description = ?, price = ?, stock_quantity = ? WHERE product_id = ?');
        const result = stmt.run(manufacturer_id, name, description, price, stock_quantity, id);
        if (result.changes === 0) {
            return { error: "Product not found" };
        }
        return { 
            message: "Product updated successfully", 
            changes: result.changes 
        };
    } catch (err) {
        console.error("Failed to update product:", err.message);
        return { error: "Failed to update product", details: err.message };
    }
}


//Fungerar med Implementera CASCADE DELETE mellan products och reviews
function deleteProduct(id) {
    const deleteProductStmt = db.prepare("DELETE FROM products WHERE product_id = ?");
    const result = deleteProductStmt.run(id);

    return { 
        message: "Product and related reviews deleted", 
        product_deleted: result.changes 
    };
}


//Kundhantering
const customerQuery = `
    SELECT 
        customers.customer_id, 
        customers.name, 
        customers.email, 
        customers.phone, 
        orders.order_id, 
        orders.order_date
    FROM customers
    LEFT JOIN orders ON customers.customer_id = orders.customer_id
    WHERE customers.customer_id = ?
`;

//See customer with ID
function getCustomerById(id) {
    return db.prepare(customerQuery).all(id);
}

//Update customer with mail, phone,address
function updateCustomer(id, email, phone, address) {
    const stmt = db.prepare(`
        UPDATE customers 
        SET email = ?, phone = ?, address = ? 
        WHERE customer_id = ?
    `);
    const result = stmt.run(email, phone, address, id);

    return { message: "Customer updated", changes: result.changes };
}

//Get customer orders with ID
function getCustomerOrders(customerId) {
    const query = `
        SELECT 
            order_id, 
            order_date 
        FROM orders 
        WHERE customer_id = ?
    `;
    return db.prepare(query).all(customerId);
}


//Analysdata 
const analysQuery = `
    SELECT 
        COALESCE(categories.name, 'Uncategorized') AS category, 
        COUNT(products.product_id) AS total_products, 
        AVG(products.price) AS avg_price, 
        SUM(products.stock_quantity) AS total_stock
    FROM products
    LEFT JOIN products_categories ON products.product_id = products_categories.product_id
    LEFT JOIN categories ON products_categories.category_id = categories.category_id
    GROUP BY COALESCE(categories.name, 'Uncategorized');

`;

//Get product stats
function getProductStats() {
    const stmt = db.prepare(analysQuery);
    return stmt.all();
}


//Reviews query
const reviewsQuery = `
    SELECT 
        products.product_id, 
        products.name AS product_name, 
        AVG(reviews.rating) AS avg_rating, 
        GROUP_CONCAT(reviews.comment, ' || ') AS comments
    FROM reviews
    JOIN products ON reviews.product_id = products.product_id
    GROUP BY products.product_id;
`;

//Get reviews
function getReviewStats() {
    const stmt = db.prepare(reviewsQuery);
    return stmt.all();
}


//CASCADE UPDATE
function updateCategoryId(oldId, newId) {
    try {
        // Kontrollera om det nya ID:t redan finns för att undvika dubbletter
        const exists = db.prepare('SELECT 1 FROM categories WHERE category_id = ?').get(newId);
        if (exists) {
            return { error: "Det nya category_id:t existerar redan" };
        }

        // Uppdatera category_id i categories-tabellen
        const stmt = db.prepare('UPDATE categories SET category_id = ? WHERE category_id = ?');
        const result = stmt.run(newId, oldId);

        if (result.changes === 0) {
            return { error: "Kategorin hittades inte" };
        }

        return { message: "Kategorin uppdaterades", changes: result.changes };
    } catch (err) {
        console.error("Fel vid uppdatering av kategori:", err);
        return { error: "Databasfel" };
    }
}

module.exports = {
    getAllProducts,
    getProductByID,
    searchProductsByName,
    getProductsByCategory,
    createProduct,
    updateProduct,
    deleteProduct,
    getCustomerById,
    updateCustomer,
    getCustomerOrders,
    getProductStats,
    getReviewStats,
    updateCategoryId
};

