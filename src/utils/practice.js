// Normalization for free-text answer checking.
// We strip accents and lowercase, so "está" === "esta" === "ESTÁ".

const DIACRITICS = /[̀-ͯ]/g;

export function normalize(str) {
  return (str || "")
    .toString()
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(DIACRITICS, "")
    .replace(/\s+/g, " ");
}

export function answersMatch(a, b) {
  return normalize(a) === normalize(b);
}

export function pickRandom(list, excludeIds = []) {
  const pool = list.filter((x) => !excludeIds.includes(x.id));
  if (pool.length === 0) return list[Math.floor(Math.random() * list.length)];
  return pool[Math.floor(Math.random() * pool.length)];
}

export function shuffle(list) {
  const arr = [...list];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function fillBlank(sentence, value) {
  return sentence.replace("___", value);
}
