const form = document.getElementById('form');
const toolTip = document.getElementById('tooltip');
const synsWrapper = document.getElementById('syn-wrapper');
const filterMatches = 2;

// Flags
let editing = false;
let isSubmitting = false;


// submit handling
form.addEventListener('submit', submitHandler);

// Handles repeated words
function submitHandler(e) {
  e.preventDefault();

  if (isSubmitting) {
    return;
  }
  isSubmitting = true;

  updateInput();

  // prevent spam submits
  setTimeout(() => {
    isSubmitting = false;
  }, 1000 / 2);
}

// Handles submit & input changes
function updateInput() {
  const textBox = document.getElementById('input-text');
  // Turns off editing
  textBox.setAttribute("contenteditable", false);
  // Clear
  textBox.innerHTML = textBox.innerText;

  const text = textBox.innerText;
  const words = text.split(' ');

  const wordMap = new Map();

  // Making word: repeatNum map
  words.forEach(word => {
    if (!wordMap.has(word)) {
      wordMap.set(word, 1);
    }
    else {
      wordMap.set(word, wordMap.get(word) + 1);
    }
  });

  // Finding and styling repeated words
  let num = 1;
  let textHtml = textBox.innerHTML;
  wordMap.forEach((repeats, word) => {
    let wordTag = `<span class='duplicated-word' id='${word}'><span class='highlight' style="background-color:${selectColor(num)};"></span>${word}</span>`;

    if (repeats > 1) {
      let regExp = new RegExp('\\b' + word + '\\b', 'gi');

      textBox.innerHTML = textHtml.replaceAll(regExp, wordTag);
      textHtml = textBox.innerHTML;
      num += 10;
    }
    else {
      textBox.innerHTML = textHtml.replaceAll(wordTag, word);
      textHtml = textBox.innerHTML;
    }
  });

}

// Tooltip
document.addEventListener('click', e => {
  synsWrapper.innerHTML = '';

  // If clicked on duplicated word
  if (e.target.className == 'duplicated-word') {

    const promise = fetchThesaurus(e.target.innerText, 6);
    promise.then((syns) => {
      // Visibility
      toolTip.style.display = 'block';

      // Content
      syns.forEach(syn => {
        const synSpan = document.createElement('span');
        synSpan.innerText = syn;
        synSpan.classList.add('syns');
        synsWrapper.appendChild(synSpan);

        // Click syn handler
        synSpan.addEventListener('click', () => {
          synsHandler(synSpan, e.target);
        });
      });

    }).catch(() => {
      console.log('no synonyms found');
    });

    // Positioning
    toolTip.style.left = `${e.clientX}px`;
    toolTip.style.top = `${e.clientY}px`;
  }

  // Clicked off word
  else {
    toolTip.style.display = 'none';
  }
});

function synsHandler(syn, oldWord) {
  oldWord.childNodes[1].nodeValue = syn.innerText;
  updateInput();
}



// Random pastel color gen
function selectColor(number) {
  const hue = number * 137.508;
  return `hsl(${hue},50%,75%)`;
}

// Fetching thesaurus API
async function fetchThesaurus(word, amount) {
  const url = `https://dictionaryapi.com/api/v3/references/thesaurus/json/${word}?key=6e7f6098-7561-4c56-b013-ed0c4556ca66`;
  let syns = [];

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    const rJson = await response.json();

    // getting all syns
    rJson.forEach(ele => {
      const synsData = ele.meta.syns;
      synsData.forEach(syn => {
        syns.push(...syn);
      });
    });
  } catch (error) {
    reject(`Could not get synonyms: ${error}`);
  }

  return syns.slice(0, 6);
}



