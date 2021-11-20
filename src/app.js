const express = require("express");
require("./db/mongoose");
const userRouter = require("./routers/user");
const taskRouter = require("./routers/task");

const app = express();

// this will auto parse the incoming req in javascript object format which will then be accessible in req.body
app.use(express.json());

app.use(userRouter);
app.use(taskRouter);

module.exports = app;
