var express = require("express");
var router = express.Router();
var productHelpers = require("../helpers/productHelpers");

/* GET users listing. */
router.get("/", function (req, res, next) {

  productHelpers.viewProduct().then((products)=>{
    res.render("admin/view_products", { admin: true, products});//use this._id in hbs and not this.__id
    //res.render is inside then of viewProduct() as response should be render only
   // after viewProduct() function
  })
  
});

router.get("/add_product", function (req, res, next) {
  res.render("admin/add_product", { admin: true });
});

router.post("/add_product", function (req, res, next) {
  //res.send('<h1 style="text-align:center">form received</h1>');// to send html element is res.send()
  //console.log(req.body);// this will get only text components in form
  //console.log(req.files.Image)// this will get file component in form
  //console.log('router.post')
  req.body.Price=parseInt(req.body.Price)//to convert the price into integer

  productHelpers.addProduct(req.body, (id) => {
    // the result will have entire data with ops_id or insertedid returned from addProduct() callback
    // console.log(id)

    let image = req.files.Image;// its Image not image
    image.mv("./public/product_images/" + id + ".jpg", (err, done) => {
      // use ./public not ../public
      if (!err) {
        res.redirect('/admin')
        //res.send('<h1 style="text-align:center">PRODUCT ADDED</h1>');

        //used res.send in call back as res should only be send if the image is saved that y its used inside
        //callback of image.mv
      } else {
        res.send(err);
      }
    });
  });
});





//use / after delete_product for id and other data or else creates an error
router.get('/delete_product',(req,res)=>{
  //console.log(req.query)
  // use can use req.params.id if its given /{{this._id}} instead of ?{{this._id}} in hbs
  let product_id=req.query.id
  productHelpers.delete_product(product_id).then((resp)=>{
    res.redirect('/admin')

  })
  

})




router.get('/edit_product',async(req,res)=>{
  let id=req.query.id
  //console.log(req.query);
  let product= await productHelpers.getProductDetails(id)
  res.render('admin/edit_product',{admin:true,product})}
);

router.post('/edit_product',async(req,res)=>{
  let id=req.query.id
  //console.log(req.query.id);
  req.body.Price=parseInt(req.body.Price)
  let updateResult= await productHelpers.updateProduct(id,req.body)
  //console.log(updateResult)
  res.redirect('/admin')
})

router.get('/all_orders',(req,res)=>{
  res.send('all orders')
})




module.exports = router;
