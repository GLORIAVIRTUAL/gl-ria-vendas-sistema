import { useEffect } from "react";

const emojiPattern = /[\p{Extended_Pictographic}\p{Emoji_Presentation}\p{Regional_Indicator}\uFE0F\u200D\u20E3]/gu;
const visibleAttributes = ["placeholder", "title"];

function removeEmojis(value) {
  return value?.replace(emojiPattern, "") ?? value;
}

function cleanElement(root) {
  if (!root) return;

  if (root.nodeType === Node.TEXT_NODE) {
    const cleaned = removeEmojis(root.nodeValue);
    if (cleaned !== root.nodeValue) root.nodeValue = cleaned;
    return;
  }

  if (root.nodeType !== Node.ELEMENT_NODE) return;
  if (["SCRIPT", "STYLE"].includes(root.tagName)) return;

  visibleAttributes.forEach((attribute) => {
    if (!root.hasAttribute(attribute)) return;
    const current = root.getAttribute(attribute);
    const cleaned = removeEmojis(current);
    if (cleaned !== current) root.setAttribute(attribute, cleaned);
  });

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const textNodes = [];
  while (walker.nextNode()) {
    if (!walker.currentNode.parentElement?.closest("script, style")) {
      textNodes.push(walker.currentNode);
    }
  }
  textNodes.forEach(cleanElement);

  root.querySelectorAll?.("[placeholder], [title]").forEach((element) => {
    visibleAttributes.forEach((attribute) => {
      if (!element.hasAttribute(attribute)) return;
      const current = element.getAttribute(attribute);
      const cleaned = removeEmojis(current);
      if (cleaned !== current) element.setAttribute(attribute, cleaned);
    });
  });
}

export default function VisualSymbolCleaner() {
  useEffect(() => {
    cleanElement(document.body);

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === "characterData") cleanElement(mutation.target);
        mutation.addedNodes.forEach(cleanElement);
      });
    });

    observer.observe(document.body, {
      childList: true,
      characterData: true,
      subtree: true,
    });

    return () => observer.disconnect();
  }, []);

  return null;
}