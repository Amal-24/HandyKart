var express = require("express");
var product_helpers = require("../helpers/product_helpers");
const user_helpers = require("../helpers/user_helpers");
let ai_helper=require("../helpers/ai")
let objectId = require("mongodb").ObjectId;
var router = express.Router();
let notifier=require('node-notifier')
const nodemailer = require('nodemailer');





const verify_login = async(req, res, next) => {
  
  if (req.session.user_logged_in) {
    req.session.user.cart_count=await user_helpers.cart_count(req.session.user._id)
    // to get cart_count to display badge
    next();
  } else {
    res.redirect("/login");
  }
};

router.get("/",verify_login, async (req, res, next)=> {
  let user = req.session.user; 
  let products= await product_helpers.view_product()
    res.render("users/home", {
      admin: false,
      products, 
      user,
    }); 
  });


router.get("/login", (req, res, next) => {
  if (req.session.user_logged_in) {
    res.redirect("/");
  } else {
    res.render("users/login", { login_err: req.session.user_login_err });
    req.session.user_login_err = false;
  }
});

router.post("/login", (req, res) => {
  user_helpers.log_in(req.body).then((resp) => {
    if (resp.login_status) {
      req.session.user_logged_in = true; 
      req.session.user = resp.user; // adding user details to session of req
      res.redirect("/"); 
      
    } else {
      req.session.user_login_err = "Invalid Username or Password";
     
      res.redirect("/login"); 
    }
  });
});

router.get("/logout", (req, res) => {
  req.session.user=null
  req.session.user_logged_in=false
  res.redirect("/");
});

router.get("/signup", (req, res, next) => {
  res.render("users/signup");
});

router.post("/signup", (req, res, next) => {
  user_helpers.sign_up(req.body).then((resp) => {
    res.redirect("/login");
  });
});


router.get('/view_products',verify_login,async(req,res)=>{
  let products= await product_helpers.view_product()
  res.render("users/view_products", {
    admin: false,
    products,
    user:req.session.user,
  }); 
})

router.get("/cart", verify_login, async (req, res, next) => {
  let user_cart = await user_helpers.get_cart_products(req.session.user._id);
  let total = 0;
  if (user_cart != []) {
    total = await user_helpers.total_amount(req.session.user._id);
  }
  else {
    total = 0;
  }
  res.render("users/cart", {
    user_cart,
    user:req.session.user,
    total,
  });
});

router.get("/add_to_cart", verify_login, (req, res) => {
  let product_id = req.query.id;
  let user_id = req.session.user._id;
  user_helpers.add_to_cart(product_id, user_id).then((result) => {
    res.json({ stat: true }); })
});  

router.post("/change_product_quantity", async (req, res) => {
  let qty = await user_helpers.change_product_quantity(req.body); 
  if (qty.status == true) {
    let total_amount = await user_helpers.total_amount(req.body.user_id);
    qty.total = total_amount.total;
  }
  res.json(qty);  
});

router.get("/view_account",verify_login,async (req, res) => {
  let user = req.session.user;
  let orders = await user_helpers.orders_of_user(req.session.user._id);
  res.render("users/view_user_account", {user,orders});
});

router.get("/place_order", verify_login, async (req, res) => {
  let user = req.session.user;
  let condition=req.query.is_single_product;//to check whether single product is true orn false
  if(condition=='true'){
   let total_amount = await user_helpers.get_amount_of_one_product(req.query.product_id)
      let total={total:total_amount.price}; // to make the total.total in hbs(similar to result of total_amount in else{})
      res.render('users/place_order',{user,total,condition,product_id:req.query.product_id});
  }
  else{
    let total = await user_helpers.total_amount(user._id);
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
    products = await user_helpers.get_product_list(req.body.user_id);
  }
  let insert_order_data = await user_helpers.place_order(
    req.body,
    products,
    total_amount,
    condition
  );
  if (req.body.payment_method === "COD") {
    let response={ cod_success: true,order_id:insert_order_data } 
    res.json(response);
  } else {
    user_helpers.generate_razorpay(insert_order_data,total_amount).then((response)=>{
      res.json(response)
    }) 
  }
});

router.get("/order_success",async (req, res) => {
  let order_id=req.query.order_id
  let products = await user_helpers.ordered_products_list(order_id); 
  let order_details= await user_helpers.total_amount_of_each_order(order_id)
  res.render("users/order_success", 
  {user:req.session.user,order_details:order_details,products_list:products});
}); 

router.get("/orders", verify_login, async (req, res) => {
  let user = req.session.user;
  let orders = await user_helpers.orders_of_user(req.session.user._id);

    res.render("users/orders", {
      admin: false,  
      user,
      orders
    });
});


router.get("/order_details", async (req, res) => {
  let order_id = req.query.order_id;
  let products = await user_helpers.ordered_products_list(order_id);
  let order_details= await user_helpers.total_amount_of_each_order(order_id)
  res.render("users/order_details", {
    user: req.session.user,
    products,order_details
  }); 
});

router.get("/cancel_order",async(req,res)=>{
  let order_id=req.query.order_id;
  let cancel_order= await user_helpers.cancel_order(order_id)
  res.redirect('/orders')
})

router.post('/verify_payment',async(req,res)=>{
  let verification= await user_helpers.payment_verification(req.body)
  let payment_status= await user_helpers.change_payment_status(req.body['order[receipt]'])
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
  let products_array= await user_helpers.remove_product(cart_id);
  let i=0;
  for(i=0;i<products_array.length;i++){
    if(products_array[i].item==product_id){
      products_array.splice(i,1);
    }
  }
  user_helpers.update_cart(cart_id,products_array).then((result)=>{
    res.redirect('/cart')
  }).catch((err)=>{
    alert(err)
  });
})


router.get('/product_details',verify_login,(req,res)=>{
  user_helpers.get_product_details(req.query.product_id).then((response)=>{

    let description=response.description;
    let description_array=description.split("#");
    res.render('users/product_details',{
      style:'carousel.css',
      user:req.session.user,
      product:response,description_array 
    })
  })
})

 
router.post('/search',verify_login,async(req,res)=>{
  let search_result= await user_helpers.search(req.body.search);
  res.render("users/view_products", {
    admin: false,
    products:search_result,
    user:req.session.user,
    prompt:req.body.search
  }); 
})


router.get('/sort',verify_login,async(req,res)=>{
  let search=req.query.search;
  let sort_type=req.query.sort_type
  let sort_result=[]
  if(search==''){
     sort_result = await user_helpers.sort('',sort_type);
  }
  else{
    sort_result= await user_helpers.sort(search,sort_type);
  }
  res.render("users/view_products", {
    admin: false,
    products:sort_result,
    user:req.session.user,
    prompt:search
  }); 
})


router.get('/contact_us',verify_login,(req,res)=>{
  res.render('users/contact_us',{user:req.session.user})
})


router.post('/ai',async(req,res)=>{
  let response=await ai_helper.run(req.body.prompt);
  res.json({resp:response})
  if(req.session.user_logged_in){
  let response=await ai_helper.run(req.body.prompt);
  res.json({resp:response})
  }else{
    res.redirect('/login');
  }
}) 


router.get('/forgot_password',(req,res)=>{
  res.render('users/verify_email')
})


router.post('/generate_otp',async(req,res)=>{
  let email=req.body.email
  let verify_email=await user_helpers.verify_email(email);
  let invalid_email=false
  let otp=null
  if(verify_email!=null){
    invalid_email=false
    otp= Math.floor((1000+Math.random()*9000));

    const transporter = await nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true, 
      auth: {
        user: 'amalkrishnaprasad4@gmail.com', 
        pass: 'vrsanginymtdnvxz'
      }
    });
  
    const mail_options = {
      from: 'amalkrishnaprasad4@gmail.com', 
      to: `${email}`, 
      subject: 'OTP VERIFICATION',
      text: `Your One Time Password is : ${otp}`
    };
    let mail_sent= await transporter.sendMail(mail_options);
    res.render('users/verify_otp',{
      otp:otp,email//to pass email to new password to change password using Email
    });

  }else{
    invalid_email=true
    res.render('users/verify_email',{
      invalid_email,
    })
  }

})


router.post('/verify_otp',(req,res)=>{
  let invalid_otp=false
  if(req.body.OTP==req.body.secret_otp){
    invalid_otp=false;
    res.render('users/new_password',{
      email:req.body.email//to pass email to new password to change password using Email
    })
  }
  else{
    invalid_otp=true
    res.render('users/verify_otp',{
      invalid_otp,email:req.body.email,
      otp:req.body.secret_otp//to pass secret otp if invalid otp is entered and to re enter correct otp
    })
  }
})


router.post('/change_password',async(req,res)=>{
  let change_password = await user_helpers.change_password(req.body.email,req.body.password);
  res.redirect('/login');
})


router.get('/test',verify_login,async(req,res)=>{

 
  res.render("users/test", {
    style:'carousel.css',
    user:req.session.user,
    
  });
  
})



module.exports = router;