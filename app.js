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
    helpers:{
      order_status:(stat)=>{
        if(stat=='Pending'){
          return '<dd class="me-2 mt-1.5 inline-flex items-center rounded bg-primary-100 px-2.5 py-0.5 text-xs font-medium text-primary-800 dark:bg-primary-900 dark:text-primary-300"><svg class="me-1 h-3 w-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"> <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.5 4h-13m13 16h-13M8 20v-3.333a2 2 0 0 1 .4-1.2L10 12.6a1 1 0 0 0 0-1.2L8.4 8.533a2 2 0 0 1-.4-1.2V4h8v3.333a2 2 0 0 1-.4 1.2L13.957 11.4a1 1 0 0 0 0 1.2l1.643 2.867a2 2 0 0 1 .4 1.2V20H8Z" /></svg> Pending</dd>'
        }
        else if(stat=='Placed'){
          return '<dd class="me-2 mt-1.5 inline-flex items-center rounded bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"><svg class="me-1 h-3 w-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h6l2 4m-8-4v8m0-8V6a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v9h2m8 0H9m4 0h2m4 0h2v-4m0 0h-5m3.5 5.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Zm-10 0a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Z" /></svg>In transit</dd>';
        }
        else if(stat=="Delivered"){
          return '<dd class="me-2 mt-1.5 inline-flex items-center rounded bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-300"><svg class="me-1 h-3 w-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 11.917 9.724 16.5 19 7.5" /></svg>Delivered</dd>';
        }
        else if(stat=="Cancelled"){
          return '<dd class="me-2 mt-1.5 inline-flex items-center rounded bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900 dark:text-red-300"><svg class="me-1 h-3 w-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18 17.94 6M18 18 6.06 6" /></svg>Cancelled</dd>';
        }
      },
      button:(stat,order_id)=>{
        if(stat!="Cancelled"){
          return `<a href="/cancel_order?order_id=${order_id}" type="button" style="text-decoration: none;" class="w-full rounded-lg border border-red-700 px-3 py-2 text-center text-sm font-medium text-red-700 hover:bg-red-700 hover:text-white focus:outline-none focus:ring-4 focus:ring-red-300 dark:border-red-500 dark:text-red-500 dark:hover:bg-red-600 dark:hover:text-white dark:focus:ring-red-900 lg:w-auto">Cancel order</a>`
        }
      },
      cal_price:(price,qty)=>{
        let total_price=price*qty
        return total_price;
      },
      user_image:(gender)=>{
        if(gender=='Male'){
          return 'avatar/male.png'
        }
        else{
          return 'avatar/female.png'
        }
      }
    }
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
