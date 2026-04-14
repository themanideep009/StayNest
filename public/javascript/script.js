const navToggle = document.getElementById("navToggle");
const navLinks = document.getElementById("navLinks");

navToggle?.addEventListener("click", () => {
    navLinks?.classList.toggle("open");
    navToggle.setAttribute("aria-expanded", navLinks?.classList.contains("open") ? "true" : "false");
});

document.querySelectorAll(".flash-toast").forEach((toast) => {
    toast.addEventListener("click", () => toast.remove());
    window.setTimeout(() => {
        toast.style.transition = "opacity 0.4s ease, transform 0.4s ease";
        toast.style.opacity = "0";
        toast.style.transform = "translateY(-8px)";
        window.setTimeout(() => toast.remove(), 400);
    }, 4000);
});

document.querySelectorAll(".needs-validation").forEach((form) => {
    form.addEventListener("submit", (event) => {
        if (!form.checkValidity()) {
            event.preventDefault();
            event.stopPropagation();
        }
        form.classList.add("was-validated");
    });
});

document.querySelectorAll("form[data-confirm]").forEach((form) => {
    form.addEventListener("submit", (event) => {
        const message = form.getAttribute("data-confirm");
        if (message && !window.confirm(message)) {
            event.preventDefault();
        }
    });
});

document.querySelectorAll("img").forEach((image) => {
    image.addEventListener(
        "error",
        () => {
            image.src = "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800";
        },
        { once: true }
    );
});

document.addEventListener("click", (event) => {
    if (!navLinks?.classList.contains("open")) {
        return;
    }

    const clickedInsideNav = event.target.closest(".wl-navbar");
    if (!clickedInsideNav) {
        navLinks.classList.remove("open");
        navToggle?.setAttribute("aria-expanded", "false");
    }
});

document.querySelectorAll(".booking-form").forEach((form) => {
    const checkin = form.querySelector('input[name="checkin"]');
    const checkout = form.querySelector('input[name="checkout"]');
    const nightsOutput = form.querySelector("[data-booking-nights]");
    const totalOutput = form.querySelector("[data-booking-total]");
    const pricePerNight = Number(form.getAttribute("data-price-per-night") || 0);

    if (!checkin || !checkout || !nightsOutput || !totalOutput || !pricePerNight) {
        return;
    }

    const updateBookingSummary = () => {
        const checkinDate = new Date(checkin.value);
        const checkoutDate = new Date(checkout.value);

        if (Number.isNaN(checkinDate.getTime()) || Number.isNaN(checkoutDate.getTime())) {
            return;
        }

        if (checkoutDate <= checkinDate) {
            const nextDay = new Date(checkinDate);
            nextDay.setDate(nextDay.getDate() + 1);
            checkout.value = nextDay.toISOString().split("T")[0];
            checkoutDate.setTime(nextDay.getTime());
        }

        checkout.min = checkin.value;

        const diffMs = checkoutDate.getTime() - checkinDate.getTime();
        const nights = Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)));
        const total = nights * pricePerNight;

        nightsOutput.textContent = `${nights} night${nights === 1 ? "" : "s"}`;
        totalOutput.innerHTML = `&#8377;${total.toLocaleString("en-IN")}`;
    };

    checkin.addEventListener("change", updateBookingSummary);
    checkout.addEventListener("change", updateBookingSummary);
    updateBookingSummary();
});
