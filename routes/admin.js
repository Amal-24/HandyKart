var express = require("express");
var router = express.Router();
var productHelpers = require("../helpers/productHelpers");
const userHelpers = require("../helpers/userHelpers");
let rimraf=require("rimraf")
let fs=require("graceful-fs");

router.get("/", function (req, res, next) {
    productHelpers.viewProduct().then((products)=>{
    res.render("admin/admin_home", { admin: true, products});})
});


router.get("/add_product", function (req, res, next) {
  res.render("admin/add_product", { admin: true });
});


router.post("/add_product", function (req, res, next) {
  req.body.Price=parseInt(req.body.Price)
  productHelpers.addProduct(req.body, (id) => {
     let image = req.files.Image;
    image.mv("./public/product_images/" + id + ".jpg", (err, done) => {
      if (!err) {
        res.redirect('/admin')
      } else {
        res.send(err);
      }
    });
  });
});


router.get('/delete_product',(req,res)=>{
  let product_id=req.query.id
  productHelpers.delete_product(product_id).then((resp)=>{
    res.redirect('/admin')
  })
})


router.get('/edit_product',async(req,res)=>{
  let product_id=req.query.id
  let product= await productHelpers.getProductDetails(product_id)
  res.render('admin/edit_product',{admin:true,product})}
);


router.post('/edit_product',async(req,res)=>{
  let product_id=req.query.id
  req.body.Price=parseInt(req.body.Price)
  if(req.body.Condition=='true'){
    //use only single dot ./public not ../public
    let delete_image=fs.unlinkSync("./public/product_images/" + product_id + ".jpg");
   let image = req.files.Image; 
   let replaced_image=await image.mv("./public/product_images/" + product_id + ".jpg")
  }
  let updateResult= await productHelpers.updateProduct(product_id,req.body)
  res.redirect('/admin')
})

 
router.get('/admin_orders',async(req,res)=>{
  let all_orders= await productHelpers.get_all_orders();
  //let user_details = await productHelpers.get_user_details(all_orders[0].user);
  res.render('admin/admin_orders',{admin:true,all_orders})
})

router.get('/admin_order_details',async(req,res)=>{
    let order_id=req.query.order_id;
    let user_id=req.query.user_id;
    let products = await userHelpers.ordered_products_list(order_id);
    let order_details= await userHelpers.total_amount_of_each_order(order_id)
    let user_details = await productHelpers.get_user_details(user_id);
  res.render('admin/admin_order_details',{admin:true,products,order_details,user_details});
})

router.post("/change_order_status",(req,res)=>{
  let status=req.body.status
  let change_status=productHelpers.change_order_status(req.body.order_id,req.body.status)
  res.json({resp:true})
})

router.get('/admin_customers',async(req,res)=>{
  let customers= await productHelpers.get_all_customers();
  res.render("admin/admin_customers",{customers,admin:true})
})


router.get('/customer_details',async(req,res)=>{
  let customer_id=req.query.customer_id
  let customer_details= await productHelpers.get_user_details(customer_id);
  let orders_of_customer= await userHelpers.orders_of_user(customer_id);
  res.render("admin/customer_details",{customer_details,admin:true,orders:orders_of_customer})
})

router.get("/admin_product_details",async(req,res)=>{
  let product_details = await userHelpers.get_product_details(req.query.product_id);
  res.render("admin/admin_product_details",{admin:true,product:product_details})
})


module.exports = router;
 