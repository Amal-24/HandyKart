var express = require("express");
var productHelpers = require("../helpers/productHelpers");
const userHelpers = require("../helpers/userHelpers");
var router = express.Router();
/*
const cart_count=async(req,res,next)=>{
  let cart_count=null
  if(req.session.user){
    cart_count=await userHelpers.cart_count(req.session.user._id)
    return cart_count
  }
  else{
    cart_count=0
    return cart_count
  } 

}*/

// middleware for login verification
// and it should be kept in top
const verifyLogin = (req, res, next) => {
  if (req.session.userLoggedIn) {
    next();
  } else {
    res.redirect("/login");
  }
};

router.get("/", async function (req, res, next) {
  // req.session.user is given here as '/login' in post in redirect to '/'
  let user = req.session.user;
  let cart_count = null;
  if (req.session.user) {
    cart_count = await userHelpers.cart_count(req.session.user._id);
  } else {
    cart_count = 0;
  }
  // this user can be use anywhere becuase session id is stored in server as a result it can be used any files
  productHelpers.viewProduct().then((products) => {
    res.render("users/view_products", {
      admin: false,
      products,
      user,
      cart_count,
    });
  });
});

router.get("/login", (req, res, next) => {
  if (req.session.userLoggedIn) {
    // used to avoid logging in same account if its already logged in
    res.redirect("/");
  } else {
    res.render("users/login", { loginErr: req.session.userLoginErr });
    req.session.userLoginErr = false; //to make login err false
  }
});

router.post("/login", (req, res) => {
  userHelpers.doLogIn(req.body).then((resp) => {
    if (resp.loginStatus) {
      //session is only given when user is logged in that y its in if{ }
      req.session.userLoggedIn = true; // session given with req as req is sent first and this req
      req.session.user = resp.user; // is made with login
      res.redirect("/"); // redirect is used to redirect to one page which is already
      // rendered  and render is used to render new hbs page
    } else {
      req.session.userLoginErr = "Invalid Username or Password";
      //we cannot pass any hbs values{} in redirect like in render thats y loginerr is passed
      //in render of /login
      res.redirect("/login"); //url is given in redirect and not hbs file
    }
  });
});

router.get("/logout", (req, res) => {
  //req.session.destroy(); //the way to destroy a session and logout user
  req.session.user=null
  req.session.userLoggedIn=false
  res.redirect("/");
});

router.get("/signup", (req, res, next) => {
  res.render("users/signup");
});

router.post("/signup", (req, res, next) => {
  userHelpers.doSignUp(req.body).then((resp) => {
    //   req.session.loggedIn=true
    //   console.log(resp.insertedId)
    //   req.session.user=resp.insertedId
    res.redirect("/login");
  });
});

router.get("/cart", verifyLogin, async (req, res, next) => {
  //let user=req.session.user
  let user_cart = await userHelpers.get_cart_products(req.session.user._id);
  let cart_count = null;
  let total = 0;
  // if(user.cart.length>0)  alt way
  if (user_cart != []) {
    total = await userHelpers.total_amount(req.session.user._id);
    //console.log('total_amount_function',total);
  } else {
    total = 0;
  }
  if (req.session.user) {
    cart_count = await userHelpers.cart_count(req.session.user._id);
  } else {
    cart_count = 0;
  }
  res.render("users/cart", {
    user_cart,
    user: req.session.user._id,
    cart_count,
    total,
  });
});

// no need to use verifylogin as ajax is used
router.get("/add_to_cart", verifyLogin, (req, res) => {
  let product_id = req.query.id;
  let user_id = req.session.user._id;
  userHelpers.add_to_cart(product_id, user_id).then((result) => {
    //console.log(result)
    //ajax is used to avoid redirect and refresh
    //res.redirect('/')
    res.json({ stat: true }); //res.json will be sent to success in $.ajax
  });
});

router.post("/change_product_quantity", async (req, res) => {
  let qty = await userHelpers.change_product_quantity(req.body);
  // qty will return an object{status:true} and we assign total to qty.total as object
  let total_amount = 0;
  if (qty.status == true) {
    total_amount = await userHelpers.total_amount(req.body.user);
    qty.total = total_amount.total;
  }
  res.json(qty);
});

router.get("/view_account", (req, res) => {
  let user = req.session.user;
  res.render("users/view_user_account", { user });
});

router.get("/place_order", verifyLogin, async (req, res) => {
  let user = req.session.user;
  let total = await userHelpers.total_amount(user._id);
  res.render("users/place_order", { user, total });
});

router.post("/place_order", async (req, res) => {
  let products = await userHelpers.get_product_list(req.body.user_id);
  let total_amount = await userHelpers.total_amount(req.body.user_id);
  let insert_order_data = await userHelpers.place_order(
    req.body,
    products,
    total_amount.total
  );
  if (req.body.payment_method === "COD") {
    let response={ cod_success: true } 
    res.json(response);
  } else {
    //order id from resolve of place order is passed to generate_razorpay
    userHelpers.generate_razorpay(insert_order_data,total_amount.total).then((response)=>{
      //console.log('users.js:167',response);
      res.json(response)
    }) 
  }
});

router.get("/order_success", (req, res) => {
  res.render("users/order_success", { user: req.session.user });
});

router.get("/orders", verifyLogin, async (req, res) => {
  let orders = await userHelpers.orders_of_user(req.session.user._id);
  res.render("users/orders", { orders, user: req.session.user });
});
router.get("/view_ordered_products", async (req, res) => {
  let order_id = req.query.id;
  let products = await userHelpers.ordered_products_list(order_id);
  res.render("users/view_ordered_products", {
    user: req.session.user,
    products,
  }); 
});


router.post('/verify_payment',async(req,res)=>{
  //console.log('line 192,user.js',req.body);
  let verification= await userHelpers.payment_verification(req.body)
  let payment_status= await userHelpers.change_payment_status(req.body['order[receipt]'])
  //its req.body['order[receipt]'] because order[receipt] is str in objecct. check req.body console
  if(payment_status){
    res.json({status:true})
  }
  else{
    res.json({status:false})
  }
})

module.exports = router;
 