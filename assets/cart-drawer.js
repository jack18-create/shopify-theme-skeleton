/* Cart functions */
 
function cartOpenLoading() {
  const cartContainer = document.querySelector('.drawer-cart');
  // cartContainer.innerHTML += '<div class="load-container"><div class="load"></div></div>';
  cartContainer.classList.add('drawn'); 
  document.querySelector('.cart-overlay').classList.add('drawn'); 
}

async function fetchCart() {
  try {
    const response = await fetch(`${routes.cart_url}`, {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/javascript',
      },
    });
    const cart = await response.json();
    return cart;
  } catch (error) {
    console.error('Error fetching cart:', error);
    throw error; // Re-throw the error to handle it outside the function if necessary.
  }
}

async function updateCart(updates, useLineNumbers = false, note = '', attributes = {}, sections = null) {
  try {
    let updatesPayload;
    if (useLineNumbers) {
      updatesPayload = {
        updates: Object.fromEntries(Object.entries(updates).map(([lineNumber, qty]) => [lineNumber, qty])),
      };
    } else {
      updatesPayload = { updates };
    }

    const requestData = {
      ...updatesPayload,
      ...(note && { note: encodeURIComponent(note) }),
      ...(Object.keys(attributes).length > 0 && {
        attributes: Object.fromEntries(
          Object.entries(attributes).map(([k, v]) => [encodeURIComponent(k), encodeURIComponent(v)])
        ),
      }),
      ...(sections && { sections: sections }),
    };

    const response = await fetch(`${routes.cart_update_url}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/javascript',
      },
      body: JSON.stringify(requestData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating cart:', error);
    throw error;
  }
}

async function changeCartItem(
  lineOrId,
  quantity,
  useLine = false,
  properties = {},
  sellingPlan = null,
  sections = null,
  cartOpenLoadingBoolean = false
) {
  try {
    if (cartOpenLoadingBoolean) {
      cartOpenLoading();
    }

    const requestData = {
      ...(useLine ? { line: lineOrId } : { id: lineOrId }),
      quantity,
      ...(Object.keys(properties).length > 0 && {
        properties: Object.fromEntries(
          Object.entries(properties).map(([k, v]) => [encodeURIComponent(k), encodeURIComponent(v)])
        ),
      }),
      ...(sellingPlan && { selling_plan: sellingPlan }),
      ...(sections && { sections: sections }),
    };

    const response = await fetch(`${routes.cart_change_url}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/javascript',
      },
      body: JSON.stringify(requestData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error changing cart item:', error);
    throw error;
  }
}

async function addToCart(items) { 
  try {
    cartOpenLoading();
    const response = await fetch(`${routes.cart_add_url}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/javascript',
      },
      body: JSON.stringify(items),
    });
    console.log(response , "response ==========");

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error adding item to cart:', error);
    throw error;
  }
}

async function clearCart() {
  try {
    const response = await fetch(`${routes.cart_clear_url}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/javascript',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error clearing cart:', error);
    throw error;
  }
}

function buildQuickData(buttonElement, sectionId) {
  const properties = {};
  // Access all data attributes
  const dataAttributes = buttonElement.dataset;

  // Find data attributes from the button element having cart-prop in the attribute name
  for (const key in dataAttributes) {
    if (dataAttributes.hasOwnProperty(key) && key.startsWith('cartProp')) {
      // Note: dataset converts 'cart-prop' to 'cartProp'
      // Remove 'cartProp' from the attribute name and add the property to the properties object
      const propKey = key.slice('cartProp'.length);
      properties[propKey.slice(1)] = dataAttributes[key];
    }
  }

  // Check if the button has a data-cart-quantity attribute otherwise set quantity to 1
  // if quantity and id are provided but its value is nan then it's an identifier so search for that element and store it's value instead

  let quantity = dataAttributes.cartQuantity || 1;
  let id = dataAttributes.cartId; 

  if (isNaN(quantity)) {
    quantity = document.querySelector(quantity).value;
  }
  if (isNaN(id)) {
    id = document.querySelector(id).value;
  }

  // if data-cart-info-quantity-multiplier is present, multiply the quantity by the multiplier
  if (dataAttributes.cartInfoQuantityMultiplier) {
    quantity *= dataAttributes.cartInfoQuantityMultiplier;
  }

  const data = [
    {
      id: id,
      quantity: quantity,
      properties: properties,
    },
  ];

  let structuredData = {
    items: data,
  };

  if (sectionId) {
    structuredData.sections = sectionId;
  }

  return structuredData;
}

class CartFunctionsWrapper extends HTMLElement {
  constructor() {
    super();
    //find button element inside the custom element
    this.button = this.querySelector('button');
    //add click event listener to the button element
    // pass button element as parameter to the onClickHandler method
    this.button.addEventListener('click', this.onClickHandler);
  }

  async onClickHandler(event) {
    event.preventDefault();
 
    if (this.classList.contains('disabled') || this.disabled) {
      return false;
    }

    // if this element has data-cart-referer data attribute then send the element with the data-cart-referer value id, else send this element use dataset
    // const cartReferer = this.dataset.cartReferer; 
 
    const button =  this; 
    console.log(button, " button =========="); 
    if (!button) {
      console.error('Referer button not found.');
      return;
    }
    // call the updateCart method with the button element
    const cartAdd = await addToCart(buildQuickData(button, 'cart-drawer')); // Replace yg-cart-drawer = cart-drawer
    console.log(cartAdd, " cartAdd ==========");
    refreshCart(true, null, cartAdd.sections);
  }
}

//register the custom element
customElements.define('cart-functions-wrapper', CartFunctionsWrapper);

class CartActionButton extends HTMLElement {
  constructor() {
    super();
    //find .delete-cart-product element inside the custom element
    this.buttonDelete = this.querySelector('.delete-cart-product');
    this.buttonQuantity = this.querySelector('input[name="quantity"]');
    //add click event listener to the button element
    if (this.buttonDelete) {
      this.buttonDelete.addEventListener('click', this.onEventHandler);
    }
    if (this.buttonQuantity) {
      this.buttonQuantity.addEventListener('change', this.onEventHandler);
    }
  }
  async onEventHandler(event) {
    event.preventDefault();
    try {
      const line = parseInt(this.closest('.cart-product-wrapper').dataset.line);
      let cart;

      if (event.target.name === 'quantity') {
        const quantity = parseInt(event.target.value);
        cart = await changeCartItem(line, quantity, true, {}, null, 'cart-drawer', true); // Replace yg-cart-drawer = cart-drawer
        refreshCart(false, cart, cart.sections);
      } else {
        cart = await changeCartItem(line, 0, true, {}, null, 'cart-drawer', true); // Replace yg-cart-drawer = cart-drawer
        refreshCart(false, cart, cart.sections);
      }
    } catch (error) {
      console.error('Error handling cart item change:', error);
      // Optionally, handle the UI or alert the user.
    }
  }
}

//register the custom element
customElements.define('cart-action-button', CartActionButton);


async function updateCartAttributes(attributes) {
  try {
    // Prepare attributes in the required format
    const encodedAttributes = Object.fromEntries(
      Object.entries(attributes).map(([key, value]) => [
        encodeURIComponent(key), // Encode keys
        value !== null ? encodeURIComponent(value) : '', // Encode or empty value
      ])
    );

    // Use the existing updateCart function to submit the attributes
    const response = await updateCart({}, false, '', encodedAttributes, 'cart-drawer');    // Replace yg-cart-drawer = cart-drawer  
    return response; // This response should already be a JSON object
  } catch (error) {
    console.error('Error updating cart attributes:', error);
    throw error;
  }
}

/* custom section */

function handleBodyClickCart(event) { 
  if (event.target.closest('.cart-toggler')) {
    toggleCartVisibility(true);
  } else if (event.target.closest('.close-cart, .cart-overlay')) {
    toggleCartVisibility(false);
  } else if (event.target.closest('.custom-checkout-btn.disabled')) {
    handleDisabledCheckout(event.target.closest('.custom-checkout-btn.disabled'));
  }
}

function toggleCartVisibility(open) {
  const OVERFLOW_HIDDEN = "overflow-hidden";
  const action = open ? 'add' : 'remove'; 

  document.querySelector('.drawer-cart')?.classList[action]('drawn');
  // document.querySelector('.drawer-cart')?.classList[inverseAction]('translate-x-full');
  document.querySelector('.cart-overlay')?.classList[action]('drawn');
  document.body.classList[action](OVERFLOW_HIDDEN);
}

window.upsellOpenedByDrawer = false;
   

function handleDisabledCheckout(button) {
  if (button.dataset.empty) return; 
  document.querySelector('.drawer-cart-wrapper')?.scrollTo({ top: 0, behavior: 'smooth' }); 
}

function handleOpenCartOnLoad() {
  const opencart = new URLSearchParams(window.location.search).get('cartopen');
  if (opencart === 'true') {
    toggleCartVisibility(true);
  }
}

// Fetch and parse both cart and header HTML content
async function fetchAndParseCartAndHeader(url) {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/javascript',
    },
  });
  if (!response.ok) throw new Error('Network response was not ok');
  const data = await response.json();
  const parser = new DOMParser();

  const cartHtmlDoc = parser.parseFromString(data['cart-drawer'], 'text/html');    // Replace yg-cart-drawer = cart-drawer  

  const cartHTML = cartHtmlDoc.querySelector('.shopify-section-yg-cart-drawer .drawer-cart').innerHTML;

  return { cartHTML };
}
 
function calculateCustomCartTotal(cartItems) {
  let customCartTotal = 0; 
  cartItems.forEach((item) => { 
      customCartTotal += item.final_line_price; 
  }); 
  return customCartTotal;
}
 
async function handleGratisProducts(cart, custom_cart_total, sections) {
  let updatedCart = cart;
  let updatedSections = sections; 
  return { cart: updatedCart, sections: updatedSections };
}
 

function findLineForGratisProduct(cart, variantId) {
  const index = cart.items.findIndex(
    (item) => item.properties._gratis_product === 'true' && item.variant_id === parseInt(variantId)
  );
  return index + 1; // line numbers are 1-based
}
 
  var _learnq = _learnq || [];

  
// ========= Gift product script :STARTS =========
async function checkGratisProductEligibility(data, sections = null) {  
    let cart = data;
    let cart_update = data;
    let custom_cart_total = calculateCustomCartTotal(cart.items); 
    let newSections = sections;
    if (_learnq) {
      _learnq.push([
        'track',
        'Added to Cart',
        {
          total_price: custom_cart_total / 100,
          $value: custom_cart_total / 100,
          items: cart.items,
        },
      ]);
    }

    // showPromotionNotification(localStorage.getItem('old-cart-total'), custom_cart_total);

    // update cart and sections with new values
    
    const { cart: updatedCart, sections: updatedSections } = await handleGratisProducts(cart, custom_cart_total, newSections);
    cart_update = updatedCart;
    newSections = updatedSections;
 
    return { cart: cart_update, sections: newSections };
  }
  // ========= Gift product script :ENDS =========

// Main function to refresh the cart
async function refreshCart(openCart = true, cartData = null, sections = null) { 
  const cartContainer = document.querySelector('.drawer-cart');
  let updatedSections = sections;
   
 console.log(openCart, "openCart ==========");
  if (openCart) {
    console.log("Open Cart ==========");
    cartContainer.classList.add('drawn');
    // cartContainer.classList.remove('translate-x-full');
    document.querySelector('.cart-overlay').classList.add('drawn');
  }

  try {
    let data = cartData ? cartData : await fetchCart(); 
    const { cart: cart_update, sections: newSections } = await checkGratisProductEligibility(data, sections); 
    updatedSections = newSections;
    data = cart_update; 

    const rootUrl = routes.root_url === '/' ? '' : routes.root_url;
    const cartUrl = `${rootUrl}/?sections=cart-drawer`;    // Replace yg-cart-drawer = cart-drawer   

    let cartHTML;

    if (!updatedSections) {
      // If sections are not provided, fetch them
      const fetchedSections = await fetchAndParseCartAndHeader(cartUrl);
      cartHTML = fetchedSections.cartHTML;
    } else {
      // Use provided sections
      const parser = new DOMParser();
      const cartHtmlDoc = parser.parseFromString(updatedSections['cart-drawer'], 'text/html');    // Replace yg-cart-drawer = cart-drawer   

      cartHTML = cartHtmlDoc.querySelector('.shopify-section-yg-cart-drawer .drawer-cart').innerHTML;
    }
    // Update DOM elements
    cartContainer.innerHTML = cartHTML;
     

    // showPromotionNotificationDisplay();
  } catch (error) {
    console.error('Failed to fetch or update cart:', error);
  } finally { 
  }
}


document.addEventListener('DOMContentLoaded', function () {
  document.body.addEventListener('click', function(event) { 
    handleBodyClickCart(event);  
  });
  handleOpenCartOnLoad(); 
});