document.addEventListener("DOMContentLoaded", function () {
  // handle tab switching for profile page
  const tabs = document.querySelectorAll(".tab");
  const tabContents = document.querySelectorAll(".tab-content");

  tabs.forEach((tab) => {
    tab.addEventListener("click", function () {
      const targetTab = tab.dataset.tab;

      tabs.forEach((tab) => tab.classList.remove("active"));

      tabContents.forEach((content) => content.classList.remove("active"));

      tab.classList.add("active");

      document.getElementById(targetTab).classList.add("active");
    });
  });
});