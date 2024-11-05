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
