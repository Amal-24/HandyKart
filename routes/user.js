var express = require("express");
var productHelpers = require("../helpers/productHelpers");
const userHelpers = require("../helpers/userHelpers");
let ai_helper=require("../helpers/ai")
let objectId = require("mongodb").ObjectId;
var router = express.Router();
let notifier=require('node-notifier')

const verifyLogin = async(req, res, next) => {
  
  if (req.session.userLoggedIn) {
    req.session.user.cart_count=await userHelpers.cart_count(req.session.user._id)
    // to get cart_count to display badge
    next();
  } else {
    res.redirect("/login");
  }
};

router.get("/",verifyLogin, async (req, res, next)=> {
  let user = req.session.user; 
  let products= await productHelpers.viewProduct()
    res.render("users/home", {
      admin: false,
      products,
      user,
    }); 
  });


router.get("/login", (req, res, next) => {
  if (req.session.userLoggedIn) {
    res.redirect("/");
  } else {
    res.render("users/login", { loginErr: req.session.userLoginErr });
    req.session.userLoginErr = false;
  }
});

router.post("/login", (req, res) => {
  userHelpers.doLogIn(req.body).then((resp) => {
    if (resp.loginStatus) {
      req.session.userLoggedIn = true; 
      req.session.user = resp.user; // adding user details to session of req
      res.redirect("/"); 
      
    } else {
      req.session.userLoginErr = "Invalid Username or Password";
     
      res.redirect("/login"); 
    }
  });
});

router.get("/logout", (req, res) => {
  req.session.user=null
  req.session.userLoggedIn=false
  res.redirect("/");
});

router.get("/signup", (req, res, next) => {
  res.render("users/signup");
});

router.post("/signup", (req, res, next) => {
  userHelpers.doSignUp(req.body).then((resp) => {
    res.redirect("/login");
  });
});


router.get('/view_products',verifyLogin,async(req,res)=>{
  let products= await productHelpers.viewProduct()
  res.render("users/view_products", {
    admin: false,
    products,
    user:req.session.user,
  }); 
})

router.get("/cart", verifyLogin, async (req, res, next) => {
  let user_cart = await userHelpers.get_cart_products(req.session.user._id);
  let cart_count = null;
  let total = 0;
  if (user_cart != []) {
    total = await userHelpers.total_amount(req.session.user._id);
  }
  else {
    total = 0;
  }
  res.render("users/cart", {
    user_cart,
    user_id:req.session.user._id,
    cart_count,
    total,
  });
});

router.get("/add_to_cart", verifyLogin, (req, res) => {
  let product_id = req.query.id;
  let user_id = req.session.user._id;
  userHelpers.add_to_cart(product_id, user_id).then((result) => {
    res.json({ stat: true }); })
});  

router.post("/change_product_quantity", async (req, res) => {

  let qty = await userHelpers.change_product_quantity(req.body); 
  if (qty.status == true) {
    let total_amount = await userHelpers.total_amount(req.body.user_id);
    qty.total = total_amount.total;
  }
  res.json(qty);  
});

router.get("/view_account",verifyLogin,async (req, res) => {
  let user = req.session.user;
  let orders = await userHelpers.orders_of_user(req.session.user._id);
  res.render("users/view_user_account", {user,orders});
});

router.get("/place_order", verifyLogin, async (req, res) => {
  let user = req.session.user;
  let condition=req.query.is_single_product;
  if(condition=='true'){
    userHelpers.get_amount_of_one_product(req.query.product_id).then((result)=>{
      // to make the total.total in hbs(similar to result of total_amount in else{})
      let total={total:result.Price};
      res.render('users/place_order',{user,total,condition,product_id:req.query.product_id});
    })
  }
  else{
    let total = await userHelpers.total_amount(user._id);
    res.render("users/place_order", { user, total});
  } 
});

router.post("/place_order", async (req, res) => {
  let products = null
  let condition = req.body.condition? true:false 
  let total_amount=req.body.total_amount;
  if(condition){
    let product_id= new objectId(req.body.product_id)
    products=[{item:product_id,quantity:1}]
  }
  else{
    products = await userHelpers.get_product_list(req.body.user_id);
  }
  let insert_order_data = await userHelpers.place_order(
    req.body,
    products,
    total_amount,
    condition
  );
  if (req.body.payment_method === "COD") {
    let response={ cod_success: true,order_id:insert_order_data } 
    res.json(response);
  } else {
    userHelpers.generate_razorpay(insert_order_data,total_amount).then((response)=>{
      res.json(response)
    }) 
  }
});

router.get("/order_success",async (req, res) => {
  let order_id=req.query.order_id
  let products = await userHelpers.ordered_products_list(order_id); 
  let order_details= await userHelpers.total_amount_of_each_order(order_id)
  res.render("users/order_success", 
  {user:req.session.user,order_details:order_details,products_list:products});
}); 

router.get("/orders", verifyLogin, async (req, res) => {
  let user = req.session.user;
  let orders = await userHelpers.orders_of_user(req.session.user._id);

    res.render("users/orders", {
      admin: false,  
      user,
      orders
    });
});


router.get("/order_details", async (req, res) => {
  let order_id = req.query.order_id;
  let products = await userHelpers.ordered_products_list(order_id);
  let order_details= await userHelpers.total_amount_of_each_order(order_id)
  res.render("users/order_details", {
    user: req.session.user,
    products,order_details
  }); 
});

router.get("/cancel_order",async(req,res)=>{
  let order_id=req.query.order_id;
  let cancel_order= await userHelpers.cancel_order(order_id)
  res.redirect('/orders')
})

router.post('/verify_payment',async(req,res)=>{
  let verification= await userHelpers.payment_verification(req.body)
  let payment_status= await userHelpers.change_payment_status(req.body['order[receipt]'])
  if(payment_status){
    res.json({status:true})
  }
  else{
    res.json({status:false})
  } 
})



router.get('/remove_product',async(req,res)=>{
  notifier.notify({title:"Product Removed",message:'Product removed successfully'})
  let product_id= req.query.product_id
  let cart_id= req.query.cart_id
  let products_array= await userHelpers.remove_product(cart_id);
  let i=0;
  for(i=0;i<products_array.length;i++){
    if(products_array[i].item==product_id){
      products_array.splice(i,1);
    }
  }
  userHelpers.update_cart(cart_id,products_array).then((result)=>{
    res.redirect('/cart')
  }).catch((err)=>{
    alert(err)
  });
})


router.get('/product_details',verifyLogin,(req,res)=>{
  userHelpers.get_product_details(req.query.product_id).then((response)=>{
    res.render('users/product_details',{
      user:req.session.user,
      product:response,
      style:'product_details.css'
    })
  })
})

 
router.post('/search',verifyLogin,async(req,res)=>{
  let search_result= await userHelpers.search(req.body.search);
  res.render("users/view_products", {
    admin: false,
    products:search_result,
    user:req.session.user,
    prompt:req.body.search
  }); 
})


router.get('/sort',verifyLogin,async(req,res)=>{
  let search=req.query.search;
  let sort_type=req.query.sort_type
  let sort_result=[]
  if(search==''){
     sort_result = await userHelpers.sort('',sort_type);
  }
  else{
    sort_result= await userHelpers.sort(search,sort_type);
  }
  res.render("users/view_products", {
    admin: false,
    products:sort_result,
    user:req.session.user,
    prompt:search
  }); 
})


router.get('/contact_us',verifyLogin,(req,res)=>{
  res.render('users/contact_us',{user:req.session.user})
})


router.post('/ai',verifyLogin,async(req,res)=>{
  let response=await ai_helper.run(req.body.prompt);
  res.json({resp:response})
}) 



router.get('/test',verifyLogin,async(req,res)=>{

    res.render("users/test", {
      admin: false,  
    
    });
  
})

module.exports = router;