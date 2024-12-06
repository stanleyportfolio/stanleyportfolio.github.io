const switchClasses = [
    "backend-noswitch",
    "backend-switch",
    "backend-switch-2"
];
const itemWrappers = document.querySelectorAll(".item-wrapper");
const htmlBody = document.querySelector("body");
htmlBody.addEventListener("click", function(e) {
    let el = e.target;
    if (el.dataset.page != 1) return;
    el.dataset.page = parseInt(el.dataset.page) + 1;
    itemWrappers.forEach((item)=>{
        item.classList.remove("selected");
    });
});
document.querySelector("#list-prev").addEventListener("click", function(e) {
    const prevSibling = document.querySelector(".item-wrapper.selected").previousElementSibling;
    if (prevSibling && prevSibling.classList.contains("item-wrapper")) {
        itemWrappers.forEach((item)=>{
            item.classList.remove("selected");
        });
        prevSibling.classList.add("selected");
        htmlBody.dataset.page = parseInt(htmlBody.dataset.page) - 1;
        const prevIndex = Array.from(itemWrappers).indexOf(prevSibling);
        if (prevIndex <= 1) htmlBody.dataset.page = 1;
    }
});
document.querySelector("#list-close").addEventListener("click", function(e) {
    itemWrappers.forEach((item)=>{
        item.classList.remove("selected");
    });
});
document.querySelector("#list-next").addEventListener("click", function(e) {
    const nextSibling = document.querySelector(".item-wrapper.selected").nextElementSibling;
    if (nextSibling && nextSibling.classList.contains("item-wrapper")) {
        itemWrappers.forEach((item)=>{
            item.classList.remove("selected");
        });
        nextSibling.classList.add("selected");
        htmlBody.dataset.page = parseInt(htmlBody.dataset.page) + 1;
        const nextIndex = Array.from(itemWrappers).indexOf(nextSibling);
        if (nextIndex >= itemWrappers.length) htmlBody.dataset.page = itemWrappers.length;
    }
});
document.querySelector("#list-switch").addEventListener("click", function(e) {
    toggleClass(document.body, switchClasses);
});
document.querySelector("#switch1").addEventListener("click", function(e) {
    toggleClass(document.body, switchClasses, switchClasses[0]);
});
document.querySelector("#switch2").addEventListener("click", function(e) {
    toggleClass(document.body, switchClasses, switchClasses[1]);
});
document.querySelector("#switch3").addEventListener("click", function(e) {
    toggleClass(document.body, switchClasses, switchClasses[2]);
});
function toggleClass(targetElement, classes, specificClass = false) {
    if (!targetElement || !classes) return;
    const currentClass = classes.find((c)=>targetElement.classList.contains(c));
    targetElement.classList.remove(currentClass);
    if (specificClass) targetElement.classList.add(specificClass);
    else targetElement.classList.add(classes[(classes.indexOf(currentClass) + 1) % classes.length]);
}
document.querySelector("#list-lightbox").addEventListener("click", function(e) {
    itemWrappers.forEach((item)=>{
        item.classList.remove("selected");
    });
});
itemWrappers.forEach((item)=>{
    item.addEventListener("click", ()=>{
        itemWrappers.forEach((item)=>{
            item.classList.remove("selected");
        });
        item.classList.add("selected");
    });
});

//# sourceMappingURL=work.7e488a45.js.map
