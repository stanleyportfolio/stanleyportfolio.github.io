const e=["backend-noswitch","backend-switch","backend-switch-2"],t=document.querySelectorAll(".item-wrapper"),c=document.querySelector("body");function s(e,t,c=!1){if(!e||!t)return;let n=t.find(t=>e.classList.contains(t));e.classList.remove(n),c?e.classList.add(c):e.classList.add(t[(t.indexOf(n)+1)%t.length])}c.addEventListener("click",function(e){let c=e.target;1==c.dataset.page&&(c.dataset.page=parseInt(c.dataset.page)+1,t.forEach(e=>{e.classList.remove("selected")}))}),document.querySelector("#list-prev").addEventListener("click",function(e){let s=document.querySelector(".item-wrapper.selected").previousElementSibling;s&&s.classList.contains("item-wrapper")&&(t.forEach(e=>{e.classList.remove("selected")}),s.classList.add("selected"),c.dataset.page=parseInt(c.dataset.page)-1,1>=Array.from(t).indexOf(s)&&(c.dataset.page=1))}),document.querySelector("#list-close").addEventListener("click",function(e){t.forEach(e=>{e.classList.remove("selected")})}),document.querySelector("#list-next").addEventListener("click",function(e){let s=document.querySelector(".item-wrapper.selected").nextElementSibling;s&&s.classList.contains("item-wrapper")&&(t.forEach(e=>{e.classList.remove("selected")}),s.classList.add("selected"),c.dataset.page=parseInt(c.dataset.page)+1,Array.from(t).indexOf(s)>=t.length&&(c.dataset.page=t.length))}),document.querySelector("#list-switch").addEventListener("click",function(t){s(document.body,e)}),document.querySelector("#switch1").addEventListener("click",function(t){s(document.body,e,e[0])}),document.querySelector("#switch2").addEventListener("click",function(t){s(document.body,e,e[1])}),document.querySelector("#switch3").addEventListener("click",function(t){s(document.body,e,e[2])}),document.querySelector("#list-lightbox").addEventListener("click",function(e){t.forEach(e=>{e.classList.remove("selected")})}),t.forEach(e=>{e.addEventListener("click",()=>{t.forEach(e=>{e.classList.remove("selected")}),e.classList.add("selected")})});
//# sourceMappingURL=work.4623ada2.js.map