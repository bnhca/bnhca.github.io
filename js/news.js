(() => {
    "use strict";

    function initializeArchive() {
        const archive = document.getElementById("newsletter-archive");
        const template = document.getElementById("newsletter-frame");
        if (!archive || !template) return;
        const status = archive.querySelector("[role=status]");
        const frame = template.content.firstElementChild.cloneNode(true);

        archive.classList.add("is-loading");
        frame.setAttribute("aria-busy", "true");
        status.hidden = false;
        const timeout = window.setTimeout(() => {
            archive.classList.remove("is-loading");
            archive.classList.add("is-slow");
            frame.setAttribute("aria-busy", "false");
            status.textContent = "The archive is taking longer to load. You can open it using the link above.";
        }, 12000);

        frame.addEventListener("load", () => {
            window.clearTimeout(timeout);
            archive.classList.remove("is-loading", "is-slow");
            frame.setAttribute("aria-busy", "false");
            status.hidden = true;
        }, { once: true });
        archive.append(frame);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initializeArchive, { once: true });
    } else {
        initializeArchive();
    }
})();
