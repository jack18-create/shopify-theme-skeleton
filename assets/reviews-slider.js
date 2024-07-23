class ReviewsSlider extends HTMLElement {
  constructor() {
    super();
    this.slides = this.querySelectorAll(".review-slide");
    this.currentSlide = 0;
    this.prevButton = this.querySelector(".prev-button");
    this.nextButton = this.querySelector(".next-button");
    this.sliderContent = this.querySelector(".reviews-slider-content");
    this.dotsContainer = this.querySelector(".slider-dots");
    this.touchStartX = 0;
    this.touchEndX = 0;
    this.maxVisibleDots = 4;
  }

  connectedCallback() {
    if (this.slides.length > 0) {
      this.setupDots();
      this.showSlide(this.currentSlide);
      this.setupNavigation();
      this.setupTouchEvents();
    }
  }

  setupDots() {
    for (let i = 0; i < this.slides.length; i++) {
      const dot = document.createElement("span");
      dot.classList.add("slider-dot");
      this.dotsContainer.appendChild(dot);
    }
    this.updateDots(0);
  }

  setupNavigation() {
    this.prevButton.addEventListener("click", () => this.prevSlide());
    this.nextButton.addEventListener("click", () => this.nextSlide());
  }

  setupTouchEvents() {
    this.sliderContent.addEventListener("touchstart", (e) => {
      this.touchStartX = e.touches[0].clientX;
    });

    this.sliderContent.addEventListener("touchend", (e) => {
      this.touchEndX = e.changedTouches[0].clientX;
      this.handleSwipe();
    });
  }

  handleSwipe() {
    const swipeThreshold = 50;
    if (this.touchStartX - this.touchEndX > swipeThreshold) {
      this.nextSlide();
    } else if (this.touchEndX - this.touchStartX > swipeThreshold) {
      this.prevSlide();
    }
  }

  showSlide(index) {
    this.slides.forEach((slide, i) => {
      slide.style.display = i === index ? "block" : "none";
    });
    this.updateDots(index);
    this.currentSlide = index;
  }

  updateDots(index) {
    const dots = this.dotsContainer.querySelectorAll(".slider-dot");
    const startDot =
      Math.floor(index / this.maxVisibleDots) * this.maxVisibleDots;

    dots.forEach((dot, i) => {
      dot.classList.toggle("active", i === index);
      dot.style.display =
        i >= startDot && i < startDot + this.maxVisibleDots
          ? "inline-block"
          : "none";
    });

    // Update active dot within visible range
    const visibleActiveDot = dots[index - startDot + startDot];
    if (visibleActiveDot) {
      visibleActiveDot.classList.add("active");
    }
  }

  prevSlide() {
    let newIndex = this.currentSlide - 1;
    if (newIndex < 0) newIndex = this.slides.length - 1;
    this.showSlide(newIndex);
  }

  nextSlide() {
    let newIndex = this.currentSlide + 1;
    if (newIndex >= this.slides.length) newIndex = 0;
    this.showSlide(newIndex);
  }
}

customElements.define("reviews-slider", ReviewsSlider);

// Shopify theme editor support
document.addEventListener("shopify:section:load", (event) => {
  const slider = event.target.querySelector("reviews-slider");
  if (slider) {
    new ReviewsSlider();
  }
});
