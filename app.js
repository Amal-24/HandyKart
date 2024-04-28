var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var hbs = require("express-handlebars"); 
var fileUpload = require("express-fileupload"); //used to get files(img,pdf etc) uploaded through form submit(POST)
var db = require("./config/db"); //importing db file from config
var userRouter = require("./routes/user");
var session=require('express-session')//imported for using session
var adminRouter = require("./routes/admin");

var app = express();
hbs.create({ strict:false });


// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "hbs");

//setting custom view engine
app.engine(
  "hbs",
  hbs.engine({
    extname: "hbs",
    defaultLayout: "layout",
    layoutDir: __dirname + "/views/layouts",
    partialDir: __dirname + "/views/partials",
  })
);

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use(fileUpload()); //calling the fileUpload package

//db should be connected before sending req thats y its placed before app.use()

db.connect()
  .then((dbname) => {
    console.log("connected to database",dbname);
  })
  .catch((err) => {
    console.log("database not connected", err);
  });



//connecting express-session npm
app.use(session({secret:'key',cookie:{maxAge:180 * 60 * 1000},saveUninitialized: true,resave: true}));

app.use("/", userRouter);
app.use("/admin", adminRouter);


// for displaying image on hbs 
// process.env.PWD = process.cwd()
// app.use(express.static(process.env.PWD + '/public/product_images'));

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
