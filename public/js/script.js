
// const dark = document.getElementById('customSwitch1');

// dark.addEventListener('click', function () {
//     const body = document.getElementById('body');
//     const list = document.querySelectorAll(".list-group-item");

//     list.forEach(function (item, index) {

//         item.classList.toggle('list-group-item-dark')
//     })

//     body.classList.toggle('dark')
// })

const btn = document.getElementById('customSwitch1');
const body = document.getElementById('body');
const currentTheme = localStorage.getItem("theme");
if (currentTheme == "dark") {
    body.classList.add("dark-theme");
}

btn.addEventListener("click", function () {
    body.classList.toggle("dark");

    let theme = "light";
    if (body.classList.contains("dark")) {
        theme = "dark";
    }
    localStorage.setItem("theme", theme);
})