const words = ["There ", "Bro ", "Guys ", "Friends ", "Cuy :) ","Bang :) "];
let i = 0;
let j = 1;
let isDeleting = false;
function type() {
  const text = document.querySelector("#text");

  if (!isDeleting) {
    text.textContent = words[i].substring(0, j++);
  } else {
    text.textContent = words[i].substring(0, j--);
  }
  if (j === words[i].length) {
    isDeleting = true;
    setTimeout(type, 5000);
    return;
  }
  if (j === 1) {
    isDeleting = false;
    i = (i + 1) % words.length;
  }
  setTimeout(type, 150);
}
const words2 = ["Frontend Developer ", "Web Developer "];
let a = 0;
let b = 2;
let isDeletings = false;
function type2() {
  const text = document.querySelector("#text2");

  if (!isDeletings) {
    text.textContent = words2[a].substring(0, b++);
  } else {
    text.textContent = words2[a].substring(0, b--);
  }
  if (b === words2[a].length) {
    isDeletings = true;
    setTimeout(type2, 3000);
    return;
  }
  if (b === 2) {
    isDeletings = false;
    a = (a + 1) % words2.length;
  }
  setTimeout(type2, 150);
}
type();
type2();
const navLinks = document.querySelectorAll('.nav');

navLinks.forEach((link) => {
  link.addEventListener('click', () => {
    // Hapus kelas active dari semua link
    navLinks.forEach((l) => l.classList.remove('active'));
    // Tambahkan kelas active ke link yang diklik
    link.classList.add('active');
  });
});