import { useEffect } from "react";

const META_TAGS = [
  ["name", "description"],
  ["property", "og:type"],
  ["property", "og:title"],
  ["property", "og:description"],
  ["property", "og:url"],
  ["property", "og:image"],
  ["name", "twitter:card"],
  ["name", "twitter:title"],
  ["name", "twitter:description"],
  ["name", "twitter:image"],
];

export default function SeoMetadata({ title, description, image, structuredData }) {
  useEffect(() => {
    const originalTitle = document.title;
    const metaValues = META_TAGS.map(([attribute, value]) => {
      let element = document.head.querySelector(
        `meta[${attribute}="${value}"]`,
      );
      const existed = Boolean(element);
      if (!element) {
        element = document.createElement("meta");
        element.setAttribute(attribute, value);
        document.head.append(element);
      }
      return { element, existed, content: element.getAttribute("content") };
    });
    let canonical = document.head.querySelector('link[rel="canonical"]');
    const hadCanonical = Boolean(canonical);
    const canonicalHref = canonical?.getAttribute("href");
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.append(canonical);
    }

    let jsonLd = document.getElementById("page-structured-data");
    const hadJsonLd = Boolean(jsonLd);
    const originalJsonLd = jsonLd?.textContent;
    if (!jsonLd) {
      jsonLd = document.createElement("script");
      jsonLd.id = "page-structured-data";
      jsonLd.type = "application/ld+json";
      document.head.append(jsonLd);
    }

    const pageUrl = window.location.href.split("#")[0];
    const values = {
      description,
      "og:type": "product",
      "og:title": title,
      "og:description": description,
      "og:url": pageUrl,
      "og:image": image,
      "twitter:card": "summary_large_image",
      "twitter:title": title,
      "twitter:description": description,
      "twitter:image": image,
    };

    document.title = title;
    META_TAGS.forEach(([attribute, key], index) => {
      metaValues[index].element.setAttribute("content", values[key]);
    });
    canonical.href = pageUrl;
    jsonLd.textContent = JSON.stringify(structuredData);

    return () => {
      document.title = originalTitle;
      metaValues.forEach(({ element, existed, content }) => {
        if (existed) element.setAttribute("content", content);
        else element.remove();
      });
      if (hadCanonical) canonical.setAttribute("href", canonicalHref);
      else canonical.remove();
      if (hadJsonLd) jsonLd.textContent = originalJsonLd;
      else jsonLd.remove();
    };
  }, [description, image, structuredData, title]);

  return null;
}
