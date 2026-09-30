(() => {
  const renderPreview = () => {
    const originalDiagram = document.querySelector(".ce-svg");
    if (!originalDiagram || originalDiagram.closest("[data-flow-preview]")) return Boolean(originalDiagram);

    const slot = originalDiagram.parentElement;
    slot.dataset.flowPreview = "true";
    slot.style.aspectRatio = "1600 / 900";
    slot.style.display = "flex";
    slot.style.alignItems = "center";

    const diagram = document.createElement("img");
    diagram.src = "assets/myco-flow-handoff-motion.svg?v=10";
    diagram.alt = "Animated Myco context flow";
    diagram.style.cssText = "display:block;width:100%;height:100%;object-fit:contain;";
    slot.replaceChildren(diagram);
    return true;
  };

  if (renderPreview()) return;
  const observer = new MutationObserver(() => {
    if (renderPreview()) observer.disconnect();
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
})();
