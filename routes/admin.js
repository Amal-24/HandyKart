var express = require("express");
var router = express.Router();
var product_helpers = require("../helpers/product_helpers");
const user_helpers = require("../helpers/user_helpers");
let rimraf=require("rimraf")
let fs=require("graceful-fs");

router.get("/", async (req, res, next)=> {
    let products= await product_helpers.view_product();    
    res.render("admin/admin_home", { admin: true, products});
});


router.get("/add_product", function (req, res, next) {
  res.render("admin/add_product", { admin: true });
});


router.post("/add_product", async (req, res, next)=> {
  req.body.price=parseInt(req.body.price)
  let id=await product_helpers.add_product(req.body);
  let image1 = req.files.image1;
  let image1_upload=await image1.mv("./public/product_images/" + id + "1.jpg")
  let image2 = req.files.image2;
  let image2_upload=await image2.mv("./public/product_images/" + id + "2.jpg")
  let image3 = req.files.image3;
  let image3_upload=await image3.mv("./public/product_images/" + id + "3.jpg")

  res.redirect('/admin');
    });


router.get('/delete_product',(req,res)=>{
  let product_id=req.query.id
  product_helpers.delete_product(product_id).then((resp)=>{
    res.redirect('/admin')
  })
})


router.get('/edit_product',async(req,res)=>{
  let product_id=req.query.id
  let product= await product_helpers.get_product_details(product_id)
  res.render('admin/edit_product',{admin:true,product})}
);


router.post('/edit_product',async(req,res)=>{ 
  let product_id=req.query.id
  req.body.price=parseInt(req.body.price)
  if(req.body.image1=='true'){  
    //use only single dot ./public not ../public
   let delete_image=fs.unlinkSync("./public/product_images/" + product_id + "1.jpg");
   let image1 = req.files.image1; 
   let replaced_image=await image1.mv("./public/product_images/" + product_id + "1.jpg")
   }

   if(req.body.image2=='true'){
    //use only single dot ./public not ../public
   let delete_image=fs.unlinkSync("./public/product_images/" + product_id + "2.jpg");
   let image2 = req.files.image2; 
   let replaced_image=await image2.mv("./public/product_images/" + product_id + "2.jpg")
   }

   if(req.body.image3=='true'){
    //use only single dot ./public not ../public
   let delete_image=fs.unlinkSync("./public/product_images/" + product_id + "3.jpg");
   let image3 = req.files.image3; 
   let replaced_image=await image3.mv("./public/product_images/" + product_id + "3.jpg")
   }  
  let updateResult= await product_helpers.update_product(product_id,req.body)
  res.redirect('/admin')
})

 
router.get('/admin_orders',async(req,res)=>{
  let all_orders= await product_helpers.get_all_orders();
  //let user_details = await product_helpers.get_user_details(all_orders[0].user);
  res.render('admin/admin_orders',{admin:true,all_orders})
})

router.get('/admin_order_details',async(req,res)=>{
    let order_id=req.query.order_id;
    let user_id=req.query.user_id;
    let products = await user_helpers.ordered_products_list(order_id);
    let order_details= await user_helpers.total_amount_of_each_order(order_id)
    let user_details = await product_helpers.get_user_details(user_id);
  res.render('admin/admin_order_details',{admin:true,products,order_details,user_details});
})

router.post("/change_order_status",(req,res)=>{
  let status=req.body.status
  let change_status=product_helpers.change_order_status(req.body.order_id,req.body.status)
  res.json({resp:true})
})

router.get('/admin_customers',async(req,res)=>{
  let customers= await product_helpers.get_all_customers();
  res.render("admin/admin_customers",{customers,admin:true})
})


router.get('/customer_details',async(req,res)=>{
  let customer_id=req.query.customer_id
  let customer_details= await product_helpers.get_user_details(customer_id);
  let orders_of_customer= await user_helpers.orders_of_user(customer_id);
  res.render("admin/customer_details",{customer_details,admin:true,orders:orders_of_customer})
})

router.get("/admin_product_details",async(req,res)=>{
  let product_details = await user_helpers.get_product_details(req.query.product_id);
  let description=product_details.description;
  let description_array=description.split("#");
  res.render("admin/admin_product_details",{admin:true,product:product_details,description_array,
    style:'carousel.css'})
})


module.exports = router;
   