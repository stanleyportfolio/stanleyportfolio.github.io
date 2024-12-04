const switchClasses = [
    "backend-noswitch",
    "backend-switch",
    "backend-switch-2"
];
const itemWrappers = document.querySelectorAll(".item-wrapper");
document.querySelector("body").addEventListener("click", function(e) {
    let el = e.target;
    if (el.dataset.page != 1) return;
    el.dataset.page = parseInt(el.dataset.page) + 1;
    itemWrappers.forEach((item)=>{
        item.classList.remove("selected");
    });
});
document.querySelector("#list-close").addEventListener("click", function(e) {
    itemWrappers.forEach((item)=>{
        item.classList.remove("selected");
    });
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
        console.log(1);
        itemWrappers.forEach((item)=>{
            item.classList.remove("selected");
        });
        item.classList.add("selected");
    });
});

//# sourceMappingURL=work.7e488a45.js.map
