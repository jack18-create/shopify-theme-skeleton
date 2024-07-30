if (!customElements.get('product-form')) {
  customElements.define(
    'product-form',
    class ProductForm extends HTMLElement {
      constructor() {
        super();

        this.form = this.querySelector('form');
        this.form.querySelector('[name=id]').disabled = false;
        this.form.addEventListener('submit', this.onSubmitHandler.bind(this));
        this.cart = document.querySelector('cart-drawer'); 
        this.submitButton = this.querySelector('[type="submit"]'); 
        if (document.querySelector('cart-drawer')) this.submitButton.setAttribute('aria-haspopup', 'dialog');
      }

    //   onSubmitHandler(evt) {
    //     evt.preventDefault();
    //     if (this.submitButton.getAttribute('aria-disabled') === 'true') return;

    //     this.handleErrorMessage();

    //     this.submitButton.setAttribute('aria-disabled', true);
    //     this.submitButton.classList.add('loading');

    //     const config = fetchConfig('javascript');
    //     config.headers['X-Requested-With'] = 'XMLHttpRequest';
    //     delete config.headers['Content-Type'];

    //     const formData = new FormData(this.form);
    //     if (this.cart) {
    //       console.log(this.cart, '@@@@@@@@@@'); // Check what this.cart is

    //       if (typeof this.cart.getSectionsToRender === 'function') {
    //         formData.append(
    //           'sections',
    //           this.cart.getSectionsToRender().map((section) => section.id)
    //         );
    //         formData.append('sections_url', window.location.pathname);
    //         this.cart.setActiveElement(document.activeElement);
    //       } else {
    //         console.warn('getSectionsToRender method is not available on this.cart');
    //       }
    //     }
    //     config.body = formData;
    //     console.log('Config: =============== ', config.body); // Log the config object

    //     fetch(`${routes.cart_add_url}`, config)
    //       .then((response) => response.json())
    //       .then((response) => {
    //         console.log('Full response:', response); // Log the full response

    //         if (response.status) {
    //           this.handleErrorMessage(response.description);

    //           const soldOutMessage = this.submitButton.querySelector('.sold-out-message');
    //           if (soldOutMessage) {
    //             this.submitButton.setAttribute('aria-disabled', true);
    //             this.submitButton.querySelector('span').classList.add('hidden');
    //             soldOutMessage.classList.remove('hidden');
    //             this.error = true;
    //           }
    //           return;
    //         }

    //         // Check if response contains sections
    //         if (response.sections) {
    //           this.error = false;
    //           const quickAddModal = this.closest('quick-add-modal');
    //           if (quickAddModal) {
    //             document.body.addEventListener(
    //               'modalClosed',
    //               () => {
    //                 setTimeout(() => {
    //                   this.cart.renderContents(response);
    //                 });
    //               },
    //               { once: true }
    //             );
    //             quickAddModal.hide(true);
    //           } else {
    //             this.cart.renderContents(response);
    //           }
    //         } else {
    //           console.warn('Response does not contain sections');
    //           // Handle missing sections if necessary
    //         }
    //       })
    //       .catch((e) => {
    //         console.error(e);
    //       })
    //       .finally(() => {
    //         this.submitButton.classList.remove('loading');
    //         if (this.cart && this.cart.classList.contains('is-empty')) this.cart.classList.remove('is-empty');
    //         if (!this.error) this.submitButton.removeAttribute('aria-disabled');
    //       });
    //   }
 

    onSubmitHandler(evt) {
        evt.preventDefault();
        if (this.submitButton.getAttribute('aria-disabled') === 'true') return;
  
        this.handleErrorMessage();
  
        // this.submitButton.setAttribute('aria-disabled', true);
        // this.submitButton.classList.add('loading');
        // this.querySelector('.loading-overlay__spinner').classList.remove('hidden');
  
        const config = fetchConfig('javascript');
        config.headers['X-Requested-With'] = 'XMLHttpRequest';
        delete config.headers['Content-Type'];
   
        const formData = new FormData(this.form); 
        if (this.cart) { 
            console.log(this.cart, "@@@@@@");
          formData.append('sections', this.cart.getSectionsToRender().map((section) => section.id)); 
          formData.append('sections_url', window.location.pathname); 
          this.cart.setActiveElement(document.activeElement);
        }
        config.body = formData;
  
        fetch(`${routes.cart_add_url}`, config)
          .then((response) => response.json())
          .then((response) => {
            if (response.status) {
              this.handleErrorMessage(response.description);
  
              const soldOutMessage = this.submitButton.querySelector('.sold-out-message');
              if (!soldOutMessage) return;
              this.submitButton.setAttribute('aria-disabled', true);
              this.submitButton.querySelector('span').classList.add('hidden');
              soldOutMessage.classList.remove('hidden');
              this.error = true;
              return;
            } else if (!this.cart) {
              window.location = window.routes.cart_url;
              return;
            }
  
            this.error = false;
            const quickAddModal = this.closest('quick-add-modal');
            if (quickAddModal) {
              document.body.addEventListener('modalClosed', () => {
                setTimeout(() => { this.cart.renderContents(response) });
              }, { once: true });
              quickAddModal.hide(true);
            } else {
              this.cart.renderContents(response);
            }
          })
          .catch((e) => {
            console.error(e);
          })
          .finally(() => {
            // this.submitButton.classList.remove('loading');
            // if (this.cart && this.cart.classList.contains('is-empty')) this.cart.classList.remove('is-empty');
            // if (!this.error) this.submitButton.removeAttribute('aria-disabled');
            // this.querySelector('.loading-overlay__spinner').classList.add('hidden');
          });
      }


      handleErrorMessage(errorMessage = false) {
        this.errorMessageWrapper =
          this.errorMessageWrapper || this.querySelector('.product-form__error-message-wrapper');
        if (!this.errorMessageWrapper) return;
        this.errorMessage = this.errorMessage || this.errorMessageWrapper.querySelector('.product-form__error-message');

        this.errorMessageWrapper.toggleAttribute('hidden', !errorMessage);

        if (errorMessage) {
          this.errorMessage.textContent = errorMessage;
        }
      }
    }
  );
}



// class CartDrawer extends HTMLElement {
//   renderContents(parsedState) {
//     if (!parsedState || !parsedState.sections) {
//       console.error('Parsed state or sections is null or undefined');
//       return; // Exit if no valid data is available
//     }

//     console.log(parsedState); // Log the parsedState to check its structure
//     const drawerInner = this.querySelector('.drawer__inner');
//     if (drawerInner && drawerInner.classList.contains('is-empty')) {
//       drawerInner.classList.remove('is-empty');
//     }

//     this.productId = parsedState.id;
//     this.getSectionsToRender().forEach((section) => {
//       const sectionElement = section.selector
//         ? document.querySelector(section.selector)
//         : document.getElementById(section.id);

//       console.log(sectionElement, 'sectionElement =============================');
//       if (sectionElement) {
//         console.log(parsedState.sections[section.id], '111111111111111');
//         console.log(section.selector, '222222222222222222');
//         const sectionHTML = this.getSectionInnerHTML(parsedState.sections[section.id], section.selector);
//         sectionElement.innerHTML = sectionHTML;
//       } else {
//         console.error(`Section element not found for selector or ID: ${section.selector || section.id}`);
//       }
//     });

//     setTimeout(() => {
//       const cartOverlay = this.querySelector('#CartDrawer-Overlay');
//       if (cartOverlay) {
//         cartOverlay.addEventListener('click', this.close.bind(this));
//       } else {
//         console.error('Cart overlay not found');
//       }
//       this.open();
//     });
//   }

//   getSectionsToRender() {
//     return [
//       {
//         id: 'cart-drawer',
//         selector: '#CartDrawer',
//       },
//       {
//         id: 'cart-icon-bubble',
//       },
//     ];
//   }

//   setActiveElement(element) {
//     this.activeElement = element;
//   }

//   getSectionInnerHTML(html, selector = '.shopify-section') {
//     console.log(html, '+++++++++++++++++++++++++++');
//     if (!html) {
//       console.warn('No HTML content provided');
//       return ''; // Return empty string or default content
//     }
//     const parsedHTML = new DOMParser().parseFromString(html, 'text/html');
//     const element = parsedHTML.querySelector(selector);
//     return element ? element.innerHTML : ''; // Handle null cases
//   }

//   open(triggeredBy) {
//     if (triggeredBy) this.setActiveElement(triggeredBy);
//     const cartDrawerNote = this.querySelector('[id^="Details-"] summary');
//     if (cartDrawerNote && !cartDrawerNote.hasAttribute('role')) this.setSummaryAccessibility(cartDrawerNote);
//     // here the animation doesn't seem to always get triggered. A timeout seem to help
//     setTimeout(() => {
//       this.classList.add('animate', 'active');
//     });

//     this.addEventListener(
//       'transitionend',
//       () => {
//         const containerToTrapFocusOn = this.classList.contains('is-empty')
//           ? this.querySelector('.drawer__inner-empty')
//           : document.getElementById('cart-drawer');
//         console.log(containerToTrapFocusOn, '>>>>>>>>>>>>>>');
//         const focusElement = this.querySelector('.drawer__inner') || this.querySelector('.drawer__close');
//         trapFocus(containerToTrapFocusOn, focusElement);
//       },
//       { once: true }
//     );

//     document.body.classList.add('overflow-hidden');
//   }

//   close() {
//     this.classList.remove('active');
//     removeTrapFocus(this.activeElement);
//     document.body.classList.remove('overflow-hidden');
//   }
// }

// customElements.define('cart-drawer', CartDrawer);
