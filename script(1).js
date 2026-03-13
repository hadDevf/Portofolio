function opennav() {
  let buka = document.getElementById("buka");
  let tutup = document.getElementById("tutup");
  buka.style.display = "none";
  tutup.style.display = "flex";
  document.getElementById("hamburger").style.display = "block";
  document.getElementById("hamburger").style.animation = "munculTengah 0.3s ease-in-out";
  setTimeout(() => {
    document.getElementById("hamburger").style.animation = "none";
  }, 300)
}
function closenav() {
  let buka = document.getElementById("buka");
  let tutup = document.getElementById("tutup");
  buka.style.display = "flex";
  tutup.style.display = "none";
  document.getElementById("hamburger").style.animation = "hilangTengah 0.3s ease-in-out";
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
function animationApp() {
  const apps = ["whatsapp",
    "tiktok",
    "instagram"];
  apps.forEach((id, index) => {
    setTimeout(() => {
      document.getElementById(id).style.animation = "mantulMantul 0.3s ease-in-out";
    }, index * 100);
  });
  setTimeout(() => {
    apps.forEach(id => {
      document.getElementById(id).style.animation = "none";
    });
  }, 1000);
}
setInterval(animationApp, 3500);

function toggle() {
  let menuToggle = document.querySelector('.menu-toggle');
  let menu = document.querySelector('.hamburger');
  menuToggle.classList.toggle('active');
  menu.classList.toggle('active');
}
function Home() {
  let menuToggle = document.querySelector('.menu-toggle');
  let menu = document.querySelector('.hamburger');
  let about = document.getElementById("aboutme");
  let home = document.getElementById("home");
  let project = document.getElementById("project");
  menuToggle.classList.toggle('active');
  menu.classList.toggle('active');
  project.style.display = "none";
  home.style.display = "flex";
  about.style.display = "none";
}
function About() {
  let menuToggle = document.querySelector('.menu-toggle');
  let menu = document.querySelector('.hamburger');
  let about = document.getElementById("aboutme");
  let home = document.getElementById("home");
  let project = document.getElementById("project");
  menuToggle.classList.toggle('active');
  menu.classList.toggle('active');
  project.style.display = "none";
  home.style.display = "none";
  about.style.display = "flex";
}
function Project() {
  let menuToggle = document.querySelector('.menu-toggle');
  let menu = document.querySelector('.hamburger');
  let about = document.getElementById("aboutme");
  let home = document.getElementById("home");
  let project = document.getElementById("project");
  menuToggle.classList.toggle('active');
  menu.classList.toggle('active');
  project.style.display = "flex";
  home.style.display = "none";
  about.style.display = "none";
}
function Homes() {
  let about = document.getElementById("aboutme");
  let home = document.getElementById("home");
  let project = document.getElementById("project");
  project.style.display = "none";
  home.style.display = "flex";
  about.style.display = "none";
}
function Abouts() {
  let about = document.getElementById("aboutme");
  let home = document.getElementById("home");
  let project = document.getElementById("project");
  project.style.display = "none";
  home.style.display = "none";
  about.style.display = "flex";
}
function Projects() {
  let about = document.getElementById("aboutme");
  let home = document.getElementById("home");
  let project = document.getElementById("project");
  project.style.display = "flex";
  home.style.display = "none";
  about.style.display = "none";
}