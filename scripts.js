document.querySelector('body').addEventListener('click', function(e){
    let el = e.target;
    if (el.dataset.page != 1) return;
    el.dataset.page = parseInt(el.dataset.page) + 1; 
});

document.querySelector('#navi-left').addEventListener('click', function(e){
    let el = document.querySelector('body');
    el.dataset.page = parseInt(el.dataset.page) - 1; 
});

document.querySelector('#navi-right').addEventListener('click', function(e){
    let el = document.querySelector('body');
    el.dataset.page = parseInt(el.dataset.page) + 1; 
});