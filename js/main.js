(() => {
    "use strict";

    function initializeNavigation() {
        const nav = document.getElementById("mainNav");
        const menu = document.getElementById("navbarTarget");
        if (!nav || !menu) return;

        const updateNavbar = () => nav.classList.toggle("navbar-shrink", window.scrollY > 100);
        updateNavbar();
        window.addEventListener("scroll", updateNavbar, { passive: true });

        nav.querySelectorAll("a.nav-link").forEach(link => {
            const destination = new URL(link.href);
            if (destination.pathname.replace(/\/index\.html$/, "/") === window.location.pathname.replace(/\/index\.html$/, "/") && (!destination.hash || destination.hash === "#top")) {
                link.setAttribute("aria-current", "page");
            }
            link.addEventListener("click", () => {
                if (menu.classList.contains("show")) {
                    bootstrap.Collapse.getOrCreateInstance(menu, { toggle: false }).hide();
                }
            });
        });
        menu.addEventListener("keydown", event => {
            if (event.key === "Escape" && menu.classList.contains("show")) {
                bootstrap.Collapse.getOrCreateInstance(menu, { toggle: false }).hide();
                nav.querySelector(".navbar-toggler").focus();
            }
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initializeNavigation, { once: true });
    } else {
        initializeNavigation();
    }
})();
