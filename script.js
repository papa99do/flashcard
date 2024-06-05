// script.js
const dailyLimit = 10;
const delay = [0, 1, 2, 3, 8, 10000]; // Number of days for each level (index 0 is not used)
const flashcardContainer = document.getElementById('flashcardContainer');
const flashcard = document.getElementById('flashcard');

const allCharacters = window.charactersData;
const allCharMap = allCharacters.reduce((acc, item) => {
    acc[item.chinese] = item;
    return acc;
  }, {})
// localStorage.removeItem('learn_chinese_progress');
const progressStr = localStorage.getItem('learn_chinese_progress')

if (progressStr != null && progressStr.length > 0) {
    const progress = JSON.parse(progressStr);
    console.log(progress)
    progress.forEach(p => {
        const char = allCharMap[p.chinese];
        if (char) {
            char.level = p.level;
            char.nextReviewTime = p.nextReviewTime
        }
    })
} 
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}
shuffleArray(allCharacters);

const now = new Date().getTime();
function score(c) {
    if (c.nextReviewTime && c.nextReviewTime < now) {
        return -1;
    } else if (c.level == 5 || c.level === undefined) {
        return 0;
    } else {
        return c.level;
    }
}
function comparator(c1, c2) {
    return score(c1) - score(c2);
}

const characters = allCharacters.sort(comparator).slice(0, dailyLimit);

console.log(characters);

let currentCharacterIndex = 0;

function changeLevel(delta) {
    if (currentCharacterIndex == null) {
        return;
    }
    const character = characters[currentCharacterIndex];
    if (character.level === undefined) {
        character.level = 1;
    } else {
        character.level = Math.min(Math.max(character.level + delta, 1), 5);
    }
    character.nextReviewTime = now + delay[character.level] * 86400 * 1000;
    console.log("Changed Character: ", character);
}

function showCharacter() {
  const currentCharacter = characters[currentCharacterIndex];
  const front = flashcard.querySelector('.front');
  const back = flashcard.querySelector('.back');

  front.textContent = currentCharacter.chinese;
  front.className = 'front level-' + currentCharacter.level;
  back.innerHTML = `
    <p class="english">${currentCharacter.english}</p>
    <ul class="common-words">
      ${currentCharacter.words.map(word => `<li>${word}</li>`).join('')}
    </ul>
  `;
}

showCharacter();

function showResult() {
    const currentCharacter = null;
    const front = flashcard.querySelector('.front');
    const back = flashcard.querySelector('.back');

    front.textContent = '\u{1F44D}';
    front.className = 'front';
    back.innerHTML = `
        <p class="english">Congrats!</p>
        <p>You have learned ${dailyLimit} words today!</p>
    `;
}

function showNextCharacter() {
    if (currentCharacterIndex == null) {
        return;
    } else if (currentCharacterIndex == dailyLimit - 1) {
        console.log('Save progress to local storage');
        saveProgress();
        showResult();
        currentCharacterIndex = null
    } else {
        currentCharacterIndex = currentCharacterIndex + 1;
        showCharacter();
    }
}

flashcardContainer.addEventListener('click', () => {
    flashcard.classList.toggle('flipped');
});

flashcardContainer.addEventListener('touchstart', touchStart, { passive: true });
flashcardContainer.addEventListener('touchmove', touchMove, { passive: true });

let xDown = null;

function touchStart(event) {
  xDown = event.touches[0].clientX;
}

function touchMove(event) {
  const sensitivity = 10;
  if (!xDown) return;

  const xUp = event.touches[0].clientX;
  const xDiff = xUp - xDown;

  if (Math.abs(xDiff) < sensitivity) {
    return;
  }

  changeLevel(Math.sign(xDiff));
  xDown = null;

  showNextCharacter();
}

document.onkeydown = function (event) {
  if (event.key === 'ArrowLeft') {
    changeLevel(-1);
  } else if (event.key === 'ArrowRight') {
    changeLevel(1);
  } else {
    return;
  }

  showNextCharacter();
}

function saveProgress() {
    const progress = allCharacters.filter(c => c.level !== undefined).map(c => { return {chinese: c.chinese, level: c.level, nextReviewTime: c.nextReviewTime}});
    console.log(progress);
    localStorage.setItem('learn_chinese_progress', JSON.stringify(progress));
}

// Save progress every 10 minutes
const saveIntervalInMilliseconds = 10 * 60 * 1000; // 10 minutes
setInterval(saveProgress, saveIntervalInMilliseconds);