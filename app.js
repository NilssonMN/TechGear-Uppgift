const express = require("express");
const app = express();
const PORT = 3000;
const { getAllProducts, 
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
                     } = require("./database");

                     
app.use(express.json()); // Allows Express to parse JSON body
app.listen(PORT, () => {
    console.log(`Server is running`)
})

//Produkthantering

//Analysdata 
// I Express.js hanteras rutter i den ordning de definieras. Om /products/:id kommer före /products/stats, så kommer "stats" att tolkas som en produkt-ID, 
app.get("/products/stats", (req, res) => {
    const stats = getProductStats();
    res.json(stats); 
});


//Get all products
app.get("/products", (req, res) => {
    res.json(getAllProducts());
  });


// Get product with ID
app.get("/products/:id", (req, res) => {
res.json(getProductByID(req.params.id))
});


app.get('/products/search/:name', (req, res) => {
    res.json(searchProductsByName(req.params.name));
});


app.get("/products/category/:categoryId", (req, res) => {
    res.json(getProductsByCategory(req.params.categoryId));
});


app.post("/products", (req, res) => {
    const { name, description, price, stock_quantity, manufacturer_id,} = req.body;
    res.json(createProduct(name, description, price, stock_quantity, manufacturer_id));
});



app.put("/products/:id", (req, res) => {
    const productId = req.params.id;
    const { name, description, price, stock_quantity, manufacturer_id, category_id } = req.body;

    const result = updateProduct(productId, name, description, price, stock_quantity, manufacturer_id, category_id);
    if (result.product_updated > 0) {
        res.json(result);
    } else {
        res.status(404).json({ error: "Product not found or update failed" });
    }
});




app.delete("/products/:id", (req, res) => {
    const productId = req.params.id;
    const result = deleteProduct(productId);
    
    if (result.product_deleted > 0) {
        res.json(result);
    } else {
        res.status(404).json({ error: "Product not found" });
    }
});



//Kundhantering
app.get("/customers/:id", (req, res) => {
    res.json(getCustomerById(req.params.id));
});


app.put("/customers/:id", (req, res) => {
    const { email, phone, address } = req.body;
    const result = updateCustomer(req.params.id, email, phone, address);

    if (result.changes > 0) {
        res.json(result);
    } else {
        res.status(404).json({ error: "Customer not found or no changes made" });
    }
});


app.get("/customers/:id/orders", (req, res) => {
    res.json(getCustomerOrders(req.params.id));
});

//Analysdata 
app.get("/reviews/stats", (req, res) => {
    const stats = getReviewStats();
    res.json(stats);
});




















