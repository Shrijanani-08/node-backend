// Import necessary modules
const express = require('express');
const colors= require("colors");
const morgan=require("morgan");
const dotenv =require("dotenv");
const mysql = require('mysql');
const cors = require('cors');
const uuid = require('uuid');
//Configure dotenv
dotenv.config({path:''})

// Create an Express application
const app = express();


const db = mysql.createConnection({
  host: '172.26.47.45',
  user: 'root',
  password: 'root',
  database: 'organization'
});

db.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL: ', err);
    return;
  }

  console.log('Connected to MySQL!');
});

//Port
const port = process.env.PORT || 6500;

//middlewares
app.use(express.json());
app.use(morgan("dev"))
app.use(cors())
//routes 
app.get("/test",(req,res)=>{
  const qu="SELECT * FROM users";
  db.query(qu,(err,data)=>{
    if (err) {
      console.error('Error executing query: ', err);
      return res.json(err);
    }
    console.log('Query result: ', data);
    return res.json(data);
  });
  // res.status(200).send("<h2>Nodejs - MySql</h2>")
})
//POST USER
app.post("/test",(req,res)=>{
  const qu="INSERT INTO users (`name`,`email`) VALUES (?)";
  const values=[req.body.username,req.body.email];
  db.query(qu,[values],(err,data)=>{
    if(err) return res.json(err);
    return res.json("User added successfully")
  })
})
//EDIT DATA
app.put("/test/:id",(req,res)=>{
  const userId = req.params.id;
  const qu="UPDATE users SET `name`=?,`email`=? WHERE id = ?";
  const values=[req.body.username,req.body.email]; 
  db.query(qu,[...values,userId],(err,data)=>{
    if(err) return res.json(err);
    return res.json("User updated successfully");
  })
})
// DELETE DATA
app.delete("/test/:id",(req,res)=>{
  const userId = req.params.id;
  const qu="DELETE FROM users WHERE id =?";
  db.query(qu,[userId],(err,data)=>{
    if(err) return res.json(err);
    return res.json("User deleted successfully")
  })
})
// Create Project name and code
app.get("/uniqueid",(req,res)=>{
  const proName="PROJECT"+uuid.v4().replace(/-/g, '').slice(0, 4);
  const proCode="CODE"+uuid.v4().replace(/-/g, '').slice(0, 8);
  res.json({ proName, proCode });
})
//Get Project name
app.get("/project",(req,res)=>{
  const qu="SELECT * FROM projects";
  db.query(qu,(err,data)=>{
    if (err) {
      console.error('Error executing query: ', err);
      return res.json(err);
    }
    console.log('Query result: ', data);
    return res.json(data);
  });
})
//Get role
app.get("/role",(req,res)=>{
  const qu="SELECT * FROM roles";
  db.query(qu,(err,data)=>{
    if (err) {
      console.error('Error executing query: ', err);
      return res.json(err);
    }
    console.log('Query result: ', data);
    return res.json(data);
  });
})
// Get form
app.get("/getform/:project_id/:role_id", (req, res) => {
  const { project_id, role_id } = req.params;

  const query = "SELECT form_data FROM forms WHERE project_id = ? AND role_id = ?";
  db.query(query, [project_id, role_id], (err, results) => {
    if (err) return res.status(500).json(err);
    if (results.length === 0) return res.status(404).json({ message: "Form not found" });

    // Send the form_data as JSON (it's already stored as JSON in the database)
    res.json(results[0].form_data);
  });
});
//Get data for table
app.get('/getformdata/:projectId/:roleId', (req, res) => {
  const { projectId, roleId } = req.params;
  const tableName = `form_data_project_${projectId}_role_${roleId}`;

  const query = `SELECT * FROM ${tableName}`;
  
  db.query(query, (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
  });
});

// Store Project name and code
app.post("/project",(req,res)=>{
  const qu="INSERT INTO projects (`code`,`name`) VALUES (?)";
  const values=[req.body.projectCode,req.body.projectName];
  db.query(qu,[values],(err,data)=>{
    if(err) return res.json(err);
    return res.json("Project added successfully")
  })
})
//Store role
app.post("/role",(req,res)=>{
  const qu="INSERT INTO roles (`role`) VALUES (?)";
  const values=[req.body.role];
  db.query(qu,[values],(err,data)=>{
    if(err) return res.json(err);
    return res.json("Role added successfully")
  })
})
// Store form
app.post("/submitform",(req,res)=>{
  const qu="INSERT INTO forms (`project_id`,`role_id`,`form_data`) VALUES (?)";
  const values=[req.body.project,req.body.role, JSON.stringify(req.body.formdata)];
  console.log(values)
  db.query(qu,[values],(err,data)=>{
    if(err) return res.json(err);
    return res.json("Form created successfully")
  })
})
//Post role form data and create table as per data
app.post('/saveformdata', (req, res) => {
  const { projectId, roleId, formValues } = req.body;
  const tableName = `form_data_project_${projectId}_role_${roleId}`;
  const formatColumnName = (key) => {
    return key
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^\w_]/g, ''); 
  };
  let createTableQuery = `CREATE TABLE IF NOT EXISTS ${tableName} (id INT AUTO_INCREMENT PRIMARY KEY,`;
  for (const key in formValues) {
    const formattedKey = formatColumnName(key);
    createTableQuery += ` ${formattedKey} VARCHAR(255),`;
  }
  createTableQuery = createTableQuery.slice(0, -1) + ')';
  db.query(createTableQuery, (err, result) => {
    if (err) return res.status(500).json(err);
    const formattedFormValues = {};
    for (const key in formValues) {
      const formattedKey = formatColumnName(key);
      formattedFormValues[formattedKey] = formValues[key];
    }
    const insertQuery = `INSERT INTO ${tableName} SET ?`;
    db.query(insertQuery, formattedFormValues, (err, result) => {
      if (err) return res.status(500).json(err);

      res.json({ message: 'Form data saved successfully' });
    });
  });
});

// Listen
app.listen(port, () => {
  console.log(`Server is running on ${process.env.PORT}`.bgMagenta.white);
});
