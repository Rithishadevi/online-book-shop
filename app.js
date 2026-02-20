// ================= CONFIG =================
const appConfig = {
  currency: '₹',
  deliveryBaseDays: 3,
  rainyExtraDays: 2,
  OPENWEATHER_API_KEY: '', // optional
};

const PRODUCTS = [
  { id: 'b1', category:'book', title:'Programming in C++', desc:'Learn C++ with OOP and STL.', price:249 },
  { id: 'b2', category:'book', title:'Data Structures Essentials', desc:'Core data structures explained.', price:299 },
  { id: 'c1', category:'course', title:'Web Development Bootcamp', desc:'Full-stack web course.', price:999 },
  { id: 'c2', category:'course', title:'Algorithms & Problem Solving', desc:'Coding interview prep.', price:799 },
  { id: 'n1', category:'note', title:'Operating Systems Notes', desc:'Quick notes for exams.', price:99 },
  { id: 'n2', category:'note', title:'DBMS Quick Guide', desc:'SQL, ER models, normalization.', price:129 },
];

// ============== STORAGE HELPERS ==============
const LS_CART_KEY = 'campus_cart';
const LS_ORDERS_KEY = 'campus_orders';
const loadCart = () => JSON.parse(localStorage.getItem(LS_CART_KEY) || '{}');
const saveCart = (c) => localStorage.setItem(LS_CART_KEY, JSON.stringify(c));
const loadOrders = () => JSON.parse(localStorage.getItem(LS_ORDERS_KEY) || '[]');
const saveOrders = (o) => localStorage.setItem(LS_ORDERS_KEY, JSON.stringify(o));

// ============== UI ELEMENTS ==============
const productsGrid = document.getElementById('productsGrid');
const cartList = document.getElementById('cartList');
const subtotalEl = document.getElementById('subtotal');
const deliveryFeeEl = document.getElementById('deliveryFee');
const grandTotalEl = document.getElementById('grandTotal');
const cartCountEl = document.getElementById('cartCount');
const filterCategory = document.getElementById('filterCategory');
const searchBox = document.getElementById('searchBox');
const btnCheckout = document.getElementById('btnCheckout');
const checkoutEmail = document.getElementById('checkoutEmail');
const checkoutCity = document.getElementById('checkoutCity');
const simulateRain = document.getElementById('simulateRain');
const checkoutMsg = document.getElementById('checkoutMsg');
const openCart = document.getElementById('openCart');
const popup = document.getElementById('popup');
const closePopup = document.getElementById('closePopup');

const navProducts = document.getElementById('navProducts');
const navOrders = document.getElementById('navOrders');
const productsView = document.getElementById('productsView');
const ordersView = document.getElementById('ordersView');
const ordersContainer = document.getElementById('ordersContainer');
const trackEmail = document.getElementById('trackEmail');
const btnTrack = document.getElementById('btnTrack');

// ============== STATE ==============
let CART = loadCart();
renderProducts();
renderCart();

// ============== PRODUCTS ==============
function renderProducts(){
  const cat = filterCategory.value;
  const q = (searchBox.value||'').toLowerCase();
  const list = PRODUCTS.filter(p=>{
    if(cat!=='all' && p.category!==cat) return false;
    if(q && !(p.title+p.desc).toLowerCase().includes(q)) return false;
    return true;
  });
  productsGrid.innerHTML = list.map(p=>`
    <div class="card">
      <h4>${p.title}</h4>
      <p class="muted">${p.desc}</p>
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <strong>${appConfig.currency}${p.price}</strong>
        <button class="btn small" onclick="addToCart('${p.id}')">Add</button>
      </div>
    </div>`).join('') || '<p class="muted">No products found.</p>';
}
filterCategory.addEventListener('change',renderProducts);
searchBox.addEventListener('input',renderProducts);

// ============== CART ==============
function addToCart(id){
  CART[id]=(CART[id]||0)+1;
  saveCart(CART);
  renderCart();
  flashMsg('Added to cart');
}
function removeFromCart(id){delete CART[id];saveCart(CART);renderCart();}
function changeQty(id,delta){
  CART[id]=(CART[id]||0)+delta;
  if(CART[id]<=0) delete CART[id];
  saveCart(CART);renderCart();
}
function clearCart(){CART={};saveCart(CART);renderCart();}

function renderCart(){
  const keys=Object.keys(CART);
  if(keys.length===0){
    cartList.innerHTML='<div class="muted">Cart is empty</div>';
    subtotalEl.textContent='₹0';deliveryFeeEl.textContent='₹0';grandTotalEl.textContent='₹0';cartCountEl.textContent=0;
    return;
  }
  let subtotal=0;
  cartList.innerHTML=keys.map(id=>{
    const p=PRODUCTS.find(x=>x.id===id);
    const qty=CART[id];const total=p.price*qty;subtotal+=total;
    return `<div class="cart-item">
      <div class="title"><strong>${p.title}</strong><div class="muted">₹${p.price} × ${qty}</div></div>
      <div class="qty">
        <button onclick="changeQty('${id}',-1)">-</button>
        <div>${qty}</div>
        <button onclick="changeQty('${id}',1)">+</button>
      </div>
      <button class="btn secondary small" onclick="removeFromCart('${id}')">Remove</button>
    </div>`;
  }).join('');
  const delivery=subtotal>=1000?0:49;
  subtotalEl.textContent=`₹${subtotal}`;
  deliveryFeeEl.textContent=`₹${delivery}`;
  grandTotalEl.textContent=`₹${subtotal+delivery}`;
  cartCountEl.textContent=keys.reduce((s,k)=>s+CART[k],0);
}

// ============== CHECKOUT ==============
btnCheckout.addEventListener('click',async()=>{
  const email=checkoutEmail.value.trim(), city=checkoutCity.value.trim();
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return checkoutMsg.textContent='Enter a valid email.';
  if(!city) return checkoutMsg.textContent='Enter delivery city.';
  if(Object.keys(CART).length===0) return checkoutMsg.textContent='Cart is empty.';
  
  let subtotal=0;const items=[];
  Object.keys(CART).forEach(id=>{
    const p=PRODUCTS.find(x=>x.id===id);
    subtotal+=p.price*CART[id];
    items.push({id:p.id,title:p.title,qty:CART[id],price:p.price});
  });
  const delivery=subtotal>=1000?0:49;
  let etaDays=appConfig.deliveryBaseDays;
  if(simulateRain.checked) etaDays+=appConfig.rainyExtraDays;
  const eta=calculateEta(etaDays);
  const order={
    id:'ORD-'+Date.now().toString().slice(-6)+'-'+Math.floor(1000+Math.random()*9000),
    email,city,items,subtotal,deliveryFee:delivery,total:subtotal+delivery,
    status:'ordered',eta,date:new Date().toISOString()
  };
  const orders=loadOrders();orders.push(order);saveOrders(orders);
  clearCart();
  showPopup(); // success popup
});

function calculateEta(d){const n=new Date();n.setDate(n.getDate()+d);return n.toISOString().slice(0,10);}
function flashMsg(msg){checkoutMsg.textContent=msg;setTimeout(()=>checkoutMsg.textContent='',3000);}
function showPopup(){popup.classList.remove('hidden');}
closePopup.addEventListener('click',()=>popup.classList.add('hidden'));

// ============== TRACKING ==============
btnTrack.addEventListener('click',()=>{
  const email=trackEmail.value.trim();
  if(!email) return alert('Enter email.');
  const list=loadOrders().filter(o=>o.email.toLowerCase()===email.toLowerCase());
  renderOrders(list);
});
function renderOrders(list){
  ordersContainer.innerHTML=list.length?list.reverse().map(o=>`
    <div class="order-card">
      <div style="display:flex;justify-content:space-between;">
        <div><strong>${o.id}</strong><div class="muted">${o.city}</div></div>
        <div><span class="status ${o.status}">${o.status}</span><div class="muted">ETA: ${o.eta}</div></div>
      </div>
      <ul>${o.items.map(i=>`<li class="muted">${i.title} × ${i.qty}</li>`).join('')}</ul>
      <div class="center">Total: ₹${o.total}</div>
    </div>`).join(''):'<p class="muted">No orders found.</p>';
}

// ============== NAVIGATION ==============
navProducts.addEventListener('click',()=>showView('products'));
navOrders.addEventListener('click',()=>showView('orders'));
function showView(v){
  navProducts.classList.remove('active');navOrders.classList.remove('active');
  productsView.style.display='none';ordersView.style.display='none';
  if(v==='products'){navProducts.classList.add('active');productsView.style.display='';}
  else{navOrders.classList.add('active');ordersView.style.display='';}
}
showView('products');
openCart.addEventListener('click',()=>window.scrollTo({top:document.body.scrollHeight,behavior:'smooth'}));
