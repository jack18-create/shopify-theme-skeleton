/* Cart functions */

function cartOpenLoading() {
  const cartContainer = document.querySelector('.drawer-cart');
  cartContainer.innerHTML += '<div class="load-container"><div class="load"></div></div>';
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

  console.log('quantity', quantity);
    console.log('id', id);

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
    if (!button) {
      console.error('Referer button not found.');
      return;
    }
    // call the updateCart method with the button element
    const cartAdd = await addToCart(buildQuickData(button, 'cart-drawer')); // Replace yg-cart-drawer = cart-drawer
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
  const action = open ? 'add' : 'remove';
  document.querySelector('.drawer-cart')?.classList[action]('drawn');
  document.querySelector('.cart-overlay')?.classList[action]('drawn');
  document.body.classList[action]('no-scroll');
}

window.upsellOpenedByDrawer = false;

// function handleBodyClickUpsell(event) {
//   if (event.target.closest('.close-upsell, .background-drawer-upsell')) {
//     toggleUpsellVisibility(false);
//     if (!window.upsellOpenedByDrawer) {
//       toggleCartVisibility(true);
//     }
//     window.upsellOpenedByDrawer = false;
//   } else if (event.target.closest('.open-upsell')) {
//     toggleCartVisibility(false);
//     toggleUpsellVisibility(true);
//     window.upsellOpenedByDrawer = false;
//   } else if (event.target.closest('[data-onclick="drawer"], [href="#upselldrawer"]')) {
//     toggleCartVisibility(false);
//     toggleUpsellVisibility(true);
//     window.upsellOpenedByDrawer = true;
//   }
// }

// function toggleUpsellVisibility(open) {
//   const action = open ? 'add' : 'remove';
//   document.querySelector('.drawer-upsell')?.classList[action]('drawn');
//   document.querySelector('.background-drawer-upsell')?.classList[action]('drawn');
//   document.body.classList[action]('no-scroll');
// }

// function handleDisabledCheckout(button) {
//   if (button.dataset.empty) return;

//   const notification = document.getElementById('floatingNotification');
//   notification.classList.remove('hidden');

//   // Scroll the .drawer-cart-wrapper to top smoothly
//   document.querySelector('.drawer-cart-wrapper')?.scrollTo({ top: 0, behavior: 'smooth' });

//   // Temporarily modify classes for visual feedback
//   document.querySelector('.subscription-box')?.classList.add('border-darker');
//   document.querySelector('.open-upsell')?.classList.add('button-darker');

//   // Revert changes after 3 seconds
//   setTimeout(() => {
//     notification.classList.add('hidden');
//     document.querySelector('.subscription-box')?.classList.remove('border-darker');
//     document.querySelector('.open-upsell')?.classList.remove('button-darker');
//   }, 3000);
// }

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

// Show promotion notifications
// function showPromotionNotificationDisplay() {
//     if (window.notificationPromo !== '') {
//       const promoNotification = document.querySelector('.promotion-notification');
//       document.getElementById('promotion-notification-product').textContent = window.notificationPromo;
//       promoNotification.classList.remove('hidden');

//       setTimeout(() => {
//         promoNotification.classList.add('hidden');
//       }, 4000);
//       window.notificationPromo = '';
//     }
//   }

// function calculateCustomCartTotal(cartItems) {
//     let customCartTotal = 0;

//     cartItems.forEach((item) => {
//       if (item.properties._intervalunitofmeasure === 'months') {
//         const originalPrice = item.original_price;
//         const subscriptionDiscount = originalPrice * 0.25;
//         const subscriptionPrice = Math.round(originalPrice - subscriptionDiscount) * item.quantity;
//         customCartTotal += subscriptionPrice;
//       } else if (item.properties._gratis_product === 'true') {
//         // Assuming you don't want to add anything if it's a gratis product
//       } else if (item.properties._is_pack === 'true') {
//         customCartTotal += item.final_price * item.quantity;
//       } else {
//         customCartTotal += item.final_line_price;
//       }
//     });

//     return customCartTotal;
//   }

// function isSubscriptionAvailable(cartItems) {
//     return cartItems.some((item) => item.properties && item.properties._intervalunitofmeasure === 'months');
//   }

async function handleGratisProducts(gratis_products, cart, subscriptionAvailable, custom_cart_total, sections) {
  let updatedCart = cart;
  let updatedSections = sections;
  for (const gratis_product of gratis_products) {
    const gratisAdded =
      updatedCart.attributes && updatedCart.attributes[`gratis_product_added_${gratis_product.variant_id}`] === 'true';

    if (gratis_product.subscription) {
      if (subscriptionAvailable && !gratisAdded) {
        const returnedData = await addToCart({
          items: [
            {
              id: parseInt(gratis_product.variant_id),
              quantity: 1,
              properties: {
                _firmhouseid: parseInt(gratis_product.firmhouse_id),
                _intervalunitofmeasure: 'default',
                _gratis_product: 'true',
              },
            },
          ],
          attributes: { [`gratis_product_added_${gratis_product.variant_id}`]: 'true' },
          sections: 'cart-drawer',       // Replace yg-cart-drawer = cart-drawer  
        });
        const cart = await fetchCart();
        updatedCart = cart;
        updatedSections = returnedData.sections;
      } else if (!subscriptionAvailable && gratisAdded) {
        const line = findLineForGratisProduct(updatedCart, gratis_product.variant_id);
        await changeCartItem(line, 0, true); // Remove the gratis product
        const returnedData = await updateCart(
          {},
          false,
          '',
          { [`gratis_product_added_${gratis_product.variant_id}`]: 'false' },
          'cart-drawer'     // Replace yg-cart-drawer = cart-drawer  
        );
        updatedCart = returnedData;
        updatedSections = returnedData.sections;
      }
    } else {
      if (custom_cart_total / 100 >= gratis_product.threshold && !gratisAdded) {
        const returnedData = await addToCart({
          items: [
            {
              id: parseInt(gratis_product.variant_id),
              quantity: 1,
              properties: {
                _firmhouseid: parseInt(gratis_product.firmhouse_id),
                _intervalunitofmeasure: 'default',
                _gratis_product: 'true',
              },
            },
          ],
          attributes: { [`gratis_product_added_${gratis_product.variant_id}`]: 'true' },
          sections: 'cart-drawer',    // Replace yg-cart-drawer = cart-drawer  
        });
        const cart = await fetchCart();
        updatedCart = cart;
        updatedSections = returnedData.sections;
      } else if (custom_cart_total / 100 < gratis_product.threshold && gratisAdded) {
        const line = findLineForGratisProduct(updatedCart, gratis_product.variant_id);
        await changeCartItem(line, 0, true); // Remove the gratis product
        const returnedData = await updateCart(
          {},
          false,
          '',
          { [`gratis_product_added_${gratis_product.variant_id}`]: 'false' },
          'cart-drawer'    // Replace yg-cart-drawer = cart-drawer  
        );
        updatedCart = returnedData;
        updatedSections = returnedData.sections;
      }
    }
  }
  // return both the updated cart and sections
  return { cart: updatedCart, sections: updatedSections };
}

async function handleFreeUrlProduct(cart_update, custom_cart_total, cartStrings, sections) {
  let updatedCart = cart_update;
  let updatedSections = sections;
  const urlGift = cart_update.attributes.url_gift;

  // Use a for...of loop to handle async operations correctly
  for (let index = 0; index < cartStrings.free_url_product.length; index++) {
    const product = cartStrings.free_url_product[index];
    if (cartStrings.free_url_product_available[index] === 'true') {
      const productInCart = cart_update.items.some(
        (item) =>
          item.variant_id == parseInt(cartStrings.free_url_product_available_id[index]) &&
          item.properties._gratis_product == 'true'
      );

      const thresholdMet = custom_cart_total / 100 >= parseInt(cartStrings.free_url_threshold[index]);

      // Add the product if not already in cart, threshold is met, and it matches the gift parameter
      if (!productInCart && thresholdMet && product === urlGift) {
        const returnedData = await addToCart({
          items: [
            {
              id: parseInt(cartStrings.free_url_product_available_id[index]),
              quantity: 1,
              properties: {
                _firmhouseid: parseInt(cartStrings.free_firmhouse_id[index]),
                _intervalunitofmeasure: 'default',
                _gratis_product: 'true',
              },
            },
          ],
          attributes: { url_gift: 'false' },
          sections: 'cart-drawer',    // Replace yg-cart-drawer = cart-drawer  
        });
        updatedCart = await fetchCart();
        updatedSections = returnedData.sections;
      }

      // Remove the product if it's in the cart and below the threshold or if it's the only item
      if ((productInCart && !thresholdMet) || (cart_update.items.length == 1 && productInCart)) {
        let line =
          cart_update.items.findIndex(
            (item) =>
              item.properties._gratis_product == 'true' &&
              item.variant_id == parseInt(cartStrings.free_url_product_available_id[index])
          ) + 1; // Convert 0-based index to 1-based line number for cart manipulation

        if (line > 0) {
          const returnedData = await changeCartItem(line, 0, true, {}, null, 'cart-drawer');    // Replace yg-cart-drawer = cart-drawer  
          updatedCart = returnedData;
          updatedSections = returnedData.sections;
        }
      }
    }
  }

  return { cart: updatedCart, sections: updatedSections };
}

function findLineForGratisProduct(cart, variantId) {
  const index = cart.items.findIndex(
    (item) => item.properties._gratis_product === 'true' && item.variant_id === parseInt(variantId)
  );
  return index + 1; // line numbers are 1-based
}
 
   

// Main function to refresh the cart
async function refreshCart(openCart = true, cartData = null, sections = null) { 
  const cartContainer = document.querySelector('.drawer-cart');
  let updatedSections = sections;
  if (!cartContainer.querySelector('.load-container')) {
    cartContainer.innerHTML += '<div class="load-container"><div class="load"></div></div>';
  }
 
  if (openCart) {
    cartContainer.classList.add('drawn');
    document.querySelector('.cart-overlay').classList.add('drawn');
  }

  try {
    let data = cartData ? cartData : await fetchCart();
    console.log('data', data);
    const { cart: cart_update, sections: newSections } = await checkGratisProductEligibility(data, sections);
    updatedSections = newSections;
    data = cart_update;
    const cartItems = data ? data.items : [];
    checkIfSubscriptionProductAvailableInCart(cartItems);

    const rootUrl = routes.root_url === '/' ? '' : routes.root_url;
    const cartUrl = `${rootUrl}/?sections=cart-drawer`;    // Replace yg-cart-drawer = cart-drawer  

    console.log('cartUrl', cartUrl);
    console.log('rootUrl', rootUrl);

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
    if (data.item_count == 0) {
      document.querySelector('.cart-count-bubble').classList.add('no-disp');
      document.querySelector('.cart-count-bubble-text').textContent = data.item_count;
    } else {
      document.querySelector('.cart-count-bubble').classList.remove('no-disp');
      document.querySelector('.cart-count-bubble-text').textContent = data.item_count;
    }

    showPromotionNotificationDisplay();
  } catch (error) {
    console.error('Failed to fetch or update cart:', error);
  } finally {
    // if upsell is open, close it and open cart
    // if (document.querySelector('.drawer-upsell').classList.contains('drawn')) {
    //   toggleUpsellVisibility(false);
    //   toggleCartVisibility(true);
    // }
    const loadContainer = document.querySelector('.load-container');
    if (loadContainer) loadContainer.remove();
  }
}


