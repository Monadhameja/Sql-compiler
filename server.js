const express = require("express");
const cors = require("cors");
const { compile } = require("./compiler");

const app = express();
app.use(cors());
app.use(express.json());

// Dummy Database
const data = [
    { name: "Sneha", city: "Dehradun", age: 22 },
    { name: "Mona", city: "Delhi", age: 20 },
    { name: "Saksham", city: "Dehradun", age: 21 },
    { name: "Abhijeet", city: "Mumbai", age: 23 },
    { name: "Riya", city: "Delhi", age: 19 },
    { name: "Aman", city: "Chandigarh", age: 24 },
    { name: "Neha", city: "Dehradun", age: 21 },
    { name: "Karan", city: "Jaipur", age: 25 }
];

app.post("/query", (req, res) => {
    let result = compile(req.body.query, data);

    // 🔥 IMPORTANT FIX
    res.json(result);  
});

app.listen(3000, () => console.log("Server running on port 3000"));