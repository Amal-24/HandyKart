// this ajax function is written in view_products.hbs


// function add_to_cart(product_id){
//     $.ajax({
//         url:'/add_to_cart/'+product_id,
//         method:'get',
//         success:(response)=>{
//             if(response.stat){
//                 let count=$('#cart_count').html()
//                 count=parseInt(count)+1
//                 $("#cart_count").html(count)
//                 console.log('count added')
//             }
//             else{
//               location.href = "/login"
//               console.log('count not added')

//             }
//         }

//     })  
// }