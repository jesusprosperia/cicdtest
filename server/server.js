require("./config/config");

const express = require("express");
const path = require("path");
const cors = require("cors");
const history = require("connect-history-api-fallback");
const app = express();

const publicDir = path.join(__dirname, "../dist");
const port = process.env.PORT;

const { json } = require("body-parser");
const db = require('./db/db');

// import routes
const schemeRoutes = require("./routes/scheme");
const usersRoutes = require("./routes/users");
const collectionRoutes = require("./routes/collection");
const computeRoutes = require("./routes/compute");
const orgsRoutes = require("./routes/orgs");

// history fallback as per:
// https://router.vuejs.org/guide/essentials/history-mode.html#html5-history-mode
app.use(history({
  rewrites: [
    {
      from: /^\/api\/.*$/, // avoid re-writing api urls
      to: function(context) {
          return context.parsedUrl.path
      }
    }
  ]
}));

app.use(express.static(publicDir));
app.use(json({ limit: "50mb" }));

// enable cors
app.use(
  cors({
    origin: true,
    exposedHeaders: "x-auth",
  })
);

// serve webpage
app.get("/", (req, res) => {
  res.render(path.join(publicDir + "/index.html"));
});

// register api routes
app.use("/api/users", usersRoutes);
app.use("/api/schemes", schemeRoutes);
app.use("/api/collection", collectionRoutes);
app.use("/api/compute", computeRoutes);
app.use("/api/orgs", orgsRoutes);

// Connect to Mongo on start
db.connect(process.env.MONGODB_URI, (err) => {
  if (err) {
    console.log('Unable to connect to Mongo.')
    process.exit(1)
  } else {
    app.listen(port, () => {
      console.log(`started on port ${port}`);
    });
  }
});