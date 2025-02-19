const Database = require("better-sqlite3");
const db = new Database('./webbutiken.db', { verbose: console.log });
// Enable foreign key constraints
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

//Ser en lista på alla produkter

function getAllProducts() { 
    return db.prepare(query).all();
}

// Ser produkter baserad på deras ID (2)
function getProductByID(id) {
    return db.prepare(`${query} WHERE products.product_id = ?`).get(id);
}

// Söker på produkter som laptops tex
function searchProductsByName(categoryName) {
    const stmt = db.prepare(`
        ${query} 
        WHERE LOWER(categories.name) LIKE LOWER(?)
    `);
    return stmt.all(`%${categoryName}%`); 
}

//Ser produkter utifrån vilken category dem ligger i
function getProductsByCategory(categoryId) {
    return db.prepare(`${query} WHERE categories.category_id = ?`).all(categoryId);
}

//Skapar en ny produkt
function createProduct(name, description, price, stock_quantity, manufacturer_id) {
    const stmt = db.prepare(`
        INSERT INTO products (name, description, price, stock_quantity, manufacturer_id) 
        VALUES (?, ?, ?, ?, ?)
    `);
    return stmt.run(name, description, price, stock_quantity, manufacturer_id);
}

//Fungerar med CASCADE UPDATE mellan categories och products
function updateProduct(id, name, description, price, stock_quantity, manufacturer_id, category_id) {

    const updateProductStmt = db.prepare(`
        UPDATE products 
        SET name = ?, description = ?, price = ?, stock_quantity = ?, manufacturer_id = ? 
        WHERE product_id = ?
    `);
    const result = updateProductStmt.run(name, description, price, stock_quantity, manufacturer_id, id);

    let categoryUpdateResult = null;

    if (category_id) {
        
        const updateCategoryStmt = db.prepare(`
            UPDATE products_categories 
            SET category_id = ? 
            WHERE product_id = ?
        `);
        categoryUpdateResult = updateCategoryStmt.run(category_id, id);

        
        if (categoryUpdateResult.changes === 0) {
            const insertCategoryStmt = db.prepare(`
                INSERT INTO products_categories (product_id, category_id)
                VALUES (?, ?)
            `);
            insertCategoryStmt.run(id, category_id);
        }
    }

    return { 
        message: "Product and category updated",
        product_updated: result.changes,
        category_updated: categoryUpdateResult ? categoryUpdateResult.changes : 1
    };
}


//Fungerar med Implementera CASCADE DELETE mellan products och reviews
function deleteProduct(id) {
  
    // Delete the product
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

function getCustomerById(id) {
    const customerOrders = db.prepare(customerQuery).all(id); 

    if (customerOrders.length === 0) {
        return { message: "Customer not found" };
    }

    
    const customer = {
        customer_id: customerOrders[0].customer_id,
        name: customerOrders[0].name,
        email: customerOrders[0].email,
        phone: customerOrders[0].phone,
        orders: []  
    };

   
    customerOrders.forEach(order => {
        if (order.order_id) {
            customer.orders.push({
                order_id: order.order_id,
                order_date: order.order_date
            });
        }
    });

    return customer;
}

function updateCustomer(id, email, phone, address) {
    const stmt = db.prepare(`
        UPDATE customers 
        SET email = ?, phone = ?, address = ? 
        WHERE customer_id = ?
    `);
    const result = stmt.run(email, phone, address, id);

    return { message: "Customer updated", changes: result.changes };
}


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

function getProductStats() {
    const stmt = db.prepare(analysQuery);
    return stmt.all();
}


//Reviews query
const reviewsQuery = `
    SELECT 
        products.product_id, 
        products.name AS product_name, 
        AVG(reviews.rating) AS avg_rating
    FROM reviews
    JOIN products ON reviews.product_id = products.product_id
    GROUP BY products.product_id;
`;

function getReviewStats() {
    const stmt = db.prepare(reviewsQuery);
    return stmt.all();
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
};

