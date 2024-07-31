// reviews-slider.js

class ReviewsSlider extends HTMLElement {
  constructor() {
    super();
    this.currentIndex = 0;
    this.touchStartX = 0;
    this.touchEndX = 0;
    this.visibleDots = 3;
  }

  connectedCallback() {
    this.initializeElements();
    this.addEventListeners();
    this.render();
  }

  initializeElements() {
    this.reviews = Array.from(this.querySelectorAll("review-item"));
    this.leftArrow = this.querySelector(".arrow.left");
    this.rightArrow = this.querySelector(".arrow.right");
    this.paginationContainer = this.querySelector(".pagination-dots");
    this.addPaginationDots();
  }

  addEventListeners() {
    this.leftArrow.addEventListener("click", () => this.changeSlide(-1));
    this.rightArrow.addEventListener("click", () => this.changeSlide(1));
    this.addEventListener("touchstart", this.handleTouchStart, {
      passive: true,
    });
    this.addEventListener("touchend", this.handleTouchEnd, { passive: true });
  }

  addPaginationDots() {
    const dotCount = Math.min(this.reviews.length, this.visibleDots);
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < dotCount; i++) {
      const dot = document.createElement("span");
      dot.className =
        "dot w-2 h-2 rounded-full bg-brand-light-gray mx-1 cursor-pointer transition-colors";
      dot.addEventListener("click", () => this.goToSlide(i));
      fragment.appendChild(dot);
    }
    this.paginationContainer.appendChild(fragment);
  }

  render() {
    this.reviews.forEach((review, index) => {
      review.classList.toggle("active", index === this.currentIndex);
    });
    this.updatePagination();
  }

  updatePagination() {
    const dots = this.paginationContainer.querySelectorAll(".dot");
    dots.forEach((dot, index) => {
      const adjustedIndex = (this.currentIndex + index) % this.reviews.length;
      dot.classList.toggle("bg-gray-700", adjustedIndex === this.currentIndex);
    });
  }

  changeSlide(direction) {
    this.currentIndex =
      (this.currentIndex + direction + this.reviews.length) %
      this.reviews.length;
    this.render();
  }

  goToSlide(index) {
    this.currentIndex = index;
    this.render();
  }

  handleTouchStart = (e) => {
    this.touchStartX = e.changedTouches[0].screenX;
  };

  handleTouchEnd = (e) => {
    this.touchEndX = e.changedTouches[0].screenX;
    const swipeThreshold = 50;
    const swipeDistance = this.touchStartX - this.touchEndX;
    if (Math.abs(swipeDistance) > swipeThreshold) {
      this.changeSlide(swipeDistance > 0 ? 1 : -1);
    }
  };
}

class ReviewItem extends HTMLElement {
  connectedCallback() {
    this.style.removeProperty("display");
  }
}

customElements.define("reviews-slider", ReviewsSlider);
customElements.define("review-item", ReviewItem);
