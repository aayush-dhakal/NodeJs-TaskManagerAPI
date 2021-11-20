const app = require("./app"); // this runs the code from the app.js file
const port = process.env.PORT;

app.listen(port, () => {
  console.log(`server is up on port ${port}`);
});
