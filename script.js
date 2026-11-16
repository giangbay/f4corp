const progressBar = document.querySelector(".scroll-progress");

function updateScrollProgress() {
  const scrollableHeight =
    document.documentElement.scrollHeight - window.innerHeight;
  const progress =
    scrollableHeight > 0 ? window.scrollY / scrollableHeight : 0;

  document.documentElement.style.setProperty(
    "--scroll-progress",
    String(progress),
  );
}

if (progressBar) {
  window.addEventListener("scroll", updateScrollProgress, { passive: true });
  window.addEventListener("resize", updateScrollProgress);
  updateScrollProgress();
}

if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  const revealTargets = document.querySelectorAll(
    [
      ".hero-copy > .eyebrow",
      ".hero h1",
      ".hero-copy > p",
      ".hero-actions",
      ".hero-note",
      ".hero-visual",
      ".intro-copy",
      ".intro-photo-wrap",
      ".section-heading",
      ".menu-card",
      ".visit-copy",
      ".visit-details",
    ].join(", "),
  );

  if ("IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -32px 0px" },
    );

    revealTargets.forEach((element) => {
      element.classList.add("reveal");
      revealObserver.observe(element);
    });
  } else {
    revealTargets.forEach((element) => element.classList.add("is-visible"));
  }
}
