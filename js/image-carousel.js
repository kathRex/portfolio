document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".project-carousel").forEach((carousel) => {
    const slides = Array.from(carousel.querySelectorAll(".carousel-image"));
    const dotsContainer = carousel.nextElementSibling?.classList.contains(
      "carousel-dots",
    )
      ? carousel.nextElementSibling
      : null;

    const prevButton = carousel.querySelector(".carousel-button--left");
    const nextButton = carousel.querySelector(".carousel-button--right");

    if (!slides.length) return;

    let activeSlideIndex = slides.findIndex((slide) =>
      slide.classList.contains("is-active"),
    );

    if (activeSlideIndex === -1) activeSlideIndex = 0;

    const setActiveSlide = (index) => {
      activeSlideIndex = (index + slides.length) % slides.length;

      slides.forEach((slide, slideIndex) => {
        slide.classList.toggle("is-active", slideIndex === activeSlideIndex);
      });

      dotsContainer?.querySelectorAll("button").forEach((dot, dotIndex) => {
        dot.classList.toggle("is-active", dotIndex === activeSlideIndex);
      });
    };

    dotsContainer.innerHTML = "";

    slides.forEach((_, slideIndex) => {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.setAttribute("aria-label", `Show image ${slideIndex + 1}`);
      dot.addEventListener("click", () => setActiveSlide(slideIndex));
      dotsContainer.appendChild(dot);
    });

    prevButton?.addEventListener("click", () => {
      setActiveSlide(activeSlideIndex - 1);
    });

    nextButton?.addEventListener("click", () => {
      setActiveSlide(activeSlideIndex + 1);
    });

    setActiveSlide(activeSlideIndex);
  });
});
