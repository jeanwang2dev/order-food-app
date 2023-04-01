const backdrop = document.querySelector('.backdrop');
const sideDrawer = document.querySelector('.mobile-nav');
const menuToggle = document.querySelector('#side-menu-toggle');

function backdropClickHandler() {
  backdrop.style.display = 'none';
  sideDrawer.classList.remove('open');
}

function menuToggleClickHandler() {
  backdrop.style.display = 'block';
  sideDrawer.classList.add('open');
}

backdrop.addEventListener('click', backdropClickHandler);
menuToggle.addEventListener('click', menuToggleClickHandler);

// const pk = 'pk_test_51HpemEC1bwGgYp60nm5Sm6wk95odbx1fJN8IVqc13G0wZ8oObpV0xC9GvZ6pZIB2UJrZzMlQNKwEOfYf78iNJEmT00lQqGYIwd';
// let stripe = Stripe(pk);
let adminObj = {};

adminObj.init = function() {
    if( document.querySelectorAll('.js_product_delete_Btn')) {
        adminObj.deleteProduct();
    }

    if( document.querySelector('#js_product_img_select')) {
        adminObj.imgPreview();
    }
    // if( document.getElementById('order-btn')) {
    //     adminObj.orderBtn();
    // }
};

adminObj.imgPreview = function() {
    let imgSelect = document.querySelector('#js_product_img_select');
    let imgPreview = document.querySelector('#js_product_img_preview');
    imgSelect.onchange = evt => {
        console.log('image select change!');
        const [file] = imgSelect.files;
        if (file) {
            imgPreview.src = URL.createObjectURL(file)
        }
    }
}

adminObj.deleteProduct = function() {
    let deteleProductBtns =document.querySelectorAll('.js_product_delete_Btn')
    deteleProductBtns.forEach( item => {
        item.addEventListener('click', function(e) {
            console.log('btn to delete product got clicked.');
            console.log(e.target);
            // let btn = e.target;
            // productId = btn.parentNode.querySelector('[name=productId').value;
            // csrf = btn.parentNode.querySelector('[name=_csrf').value;
            // productElement = btn.closest('article');

            // fetch('/admin/product/' + productId, {
            //     method: 'DELETE',
            //     headers: {
            //         'csrf-token': csrf
            //     }
            // })
            // .then(result => {
            //     console.log(result);
            //     //productElement.remove();
            //     productElement.parentNode.removeChild(productElement);
            // })
            // .catch(err => {
            //     console.log(err);
            // })
        });
    });
};

// adminObj.orderBtn = function() {
//     document.getElementById('order-btn').addEventListener('click', function(){
//         console.log('stripe');
//         let sessionId = document.getElementById('sid').value;
//         stripe.redirectToCheckout({
//             sessionId: sessionId,
//         });
//     });
// }
adminObj.init();