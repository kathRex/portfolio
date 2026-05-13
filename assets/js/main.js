const yearElement = document.getElementById("year");

if (yearElement) {
	yearElement.textContent = new Date().getFullYear();
}

// Create the main lightbox container element, which is a div that will overlay the page to show images in full size
const lightboxElement = document.createElement("div");
lightboxElement.className = "image-lightbox";
lightboxElement.hidden = true;
lightboxElement.setAttribute("aria-hidden", "true");

// Create a paragraph element for the caption of the image in the lightbox
const lightboxCaptionElement = document.createElement("p");
lightboxCaptionElement.className = "image-lightbox-caption";
lightboxCaptionElement.textContent = "";

// Create an image element that will display the full-size image in the lightbox
const lightboxImageElement = document.createElement("img");
lightboxImageElement.className = "image-lightbox-image";
lightboxImageElement.alt = "";

// Create a close button for the lightbox with an X symbol
const lightboxCloseElement = document.createElement("button");
lightboxCloseElement.className = "image-lightbox-close";
lightboxCloseElement.type = "button";
lightboxCloseElement.setAttribute("aria-label", "Close image preview");
lightboxCloseElement.textContent = "✕";

// Add the caption, image, and close button to the lightbox container
lightboxElement.appendChild(lightboxCaptionElement);
lightboxElement.appendChild(lightboxImageElement);
lightboxElement.appendChild(lightboxCloseElement);
// Finally, add the entire lightbox to the body of the document
document.body.appendChild(lightboxElement);

// Function to open the lightbox when an image is clicked, setting the image source and caption
const openLightbox = (imageElement) => {
	const caption = imageElement.alt || "Project image preview";
	lightboxCaptionElement.textContent = caption;
	lightboxImageElement.src = imageElement.currentSrc || imageElement.src;
	lightboxImageElement.alt = caption;
	lightboxElement.hidden = false;
	lightboxElement.setAttribute("aria-hidden", "false");
	document.body.style.overflow = "hidden";
};

// Function to close the lightbox, hiding it and resetting the image source and body overflow
const closeLightbox = () => {
	lightboxElement.hidden = true;
	lightboxElement.setAttribute("aria-hidden", "true");
	lightboxImageElement.src = "";
	document.body.style.overflow = "";
};

// Add event listener to the close button to close the lightbox when clicked
lightboxCloseElement.addEventListener("click", closeLightbox);

// Add event listener to the lightbox itself to close it when clicked outside the image (on the overlay)
lightboxElement.addEventListener("click", (event) => {
	if (event.target === lightboxElement) {
		closeLightbox();
	}
});

// Add event listener to the document for the Escape key to close the lightbox
document.addEventListener("keydown", (event) => {
	if (event.key === "Escape" && !lightboxElement.hidden) {
		closeLightbox();
	}
});

// Find all elements with the data-carousel attribute, which are the carousel containers
const carouselElements = document.querySelectorAll("[data-carousel]");

// Loop through each carousel element to set up its functionality
carouselElements.forEach((carouselElement) => {
	// Find the parent media panel or the carousel's parent element
	const mediaPanelElement = carouselElement.closest(".project-media-panel") || carouselElement.parentElement;
	// Get all slide elements within the carousel
	const slideElements = Array.from(carouselElement.querySelectorAll(".carousel-slide"));
	// Find the previous and next control buttons
	const previousButton = carouselElement.querySelector(".carousel-control.prev");
	const nextButton = carouselElement.querySelector(".carousel-control.next");
	// Find the dot indicators for the slides
	const dotElements = Array.from((mediaPanelElement || carouselElement).querySelectorAll(".carousel-dot"));

	// For each slide, if it's an image, add a click event to open the lightbox
	slideElements.forEach((slideElement) => {
		if (slideElement.tagName === "IMG") {
			slideElement.addEventListener("click", () => {
				openLightbox(slideElement);
			});
		}
	});

	// If there are no slides, skip this carousel
	if (slideElements.length === 0) {
		return;
	}

	// Initialize the current slide index
	let currentIndex = 0;

	// Function to update which slide is active based on the new index
	const updateSlides = (newIndex) => {
		// Calculate the new index, wrapping around if necessary
		currentIndex = (newIndex + slideElements.length) % slideElements.length;

		// Loop through each slide to set the active class and handle media
		slideElements.forEach((slideElement, index) => {
			const isActive = index === currentIndex;
			slideElement.classList.toggle("is-active", isActive);

			// If it's a video and not active, pause it
			if (slideElement.tagName === "VIDEO" && !isActive) {
				slideElement.pause();
			}

			// If it's an iframe, manage its src to load/unload the embed
			if (slideElement.tagName === "IFRAME") {
				if (!slideElement.dataset.embedSrc) {
					slideElement.dataset.embedSrc = slideElement.src;
				}

				slideElement.src = isActive ? slideElement.dataset.embedSrc : "";
			}
		});

		// Update the dot indicators to show which is active
		dotElements.forEach((dotElement, index) => {
			dotElement.classList.toggle("is-active", index === currentIndex);
			dotElement.setAttribute("aria-selected", index === currentIndex ? "true" : "false");
		});
	};

	// If there's only one slide, hide the controls and dots, and show the single slide
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

	// Add event listeners to the previous and next buttons to change slides
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

	// Add event listeners to the dots to jump to specific slides
	dotElements.forEach((dotElement, index) => {
		dotElement.addEventListener("click", () => {
			updateSlides(index);
		});
	});

	// Initialize the carousel by showing the first slide
	updateSlides(0);
});