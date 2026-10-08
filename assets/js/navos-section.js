(function () {
  "use strict";

  var root = document.querySelector("[data-nm-root]");
  var tablist = root ? root.querySelector("[data-nm-tabs]") : null;
  var tabs = tablist ? Array.prototype.slice.call(tablist.querySelectorAll('[role="tab"]')) : [];
  var panels = root ? Array.prototype.slice.call(root.querySelectorAll('[role="tabpanel"]')) : [];

  function activateTab(tab, focus) {
    if (!tab || !tablist) return;
    var panelId = tab.getAttribute("aria-controls");

    tabs.forEach(function (item) {
      var active = item === tab;
      item.setAttribute("aria-selected", active ? "true" : "false");
      item.tabIndex = active ? 0 : -1;
    });

    panels.forEach(function (panel) {
      var active = panel.id === panelId;
      panel.hidden = !active;
      panel.classList.toggle("is-entering", active);
      if (active) {
        window.setTimeout(function () {
          panel.classList.remove("is-entering");
        }, 320);
      }
    });

    tablist.dataset.active = tab.dataset.nmTab || "advantages";
    if (focus) tab.focus();
  }

  tabs.forEach(function (tab, index) {
    tab.addEventListener("click", function () {
      activateTab(tab, false);
    });

    tab.addEventListener("keydown", function (event) {
      var next = index;
      if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
      else if (event.key === "ArrowLeft") next = (index - 1 + tabs.length) % tabs.length;
      else if (event.key === "Home") next = 0;
      else if (event.key === "End") next = tabs.length - 1;
      else return;

      event.preventDefault();
      activateTab(tabs[next], true);
    });
  });

  document.querySelectorAll("[data-proof-track]").forEach(function (track) {
    if (track.dataset.enhanced === "true") return;
    track.dataset.enhanced = "true";

    Array.prototype.slice.call(track.children).forEach(function (card) {
      var clone = card.cloneNode(true);
      clone.dataset.clone = "true";
      clone.setAttribute("aria-hidden", "true");
      clone.querySelectorAll("[id]").forEach(function (node) {
        node.removeAttribute("id");
      });
      track.appendChild(clone);
    });
  });

  var proofToggle = document.querySelector("[data-proof-toggle]");
  var proofStage = document.getElementById("nm-proof-stage");
  if (proofToggle && proofStage) {
    proofToggle.addEventListener("click", function () {
      var paused = !proofStage.classList.contains("is-paused");
      proofStage.classList.toggle("is-paused", paused);
      proofToggle.setAttribute("aria-pressed", paused ? "true" : "false");
      proofToggle.textContent = paused
        ? proofToggle.dataset.playLabel
        : proofToggle.dataset.pauseLabel;
    });
  }
})();
