function opennav() {
  document.getElementById("hamburger").style.display = "block";
  document.getElementById("hamburger").style.animation = "mantul 0.3s ease-in-out";
  setTimeout(() => {
    document.getElementById("hamburger").style.animation = "none";
  }, 300)
}
function closenav() {
  document.getElementById("hamburger").style.animation = "tutupMantul 0.3s ease-in-out";
  setTimeout(() => {
    document.getElementById("hamburger").style.display = "none";
    document.getElementById("hamburger").style.animation = "none";
  }, 300);
}
function scrollSkill() {
  const el = document.getElementById("skill");
  const y = el.getBoundingClientRect().top + window.pageYOffset;
  const offset = window.innerHeight / 2 - el.offsetHeight / 2;

  window.scrollTo({
    top: y - offset,
    behavior: "smooth"
  });
  document.getElementById("hamburger").style.animation = "tutupMantul 0.3s ease-in-out";
  setTimeout(() => {
    document.getElementById("hamburger").style.display = "none";
    document.getElementById("hamburger").style.animation = "none";
  }, 300);
  setTimeout(() => {
    document.getElementById("skill").style.animation = "tanda 0.4s linear";
    document.getElementById("skill").style.boxShadow = "0 0 10px white";
  }, 300);
  setTimeout(() => {
    document.getElementById("skill").style.boxShadow = "0 0 0 rgba(0,0,0,0)";
    document.getElementById("skill").style.animation = "none";
  }, 1300);
}
function scrollHome() {
  const el = document.getElementById("heading");
  const y = el.getBoundingClientRect().top + window.pageYOffset;
  const offset = window.innerHeight / 2 - el.offsetHeight / 2;

  window.scrollTo({
    top: y - offset,
    behavior: "smooth"
  });
  document.getElementById("hamburger").style.animation = "tutupMantul 0.3s ease-in-out";
  setTimeout(() => {
    document.getElementById("hamburger").style.display = "none";
    document.getElementById("hamburger").style.animation = "none";
  }, 300);
  document.getElementById("heading").scrollIntoView({
    behavior: "smooth"
  });
}
function scrollEducation() {
  const el = document.getElementById("education");
  const y = el.getBoundingClientRect().top + window.pageYOffset;
  const offset = window.innerHeight / 2 - el.offsetHeight / 2;

  window.scrollTo({
    top: y - offset,
    behavior: "smooth"
  });
  document.getElementById("hamburger").style.animation = "tutupMantul 0.3s ease-in-out";
  setTimeout(() => {
    document.getElementById("hamburger").style.display = "none";
    document.getElementById("hamburger").style.animation = "none";
  }, 300);
  setTimeout(() => {
    document.getElementById("education").style.animation = "tanda 0.4s linear";
    document.getElementById("education").style.boxShadow = "0 0 10px white";
  }, 300);
  setTimeout(() => {
    document.getElementById("education").style.boxShadow = "0 0 0 rgba(0,0,0,0)";
    document.getElementById("education").style.animation = "none";
  }, 1300);
}
function scrollContact() {
  document.getElementById("hamburger").style.animation = "tutupMantul 0.3s ease-in-out";
  setTimeout(() => {
    document.getElementById("hamburger").style.display = "none";
    document.getElementById("hamburger").style.animation = "none";
  }, 300);
  document.getElementById("contact").scrollIntoView({
    behavior: "smooth"
  });
  setTimeout(() => {
    document.getElementById("contact").style.animation = "tanda 0.4s linear";
    document.getElementById("contact").style.boxShadow = "0 0 10px white";
  }, 300);
  setTimeout(() => {
    document.getElementById("contact").style.boxShadow = "0 0 0 rgba(0,0,0,0)";
    document.getElementById("contact").style.animation = "none";
  }, 1300);
}
function scrollAbout() {
  const el = document.getElementById("about");
  const y = el.getBoundingClientRect().top + window.pageYOffset;
  const offset = window.innerHeight / 2 - el.offsetHeight / 2;

  window.scrollTo({
    top: y - offset,
    behavior: "smooth"
  });
  document.getElementById("hamburger").style.animation = "tutupMantul 0.3s ease-in-out";
  setTimeout(() => {
    document.getElementById("hamburger").style.display = "none";
    document.getElementById("hamburger").style.animation = "none";
  }, 300);
  setTimeout(() => {
    document.getElementById("hamburger").style.display = "none";
    document.getElementById("hamburger").style.animation = "none";
  }, 300);
  setTimeout(() => {
    document.getElementById("about").style.animation = "tanda 0.4s linear";
    document.getElementById("about").style.boxShadow = "0 0 10px white";
  }, 300);
  setTimeout(() => {
    document.getElementById("about").style.boxShadow = "0 0 0 rgba(0,0,0,0)";
    document.getElementById("about").style.animation = "none";
  }, 1300);
}
function scrollProject() {
  const el = document.getElementById("project");
  const y = el.getBoundingClientRect().top + window.pageYOffset;
  const offset = window.innerHeight / 2 - el.offsetHeight / 2;

  window.scrollTo({
    top: y - offset,
    behavior: "smooth"
  });
  document.getElementById("hamburger").style.animation = "tutupMantul 0.3s ease-in-out";
  setTimeout(() => {
    document.getElementById("hamburger").style.display = "none";
    document.getElementById("hamburger").style.animation = "none";
  }, 300);
  setTimeout(() => {
    document.getElementById("project").style.animation = "tanda 0.4s linear";
    document.getElementById("project").style.boxShadow = "0 0 10px white";
  }, 300);
  setTimeout(() => {
    document.getElementById("project").style.boxShadow = "0 0 0 rgba(0,0,0,0)";
    document.getElementById("project").style.animation = "none";
  }, 1300);
}

function brightnes() {
  const warna = document.getElementById("warna");
  const skillName = document.getElementById("skill-name");
  const skillName1 = document.getElementById("skill-name1");
  const skillName2 = document.getElementById("skill-name2");
  const garis = document.getElementById("garis");

  document.body.style.background = "#e8e8e8";

  document.getElementById("cm").style.color = "red";
  warna.style.color = "red";
  warna1.style.color = "red";
  warna2.style.color = "red";
  warna3.style.color = "red";
  warna4.style.color = "red";
  warna5.style.color = "red";
  warna6.style.color = "red";
  warna7.style.color = "red";
  warna8.style.color = "red";
  warna9.style.color = "red";
  warna10.style.color = "red";

  document.getElementById("light").style.display = "none";
  document.getElementById("night").style.display = "flex";
  document.getElementById("heading").style.color = "black";
  document.getElementById("header").style.color = "black";
  document.getElementById("header").style.border = "1px solid black";
  document.getElementById("header").style.background = "#e5e5e5";
  document.getElementById("heading").style.background = "#e5e5e5";
  document.getElementById("heading").style.boxShadow = "2px 2px 5px black";
  document.getElementById("hamburger").style.color = "#000";
  document.getElementById("hamburger").style.background = "#e5e5e5";
  document.getElementById("about").style.background = "#e5e5e5";
  document.getElementById("about").style.boxShadow = "2px 2px 5px black";
  document.getElementById("about").style.color = "#000";
  document.getElementById("skill").style.background = "#e5e5e5";
  document.getElementById("skill").style.boxShadow = "2px 2px 5px black";
  document.getElementById("skill").style.color = "#000";
  document.getElementById("project").style.background = "#e5e5e5";
  document.getElementById("project").style.boxShadow = "2px 2px 5px black";
  document.getElementById("project").style.color = "#000";
  document.getElementById("education").style.background = "#e5e5e5";
  document.getElementById("education").style.boxShadow = "2px 2px 5px black";
  document.getElementById("education").style.color = "#000";
  document.getElementById("contact").style.background = "#e5e5e5";
  document.getElementById("contact").style.boxShadow = "2px 2px 5px black";
  document.getElementById("contact").style.color = "#000";
  skillName.style.color = "#000";
  skillName1.style.color = "#000";
  skillName2.style.color = "#000";
  garis.style.background = "black";
  garis2.style.background = "black";
  garis3.style.background = "black";
  garis4.style.background = "black";
  garis5.style.background = "black";
}
function wa() {
  setTimeout(() => {
    window.location.href = "https://api.whatsapp.com/send?phone=+6283866317501";
  }, 1000);
}
function tt() {
  setTimeout(() => {
    window.location.href = "https://vm.tiktok.com/ZS91x3bL8B8rE-FLK2Z/";
  }, 1000);
}
function ig() {
  setTimeout(() => {
    window.location.href = "https://www.instagram.com/nyxtrix1?igsh=MWxtaXN6enZpbWU2OQ%3D%3D";
  }, 1000);
}
function tele() {
  setTimeout(() => {
    window.location.href = "t.me/Hadzztele";
  }, 1000);
}
function projectaddon() {
  window.location.href = "https://kaelvxy.github.io/addon_mcpe/Beranda.html";
}
const img = document.getElementById("gambarprofile");
let loading = document.getElementById("loading");

function selesaiLoad(){
  setTimeout(()=>{
    loading.style.display = "none";
  },500);
}

img.addEventListener("load", selesaiLoad);

// kalau gambar sudah ke-cache
if (img.complete) {
  selesaiLoad();
}