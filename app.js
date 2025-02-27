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
    updateCategoryId
                     } = require("./database");     

app.use(express.json()); 

app.listen(PORT, () => {
    console.log(`Server is running`)
})

//Produkthantering

//Analysdata 
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

//Search product with name ex: /products/search/laptop
app.get('/products/search/:name', (req, res) => {
    res.json(searchProductsByName(req.params.name));
});

//Search product category: 4
app.get("/products/category/:categoryId", (req, res) => {
    res.json(getProductsByCategory(req.params.categoryId));
});


/* Add new product in products
{
    "name": "Gaming Laptop",
    "description": "High-end gaming laptop with RTX 4090.",
    "price": 1500,
    "stock_quantity": 25,
    "manufacturer_id": 2
}
  */
app.post("/products", (req, res) => {
    const { name, description, price, stock_quantity, manufacturer_id } = req.body;
    const result = createProduct(name, description, price, stock_quantity, manufacturer_id);
    res.json(result);
});


/*Uppdatera en befintlig produkt
{
    "name": "Gaming Laptop",
    "description": "High-end gaming laptop with RTX 4090.",
    "price": 1500,
    "stock_quantity": 25,
    "manufacturer_id": 5
  }
  */
  app.put('/products/:id', (req, res) => {
    const { name, description, price, stock_quantity, manufacturer_id } = req.body;
    const result = updateProduct(req.params.id, name, description, price, stock_quantity, manufacturer_id);
    res.json(result);
});



// Delete en befintlig produkt
app.delete("/products/:id", (req, res) => {
    const result = deleteProduct(req.params.id);
    if (result.product_deleted > 0) {
      res.status(204).send(); 
    } else {
      res.status(404).json({ error: "Product not found" });
    }
  });



//Kundhantering
//See customer with id
app.get("/customers/:id", (req, res) => {
    res.json(getCustomerById(req.params.id));
});


/*uppdaterar befintlig customer mail,phone,adress
{
   "email": "newemail@.com",
   "phone": "0710101010",
   "address": "new address 1337"
}
*/
app.put("/customers/:id", (req, res) => {
    const { email, phone, address } = req.body;
    const result = updateCustomer(req.params.id, email, phone, address);
    if (result.changes > 0) {
      res.status(200).json(result);
    } else {
      res.status(404).json({ error: "Customer not found or no changes made" }); 
    }
  });

//See customers order 
app.get("/customers/:id/orders", (req, res) => {
    res.json(getCustomerOrders(req.params.id));
});

//Analysdata 

//See reviews stats
app.get("/reviews/stats", (req, res) => {
    const stats = getReviewStats();
    res.json(stats);
});


//Update cascade
/*PUT http://localhost:3000/categories/1

Body i postman
{
    "newId": 11
}

GET för att se om categoryn är uppdaterad http://localhost:3000/products/category/1
*/

app.put("/categories/:oldId", (req, res) => {
    const oldId = req.params.oldId;
    const newId = req.body.newId;

    if (!newId) {
        return res.status(400).json({ error: "newId krävs" });
    }

    const result = updateCategoryId(oldId, newId);
    if (result.error) {
        return res.status(400).json(result);
    }

    res.json(result);
});




















