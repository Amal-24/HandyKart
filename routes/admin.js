var express = require("express");
var router = express.Router();
var productHelpers = require("../helpers/productHelpers");

/* GET users listing. */
router.get("/", function (req, res, next) {

  productHelpers.viewProduct().then((products)=>{
    res.render("admin/view_products", { admin: true, products});

  })
  
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
  let id=req.query.id
  let product= await productHelpers.getProductDetails(id)
  res.render('admin/edit_product',{admin:true,product})}
);

router.post('/edit_product',async(req,res)=>{
  let id=req.query.id
  req.body.Price=parseInt(req.body.Price)
  let updateResult= await productHelpers.updateProduct(id,req.body)
  res.redirect('/admin')
})

router.get('/all_orders',(req,res)=>{
  res.send('all orders')
})




module.exports = router;
