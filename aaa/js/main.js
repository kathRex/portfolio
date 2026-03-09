const yearElement = document.getElementById("year");

if (yearElement) {
	yearElement.textContent = new Date().getFullYear();
}

const lightboxElement = document.createElement("div");
lightboxElement.className = "image-lightbox";
lightboxElement.hidden = true;
lightboxElement.setAttribute("aria-hidden", "true");

const lightboxImageElement = document.createElement("img");
lightboxImageElement.className = "image-lightbox-image";
lightboxImageElement.alt = "";

const lightboxCloseElement = document.createElement("button");
lightboxCloseElement.className = "image-lightbox-close";
lightboxCloseElement.type = "button";
lightboxCloseElement.setAttribute("aria-label", "Close image preview");
lightboxCloseElement.textContent = "✕";

lightboxElement.appendChild(lightboxImageElement);
lightboxElement.appendChild(lightboxCloseElement);
document.body.appendChild(lightboxElement);

const openLightbox = (imageElement) => {
	lightboxImageElement.src = imageElement.currentSrc || imageElement.src;
	lightboxImageElement.alt = imageElement.alt || "Project image preview";
	lightboxElement.hidden = false;
	lightboxElement.setAttribute("aria-hidden", "false");
	document.body.style.overflow = "hidden";
};

const closeLightbox = () => {
	lightboxElement.hidden = true;
	lightboxElement.setAttribute("aria-hidden", "true");
	lightboxImageElement.src = "";
	document.body.style.overflow = "";
};

lightboxCloseElement.addEventListener("click", closeLightbox);

lightboxElement.addEventListener("click", (event) => {
	if (event.target === lightboxElement) {
		closeLightbox();
	}
});

document.addEventListener("keydown", (event) => {
	if (event.key === "Escape" && !lightboxElement.hidden) {
		closeLightbox();
	}
});

const carouselElements = document.querySelectorAll("[data-carousel]");

carouselElements.forEach((carouselElement) => {
	const mediaPanelElement = carouselElement.closest(".project-media-panel") || carouselElement.parentElement;
	const slideElements = Array.from(carouselElement.querySelectorAll(".carousel-slide"));
	const previousButton = carouselElement.querySelector(".carousel-control.prev");
	const nextButton = carouselElement.querySelector(".carousel-control.next");
	const dotElements = Array.from((mediaPanelElement || carouselElement).querySelectorAll(".carousel-dot"));

	slideElements.forEach((slideElement) => {
		if (slideElement.tagName === "IMG") {
			slideElement.addEventListener("click", () => {
				openLightbox(slideElement);
			});
		}
	});

	if (slideElements.length === 0) {
		return;
	}

	let currentIndex = 0;

	const updateSlides = (newIndex) => {
		currentIndex = (newIndex + slideElements.length) % slideElements.length;

		slideElements.forEach((slideElement, index) => {
			const isActive = index === currentIndex;
			slideElement.classList.toggle("is-active", isActive);

			if (slideElement.tagName === "VIDEO" && !isActive) {
				slideElement.pause();
			}

			if (slideElement.tagName === "IFRAME") {
				if (!slideElement.dataset.embedSrc) {
					slideElement.dataset.embedSrc = slideElement.src;
				}

				slideElement.src = isActive ? slideElement.dataset.embedSrc : "";
			}
		});

		dotElements.forEach((dotElement, index) => {
			dotElement.classList.toggle("is-active", index === currentIndex);
			dotElement.setAttribute("aria-selected", index === currentIndex ? "true" : "false");
		});
	};

	if (slideElements.length === 1) {
		if (previousButton) {
			previousButton.hidden = true;
		}
		if (nextButton) {
			nextButton.hidden = true;
		}
		dotElements.forEach((dotElement) => {
			dotElement.hidden = true;
		});
		updateSlides(0);
		return;
	}

	if (previousButton) {
		previousButton.addEventListener("click", () => {
			updateSlides(currentIndex - 1);
		});
	}

	if (nextButton) {
		nextButton.addEventListener("click", () => {
			updateSlides(currentIndex + 1);
		});
	}

	dotElements.forEach((dotElement, index) => {
		dotElement.addEventListener("click", () => {
			updateSlides(index);
		});
	});

	updateSlides(0);
});