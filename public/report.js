const form = document.getElementById("reportForm");
const formMessage = document.getElementById("formMessage");

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const formData = new FormData(form);
  const body = new URLSearchParams();
  formData.forEach((value, key) => body.append(key, value));

  fetch("/api/items", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  })
    .then((response) => response.json())
    .then((result) => {
      if (result.status === "saved") {
        formMessage.textContent = "Your report was saved. Go back to Browse to see the new item.";
        form.reset();
      } else {
        formMessage.textContent = "Unable to save the report. Please try again.";
      }
    })
    .catch(() => {
      formMessage.textContent = "Unable to save the report. Please try again.";
    });
});
